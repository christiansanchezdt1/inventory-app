import { Suspense } from "react"
import { getCustomers } from "@/app/actions/customer-actions"
import { getOrders } from "@/app/actions/order-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import CustomersDashboard from "@/components/customers/customers-dashboard"
import type { Order } from "@/types/order"

export default async function CustomersPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Clientes</h1>
      <Suspense fallback={<CustomersSkeleton />}>
        <CustomersContent />
      </Suspense>
    </div>
  )
}

async function CustomersContent() {
  try {
    const [customersResult, ordersResult] = await Promise.all([getCustomers(), getOrders()])

    // Verificar si alguna petición falló
    if (!customersResult.success || !ordersResult.success) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {!customersResult.success
              ? customersResult.error
              : ordersResult.error || "Ocurrió un error al cargar los datos"}
          </AlertDescription>
        </Alert>
      )
    }

    // Organizar los pedidos por cliente
    const customerOrders: Record<number, Order[]> = {}

    if (ordersResult.data) {
      // Crear un mapa para buscar clientes por nombre
      const customerMap = new Map(
        customersResult.data?.map((customer) => [customer.name.toLowerCase(), customer.id]) || [],
      )

      // Agrupar pedidos por cliente
      ordersResult.data.forEach((order) => {
        const customerId = customerMap.get(order.customer_name.toLowerCase())
        if (customerId) {
          if (!customerOrders[customerId]) {
            customerOrders[customerId] = []
          }
          customerOrders[customerId].push(order)
        }
      })
    }

    return <CustomersDashboard initialCustomers={customersResult.data || []} customerOrders={customerOrders} />
  } catch (error) {
    console.error("Error en CustomersContent:", error)
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Ocurrió un error inesperado al cargar los datos. Por favor, inténtelo de nuevo más tarde.
        </AlertDescription>
      </Alert>
    )
  }
}

function CustomersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <div className="border rounded-md">
        <div className="p-4">
          <Skeleton className="h-8 w-full mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full mb-2" />
          ))}
        </div>
      </div>
    </div>
  )
}
