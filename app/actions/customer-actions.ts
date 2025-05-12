"use server"

import { neon } from "@neondatabase/serverless"
import type { Customer } from "@/types/customer"
import { revalidatePath } from "next/cache"

const sql = neon(process.env.DATABASE_URL!)

// Obtener todos los clientes
export async function getCustomers(): Promise<{ success: boolean; data?: Customer[]; error?: string }> {
  try {
    const customers = await sql`
      SELECT * FROM customers
      ORDER BY name ASC
    `
    return { success: true, data: customers }
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    return { success: false, error: "No se pudieron cargar los clientes" }
  }
}

// Obtener un cliente por ID
export async function getCustomerById(id: number): Promise<{ success: boolean; data?: Customer; error?: string }> {
  try {
    const [customer] = await sql`
      SELECT * FROM customers
      WHERE id = ${id}
    `
    if (!customer) {
      return { success: false, error: "Cliente no encontrado" }
    }
    return { success: true, data: customer }
  } catch (error) {
    console.error(`Error al obtener cliente con ID ${id}:`, error)
    return { success: false, error: "No se pudo cargar el cliente" }
  }
}

// Crear un nuevo cliente
export async function createCustomer(
  customerData: Omit<Customer, "id" | "created_at" | "updated_at">,
): Promise<{ success: boolean; data?: Customer; error?: string }> {
  try {
    const [newCustomer] = await sql`
      INSERT INTO customers (
        name, 
        email, 
        phone, 
        address, 
        notes,
        created_at,
        updated_at
      ) VALUES (
        ${customerData.name},
        ${customerData.email},
        ${customerData.phone},
        ${customerData.address},
        ${customerData.notes},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    revalidatePath("/customers")
    revalidatePath("/orders")

    return { success: true, data: newCustomer }
  } catch (error) {
    console.error("Error al crear cliente:", error)
    return { success: false, error: "No se pudo crear el cliente" }
  }
}

// Actualizar un cliente existente
export async function updateCustomer(
  id: number,
  customerData: Partial<Customer>,
): Promise<{ success: boolean; data?: Customer; error?: string }> {
  try {
    // Construir dinámicamente la consulta de actualización
    const updateFields = []
    const values = []

    // Añadir cada campo que no sea nulo o indefinido
    if (customerData.name !== undefined) {
      updateFields.push("name = $1")
      values.push(customerData.name)
    }
    if (customerData.email !== undefined) {
      updateFields.push(`email = $${values.length + 1}`)
      values.push(customerData.email)
    }
    if (customerData.phone !== undefined) {
      updateFields.push(`phone = $${values.length + 1}`)
      values.push(customerData.phone)
    }
    if (customerData.address !== undefined) {
      updateFields.push(`address = $${values.length + 1}`)
      values.push(customerData.address)
    }
    if (customerData.notes !== undefined) {
      updateFields.push(`notes = $${values.length + 1}`)
      values.push(customerData.notes)
    }

    // Añadir updated_at
    updateFields.push(`updated_at = NOW()`)

    // Si no hay campos para actualizar, devolver error
    if (updateFields.length === 0) {
      return { success: false, error: "No hay datos para actualizar" }
    }

    // Construir la consulta SQL
    const query = `
      UPDATE customers 
      SET ${updateFields.join(", ")} 
      WHERE id = $${values.length + 1} 
      RETURNING *
    `

    // Añadir el ID al final de los valores
    values.push(id)

    const [updatedCustomer] = await sql.query(query, values)

    revalidatePath("/customers")
    revalidatePath("/orders")

    return { success: true, data: updatedCustomer }
  } catch (error) {
    console.error(`Error al actualizar cliente con ID ${id}:`, error)
    return { success: false, error: "No se pudo actualizar el cliente" }
  }
}

// Eliminar un cliente
export async function deleteCustomer(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      DELETE FROM customers 
      WHERE id = ${id}
    `

    revalidatePath("/customers")
    revalidatePath("/orders")

    return { success: true }
  } catch (error) {
    console.error(`Error al eliminar cliente con ID ${id}:`, error)
    return { success: false, error: "No se pudo eliminar el cliente" }
  }
}

// Obtener clientes para el formulario de pedidos
export async function getCustomersForOrder(): Promise<{
  success: boolean
  data?: { id: number; name: string; email: string | null; phone: string | null }[]
  error?: string
}> {
  try {
    const customers = await sql`
      SELECT 
        id, 
        name, 
        email, 
        phone
      FROM 
        customers
      ORDER BY 
        name ASC
    `
    return { success: true, data: customers }
  } catch (error) {
    console.error("Error al obtener clientes para pedido:", error)
    return { success: false, error: "No se pudieron cargar los clientes" }
  }
}
