CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  name          TEXT          NOT NULL,
  category      TEXT          NOT NULL CHECK (category IN ('Tecnología', 'Moda', 'Hogar', 'Accesorios')),
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  rating        NUMERIC(2,1)  NOT NULL DEFAULT 0,
  reviews       INTEGER       NOT NULL DEFAULT 0,
  badge         TEXT,
  image_bg      TEXT          NOT NULL DEFAULT '#dcebe6',
  image         TEXT,
  in_stock      BOOLEAN       NOT NULL DEFAULT TRUE,
  fast_shipping BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  full_name     TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (lower(email));

-- Enlaces de recuperación de contraseña: se guarda solo el hash SHA-256 del token
CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Datos de ejemplo del diseño de Figma (solo si la tabla está vacía)
INSERT INTO products (name, category, price, rating, reviews, badge, image_bg, in_stock, fast_shipping)
SELECT * FROM (VALUES
  ('Audífonos inalámbricos',      'Tecnología', 249.90, 4.8, 312, 'Nuevo', '#dcebe6', TRUE, TRUE),
  ('Reloj inteligente deportivo', 'Tecnología', 389.00, 4.6, 198, NULL,    '#e4e9f2', TRUE, FALSE),
  ('Mochila urbana impermeable',  'Accesorios', 139.90, 4.7, 421, '-20%',  '#f3e6d3', TRUE, TRUE),
  ('Zapatillas para correr',      'Moda',       299.00, 4.5,  87, NULL,    '#ede3ee', TRUE, FALSE),
  ('Lámpara de escritorio LED',   'Hogar',       89.90, 4.4, 156, NULL,    '#f1eed5', TRUE, TRUE),
  ('Set de tazas de cerámica',    'Hogar',       59.90, 4.9,  64, 'Nuevo', '#e8e2da', TRUE, FALSE),
  ('Casaca cortavientos',         'Moda',       219.00, 4.6, 110, NULL,    '#dde6ec', TRUE, TRUE),
  ('Botella térmica 750 ml',      'Accesorios',  69.90, 4.8, 530, NULL,    '#dcebe6', TRUE, TRUE)
) AS seed(name, category, price, rating, reviews, badge, image_bg, in_stock, fast_shipping)
WHERE NOT EXISTS (SELECT 1 FROM products);
