import { Suspense } from "react"
import InventoryDashboard from "@/components/inventory/inventory-dashboard"
import { getProducts, getCategories, getSuppliers } from "@/app/actions/product-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function InventoryPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Inventario</h1>
      <Suspense fallback={<InventorySkeleton />}>
        <InventoryContent />
      </Suspense>
    </div>
  )
}

async function InventoryContent() {
  try {
    const [productsResult, categoriesResult, suppliersResult] = await Promise.all([
      getProducts(),
      getCategories(),
      getSuppliers(),
    ])

    // Verificar si alguna de las peticiones falló
    if (!productsResult.success || !categoriesResult.success || !suppliersResult.success) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {!productsResult.success
              ? productsResult.error
              : !categoriesResult.success
                ? categoriesResult.error
                : suppliersResult.error || "Ocurrió un error al cargar los datos"}
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <InventoryDashboard
        initialProducts={productsResult.data || []}
        categories={categoriesResult.data || []}
        suppliers={suppliersResult.data || []}
      />
    )
  } catch (error) {
    console.error("Error en InventoryContent:", error)
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

function InventorySkeleton() {
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
