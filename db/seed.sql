-- Datos de ejemplo. Requiere haber aplicado db/schema.sql.
-- Idempotente: no duplica registros si se corre más de una vez.
-- Aplicar con `npm run db:seed`.

INSERT INTO categories (name, description) VALUES
  ('Ropa', 'Prendas de vestir'),
  ('Calzado', 'Zapatillas y zapatos'),
  ('Accesorios', 'Relojes, bolsos y complementos'),
  ('Electrónica', 'Dispositivos y gadgets'),
  ('Belleza', 'Perfumería y cuidado personal')
ON CONFLICT (name) DO NOTHING;

INSERT INTO suppliers (name, contact_name, email, phone, address)
SELECT v.name, v.contact_name, v.email, v.phone, v.address
FROM (VALUES
  ('Textil Norte', 'Laura Gómez', 'ventas@textilnorte.example', '3875550101', 'Av. Belgrano 1200, Salta'),
  ('TecnoImport', 'Martín Ríos', 'contacto@tecnoimport.example', '1145550202', 'Av. Corrientes 3400, CABA'),
  ('Distribuidora Andina', 'Paula Díaz', 'pedidos@andina.example', '3515550303', 'Bv. San Juan 850, Córdoba')
) AS v (name, contact_name, email, phone, address)
WHERE NOT EXISTS (SELECT 1 FROM suppliers s WHERE s.name = v.name);

INSERT INTO products (name, description, sku, category_id, supplier_id, stock, price, cost_price, status)
SELECT v.name, v.description, v.sku, c.id, s.id, v.stock, v.price, v.cost_price, v.status
FROM (VALUES
  ('Camiseta Básica', 'Camiseta de algodón', 'ROP-001', 'Ropa', 'Textil Norte', 45, 19.99, 9.50, 'En stock'),
  ('Pantalón Vaquero', 'Jean corte recto', 'ROP-002', 'Ropa', 'Textil Norte', 32, 49.99, 25.00, 'En stock'),
  ('Zapatillas Deportivas', 'Running, suela de goma', 'CAL-001', 'Calzado', 'Distribuidora Andina', 12, 89.99, 50.00, 'En stock'),
  ('Reloj Analógico', 'Malla de cuero', 'ACC-001', 'Accesorios', 'Distribuidora Andina', 8, 129.99, 70.00, 'Bajo stock'),
  ('Bolso de Cuero', 'Bolso de mano', 'ACC-002', 'Accesorios', 'Distribuidora Andina', 0, 159.99, 90.00, 'Sin stock'),
  ('Auriculares Bluetooth', 'Inalámbricos con estuche de carga', 'ELE-001', 'Electrónica', 'TecnoImport', 23, 79.99, 40.00, 'En stock'),
  ('Tablet 10"', 'Pantalla de 10 pulgadas, 64 GB', 'ELE-002', 'Electrónica', 'TecnoImport', 5, 299.99, 180.00, 'Bajo stock'),
  ('Perfume Unisex', 'Eau de toilette 100 ml', 'BEL-001', 'Belleza', 'Distribuidora Andina', 18, 69.99, 30.00, 'En stock')
) AS v (name, description, sku, category, supplier, stock, price, cost_price, status)
JOIN categories c ON c.name = v.category
JOIN suppliers s ON s.name = v.supplier
ON CONFLICT (sku) DO NOTHING;

INSERT INTO customers (name, email, phone, address, notes)
SELECT v.name, v.email, v.phone, v.address, v.notes
FROM (VALUES
  ('Ana Fernández', 'ana.fernandez@example.com', '3875551111', 'Caseros 450, Salta', 'Cliente frecuente'),
  ('Jorge Medina', 'jorge.medina@example.com', '3875552222', 'Mitre 980, Salta', NULL),
  ('Comercial Los Andes', 'compras@losandes.example', '3875553333', 'Av. Paraguay 2100, Salta', 'Pedidos mayoristas')
) AS v (name, email, phone, address, notes)
WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.name = v.name);

-- Un pedido de ejemplo, solo si todavía no hay pedidos.
WITH new_order AS (
  INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, status, total_amount)
  SELECT 'ORD-000000-001', 'Ana Fernández', 'ana.fernandez@example.com', '3875551111', 'Completado', 89.97
  WHERE NOT EXISTS (SELECT 1 FROM orders)
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
SELECT o.id, p.id, v.quantity, p.price, p.price * v.quantity
FROM new_order o
CROSS JOIN (VALUES ('ROP-001', 2), ('ROP-002', 1)) AS v (sku, quantity)
JOIN products p ON p.sku = v.sku;
