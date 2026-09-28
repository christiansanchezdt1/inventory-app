-- Solo para bases creadas antes de db/schema.sql (instalaciones nuevas no lo necesitan).
--
-- 1. product_history tenía columnas action/stock_before/stock_after/... pero el código
--    escribe action_type + changes (JSONB), así que ningún cambio de producto se registraba.
--    Convierte los registros existentes al formato nuevo y borra las columnas viejas.
-- 2. Quita las FK de product_history y order_history: el registro de una baja se inserta
--    después de borrar el producto/pedido, y con la FK ese insert fallaba (y un producto con
--    historial no se podía borrar).
--
-- Correrlo una sola vez, entero, en el SQL Editor de Neon. Hacer un backup (branch) antes.

BEGIN;

ALTER TABLE product_history DROP CONSTRAINT IF EXISTS product_history_product_id_fkey;
ALTER TABLE order_history DROP CONSTRAINT IF EXISTS fk_order_history_order;
ALTER TABLE order_history DROP CONSTRAINT IF EXISTS order_history_order_id_fkey;

ALTER TABLE product_history ADD COLUMN IF NOT EXISTS action_type VARCHAR(20);
ALTER TABLE product_history ADD COLUMN IF NOT EXISTS changes JSONB;
ALTER TABLE product_history ADD COLUMN IF NOT EXISTS user_id INTEGER;

UPDATE product_history SET
  action_type = action,
  changes = CASE action
    WHEN 'update' THEN jsonb_strip_nulls(jsonb_build_object(
      'stock',  CASE WHEN stock_before IS DISTINCT FROM stock_after
                     THEN jsonb_build_object('before', stock_before, 'after', stock_after) END,
      'price',  CASE WHEN price_before IS DISTINCT FROM price_after
                     THEN jsonb_build_object('before', price_before, 'after', price_after) END,
      'status', CASE WHEN status_before IS DISTINCT FROM status_after
                     THEN jsonb_build_object('before', status_before, 'after', status_after) END))
    ELSE jsonb_strip_nulls(jsonb_build_object(
      'stock', stock_after, 'price', price_after, 'status', status_after))
  END
WHERE action_type IS NULL;

ALTER TABLE product_history ALTER COLUMN action_type SET NOT NULL;
ALTER TABLE product_history ALTER COLUMN changes SET DEFAULT '{}'::jsonb;
ALTER TABLE product_history ALTER COLUMN changes SET NOT NULL;
ALTER TABLE product_history ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE product_history
  DROP COLUMN IF EXISTS action,
  DROP COLUMN IF EXISTS stock_before,
  DROP COLUMN IF EXISTS stock_after,
  DROP COLUMN IF EXISTS price_before,
  DROP COLUMN IF EXISTS price_after,
  DROP COLUMN IF EXISTS status_before,
  DROP COLUMN IF EXISTS status_after,
  DROP COLUMN IF EXISTS changed_by,
  DROP COLUMN IF EXISTS notes;

-- Índice duplicado de idx_product_history_product
DROP INDEX IF EXISTS idx_product_history_product_id;

COMMIT;
