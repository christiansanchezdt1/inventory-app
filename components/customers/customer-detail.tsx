"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Loader2, ArrowLeft, Mail, Phone, MapPin, FileText, Download } from "lucide-react"
import type { Customer } from "@/types/customer"
import type { Order } from "@/types/order"

interface CustomerDetailProps {
  customer: Customer
  customerOrders: Order[]
  onBack: () => void
  isLoading?: boolean
}

export default function CustomerDetail({ customer, customerOrders, onBack, isLoading = false }: CustomerDetailProps) {
  const [activeTab, setActiveTab] = useState("info")
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    lastOrderDate: "",
  })

  useEffect(() => {
    if (customerOrders.length > 0) {
      const totalOrders = customerOrders.length
      const totalSpent = customerOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
      const averageOrderValue = totalSpent / totalOrders
      const lastOrderDate = new Date(
        Math.max(...customerOrders.map((order) => new Date(order.created_at).getTime())),
      ).toLocaleDateString("es-AR")

      setStats({
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate,
      })
    }
  }, [customerOrders])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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

  const exportCustomerData = () => {
    // Preparar datos del cliente
    const customerData = {
      nombre: customer.name,
      email: customer.email || "",
      telefono: customer.phone || "",
      direccion: customer.address || "",
      notas: customer.notes || "",
      fecha_alta: formatDate(customer.created_at),
      pedidos: customerOrders.map((order) => ({
        numero: order.order_number,
        fecha: formatDate(order.created_at),
        estado: order.status,
        total: order.total_amount,
      })),
    }

    // Convertir a JSON y crear blob
    const jsonData = JSON.stringify(customerData, null, 2)
    const blob = new Blob([jsonData], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    // Crear enlace de descarga
    const a = document.createElement("a")
    a.href = url
    a.download = `cliente_${customer.name.replace(/\s+/g, "_")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>
        <Button onClick={exportCustomerData}>
          <Download className="mr-2 h-4 w-4" />
          Exportar datos
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{customer.name}</CardTitle>
          <CardDescription>Cliente desde {formatDate(customer.created_at)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="orders">Pedidos</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                      {customer.email}
                    </a>
                  </div>
                )}

                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Teléfono:</span>
                    <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                )}

                {customer.address && (
                  <div className="flex items-start gap-2 md:col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <span className="font-medium">Dirección:</span>
                    <span>{customer.address}</span>
                  </div>
                )}

                {customer.notes && (
                  <div className="flex items-start gap-2 md:col-span-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                    <span className="font-medium">Notas:</span>
                    <span>{customer.notes}</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="orders">
              {customerOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Este cliente no tiene pedidos registrados</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº Pedido</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(order.total_amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.averageOrderValue ? formatCurrency(stats.averageOrderValue) : "-"}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Último Pedido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.lastOrderDate || "-"}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
