"use client"

import { useState } from "react"
import type { ProductHistoryEntry } from "@/app/actions/product-actions"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, Edit, Trash, ChevronDown, ChevronRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface ProductHistoryListProps {
  historyEntries: ProductHistoryEntry[]
}

export default function ProductHistoryList({ historyEntries }: ProductHistoryListProps) {
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({})

  const toggleItem = (id: number) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  if (historyEntries.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay actividad reciente para mostrar</div>
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "create":
        return <Plus className="h-4 w-4" />
      case "update":
        return <Edit className="h-4 w-4" />
      case "delete":
        return <Trash className="h-4 w-4" />
      default:
        return null
    }
  }

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case "create":
        return <Badge className="bg-green-500">Creación</Badge>
      case "update":
        return <Badge className="bg-blue-500">Actualización</Badge>
      case "delete":
        return <Badge className="bg-red-500">Eliminación</Badge>
      default:
        return <Badge>{actionType}</Badge>
    }
  }

  const formatChanges = (changes: Record<string, any> | null | undefined, actionType: string) => {
    // Si changes es null o undefined, mostrar mensaje
    if (!changes) {
      return <div className="text-muted-foreground">No hay detalles disponibles</div>
    }

    if (actionType === "create") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(changes).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="font-medium">{formatFieldName(key)}:</span>
              <span>{formatValue(value, key)}</span>
            </div>
          ))}
        </div>
      )
    }

    if (actionType === "delete") {
      const deletedProduct = changes.deletedProduct
      if (!deletedProduct) {
        return <div className="text-muted-foreground">No hay detalles disponibles sobre el producto eliminado</div>
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(deletedProduct).map(([key, value]) => {
            // Filtrar campos que no queremos mostrar
            if (["id", "created_at", "updated_at"].includes(key)) return null

            return (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{formatFieldName(key)}:</span>
                <span>{formatValue(value, key)}</span>
              </div>
            )
          })}
        </div>
      )
    }

    // Para actualizaciones, mostrar antes y después
    // Verificar que hay cambios para mostrar y que changes es un objeto válido
    if (!changes || typeof changes !== "object" || Object.keys(changes).length === 0) {
      return <div className="text-muted-foreground">No se detectaron cambios</div>
    }

    return (
      <div className="space-y-2">
        {Object.entries(changes).map(([key, change]) => {
          // Verificar que change tiene las propiedades before y after
          if (!change || typeof change !== "object" || !("before" in change) || !("after" in change)) {
            return null
          }

          return (
            <div key={key} className="grid grid-cols-3 gap-2">
              <span className="font-medium">{formatFieldName(key)}:</span>
              <span className="line-through text-muted-foreground">{formatValue(change.before, key)}</span>
              <span className="font-medium text-green-600">{formatValue(change.after, key)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const formatFieldName = (key: string) => {
    const fieldNames: Record<string, string> = {
      name: "Nombre",
      description: "Descripción",
      sku: "SKU",
      category_id: "Categoría",
      supplier_id: "Proveedor",
      stock: "Stock",
      price: "Precio",
      cost_price: "Costo",
      status: "Estado",
      image_url: "Imagen",
    }

    return fieldNames[key] || key
  }

  const formatValue = (value: any, key: string) => {
    if (value === null || value === undefined) return "-"

    if (typeof value === "number") {
      // Si parece un precio
      if (key === "price" || key === "cost_price") {
        return formatCurrency(value)
      }
      return value.toString()
    }

    if (typeof value === "boolean") {
      return value ? "Sí" : "No"
    }

    return value.toString()
  }

  return (
    <div className="space-y-4">
      {historyEntries.map((entry) => (
        <Collapsible
          key={entry.id}
          open={openItems[entry.id]}
          onOpenChange={() => toggleItem(entry.id)}
          className="border rounded-md p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getActionIcon(entry.action_type)}
              <span className="font-medium">{entry.product_name || `Producto #${entry.product_id}`}</span>
              <span className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(entry.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getActionBadge(entry.action_type)}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {openItems[entry.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          <CollapsibleContent className="mt-4 pt-4 border-t">
            {formatChanges(entry.changes, entry.action_type)}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}
