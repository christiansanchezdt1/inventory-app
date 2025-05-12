"use server"

import { neon } from "@neondatabase/serverless"
import type { Order, OrderItem, OrderWithItems, OrderHistoryEntry } from "@/types/order"
import { revalidatePath } from "next/cache"

const sql = neon(process.env.DATABASE_URL!)

// Obtener todos los pedidos
export async function getOrders(): Promise<{ success: boolean; data?: Order[]; error?: string }> {
  try {
    const orders = await sql`
      SELECT * FROM orders
      ORDER BY created_at DESC
    `
    return { success: true, data: orders }
  } catch (error) {
    console.error("Error al obtener pedidos:", error)
    return { success: false, error: "No se pudieron cargar los pedidos" }
  }
}

// Obtener un pedido por ID con sus items
export async function getOrderById(id: number): Promise<{ success: boolean; data?: OrderWithItems; error?: string }> {
  try {
    // Obtener el pedido
    const [order] = await sql`
      SELECT * FROM orders
      WHERE id = ${id}
    `

    if (!order) {
      return { success: false, error: "Pedido no encontrado" }
    }

    // Obtener los items del pedido con información del producto
    const items = await sql`
      SELECT 
        oi.*,
        p.name as product_name,
        p.sku as product_sku
      FROM 
        order_items oi
      JOIN 
        products p ON oi.product_id = p.id
      WHERE 
        oi.order_id = ${id}
    `

    return {
      success: true,
      data: {
        ...order,
        items,
      },
    }
  } catch (error) {
    console.error(`Error al obtener pedido con ID ${id}:`, error)
    return { success: false, error: "No se pudo cargar el pedido" }
  }
}

// Registrar una entrada en el historial
async function recordOrderHistory(
  orderId: number,
  actionType: "create" | "update" | "delete",
  changes: Record<string, any>
): Promise<void> {
  try {
    await sql`
      INSERT INTO order_history (
        order_id, 
        action_type, 
        changes
      ) VALUES (
        ${orderId},
        ${actionType},
        ${JSON.stringify(changes)}
      )
    `
  } catch (error) {
    console.error(`Error al registrar historial para pedido ${orderId}:`, error)
    // No lanzamos error para no interrumpir la operación principal
  }
}

// Generar número de pedido único
async function generateOrderNumber(): Promise<string> {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  
  // Obtener el último número de pedido del día
  const [lastOrder] = await sql`
    SELECT order_number FROM orders
    WHERE order_number LIKE ${`ORD-${year}${month}${day}-%`}
    ORDER BY order_number DESC
    LIMIT 1
  `
  
  let sequence = 1
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.order_number.split('-').pop() || '0')
    sequence = lastSequence + 1
  }
  
  return `ORD-${year}${month}${day}-${sequence.toString().padStart(3, '0')}`
}

// Crear un nuevo pedido
export async function createOrder(
  orderData: Omit<Order, "id" | "order_number" | "created_at" | "updated_at"> & {
    items: Omit<OrderItem, "id" | "order_id" | "created_at" | "subtotal">[]
  }
): Promise<{ success: boolean; data?: OrderWithItems; error?: string }> {
  try {
    // Generar número de pedido
    const orderNumber = await generateOrderNumber()
    
    // Calcular el total del pedido
    const totalAmount = orderData.items.reduce((total, item) => total + item.price * item.quantity, 0)
    
    // Crear el pedido
    const [newOrder] = await sql`
      INSERT INTO orders (
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        status,
        total_amount,
        notes,
        created_at,
        updated_at
      ) VALUES (
        ${orderNumber},
        ${orderData.customer_name},
        ${orderData.customer_email || null},
        ${orderData.customer_phone || null},
        ${orderData.status},
        ${totalAmount},
        ${orderData.notes || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `
    
    // Crear los items del pedido
    const orderItems = []
    for (const item of orderData.items) {
      const subtotal = item.price * item.quantity
      const [newItem] = await sql`
        INSERT INTO order_items (
          order_id,
          product_id,
          quantity,
          price,
          subtotal,
          created_at
        ) VALUES (
          ${newOrder.id},
          ${item.product_id},
          ${item.quantity},
          ${item.price},
          ${subtotal},
          NOW()
        )
        RETURNING *
      `
      
      // Obtener información del producto para la UI
      const [product] = await sql`
        SELECT name as product_name, sku as product_sku
        FROM products
        WHERE id = ${item.product_id}
      `
      
      orderItems.push({
        ...newItem,
        product_name: product.product_name,
        product_sku: product.product_sku
      })
    }
    
    // Registrar en el historial
    await recordOrderHistory(newOrder.id, "create", {
      order: newOrder,
      items: orderItems
    })
    
    revalidatePath('/orders')
    revalidatePath('/')
    
    return {
      success: true,
      data: {
        ...newOrder,
        items: orderItems
      }
    }
  } catch (error) {
    console.error("Error al crear pedido:", error)
    return { success: false, error: "No se pudo crear el pedido" }
  }
}

// Actualizar un pedido existente
export async function updateOrder(
  id: number,
  orderData: Partial<Order> & {
    items?: (Omit<OrderItem, "created_at" | "subtotal"> & { id?: number })[]
  }
): Promise<{ success: boolean; data?: OrderWithItems; error?: string }> {
  try {
    // Obtener el pedido actual para registrar los cambios
    const currentOrderResult = await getOrderById(id)
    if (!currentOrderResult.success) {
      return currentOrderResult
    }
    
    const currentOrder = currentOrderResult.data!
    const changes: Record<string, any> = { order: {}, items: [] }
    
    // Actualizar el pedido
    if (Object.keys(orderData).some(key => key !== 'items')) {
      const updateFields = []
      const values = []
      
      // Añadir cada campo que no sea nulo o indefinido
      if (orderData.customer_name !== undefined) {
        updateFields.push("customer_name = $1")
        values.push(orderData.customer_name)
        changes.order.customer_name = {
          before: currentOrder.customer_name,
          after: orderData.customer_name
        }
      }
      
      if (orderData.customer_email !== undefined) {
        updateFields.push(`customer_email = $${values.length + 1}`)
        values.push(orderData.customer_email)
        changes.order.customer_email = {
          before: currentOrder.customer_email,
          after: orderData.customer_email
        }
      }
      
      if (orderData.customer_phone !== undefined) {
        updateFields.push(`customer_phone = $${values.length + 1}`)
        values.push(orderData.customer_phone)
        changes.order.customer_phone = {
          before: currentOrder.customer_phone,
          after: orderData.customer_phone
        }
      }
      
      if (orderData.status !== undefined) {
        updateFields.push(`status = $${values.length + 1}`)
        values.push(orderData.status)
        changes.order.status = {
          before: currentOrder.status,
          after: orderData.status
        }
      }
      
      if (orderData.notes !== undefined) {
        updateFields.push(`notes = $${values.length + 1}`)
        values.push(orderData.notes)
        changes.order.notes = {
          before: currentOrder.notes,
          after: orderData.notes
        }
      }
      
      // Añadir updated_at
      updateFields.push(`updated_at = NOW()`)
      
      // Si hay campos para actualizar
      if (updateFields.length > 0) {
        // Construir la consulta SQL
        const query = `
          UPDATE orders 
          SET ${updateFields.join(", ")} 
          WHERE id = $${values.length + 1} 
          RETURNING *
        `
        
        // Añadir el ID al final de los valores
        values.push(id)
        
        const [updatedOrder] = await sql.query(query, values)
        Object.assign(currentOrder, updatedOrder)
      }
    }
    
    // Actualizar los items del pedido si se proporcionan
    if (orderData.items && orderData.items.length > 0) {
      // Eliminar los items actuales
      const currentItemIds = currentOrder.items.map(item => item.id)
      const newItemIds = orderData.items.filter(item => item.id).map(item => item.id)
      
      // Items a eliminar (están en currentItemIds pero no en newItemIds)
      const itemsToDelete = currentOrder.items.filter(item => 
        item.id && !newItemIds.includes(item.id)
      )
      
      // Registrar items eliminados en los cambios
      if (itemsToDelete.length > 0) {
        changes.items.push({
          action: 'delete',
          items: itemsToDelete
        })
        
        // Eliminar los items
        for (const item of itemsToDelete) {
          await sql`
            DELETE FROM order_items
            WHERE id = ${item.id}
          `
        }
      }
      
      // Actualizar o crear nuevos items
      const updatedItems = []
      
      for (const item of orderData.items) {
        const subtotal = item.price * item.quantity
        
        if (item.id) {
          // Actualizar item existente
          const currentItem = currentOrder.items.find(i => i.id === item.id)
          
          if (currentItem) {
            const [updatedItem] = await sql`
              UPDATE order_items
              SET 
                product_id = ${item.product_id},
                quantity = ${item.quantity},
                price = ${item.price},
                subtotal = ${subtotal}
              WHERE id = ${item.id}
              RETURNING *
            `
            
            // Obtener información del producto para la UI
            const [product] = await sql`
              SELECT name as product_name, sku as product_sku
              FROM products
              WHERE id = ${item.product_id}
            `
            
            const updatedItemWithProduct = {
              ...updatedItem,
              product_name: product.product_name,
              product_sku: product.product_sku
            }
            
            updatedItems.push(updatedItemWithProduct)
            
            // Registrar cambios en el item
            if (
              currentItem.product_id !== item.product_id ||
              currentItem.quantity !== item.quantity ||
              currentItem.price !== item.price
            ) {
              changes.items.push({
                action: 'update',
                before: currentItem,
                after: updatedItemWithProduct
              })
            }
          }
        } else {
          // Crear nuevo item
          const [newItem] = await sql`
            INSERT INTO order_items (
              order_id,
              product_id,
              quantity,
              price,
              subtotal,
              created_at
            ) VALUES (
              ${id},
              ${item.product_id},
              ${item.quantity},
              ${item.price},
              ${subtotal},
              NOW()
            )
            RETURNING *
          `
          
          // Obtener información del producto para la UI
          const [product] = await sql`
            SELECT name as product_name, sku as product_sku
            FROM products
            WHERE id = ${item.product_id}
          `
          
          const newItemWithProduct = {
            ...newItem,
            product_name: product.product_name,
            product_sku: product.product_sku
          }
          
          updatedItems.push(newItemWithProduct)
          
          // Registrar nuevo item en los cambios
          changes.items.push({
            action: 'create',
            item: newItemWithProduct
          })
        }
      }
      
      // Actualizar los items en el objeto currentOrder
      currentOrder.items = updatedItems
      
      // Recalcular el total del pedido
      const totalAmount = updatedItems.reduce((total, item) => total + Number(item.subtotal), 0)
      
      // Actualizar el total en la base de datos
      await sql`
        UPDATE orders
        SET 
          total_amount = ${totalAmount},
          updated_at = NOW()
        WHERE id = ${id}
      `
      
      // Actualizar el total en el objeto currentOrder
      currentOrder.total_amount = totalAmount
      
      // Registrar cambio en el total si cambió
      if (currentOrder.total_amount !== totalAmount) {
        changes.order.total_amount = {
          before: currentOrder.total_amount,
          after: totalAmount
        }
      }
    }
    
    // Registrar en el historial si hay cambios
    if (
      Object.keys(changes.order).length > 0 || 
      changes.items.length > 0
    ) {
      await recordOrderHistory(id, "update", changes)
    }
    
    revalidatePath('/orders')
    revalidatePath('/')
    
    return { success: true, data: currentOrder }
  } catch (error) {
    console.error(`Error al actualizar pedido con ID ${id}:`, error)
    return { success: false, error: "No se pudo actualizar el pedido" }
  }
}

// Eliminar un pedido
export async function deleteOrder(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Obtener el pedido antes de eliminarlo para el historial
    const orderResult = await getOrderById(id)
    if (!orderResult.success) {
      return orderResult
    }
    
    const order = orderResult.data!
    
    // Eliminar el pedido (los items se eliminarán en cascada)
    await sql`
      DELETE FROM orders 
      WHERE id = ${id}
    `
    
    // Registrar en el historial
    await recordOrderHistory(id, "delete", { deletedOrder: order })
    
    revalidatePath('/orders')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error(`Error al eliminar pedido con ID ${id}:`, error)
    return { success: false, error: "No se pudo eliminar el pedido" }
  }
}

// Obtener historial de cambios de un pedido
export async function getOrderHistory(
  orderId?: number
): Promise<{ success: boolean; data?: OrderHistoryEntry[]; error?: string }> {
  try {
    let historyQuery
    
    if (orderId) {
      // Historial para un pedido específico
      historyQuery = sql`
        SELECT 
          oh.*,
          o.order_number
        FROM 
          order_history oh
        LEFT JOIN 
          orders o ON oh.order_id = o.id
        WHERE 
          oh.order_id = ${orderId}
        ORDER BY 
          oh.created_at DESC
      `
    } else {
      // Historial general de todos los pedidos
      historyQuery = sql`
        SELECT 
          oh.*,
          o.order_number
        FROM 
          order_history oh
        LEFT JOIN 
          orders o ON oh.order_id = o.id
        ORDER BY 
          oh.created_at DESC
        LIMIT 100
      `
    }
    
    const history = await historyQuery
    
    // Asegurarse de que los cambios (changes) sean objetos válidos
    const validatedHistory = history.map((entry) => ({
      ...entry,
      // Asegurarse de que changes sea un objeto válido
      changes: entry.changes && typeof entry.changes === "object" ? entry.changes : {},
    }))
    
    return { success: true, data: validatedHistory || [] }
  } catch (error) {
    console.error(
      `Error al obtener historial ${orderId ? `del pedido con ID ${orderId}` : "de pedidos"}:`,
      error
    )
    return { success: false, error: "No se pudo cargar el historial", data: [] }
  }
}

// Obtener productos para seleccionar en el formulario de pedidos
export async function getProductsForOrder(): Promise<{ 
  success: boolean; 
  data?: { id: number; name: string; sku: string; price: number; stock: number }[]; 
  error?: string 
}> {
  try {
    const products = await sql`
      SELECT 
        id, 
        name, 
        sku, 
        price, 
        stock
      FROM 
        products
      WHERE 
        status != 'Descontinuado'
        AND stock > 0
      ORDER BY 
        name ASC
    `
    return { success: true, data: products }
  } catch (error) {
    console.error("Error al obtener productos para pedido:", error)
    return { success: false, error: "No se pudieron cargar los productos" }
  }
}
