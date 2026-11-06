import express from 'express'
import { pool } from './db.ts'
import { authRouter } from './auth.ts'

const app = express()
app.use(express.json())
app.use('/api/auth', authRouter)

app.get('/api/health', async (_req, res) => {
  try {
    const { rows } = await pool.query<{ now: Date }>('SELECT now()')
    res.json({ ok: true, database: process.env.PGDATABASE, time: rows[0].now })
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message })
  }
})

app.get('/api/products', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, category, price, rating, reviews, badge,
             image_bg AS "imageBg", image,
             in_stock AS "inStock", fast_shipping AS "fastShipping"
      FROM products
      ORDER BY id
    `)
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'No se pudieron obtener los productos' })
  }
})

const port = Number(process.env.API_PORT ?? 3001)
app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`)
})
