import pg from 'pg'

// pg lee PGHOST, PGPORT, PGDATABASE, PGUSER y PGPASSWORD desde el entorno (.env)
export const pool = new pg.Pool({ max: 10 })

// NUMERIC llega como string por defecto; lo convertimos a number
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => parseFloat(value))
