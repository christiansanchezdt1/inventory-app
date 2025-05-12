"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState } from "react"
import {
  Package,
  Search,
  PlusCircle,
  BarChart3,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  MoreHorizontal,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  createProduct,
  deleteProduct,
  updateProduct,
  getProductHistory,
  type Product,
  type Category,
  type Supplier,
} from "@/app/actions/product-actions"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type InventoryDashboardProps = {
  initialProducts: Product[]
  categories: Category[]
  suppliers: Supplier[]
}

export function InventoryDashboard({ initialProducts, categories, suppliers }: InventoryDashboardProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productHistory, setProductHistory] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const { toast } = useToast()

  // Filtrar productos basados en el término de búsqueda
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Calcular estadísticas
  const totalProducts = products.length
  const totalItems = products.reduce((sum, product) => sum + product.stock, 0)
  const totalValue = products.reduce((sum, product) => sum + product.stock * Number(product.price), 0)
  const lowStockItems = products.filter((product) => product.stock <= 10).length

  // Manejar la creación de un nuevo producto
  async function handleCreateProduct(formData: FormData) {
    setIsSubmitting(true)
    const result = await createProduct(formData)
    setIsSubmitting(false)

    if (result.success) {
      // Actualizar la UI optimísticamente
      const newProduct = {
        id: result.productId,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        sku: formData.get("sku") as string,
        category_id: formData.get("category_id") ? Number(formData.get("category_id")) : null,
        category_name: formData.get("category_id")
          ? categories.find((c) => c.id === Number(formData.get("category_id")))?.name || null
          : null,
        supplier_id: formData.get("supplier_id") ? Number(formData.get("supplier_id")) : null,
        supplier_name: formData.get("supplier_id")
          ? suppliers.find((s) => s.id === Number(formData.get("supplier_id")))?.name || null
          : null,
        stock: Number(formData.get("stock")),
        price: Number(formData.get("price")),
        cost_price: formData.get("cost_price") ? Number(formData.get("cost_price")) : null,
        status:
          Number(formData.get("stock")) === 0
            ? "Sin stock"
            : Number(formData.get("stock")) <= 10
              ? "Bajo stock"
              : "En stock",
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setProducts([...products, newProduct])
      setIsAddDialogOpen(false)
      toast({
        title: "Producto creado",
        description: "El producto ha sido creado exitosamente",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Ocurrió un error al crear el producto",
        variant: "destructive",
      })
    }
  }

  // Manejar la actualización de un producto
  async function handleUpdateProduct(formData: FormData) {
    setIsSubmitting(true)
    const result = await updateProduct(formData)
    setIsSubmitting(false)

    if (result.success) {
      // Actualizar la UI optimísticamente
      const updatedProduct = {
        ...selectedProduct!,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        sku: formData.get("sku") as string,
        category_id: formData.get("category_id") ? Number(formData.get("category_id")) : null,
        category_name: formData.get("category_id")
          ? categories.find((c) => c.id === Number(formData.get("category_id")))?.name || null
          : null,
        supplier_id: formData.get("supplier_id") ? Number(formData.get("supplier_id")) : null,
        supplier_name: formData.get("supplier_id")
          ? suppliers.find((s) => s.id === Number(formData.get("supplier_id")))?.name || null
          : null,
        stock: Number(formData.get("stock")),
        price: Number(formData.get("price")),
        cost_price: formData.get("cost_price") ? Number(formData.get("cost_price")) : null,
        status:
          Number(formData.get("stock")) === 0
            ? "Sin stock"
            : Number(formData.get("stock")) <= 10
              ? "Bajo stock"
              : "En stock",
        updated_at: new Date().toISOString(),
      }
      setProducts(products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)))
      setIsEditDialogOpen(false)
      setSelectedProduct(null)
      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado exitosamente",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Ocurrió un error al actualizar el producto",
        variant: "destructive",
      })
    }
  }

  // Manejar la eliminación de un producto
  async function handleDeleteProduct() {
    if (!selectedProduct) return

    setIsSubmitting(true)
    const result = await deleteProduct(selectedProduct.id)
    setIsSubmitting(false)

    if (result.success) {
      // Actualizar la UI optimísticamente
      setProducts(products.filter((p) => p.id !== selectedProduct.id))
      setIsDeleteDialogOpen(false)
      setSelectedProduct(null)
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Ocurrió un error al eliminar el producto",
        variant: "destructive",
      })
    }
  }

  // Cargar historial de un producto
  async function loadProductHistory(productId: number) {
    setIsLoadingHistory(true)
    const result = await getProductHistory(productId)
    setIsLoadingHistory(false)

    if (result.success) {
      setProductHistory(result.data)
      setIsHistoryDialogOpen(true)
    } else {
      toast({
        title: "Error",
        description: result.error || "Ocurrió un error al cargar el historial",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Barra de navegación */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Package className="h-6 w-6" />
            <span>InventarioApp</span>
          </div>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Button variant="ghost" className="text-muted-foreground">
              Inventario
            </Button>
            <Button variant="ghost" className="text-muted-foreground">
              Proveedores
            </Button>
            <Button variant="ghost" className="text-muted-foreground">
              Reportes
            </Button>
            <Button variant="ghost" className="text-muted-foreground">
              Configuración
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard de Inventario</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                <DialogDescription>
                  Ingresa los detalles del nuevo producto para agregarlo al inventario.
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateProduct}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nombre
                    </Label>
                    <Input id="name" name="name" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Descripción
                    </Label>
                    <Textarea id="description" name="description" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sku" className="text-right">
                      SKU
                    </Label>
                    <Input id="sku" name="sku" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Categoría
                    </Label>
                    <Select name="category_id">
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="supplier" className="text-right">
                      Proveedor
                    </Label>
                    <Select name="supplier_id">
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="stock" className="text-right">
                      Stock
                    </Label>
                    <Input id="stock" name="stock" type="number" min="0" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Precio Venta
                    </Label>
                    <Input id="price" name="price" type="number" step="0.01" min="0" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cost_price" className="text-right">
                      Precio Costo
                    </Label>
                    <Input id="cost_price" name="cost_price" type="number" step="0.01" min="0" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Producto"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">{totalItems} unidades en inventario</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor del Inventario</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Valor total de productos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos Bajo Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Requieren reposición</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">152</div>
              <p className="text-xs text-muted-foreground">+12% respecto al mes anterior</p>
            </CardContent>
          </Card>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar productos por nombre, categoría o SKU..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            Reportes
          </Button>
        </div>

        {/* Tabla de inventario */}
        <Card>
          <CardHeader>
            <CardTitle>Inventario de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No se encontraron productos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.id}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.category_name || "Sin categoría"}</TableCell>
                        <TableCell>{product.sku || "—"}</TableCell>
                        <TableCell className="text-center">{product.stock}</TableCell>
                        <TableCell className="text-right">${Number(product.price).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              product.status === "En stock"
                                ? "default"
                                : product.status === "Bajo stock"
                                  ? "warning"
                                  : "destructive"
                            }
                          >
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProduct(product)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                Editar producto
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProduct(product)
                                  loadProductHistory(product.id)
                                }}
                              >
                                Ver historial
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedProduct(product)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                Eliminar producto
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Diálogo de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>Modifica los detalles del producto seleccionado.</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <form action={handleUpdateProduct}>
              <input type="hidden" name="id" value={selectedProduct.id} />
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={selectedProduct.name}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right">
                    Descripción
                  </Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={selectedProduct.description || ""}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-sku" className="text-right">
                    SKU
                  </Label>
                  <Input id="edit-sku" name="sku" defaultValue={selectedProduct.sku || ""} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-category" className="text-right">
                    Categoría
                  </Label>
                  <Select name="category_id" defaultValue={selectedProduct.category_id?.toString()}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-supplier" className="text-right">
                    Proveedor
                  </Label>
                  <Select name="supplier_id" defaultValue={selectedProduct.supplier_id?.toString()}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-stock" className="text-right">
                    Stock
                  </Label>
                  <Input
                    id="edit-stock"
                    name="stock"
                    type="number"
                    min="0"
                    defaultValue={selectedProduct.stock}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-price" className="text-right">
                    Precio Venta
                  </Label>
                  <Input
                    id="edit-price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={selectedProduct.price}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-cost-price" className="text-right">
                    Precio Costo
                  </Label>
                  <Input
                    id="edit-cost-price"
                    name="cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={selectedProduct.cost_price || ""}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setSelectedProduct(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    "Actualizar Producto"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedProduct(null)
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de historial */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Historial del Producto</DialogTitle>
            <DialogDescription>
              {selectedProduct ? `Historial de cambios para: ${selectedProduct.name}` : "Historial de cambios"}
            </DialogDescription>
          </DialogHeader>
          {isLoadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {productHistory.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  No hay registros de historial para este producto
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.action === "create"
                                ? "default"
                                : record.action === "update"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {record.action === "create"
                              ? "Creación"
                              : record.action === "update"
                                ? "Actualización"
                                : "Eliminación"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.stock_before !== null && record.stock_after !== null ? (
                            <>
                              {record.stock_before} → {record.stock_after}
                            </>
                          ) : record.stock_after !== null ? (
                            record.stock_after
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {record.price_before !== null && record.price_after !== null ? (
                            <>
                              ${Number(record.price_before).toFixed(2)} → ${Number(record.price_after).toFixed(2)}
                            </>
                          ) : record.price_after !== null ? (
                            `$${Number(record.price_after).toFixed(2)}`
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {record.status_before !== null && record.status_after !== null ? (
                            <>
                              {record.status_before} → {record.status_after}
                            </>
                          ) : record.status_after !== null ? (
                            record.status_after
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{record.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsHistoryDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}