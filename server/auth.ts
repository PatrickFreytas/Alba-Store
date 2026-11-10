import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { Router } from 'express'
import { pool } from './db.ts'

const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>

const KEY_LENGTH = 64

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

interface UserRow {
  id: number
  fullName: string
  email: string
}

export const authRouter = Router()

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
