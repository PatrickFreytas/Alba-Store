import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { Router } from 'express'
import { pool } from './db.ts'

const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>

const KEY_LENGTH = 64
export const MIN_PASSWORD_LENGTH = 12
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Formato guardado: "<salt>:<hash>" en hexadecimal
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = await scryptAsync(password, salt, KEY_LENGTH)
  return `${salt}:${hash.toString('hex')}`
}

async function verifyPassword(password: string, stored: string) {
  const [salt, hashHex] = stored.split(':')
  if (!salt || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scryptAsync(password, salt, expected.length)
  return timingSafeEqual(actual, expected)
}

function isValidPassword(password: string) {
  return password.length >= MIN_PASSWORD_LENGTH && /[a-zA-Z]/.test(password) && /\d/.test(password)
}

const RESET_TOKEN_TTL_MINUTES = 60
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

interface UserRow {
  id: number
  fullName: string
  email: string
}

export const authRouter = Router()

authRouter.post('/register', async (req, res) => {
  const fullName = String(req.body?.fullName ?? '').trim()
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')

  if (!fullName) return res.status(400).json({ error: 'Ingresa tu nombre completo.' })
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' })
  if (!isValidPassword(password)) {
    return res
      .status(400)
      .json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres, con letras y números.` })
  }

  try {
    const { rows } = await pool.query<UserRow>(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name AS "fullName", email`,
      [fullName, email, await hashPassword(password)],
    )
    res.status(201).json(rows[0])
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' })
    }
    console.error(error)
    res.status(500).json({ error: 'No se pudo crear la cuenta.' })
  }
})

authRouter.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')

  try {
    const { rows } = await pool.query<UserRow & { passwordHash: string }>(
      `SELECT id, full_name AS "fullName", email, password_hash AS "passwordHash"
       FROM users WHERE lower(email) = $1`,
      [email],
    )
    const user = rows[0]
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' })
    }
    res.json({ id: user.id, fullName: user.fullName, email: user.email })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'No se pudo iniciar sesión.' })
  }
})

// Siempre responde lo mismo, exista o no la cuenta, para no revelar qué correos están registrados.
authRouter.post('/forgot-password', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' })

  try {
    const { rows } = await pool.query<{ id: number }>('SELECT id FROM users WHERE lower(email) = $1', [email])
    const payload: { ok: true; devResetUrl?: string } = { ok: true }

    if (rows[0]) {
      const token = randomBytes(32).toString('base64url')
      await pool.query(
        `INSERT INTO password_resets (user_id, token_hash, expires_at)
         VALUES ($1, $2, now() + make_interval(mins => $3))`,
        [rows[0].id, hashToken(token), RESET_TOKEN_TTL_MINUTES],
      )
      const resetUrl = `${APP_URL}/?reset=${token}`
      // Aún no hay servicio de correo: en desarrollo el enlace se muestra en consola y en la respuesta.
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[recuperar contraseña] ${email}: ${resetUrl}`)
        payload.devResetUrl = resetUrl
      }
    }

    res.json(payload)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'No se pudo enviar el enlace.' })
  }
})

authRouter.post('/reset-password', async (req, res) => {
  const token = String(req.body?.token ?? '')
  const password = String(req.body?.password ?? '')

  if (!isValidPassword(password)) {
    return res
      .status(400)
      .json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres, con letras y números.` })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query<{ id: number; userId: number; passwordHash: string }>(
      `SELECT r.id, r.user_id AS "userId", u.password_hash AS "passwordHash"
       FROM password_resets r JOIN users u ON u.id = r.user_id
       WHERE r.token_hash = $1 AND r.used_at IS NULL AND r.expires_at > now()
       FOR UPDATE OF r`,
      [hashToken(token)],
    )
    const reset = rows[0]
    if (!reset) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'El enlace no es válido o ya expiró. Solicita uno nuevo.' })
    }
    if (await verifyPassword(password, reset.passwordHash)) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la anterior.' })
    }

    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [await hashPassword(password), reset.userId])
    // Invalida este y cualquier otro enlace pendiente del usuario
    await client.query('UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [
      reset.userId,
    ])
    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(error)
    res.status(500).json({ error: 'No se pudo actualizar la contraseña.' })
  } finally {
    client.release()
  }
})
