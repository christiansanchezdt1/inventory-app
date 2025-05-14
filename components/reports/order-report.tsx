"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Download, FileText } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn, formatCurrency } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Order } from "@/types/order"

interface OrderReportProps {
  orders: Order[]
}

export default function OrderReport({ orders }: OrderReportProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState<string>("Todos")
  const [reportType, setReportType] = useState<string>("summary")

  const statusOptions = ["Todos", "Pendiente", "En Proceso", "Completado", "Cancelado"]
  const reportTypeOptions = [
    { value: "summary", label: "Resumen" },
    { value: "detailed", label: "Detallado" },
    { value: "status", label: "Por Estado" },
  ]

  // Filtrar pedidos según los criterios seleccionados
  const filteredOrders = orders.filter((order) => {
    // Filtro de estado
    const statusMatch = status === "Todos" || order.status === status

    // Filtro de fecha desde
    const dateFromMatch = !dateFrom || new Date(order.created_at) >= new Date(dateFrom.setHours(0, 0, 0, 0))

    // Filtro de fecha hasta
    const dateToMatch = !dateTo || new Date(order.created_at) <= new Date(dateTo.setHours(23, 59, 59, 999))

    return statusMatch && dateFromMatch && dateToMatch
  })

  // Calcular estadísticas
  const totalAmount = filteredOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
  const averageAmount = filteredOrders.length > 0 ? totalAmount / filteredOrders.length : 0

  // Agrupar por estado
  const ordersByStatus = filteredOrders.reduce(
    (acc, order) => {
      if (!acc[order.status]) {
        acc[order.status] = {
          count: 0,
          total: 0,
        }
      }
      acc[order.status].count += 1
      acc[order.status].total += Number(order.total_amount)
      return acc
    },
    {} as Record<string, { count: number; total: number }>,
  )

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
    }).format(date)
  }

  // Generar título del reporte
  const getReportTitle = () => {
    let title = "Reporte de Pedidos"
    if (dateFrom && dateTo) {
      title += ` del ${format(dateFrom, "dd/MM/yyyy")} al ${format(dateTo, "dd/MM/yyyy")}`
    } else if (dateFrom) {
      title += ` desde ${format(dateFrom, "dd/MM/yyyy")}`
    } else if (dateTo) {
      title += ` hasta ${format(dateTo, "dd/MM/yyyy")}`
    }

    if (status !== "Todos") {
      title += ` - Estado: ${status}`
    }

    return title
  }

  // Función para exportar a CSV
  const exportToCSV = () => {
    // Cabeceras según el tipo de reporte
    let headers: string[] = []
    let rows: string[][] = []

    if (reportType === "summary") {
      headers = ["Fecha", "Número", "Cliente", "Estado", "Total"]
      rows = filteredOrders.map((order) => [
        formatDate(order.created_at),
        order.order_number,
        order.customer_name,
        order.status,
        order.total_amount.toString(),
      ])
    } else if (reportType === "detailed") {
      headers = ["Fecha", "Número", "Cliente", "Email", "Teléfono", "Estado", "Notas", "Total"]
      rows = filteredOrders.map((order) => [
        formatDate(order.created_at),
        order.order_number,
        order.customer_name,
        order.customer_email || "",
        order.customer_phone || "",
        order.status,
        order.notes || "",
        order.total_amount.toString(),
      ])
    } else if (reportType === "status") {
      headers = ["Estado", "Cantidad de Pedidos", "Total"]
      rows = Object.entries(ordersByStatus).map(([status, data]) => [
        status,
        data.count.toString(),
        data.total.toString(),
      ])
    }

    // Crear contenido CSV
    const csvContent =
      headers.join(",") +
      "\n" +
      rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${getReportTitle().replace(/\s+/g, "_")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportes de Pedidos</CardTitle>
        <CardDescription>Genera reportes de pedidos según diferentes criterios</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Desde</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus locale={es} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus locale={es} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((statusOption) => (
                  <SelectItem key={statusOption} value={statusOption}>
                    {statusOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportType">Tipo de Reporte</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="reportType">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {reportTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{getReportTitle()}</h3>
          <Button onClick={exportToCSV} disabled={filteredOrders.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                <p className="text-3xl font-bold">{filteredOrders.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Monto Total</p>
                <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Promedio por Pedido</p>
                <p className="text-3xl font-bold">{formatCurrency(averageAmount)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {reportType === "summary" && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2" />
                        <p>No hay datos para mostrar con los filtros seleccionados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(order.total_amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {reportType === "detailed" && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2" />
                        <p>No hay datos para mostrar con los filtros seleccionados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>{order.customer_email || "-"}</TableCell>
                      <TableCell>{order.customer_phone || "-"}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(order.total_amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {reportType === "status" && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cantidad de Pedidos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Promedio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(ordersByStatus).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2" />
                        <p>No hay datos para mostrar con los filtros seleccionados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(ordersByStatus).map(([statusName, data]) => (
                    <TableRow key={statusName}>
                      <TableCell>{getStatusBadge(statusName)}</TableCell>
                      <TableCell>{data.count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.total)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.total / data.count)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
