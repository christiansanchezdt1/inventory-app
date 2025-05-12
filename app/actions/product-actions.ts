"use server"

import { neon } from "@neondatabase/serverless"
import type { Product, Category, Supplier } from "@/types/product"
import { revalidatePath } from "next/cache"

const sql = neon(process.env.DATABASE_URL!)

// Interfaz para el historial de productos
export interface ProductHistoryEntry {
  id: number
  product_id: number
  action_type: "create" | "update" | "delete"
  changes: Record<string, any>
  user_id?: number
  created_at: string
  product_name?: string // Para mostrar en la UI
}

// Obtener todos los productos con información de categoría y proveedor
export async function getProducts(): Promise<{ success: boolean; data?: Product[]; error?: string }> {
  try {
    const products = await sql`
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM 
        products p
      LEFT JOIN 
        categories c ON p.category_id = c.id
      LEFT JOIN 
        suppliers s ON p.supplier_id = s.id
      ORDER BY 
        p.name ASC
    `
    return { success: true, data: products }
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return { success: false, error: "No se pudieron cargar los productos" }
  }
}

// Obtener un producto por ID
export async function getProductById(id: number): Promise<{ success: boolean; data?: Product; error?: string }> {
  try {
    const [product] = await sql`
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM 
        products p
      LEFT JOIN 
        categories c ON p.category_id = c.id
      LEFT JOIN 
        suppliers s ON p.supplier_id = s.id
      WHERE 
        p.id = ${id}
    `
    if (!product) {
      return { success: false, error: "Producto no encontrado" }
    }
    return { success: true, data: product }
  } catch (error) {
    console.error(`Error al obtener producto con ID ${id}:`, error)
    return { success: false, error: "No se pudo cargar el producto" }
  }
}

// Registrar una entrada en el historial
async function recordProductHistory(
  productId: number,
  actionType: "create" | "update" | "delete",
  changes: Record<string, any>,
): Promise<void> {
  try {
    await sql`
      INSERT INTO product_history (
        product_id, 
        action_type, 
        changes
      ) VALUES (
        ${productId},
        ${actionType},
        ${JSON.stringify(changes)}
      )
    `
  } catch (error) {
    console.error(`Error al registrar historial para producto ${productId}:`, error)
    // No lanzamos error para no interrumpir la operación principal
  }
}

// Crear un nuevo producto
export async function createProduct(
  productData: Omit<Product, "id" | "created_at" | "updated_at">,
): Promise<{ success: boolean; data?: Product; error?: string }> {
  try {
    const [newProduct] = await sql`
      INSERT INTO products (
        name, 
        description, 
        sku, 
        category_id, 
        supplier_id, 
        stock, 
        price, 
        cost_price, 
        status,
        image_url,
        created_at,
        updated_at
      ) VALUES (
        ${productData.name},
        ${productData.description},
        ${productData.sku},
        ${productData.category_id},
        ${productData.supplier_id},
        ${productData.stock},
        ${productData.price},
        ${productData.cost_price},
        ${productData.status},
        ${productData.image_url || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    // Registrar en el historial
    await recordProductHistory(newProduct.id, "create", productData)

    revalidatePath("/inventory")
    revalidatePath("/")

    return { success: true, data: newProduct }
  } catch (error) {
    console.error("Error al crear producto:", error)
    return { success: false, error: "No se pudo crear el producto" }
  }
}

// Actualizar un producto existente
export async function updateProduct(
  id: number,
  productData: Partial<Product>,
): Promise<{ success: boolean; data?: Product; error?: string }> {
  try {
    // Obtener el producto actual para registrar los cambios
    const currentProductResult = await getProductById(id)
    if (!currentProductResult.success) {
      return currentProductResult
    }

    const currentProduct = currentProductResult.data!

    // Construir dinámicamente la consulta de actualización
    const updateFields = []
    const values = []

    // Añadir cada campo que no sea nulo o indefinido
    if (productData.name !== undefined) {
      updateFields.push("name = $1")
      values.push(productData.name)
    }
    if (productData.description !== undefined) {
      updateFields.push(`description = $${values.length + 1}`)
      values.push(productData.description)
    }
    if (productData.sku !== undefined) {
      updateFields.push(`sku = $${values.length + 1}`)
      values.push(productData.sku)
    }
    if (productData.category_id !== undefined) {
      updateFields.push(`category_id = $${values.length + 1}`)
      values.push(productData.category_id)
    }
    if (productData.supplier_id !== undefined) {
      updateFields.push(`supplier_id = $${values.length + 1}`)
      values.push(productData.supplier_id)
    }
    if (productData.stock !== undefined) {
      updateFields.push(`stock = $${values.length + 1}`)
      values.push(productData.stock)
    }
    if (productData.price !== undefined) {
      updateFields.push(`price = $${values.length + 1}`)
      values.push(productData.price)
    }
    if (productData.cost_price !== undefined) {
      updateFields.push(`cost_price = $${values.length + 1}`)
      values.push(productData.cost_price)
    }
    if (productData.status !== undefined) {
      updateFields.push(`status = $${values.length + 1}`)
      values.push(productData.status)
    }
    if (productData.image_url !== undefined) {
      updateFields.push(`image_url = $${values.length + 1}`)
      values.push(productData.image_url)
    }

    // Añadir updated_at
    updateFields.push(`updated_at = NOW()`)

    // Si no hay campos para actualizar, devolver el producto sin cambios
    if (updateFields.length === 0) {
      return { success: true, data: currentProduct }
    }

    // Construir la consulta SQL
    const query = `
      UPDATE products 
      SET ${updateFields.join(", ")} 
      WHERE id = $${values.length + 1} 
      RETURNING *
    `

    // Añadir el ID al final de los valores
    values.push(id)

    const [updatedProduct] = await sql.query(query, values)

    // Calcular los cambios para el historial
    const changes: Record<string, { before: any; after: any }> = {}
    Object.keys(productData).forEach((key) => {
      if (key in currentProduct && productData[key as keyof Product] !== currentProduct[key as keyof Product]) {
        changes[key] = {
          before: currentProduct[key as keyof Product],
          after: productData[key as keyof Product],
        }
      }
    })

    // Registrar en el historial si hay cambios
    if (Object.keys(changes).length > 0) {
      await recordProductHistory(id, "update", changes)
    }

    revalidatePath("/inventory")
    revalidatePath("/")

    return { success: true, data: updatedProduct }
  } catch (error) {
    console.error(`Error al actualizar producto con ID ${id}:`, error)
    return { success: false, error: "No se pudo actualizar el producto" }
  }
}

// Eliminar un producto
export async function deleteProduct(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Obtener el producto antes de eliminarlo para el historial
    const productResult = await getProductById(id)
    if (!productResult.success) {
      return productResult
    }

    const product = productResult.data!

    await sql`
      DELETE FROM products 
      WHERE id = ${id}
    `

    // Registrar en el historial
    await recordProductHistory(id, "delete", { deletedProduct: product })

    revalidatePath("/inventory")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error(`Error al eliminar producto con ID ${id}:`, error)
    return { success: false, error: "No se pudo eliminar el producto" }
  }
}

// Obtener todas las categorías
export async function getCategories(): Promise<{ success: boolean; data?: Category[]; error?: string }> {
  try {
    const categories = await sql`
      SELECT * FROM categories
      ORDER BY name ASC
    `
    return { success: true, data: categories }
  } catch (error) {
    console.error("Error al obtener categorías:", error)
    return { success: false, error: "No se pudieron cargar las categorías" }
  }
}

// Obtener todos los proveedores
export async function getSuppliers(): Promise<{ success: boolean; data?: Supplier[]; error?: string }> {
  try {
    const suppliers = await sql`
      SELECT * FROM suppliers
      ORDER BY name ASC
    `
    return { success: true, data: suppliers }
  } catch (error) {
    console.error("Error al obtener proveedores:", error)
    return { success: false, error: "No se pudieron cargar los proveedores" }
  }
}

// Obtener historial de cambios de un producto
export async function getProductHistory(
  productId?: number,
): Promise<{ success: boolean; data?: ProductHistoryEntry[]; error?: string }> {
  try {
    let historyQuery

    if (productId) {
      // Historial para un producto específico
      historyQuery = sql`
        SELECT 
          ph.*,
          p.name as product_name
        FROM 
          product_history ph
        LEFT JOIN 
          products p ON ph.product_id = p.id
        WHERE 
          ph.product_id = ${productId}
        ORDER BY 
          ph.created_at DESC
      `
    } else {
      // Historial general de todos los productos
      historyQuery = sql`
        SELECT 
          ph.*,
          p.name as product_name
        FROM 
          product_history ph
        LEFT JOIN 
          products p ON ph.product_id = p.id
        ORDER BY 
          ph.created_at DESC
        LIMIT 100
      `
    }

    const history = await historyQuery
    return { success: true, data: history }
  } catch (error) {
    console.error(
      `Error al obtener historial ${productId ? `del producto con ID ${productId}` : "de productos"}:`,
      error,
    )
    return { success: false, error: "No se pudo cargar el historial" }
  }
}

// Obtener estadísticas de inventario para el dashboard
export async function getInventoryStats(): Promise<{
  success: boolean
  data?: {
    totalProducts: number
    lowStockProducts: number
    totalValue: number
    categoryCounts: { category: string; count: number }[]
    recentActivity: ProductHistoryEntry[]
  }
  error?: string
}> {
  try {
    // Total de productos
    const [totalProductsResult] = await sql`SELECT COUNT(*) as count FROM products`
    const totalProducts = Number.parseInt(totalProductsResult.count)

    // Productos con bajo stock (menos de 10 unidades)
    const [lowStockResult] = await sql`SELECT COUNT(*) as count FROM products WHERE stock < 10`
    const lowStockProducts = Number.parseInt(lowStockResult.count)

    // Valor total del inventario
    const [totalValueResult] = await sql`SELECT SUM(stock * price) as total FROM products`
    const totalValue = Number.parseFloat(totalValueResult.total || "0")

    // Conteo por categorías
    const categoryCounts = await sql`
      SELECT 
        c.name as category, 
        COUNT(p.id) as count
      FROM 
        categories c
      LEFT JOIN 
        products p ON c.id = p.category_id
      GROUP BY 
        c.name
      ORDER BY 
        count DESC
    `

    // Actividad reciente (últimas 10 entradas del historial)
    const recentActivity = await sql`
      SELECT 
        ph.*,
        p.name as product_name
      FROM 
        product_history ph
      LEFT JOIN 
        products p ON ph.product_id = p.id
      ORDER BY 
        ph.created_at DESC
      LIMIT 10
    `

    return {
      success: true,
      data: {
        totalProducts,
        lowStockProducts,
        totalValue,
        categoryCounts,
        recentActivity,
      },
    }
  } catch (error) {
    console.error("Error al obtener estadísticas de inventario:", error)
    return { success: false, error: "No se pudieron cargar las estadísticas del inventario" }
  }
}
