import { Suspense } from "react"
import { getOrders } from "@/app/actions/order-actions"
import { getProducts } from "@/app/actions/product-actions"
import OrderReport from "@/components/reports/order-report"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Reportes</h1>
      <Suspense fallback={<ReportsSkeleton />}>
        <ReportsContent />
      </Suspense>
    </div>
  )
}

async function ReportsContent() {
  try {
    const [ordersResult, productsResult] = await Promise.all([getOrders(), getProducts()])

    // Verificar si alguna de las peticiones falló
    if (!ordersResult.success || !productsResult.success) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {!ordersResult.success
              ? ordersResult.error
              : productsResult.error || "Ocurrió un error al cargar los datos"}
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <Tabs defaultValue="orders">
        <TabsList className="mb-6">
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <OrderReport orders={ordersResult.data || []} />
        </TabsContent>
        <TabsContent value="inventory">
          <div className="text-center py-8 text-muted-foreground">
            <p>Reportes de inventario próximamente</p>
          </div>
        </TabsContent>
      </Tabs>
    )
  } catch (error) {
    console.error("Error en ReportsContent:", error)
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

function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-[200px] mb-6" />
      <Skeleton className="h-[600px] w-full rounded-md" />
    </div>
  )
}
