// Ejecuta archivos .sql contra DATABASE_URL (Neon, driver HTTP).
// Uso: node scripts/db-run.mjs db/schema.sql [db/seed.sql ...]
// Lee DATABASE_URL del entorno o de .env.local / .env.
// Cada sentencia debe terminar en ";" al final de una línea.
import { readFileSync, existsSync } from "node:fs"
import { neon } from "@neondatabase/serverless"

function loadEnv(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2")
    }
  }
}

loadEnv(".env.local")
loadEnv(".env")

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error("Uso: node scripts/db-run.mjs <archivo.sql> [...]")
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL (definila en .env.local, ver .env.example)")
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

for (const file of files) {
  const statements = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*$/m)
    .map((statement) => statement.trim())
    .filter(Boolean)

  for (const statement of statements) {
    try {
      await sql.query(statement)
    } catch (error) {
      console.error(`\n✗ ${file}\n${statement}\n\n${error.message}`)
      process.exit(1)
    }
  }
  console.log(`✓ ${file} (${statements.length} sentencias)`)
}
