import { Suspense } from "react"
import OrdersDashboard from "@/components/orders/orders-dashboard"
import { getOrders, getProductsForOrder } from "@/app/actions/order-actions"
import { getCustomersForOrder } from "@/app/actions/customer-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function OrdersPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Pedidos</h1>
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContent />
      </Suspense>
    </div>
  )
}

async function OrdersContent() {
  try {
    const [ordersResult, productsResult, customersResult] = await Promise.all([
      getOrders(),
      getProductsForOrder(),
      getCustomersForOrder(),
    ])

    // Verificar si alguna de las peticiones falló
    if (!ordersResult.success || !productsResult.success || !customersResult.success) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {!ordersResult.success
              ? ordersResult.error
              : !productsResult.success
                ? productsResult.error
                : customersResult.error || "Ocurrió un error al cargar los datos"}
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <OrdersDashboard
        initialOrders={ordersResult.data || []}
        products={productsResult.data || []}
        customers={customersResult.data || []}
      />
    )
  } catch (error) {
    console.error("Error en OrdersContent:", error)
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

function OrdersSkeleton() {
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
