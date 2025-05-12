import { getProducts, getCategories, getSuppliers } from "@/app/actions/product-actions"
import { InventoryDashboard } from "@/components/inventory-dashboard"

export default async function Home() {
  const { success: productsSuccess, data: products, error: productsError } = await getProducts()
  const { success: categoriesSuccess, data: categories } = await getCategories()
  const { success: suppliersSuccess, data: suppliers } = await getSuppliers()

  if (!productsSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p>{productsError || "Ocurrió un error al cargar los datos"}</p>
        </div>
      </div>
    )
  }

  return (
    <InventoryDashboard
      initialProducts={products}
      categories={categoriesSuccess ? categories : []}
      suppliers={suppliersSuccess ? suppliers : []}
    />
  )
}
