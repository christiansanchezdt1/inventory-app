"use client"

import { useState } from "react"
import type { OrderHistoryEntry } from "@/types/order"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, Edit, Trash, ChevronDown, ChevronRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface OrderHistoryListProps {
  historyEntries: OrderHistoryEntry[]
}

export default function OrderHistoryList({ historyEntries }: OrderHistoryListProps) {
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
      // Para creación, mostrar los detalles del pedido
      const order = changes.order
      if (!order) {
        return <div className="text-muted-foreground">No hay detalles disponibles</div>
      }

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex justify-between">
              <span className="font-medium">Cliente:</span>
              <span>{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Estado:</span>
              <span>{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Fecha:</span>
              <span>{new Date(order.created_at).toLocaleString()}</span>
            </div>
          </div>

          {changes.items && changes.items.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Productos:</h4>
              <div className="border rounded-md divide-y">
                {changes.items.map((item: any, index: number) => (
                  <div key={index} className="p-2 flex justify-between">
                    <span>{item.product_name || `Producto #${item.product_id}`}</span>
                    <span>
                      {item.quantity} x {formatCurrency(item.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (actionType === "delete") {
      // Para eliminación, mostrar los detalles del pedido eliminado
      const deletedOrder = changes.deletedOrder
      if (!deletedOrder) {
        return <div className="text-muted-foreground">No hay detalles disponibles sobre el pedido eliminado</div>
      }

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex justify-between">
              <span className="font-medium">Cliente:</span>
              <span>{deletedOrder.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Estado:</span>
              <span>{deletedOrder.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total:</span>
              <span>{formatCurrency(deletedOrder.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Fecha:</span>
              <span>{new Date(deletedOrder.created_at).toLocaleString()}</span>
            </div>
          </div>

          {deletedOrder.items && deletedOrder.items.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Productos eliminados:</h4>
              <div className="border rounded-md divide-y">
                {deletedOrder.items.map((item: any, index: number) => (
                  <div key={index} className="p-2 flex justify-between">
                    <span>{item.product_name || `Producto #${item.product_id}`}</span>
                    <span>
                      {item.quantity} x {formatCurrency(item.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    // Para actualizaciones, mostrar los cambios
    // Verificar que hay cambios para mostrar
    const orderChanges = changes.order || {}
    const itemChanges = changes.items || []

    if (Object.keys(orderChanges).length === 0 && itemChanges.length === 0) {
      return <div className="text-muted-foreground">No se detectaron cambios</div>
    }

    return (
      <div className="space-y-4">
        {Object.keys(orderChanges).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Cambios en el pedido:</h4>
            <div className="space-y-2">
              {Object.entries(orderChanges).map(([key, change]: [string, any]) => {
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
          </div>
        )}

        {itemChanges.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Cambios en los productos:</h4>
            <div className="space-y-2">
              {itemChanges.map((change: any, index: number) => {
                if (change.action === "create") {
                  // Nuevo producto añadido
                  return (
                    <div key={index} className="p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Producto añadido:</span>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <span>{change.item.product_name || `Producto #${change.item.product_id}`}</span>
                        <span>
                          {change.item.quantity} x {formatCurrency(change.item.price)}
                        </span>
                      </div>
                    </div>
                  )
                } else if (change.action === "delete") {
                  // Producto eliminado
                  return (
                    <div key={index} className="p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Trash className="h-4 w-4 text-red-500" />
                        <span className="font-medium">Producto eliminado:</span>
                      </div>
                      {change.items &&
                        change.items.map((item: any, idx: number) => (
                          <div key={idx} className="mt-2 flex justify-between">
                            <span>{item.product_name || `Producto #${item.product_id}`}</span>
                            <span>
                              {item.quantity} x {formatCurrency(item.price)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )
                } else if (change.action === "update") {
                  // Producto actualizado
                  return (
                    <div key={index} className="p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Producto actualizado:</span>
                        <span>{change.before.product_name || `Producto #${change.before.product_id}`}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {change.before.quantity !== change.after.quantity && (
                          <div className="grid grid-cols-3 gap-2">
                            <span className="font-medium">Cantidad:</span>
                            <span className="line-through text-muted-foreground">{change.before.quantity}</span>
                            <span className="font-medium text-green-600">{change.after.quantity}</span>
                          </div>
                        )}
                        {change.before.price !== change.after.price && (
                          <div className="grid grid-cols-3 gap-2">
                            <span className="font-medium">Precio:</span>
                            <span className="line-through text-muted-foreground">
                              {formatCurrency(change.before.price)}
                            </span>
                            <span className="font-medium text-green-600">{formatCurrency(change.after.price)}</span>
                          </div>
                        )}
                        {change.before.product_id !== change.after.product_id && (
                          <div className="grid grid-cols-3 gap-2">
                            <span className="font-medium">Producto:</span>
                            <span className="line-through text-muted-foreground">
                              {change.before.product_name || `#${change.before.product_id}`}
                            </span>
                            <span className="font-medium text-green-600">
                              {change.after.product_name || `#${change.after.product_id}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }

                return null
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  const formatFieldName = (key: string) => {
    const fieldNames: Record<string, string> = {
      customer_name: "Cliente",
      customer_email: "Email",
      customer_phone: "Teléfono",
      status: "Estado",
      total_amount: "Total",
      notes: "Notas",
    }

    return fieldNames[key] || key
  }

  const formatValue = (value: any, key: string) => {
    if (value === null || value === undefined) return "-"

    if (typeof value === "number") {
      // Si parece un precio
      if (key === "total_amount" || key === "price") {
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
              <span className="font-medium">{entry.order_number || `Pedido #${entry.order_id}`}</span>
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
