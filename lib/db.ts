import { neon } from "@neondatabase/serverless"

// Crear una instancia de conexión a la base de datos
export const sql = neon(process.env.DATABASE_URL!)

// Función auxiliar para ejecutar consultas con parámetros
export async function query(queryText: string, params: any[] = []) {
  try {
    // Usar sql.query para consultas parametrizadas
    return await sql.query(queryText, params)
  } catch (error) {
    console.error("Error ejecutando consulta SQL:", error)
    throw error
  }
}
