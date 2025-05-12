"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CustomerList from "./customer-list"
import CustomerForm from "./customer-form"
import CustomerDetail from "./customer-detail"
import CustomerStats from "./customer-stats"
import CustomerFilters, { type CustomerFilters as CustomerFiltersType } from "./customer-filters"
import type { Customer } from "@/types/customer"
import type { Order } from "@/types/order"
import { createCustomer, updateCustomer, deleteCustomer } from "@/app/actions/customer-actions"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface CustomersDashboardProps {
  initialCustomers: Customer[]
  customerOrders?: Record<number, Order[]>
}

export default function CustomersDashboard({ initialCustomers, customerOrders = {} }: CustomersDashboardProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [activeTab, setActiveTab] = useState("list")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [filters, setFilters] = useState<CustomerFiltersType>({
    search: "",
    dateFrom: undefined,
    dateTo: undefined,
    hasOrders: "all",
  })

  const handleAddCustomer = async (customerData: Omit<Customer, "id" | "created_at" | "updated_at">) => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await createCustomer(customerData)

      if (!result.success) {
        setError(result.error || "Error al crear el cliente")
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el cliente. Inténtalo de nuevo.",
          variant: "destructive",
        })
        return
      }

      const newCustomer = result.data!

      setCustomers([...customers, newCustomer])
      setActiveTab("list")
      toast({
        title: "Cliente creado",
        description: `${newCustomer.name} ha sido añadido correctamente.`,
      })
    } catch (error) {
      console.error(error)
      setError("Error inesperado al crear el cliente")
      toast({
        title: "Error",
        description: "No se pudo crear el cliente. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await updateCustomer(updatedCustomer.id, updatedCustomer)

      if (!result.success) {
        setError(result.error || "Error al actualizar el cliente")
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el cliente. Inténtalo de nuevo.",
          variant: "destructive",
        })
        return
      }

      const resultCustomer = result.data!

      setCustomers(customers.map((customer) => (customer.id === resultCustomer.id ? resultCustomer : customer)))
      setEditingCustomer(null)
      setActiveTab("list")
      toast({
        title: "Cliente actualizado",
        description: `${resultCustomer.name} ha sido actualizado correctamente.`,
      })
    } catch (error) {
      console.error(error)
      setError("Error inesperado al actualizar el cliente")
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCustomer = async (id: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const customerToDelete = customers.find((c) => c.id === id)
      const result = await deleteCustomer(id)

      if (!result.success) {
        setError(result.error || "Error al eliminar el cliente")
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el cliente. Inténtalo de nuevo.",
          variant: "destructive",
        })
        return
      }

      setCustomers(customers.filter((customer) => customer.id !== id))
      toast({
        title: "Cliente eliminado",
        description: `${customerToDelete?.name || "El cliente"} ha sido eliminado.`,
      })
    } catch (error) {
      console.error(error)
      setError("Error inesperado al eliminar el cliente")
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setActiveTab("form")
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setActiveTab("detail")
  }

  const handleFilterChange = (newFilters: CustomerFiltersType) => {
    setFilters(newFilters)
  }

  const resetFilters = () => {
    setFilters({
      search: "",
      dateFrom: undefined,
      dateTo: undefined,
      hasOrders: "all",
    })
  }

  // Filtrar clientes según los criterios
  const filteredCustomers = customers.filter((customer) => {
    // Filtro de búsqueda
    const searchMatch =
      filters.search === "" ||
      customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(filters.search.toLowerCase())) ||
      (customer.phone && customer.phone.toLowerCase().includes(filters.search.toLowerCase()))

    // Filtro de fecha desde
    const dateFromMatch =
      !filters.dateFrom || new Date(customer.created_at) >= new Date(filters.dateFrom.setHours(0, 0, 0, 0))

    // Filtro de fecha hasta
    const dateToMatch =
      !filters.dateTo || new Date(customer.created_at) <= new Date(filters.dateTo.setHours(23, 59, 59, 999))

    // Filtro de pedidos
    const hasOrdersMatch =
      filters.hasOrders === "all" ||
      (filters.hasOrders === "yes" && customerOrders[customer.id]?.length > 0) ||
      (filters.hasOrders === "no" && (!customerOrders[customer.id] || customerOrders[customer.id].length === 0))

    return searchMatch && dateFromMatch && dateToMatch && hasOrdersMatch
  })

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
            <TabsTrigger value="list">Lista de Clientes</TabsTrigger>
            <TabsTrigger value="form">{editingCustomer ? "Editar Cliente" : "Agregar Cliente"}</TabsTrigger>
            {selectedCustomer && <TabsTrigger value="detail">Detalles del Cliente</TabsTrigger>}
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="space-y-4">
          <CustomerFilters filters={filters} onFilterChange={handleFilterChange} onResetFilters={resetFilters} />
          <CustomerList
            customers={filteredCustomers}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            onView={handleViewCustomer}
            customerOrders={customerOrders}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="form">
          <CustomerForm
            initialData={editingCustomer}
            onSubmit={editingCustomer ? handleUpdateCustomer : handleAddCustomer}
            onCancel={() => {
              setEditingCustomer(null)
              setActiveTab("list")
            }}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="detail">
          {selectedCustomer && (
            <CustomerDetail
              customer={selectedCustomer}
              customerOrders={customerOrders[selectedCustomer.id] || []}
              onBack={() => setActiveTab("list")}
              isLoading={isLoading}
            />
          )}
        </TabsContent>
        <TabsContent value="stats">
          <CustomerStats customers={customers} customerOrders={customerOrders} />
        </TabsContent>
      </Tabs>
    </>
  )
}
