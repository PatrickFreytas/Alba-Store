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

const port = Number(process.env.API_PORT ?? 3001)
app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`)
})
