-- Esquema de la base de datos (PostgreSQL / Neon).
-- Idempotente: se puede volver a correr sin perder datos.
-- Aplicar con `npm run db:schema` o pegándolo en el SQL Editor de Neon.

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  contact_name VARCHAR(100),
  email        VARCHAR(100),
  phone        VARCHAR(20),
  address      TEXT,
  created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- status: 'En stock' | 'Bajo stock' | 'Sin stock' | 'Descontinuado'
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  sku         VARCHAR(50) UNIQUE,
  category_id INTEGER REFERENCES categories(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  stock       INTEGER NOT NULL DEFAULT 0,
  price       NUMERIC(10,2) NOT NULL,
  cost_price  NUMERIC(10,2),
  status      VARCHAR(20) NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products (supplier_id);

-- Sin FK a products: el registro de una baja se inserta después de borrar el producto
-- y el historial se conserva aunque el producto ya no exista.
-- changes: {campo: {before, after}} en 'update', datos del producto en 'create',
-- {deletedProduct} en 'delete'.
CREATE TABLE IF NOT EXISTS product_history (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER NOT NULL,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  changes     JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id     INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_history_product ON product_history (product_id);

CREATE TABLE IF NOT EXISTS customers (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255),
  phone      VARCHAR(50),
  address    TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);

-- Los pedidos guardan los datos del cliente copiados (no hay FK a customers).
-- order_number: ORD-AAMMDD-NNN, generado en order-actions.ts.
-- status: 'Pendiente' | 'Completado' | 'Cancelado'
CREATE TABLE IF NOT EXISTS orders (
  id             SERIAL PRIMARY KEY,
  order_number   VARCHAR(50) NOT NULL,
  customer_name  VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  status         VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  total_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);

-- Un producto con pedidos no se puede borrar (RESTRICT); borrar un pedido borra sus items.
CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity   INTEGER NOT NULL DEFAULT 1,
  price      NUMERIC(10,2) NOT NULL,
  subtotal   NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);

-- Igual que product_history: sin FK, para conservar el registro de pedidos eliminados.
CREATE TABLE IF NOT EXISTS order_history (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  changes     JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id     INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history (order_id);
