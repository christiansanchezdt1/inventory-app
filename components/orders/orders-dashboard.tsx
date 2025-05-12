"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import OrderList from "./order-list"
import OrderForm from "./order-form"
import type { Order } from "@/types/order"
import { createOrder, updateOrder, deleteOrder, getOrderById, getOrderHistory } from "@/app/actions/order-actions"
import { useToast } from "@/hooks/use-toast"
import OrderHistoryList from "./order-history-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import OrderPrint from "./order-print"

interface OrdersDashboardProps {
  initialOrders: Order[]
  products: { id: number; name: string; sku: string; price: number; stock: number }[]
  customers: { id: number; name: string; email: string | null; phone: string | null }[]
}

export default function OrdersDashboard({ initialOrders, products, customers }: OrdersDashboardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState("list")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderHistory, setOrderHistory] = useState<any[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const { toast } = useToast()
  const [printOrder, setPrintOrder] = useState<any | null>(null)

  const handleAddOrder = async (orderData: any) => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await createOrder(orderData)

      if (!result.success) {
        setError(result.error || "Error al crear el pedido")
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el pedido. Inténtalo de nuevo.",
          variant: "destructive",
        })
        return
      }

      const newOrder = result.data!

      setOrders([newOrder, ...orders])
      setActiveTab("list")
      toast({
        title: "Pedido creado",
        description: `Pedido ${newOrder.order_number} ha sido creado correctamente.`,
      })
    } catch (error) {
      console.error(error)
      setError("Error inesperado al crear el pedido")
      toast({
        title: "Error",
        description: "No se pudo crear el pedido. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateOrder = async (updatedOrderData: any) => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await updateOrder(updatedOrderData.id, updatedOrderData)

      if (!result.success) {
        setError(result.error || "Error al actualizar el pedido")
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el pedido. Inténtalo de nuevo.",
          variant: "destructive",
        })
        return
      }

      const updatedOrder = result.data!

      setOrders(orders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)))
      setEditingOrder(null)
      setActiveTab("list")
      toast({
        title: "Pedido actualizado",
        description: `Pedido ${updatedOrder.order_number} ha sido actualizado correctamente.`,
      })
    } catch (error) {
      console.error(error)
      setError("Error inesperado al actualizar el pedido")
      toast({
        title: "Error",
        description: "No se pudo actualizar el pedido. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteOrder = async (id: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const orderToDelete = orders.find((o) => o.id === id)
      const result = await deleteOrder(id)

      if (!result.success) {
        setError(result.error || "Error al eliminar el pedido")
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el pedido. Inténtalo de nuevo.",
          variant: "destructive",
        })
        return
      }

      setOrders(orders.filter((order) => order.id !== id))
      toast({
        title: "Pedido eliminado",
        description: `Pedido ${orderToDelete?.order_number || ""} ha sido eliminado.`,
      })
    } catch (error) {
      console.error(error)
      setError("Error inesperado al eliminar el pedido")
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditOrder = async (orderId: number) => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getOrderById(orderId)

      if (!result.success) {
        setError(result.error || "Error al cargar el pedido")
        toast({
          title: "Error",
          description: result.error || "No se pudo cargar el pedido para editar.",
          variant: "destructive",
        })
        return
      }

      setEditingOrder(result.data)
      setActiveTab("form")
    } catch (error) {
      console.error(error)
      setError("Error inesperado al cargar el pedido")
      toast({
        title: "Error",
        description: "No se pudo cargar el pedido para editar.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewHistory = async (orderId: number) => {
    try {
      setIsLoadingHistory(true)
      setError(null)
      setSelectedOrderId(orderId)

      const result = await getOrderHistory(orderId)

      if (!result.success) {
        setError(result.error || "Error al cargar el historial")
        toast({
          title: "Error",
          description: result.error || "No se pudo cargar el historial del pedido.",
          variant: "destructive",
        })
        // Inicializar con array vacío en caso de error
        setOrderHistory([])
        return
      }

      // Asegurarse de que siempre sea un array
      setOrderHistory(result.data || [])
      setActiveTab("history")
    } catch (error) {
      console.error(error)
      setError("Error inesperado al cargar el historial")
      toast({
        title: "Error",
        description: "No se pudo cargar el historial del pedido.",
        variant: "destructive",
      })
      // Inicializar con array vacío en caso de error
      setOrderHistory([])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handlePrintOrder = async (orderId: number) => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getOrderById(orderId)

      if (!result.success) {
        setError(result.error || "Error al cargar el pedido")
        toast({
          title: "Error",
          description: result.error || "No se pudo cargar el pedido para imprimir.",
          variant: "destructive",
        })
        return
      }

      setPrintOrder(result.data)
      setActiveTab("print")
    } catch (error) {
      console.error(error)
      setError("Error inesperado al cargar el pedido")
      toast({
        title: "Error",
        description: "No se pudo cargar el pedido para imprimir.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="list">Lista de Pedidos</TabsTrigger>
            <TabsTrigger value="form">{editingOrder ? "Editar Pedido" : "Nuevo Pedido"}</TabsTrigger>
            {selectedOrderId && <TabsTrigger value="history">Historial</TabsTrigger>}
            {printOrder && <TabsTrigger value="print">Imprimir Pedido</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="list" className="space-y-4">
          <OrderList
            orders={orders}
            onEdit={handleEditOrder}
            onDelete={handleDeleteOrder}
            onViewHistory={handleViewHistory}
            onPrint={handlePrintOrder}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="form">
          <OrderForm
            initialData={editingOrder}
            onSubmit={editingOrder ? handleUpdateOrder : handleAddOrder}
            onCancel={() => {
              setEditingOrder(null)
              setActiveTab("list")
            }}
            products={products}
            customers={customers}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="history">
          {selectedOrderId && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Historial de{" "}
                  {orders.find((o) => o.id === selectedOrderId)?.order_number || `Pedido #${selectedOrderId}`}
                </h2>
                <Button variant="outline" onClick={() => setActiveTab("list")}>
                  Volver a la lista
                </Button>
              </div>

              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <Spinner className="mx-auto" />
                  <p className="mt-2 text-muted-foreground">Cargando historial...</p>
                </div>
              ) : (
                <OrderHistoryList historyEntries={orderHistory} />
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="print">
          {printOrder && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Imprimir Pedido: {printOrder.order_number}</h2>
                <Button variant="outline" onClick={() => setActiveTab("list")}>
                  Volver a la lista
                </Button>
              </div>
              <OrderPrint order={printOrder} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}

// Componente Spinner para indicar carga
function Spinner({ className }: { className?: string }) {
  return <div className={cn("animate-spin rounded-full h-6 w-6 border-b-2 border-primary", className)} />
}

// Función para combinar clases de Tailwind
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
