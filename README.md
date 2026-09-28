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
lib/db.ts         # conexión a Neon
prisma/           # seed con productos de ejemplo
```

Tablas usadas: `products`, `categories`, `suppliers`, `product_history`, `customers`, `orders`, `order_items`, `order_history`.

### Puesta en marcha

Requisitos: Node.js 18.18 o superior y una base PostgreSQL (por ejemplo, un proyecto gratuito en Neon) con las tablas de arriba.

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear `.env.local` con la cadena de conexión:
   ```dotenv
   DATABASE_URL=postgresql://usuario:clave@host/base?sslmode=require
   ```
3. Levantar el servidor de desarrollo:
   ```bash
   npm run dev        # http://localhost:3000
   ```

### Scripts

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción
npm run start      # servir el build
npm run lint       # ESLint
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

### Getting started

Requirements: Node.js 18.18 or newer and a PostgreSQL database (e.g. a free Neon project) with the tables listed above.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` with the connection string:
   ```dotenv
   DATABASE_URL=postgresql://user:password@host/db?sslmode=require
   ```
3. Start the development server:
   ```bash
   npm run dev        # http://localhost:3000
   ```

### Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # serve the build
npm run lint       # ESLint
```

---

Desarrollado por / Developed by [Christian Sánchez](https://github.com/christiansanchezdt1).
