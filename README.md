# Inventory App

🇪🇸 [Español](#español) · 🇬🇧 [English](#english)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)

---

## Español

Sistema web de **gestión de inventario y pedidos** para un comercio: administra productos, stock, clientes y pedidos desde un panel, con historial de cambios y reportes exportables.

### Funcionalidades

- **Inventario**: alta, edición y baja de productos con categoría, proveedor, precio, stock y estado (en stock, bajo stock, sin stock). Incluye búsqueda, filtros y estadísticas con gráficos.
- **Historial de productos**: cada alta o modificación queda registrada con los cambios realizados.
- **Clientes**: ficha de cliente, filtros, detalle y estadísticas.
- **Pedidos**: creación de pedidos con varios productos, estados, historial de cambios e impresión del pedido.
- **Reportes**: reporte de pedidos por período con exportación a **CSV**.
- Modo claro y oscuro, y diseño responsive con barra lateral.

### Tecnologías

| Área | Stack |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions), React 19, TypeScript |
| Base de datos | PostgreSQL en [Neon](https://neon.tech), consultas SQL con `@neondatabase/serverless` |
| UI | Tailwind CSS 3, shadcn/ui (Radix UI), lucide-react, next-themes |
| Gráficos | Recharts |
| Formularios | react-hook-form, zod |

### Estructura

```
app/
  actions/        # Server Actions: productos, clientes, pedidos
  inventory/      # inventario
  customers/      # clientes
  orders/         # pedidos
  reports/        # reportes
  types/          # tipos de dominio (Product, Customer, Order)
components/       # componentes por módulo + ui/ (shadcn)
db/
  schema.sql      # esquema completo de la base (idempotente)
  seed.sql        # datos de ejemplo
  migrations/     # cambios para bases creadas con versiones anteriores
scripts/db-run.mjs# aplica archivos .sql contra DATABASE_URL
lib/db.ts         # conexión a Neon
```

### Base de datos

| Tabla | Contenido |
|---|---|
| `categories`, `suppliers` | Categorías y proveedores de productos |
| `products` | Productos: SKU único, stock, precio, costo y estado |
| `product_history` | Altas, cambios y bajas de productos (`changes` en JSONB) |
| `customers` | Clientes |
| `orders`, `order_items` | Pedidos y sus líneas (borrar un pedido borra sus items) |
| `order_history` | Altas, cambios y bajas de pedidos |

### Puesta en marcha

Requisitos: Node.js 18.18 o superior y una base PostgreSQL en [Neon](https://neon.tech) (el plan gratuito alcanza).

1. Instalar dependencias:
   ```bash
   npm install        # o: pnpm install
   ```
2. Crear `.env.local` a partir del ejemplo y pegar la cadena de conexión de Neon (Dashboard → Connect):
   ```bash
   cp .env.example .env.local
   ```
3. Crear las tablas y cargar datos de ejemplo:
   ```bash
   npm run db:setup   # = db:schema + db:seed
   ```
   Para crear solo las tablas, sin datos, usar `npm run db:schema`. También se puede pegar `db/schema.sql` en el SQL Editor de Neon.
4. Levantar el servidor de desarrollo:
   ```bash
   npm run dev        # http://localhost:3000
   ```

> **Base existente creada antes de `db/schema.sql`**: correr una vez `db/migrations/001_history_format.sql` en el SQL Editor de Neon. Hace que el historial de productos se registre y que se puedan borrar productos con historial.

### Scripts

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción (necesita DATABASE_URL)
npm run start      # servir el build
npm run lint       # ESLint
npm run db:schema  # crear/actualizar tablas
npm run db:seed    # cargar datos de ejemplo
npm run db:setup   # ambos
```

---

## English

Web app for **inventory and order management** for a retail business: manage products, stock, customers and orders from a dashboard, with change history and exportable reports.

### Features

- **Inventory**: create, edit and delete products with category, supplier, price, stock and status (in stock, low stock, out of stock). Includes search, filters and charted statistics.
- **Product history**: every creation or update is logged with the changes made.
- **Customers**: customer records, filters, detail view and statistics.
- **Orders**: multi-item orders with statuses, change history and printable orders.
- **Reports**: order reports by period with **CSV** export.
- Light and dark mode, responsive layout with a sidebar.

### Tech stack

| Area | Stack |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions), React 19, TypeScript |
| Database | PostgreSQL on [Neon](https://neon.tech), SQL queries via `@neondatabase/serverless` |
| UI | Tailwind CSS 3, shadcn/ui (Radix UI), lucide-react, next-themes |
| Charts | Recharts |
| Forms | react-hook-form, zod |

### Database

The full schema lives in `db/schema.sql` (idempotent) and sample data in `db/seed.sql`. Tables: `categories`, `suppliers`, `products`, `product_history`, `customers`, `orders`, `order_items`, `order_history`. History tables store changes as JSONB.

### Getting started

Requirements: Node.js 18.18 or newer and a PostgreSQL database on [Neon](https://neon.tech) (the free tier is enough).

1. Install dependencies:
   ```bash
   npm install        # or: pnpm install
   ```
2. Create `.env.local` from the example and paste your Neon connection string (Dashboard → Connect):
   ```bash
   cp .env.example .env.local
   ```
3. Create the tables and load sample data:
   ```bash
   npm run db:setup   # = db:schema + db:seed
   ```
   To create only the tables, use `npm run db:schema`. You can also paste `db/schema.sql` into Neon's SQL Editor.
4. Start the development server:
   ```bash
   npm run dev        # http://localhost:3000
   ```

> **Existing database created before `db/schema.sql`**: run `db/migrations/001_history_format.sql` once in Neon's SQL Editor. It makes product history actually get recorded and allows deleting products that have history.

### Scripts

```bash
npm run dev        # development server
npm run build      # production build (requires DATABASE_URL)
npm run start      # serve the build
npm run lint       # ESLint
npm run db:schema  # create/update tables
npm run db:seed    # load sample data
npm run db:setup   # both
```

---

Desarrollado por / Developed by [Christian Sánchez](https://github.com/christiansanchezdt1).
