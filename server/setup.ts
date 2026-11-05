import { readFile } from 'node:fs/promises'
import { pool } from './db.ts'
import { hashPassword } from './auth.ts'

const DEMO_USER = { fullName: 'Usuario Demo', email: 'demo@albastore.com', password: 'AlbaStore2026' }

const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')

try {
  await pool.query(sql)

  await pool.query(
    `INSERT INTO users (full_name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (lower(email)) DO NOTHING`,
    [DEMO_USER.fullName, DEMO_USER.email, await hashPassword(DEMO_USER.password)],
  )

  const { rows } = await pool.query<{ products: string; users: string }>(
    'SELECT (SELECT count(*) FROM products) AS products, (SELECT count(*) FROM users) AS users',
  )
  console.log(`Base de datos lista en "${process.env.PGDATABASE}": ${rows[0].products} productos, ${rows[0].users} usuarios.`)
  console.log(`Cuenta demo: ${DEMO_USER.email} / ${DEMO_USER.password}`)
} finally {
  await pool.end()
}
