"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
// Actualizar la importación de iconos para incluir Printer
import { MoreHorizontal, Edit, Trash2, ChevronUp, ChevronDown, AlertCircle, History, Printer } from "lucide-react"
import type { Order } from "@/types/order"
import { formatCurrency } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import OrderFilters, { type OrderFilters as OrderFiltersType } from "./order-filters"

// Actualizar la interfaz OrderListProps para incluir la función onPrint
interface OrderListProps {
  orders: Order[]
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onViewHistory: (id: number) => void
  onPrint: (id: number) => void
  isLoading?: boolean
}

// Actualizar la desestructuración de props para incluir onPrint
export default function OrderList({
  orders,
  onEdit,
  onDelete,
  onViewHistory,
  onPrint,
  isLoading = false,
}: OrderListProps) {
  const [filters, setFilters] = useState<OrderFiltersType>({
    search: "",
    status: "",
    dateFrom: undefined,
    dateTo: undefined,
  })
  const [sortField, setSortField] = useState<keyof Order>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)

  const handleSort = (field: keyof Order) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleFilterChange = (newFilters: OrderFiltersType) => {
    setFilters(newFilters)
  }

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "",
      dateFrom: undefined,
      dateTo: undefined,
    })
  }

  const filteredOrders = orders.filter((order) => {
    // Filtro de búsqueda
    const searchMatch =
      filters.search === "" ||
      order.order_number.toLowerCase().includes(filters.search.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(filters.search.toLowerCase()))

    // Filtro de estado
    const statusMatch = filters.status === "" || order.status === filters.status

    // Filtro de fecha desde
    const dateFromMatch =
      !filters.dateFrom || new Date(order.created_at) >= new Date(filters.dateFrom.setHours(0, 0, 0, 0))

    // Filtro de fecha hasta
    const dateToMatch =
      !filters.dateTo || new Date(order.created_at) <= new Date(filters.dateTo.setHours(23, 59, 59, 999))

    return searchMatch && statusMatch && dateFromMatch && dateToMatch
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    // Ordenamiento normal
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pendiente":
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case "en proceso":
        return <Badge className="bg-blue-500">En Proceso</Badge>
      case "completado":
        return <Badge className="bg-green-500">Completado</Badge>
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const confirmDelete = (order: Order) => {
    setOrderToDelete(order)
  }

  const handleConfirmDelete = () => {
    if (orderToDelete) {
      onDelete(orderToDelete.id)
      setOrderToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      <OrderFilters filters={filters} onFilterChange={handleFilterChange} onResetFilters={resetFilters} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("order_number")}>
                <div className="flex items-center gap-1">
                  Nº Pedido
                  {sortField === "order_number" && (
                    <span>
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("customer_name")}>
                <div className="flex items-center gap-1">
                  Cliente
                  {sortField === "customer_name" && (
                    <span>
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort("total_amount")}>
                <div className="flex items-center justify-end gap-1">
                  Total
                  {sortField === "total_amount" && (
                    <span>
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                <div className="flex items-center gap-1">
                  Estado
                  {sortField === "status" && (
                    <span>
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => handleSort("created_at")}>
                <div className="flex items-center gap-1">
                  Fecha
                  {sortField === "created_at" && (
                    <span>
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  {filters.search || filters.status || filters.dateFrom || filters.dateTo ? (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mb-2" />
                      <p>No se encontraron pedidos con los filtros aplicados</p>
                      <Button variant="link" onClick={resetFilters} className="mt-2">
                        Limpiar filtros
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mb-2" />
                      <p>No hay pedidos registrados</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(order.created_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      {/* Añadir la opción de impresión en el menú desplegable */}
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(order.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewHistory(order.id)}>
                          <History className="mr-2 h-4 w-4" />
                          Ver historial
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPrint(order.id)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Imprimir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => confirmDelete(order)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el pedido "{orderToDelete?.order_number}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
