import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
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
