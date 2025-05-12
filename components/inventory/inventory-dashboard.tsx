"use client"

import { Button } from "@/components/ui/button"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProductList from "./product-list"
import ProductForm from "./product-form"
import type { Product, Category, Supplier } from "@/types/product"
import { createProduct, updateProduct, deleteProduct, getProductHistory } from "@/app/actions/product-actions"
import { useToast } from "@/hooks/use-toast"
import ProductHistoryList from "@/components/dashboard/product-history-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface InventoryDashboardProps {
  initialProducts: Product[]
  categories: Category[]
  suppliers: Supplier[]
}

export default function InventoryDashboard({ initialProducts, categories, suppliers }: InventoryDashboardProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [activeTab, setActiveTab] = useState("list")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productHistory, setProductHistory] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const { toast } = useToast()

  const handleAddProduct = async (
    productData: Omit<Product, "id" | "created_at" | "updated_at" | "category_name" | "supplier_name">,
  ) => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await createProduct(productData)

      if (!result.success) {
        setError(result.error || "Error al crear el producto")
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el producto. Inténtalo de nuevo.",
          variant: "destructive",
        })
        return
      }

      const newProduct = result.data!

      // Añadir nombres de categoría y proveedor para la UI
      const category = categories.find((c) => c.id === newProduct.category_id)
      const supplier = suppliers.find((s) => s.id === newProduct.supplier_id)

      const enrichedProduct = {
        ...newProduct,
        category_name: category?.name,
        supplier_name: supplier?.name,
      }

      setProducts([...products, enrichedProduct])
      setActiveTab("list")
      toast({
        title: "Producto creado",
        description: `${newProduct.name} ha sido añadido al inventario.`,
      })
    } catch (error) {
      console.error(error)
      setError("Error inesperado al crear el producto")
      toast({
        title: "Error",
        description: "No se pudo crear el producto. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await updateProduct(updatedProduct.id, updatedProduct)

      if (!result.success) {
        setError(result.error || "Error al actualizar el producto")
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el producto. Inténtalo de nuevo.",
          variant: "destructive",
        })
        return
      }

      const resultProduct = result.data!

      // Añadir nombres de categoría y proveedor para la UI
      const category = categories.find((c) => c.id === resultProduct.category_id)
      const supplier = suppliers.find((s) => s.id === resultProduct.supplier_id)

      const enrichedProduct = {
        ...resultProduct,
        category_name: category?.name,
        supplier_name: supplier?.name,
      }

      setProducts(products.map((product) => (product.id === enrichedProduct.id ? enrichedProduct : product)))
      setEditingProduct(null)
      setActiveTab("list")
      toast({
        title: "Producto actualizado",
        description: `${resultProduct.name} ha sido actualizado correctamente.`,
      })
    } catch (error) {
      console.error(error)
      setError("Error inesperado al actualizar el producto")
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (id: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const productToDelete = products.find((p) => p.id === id)
      const result = await deleteProduct(id)

      if (!result.success) {
        setError(result.error || "Error al eliminar el producto")
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el producto. Inténtalo de nuevo.",
          variant: "destructive",
        })
        return
      }

      setProducts(products.filter((product) => product.id !== id))
      toast({
        title: "Producto eliminado",
        description: `${productToDelete?.name || "El producto"} ha sido eliminado del inventario.`,
      })
    } catch (error) {
      console.error(error)
      setError("Error inesperado al eliminar el producto")
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setActiveTab("form")
  }

  const handleViewHistory = async (productId: number) => {
    try {
      setIsLoadingHistory(true)
      setError(null)
      setSelectedProductId(productId)

      const result = await getProductHistory(productId)

      if (!result.success) {
        setError(result.error || "Error al cargar el historial")
        toast({
          title: "Error",
          description: result.error || "No se pudo cargar el historial del producto.",
          variant: "destructive",
        })
        return
      }

      setProductHistory(result.data || [])
      setActiveTab("history")
    } catch (error) {
      console.error(error)
      setError("Error inesperado al cargar el historial")
      toast({
        title: "Error",
        description: "No se pudo cargar el historial del producto.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingHistory(false)
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
            <TabsTrigger value="list">Lista de Productos</TabsTrigger>
            <TabsTrigger value="form">{editingProduct ? "Editar Producto" : "Agregar Producto"}</TabsTrigger>
            {selectedProductId && <TabsTrigger value="history">Historial</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="list" className="space-y-4">
          <ProductList
            products={products}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onViewHistory={handleViewHistory}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="form">
          <ProductForm
            initialData={editingProduct}
            onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
            onCancel={() => {
              setEditingProduct(null)
              setActiveTab("list")
            }}
            categories={categories}
            suppliers={suppliers}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="history">
          {selectedProductId && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Historial de{" "}
                  {products.find((p) => p.id === selectedProductId)?.name || `Producto #${selectedProductId}`}
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
                <ProductHistoryList historyEntries={productHistory} />
              )}
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
