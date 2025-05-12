import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Limpiar la base de datos
  await prisma.product.deleteMany()

  // Crear productos de ejemplo
  const products = [
    { name: "Camiseta Básica", category: "Ropa", stock: 45, price: 19.99, status: "En stock" },
    { name: "Pantalón Vaquero", category: "Ropa", stock: 32, price: 49.99, status: "En stock" },
    { name: "Zapatillas Deportivas", category: "Calzado", stock: 12, price: 89.99, status: "Bajo stock" },
    { name: "Reloj Analógico", category: "Accesorios", stock: 8, price: 129.99, status: "Bajo stock" },
    { name: "Bolso de Cuero", category: "Accesorios", stock: 0, price: 159.99, status: "Sin stock" },
    { name: "Auriculares Bluetooth", category: "Electrónica", stock: 23, price: 79.99, status: "En stock" },
    { name: "Tablet 10\"", category: "Electrónica", stock: 5, price: 299.99, status: "Bajo stock" },
    { name: "Perfume Unisex", category: "Belleza", stock: 18, price: 69.99, status: "En stock" },
  ]

  for (const product of products) {
    await prisma.product.create({
      data: product,
    })
  }

  console.log('Base de datos poblada con éxito')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })