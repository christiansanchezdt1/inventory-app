"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { OrderWithItems } from "@/types/order"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Esquema de validación para los items del pedido
const orderItemSchema = z.object({
  id: z.number().optional(),
  product_id: z.coerce.number().min(1, {
    message: "Por favor seleccione un producto.",
  }),
  quantity: z.coerce.number().int().min(1, {
    message: "La cantidad debe ser al menos 1.",
  }),
  price: z.coerce.number().min(0, {
    message: "El precio no puede ser negativo.",
  }),
})

// Esquema de validación para el pedido
const formSchema = z.object({
  customer_id: z.coerce.number().min(1, {
    message: "Por favor seleccione un cliente.",
  }),
  customer_name: z.string().optional(),
  customer_email: z.string().email({ message: "Por favor ingrese un email válido." }).optional().or(z.literal("")),
  customer_phone: z
    .string()
    .min(5, { message: "El teléfono debe tener al menos 5 caracteres." })
    .optional()
    .or(z.literal("")),
  status: z.string().min(1, {
    message: "Por favor seleccione un estado.",
  }),
  notes: z.string().optional().or(z.literal("")),
  items: z.array(orderItemSchema).min(1, {
    message: "Debe agregar al menos un producto al pedido.",
  }),
})

// Esquema para el formulario de cliente rápido
const quickCustomerSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor ingrese un email válido." }).optional().or(z.literal("")),
  phone: z.string().min(5, { message: "El teléfono debe tener al menos 5 caracteres." }).optional().or(z.literal("")),
})

interface OrderFormProps {
  initialData: OrderWithItems | null
  onSubmit: (data: any) => void
  onCancel: () => void
  products: { id: number; name: string; sku: string; price: number; stock: number }[]
  customers: { id: number; name: string; email: string | null; phone: string | null }[]
  isLoading?: boolean
}

export default function OrderForm({
  initialData,
  onSubmit,
  onCancel,
  products,
  customers,
  isLoading = false,
}: OrderFormProps) {
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState<{
    id: number
    name: string
    email: string | null
    phone: string | null
  } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          customer_id: initialData.id, // Esto debe ser actualizado para usar customer_id
          customer_name: initialData.customer_name,
          customer_email: initialData.customer_email || "",
          customer_phone: initialData.customer_phone || "",
          status: initialData.status,
          notes: initialData.notes || "",
          items: initialData.items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          })),
        }
      : {
          customer_id: 0,
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          status: "Pendiente",
          notes: "",
          items: [
            {
              product_id: 0,
              quantity: 1,
              price: 0,
            },
          ],
        },
  })

  const quickCustomerForm = useForm<z.infer<typeof quickCustomerSchema>>({
    resolver: zodResolver(quickCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const statusOptions = ["Pendiente", "En Proceso", "Completado", "Cancelado"]

  // Calcular el total del pedido
  const calculateTotal = () => {
    const items = form.getValues("items")
    return items.reduce((total, item) => {
      const product = products.find((p) => p.id === Number(item.product_id))
      const price = item.price || (product ? product.price : 0)
      return total + price * (item.quantity || 0)
    }, 0)
  }

  // Actualizar el precio cuando se selecciona un producto
  const handleProductChange = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      const currentItems = form.getValues("items")
      currentItems[index].price = product.price
      form.setValue(`items.${index}.price`, product.price)
    }
  }

  // Actualizar los campos de cliente cuando se selecciona un cliente
  const handleCustomerChange = (customerId: number) => {
    const customer = customers.find((c) => c.id === customerId) || newCustomer
    if (customer) {
      form.setValue("customer_name", customer.name)
      form.setValue("customer_email", customer.email || "")
      form.setValue("customer_phone", customer.phone || "")
    }
  }

  // Manejar la creación rápida de cliente
  const handleQuickCustomerSubmit = (data: z.infer<typeof quickCustomerSchema>) => {
    // En un caso real, aquí se llamaría a una API para crear el cliente
    // Por ahora, simulamos la creación con un ID temporal
    const tempCustomer = {
      id: -1, // ID temporal negativo para distinguirlo
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
    }

    setNewCustomer(tempCustomer)
    form.setValue("customer_id", tempCustomer.id)
    form.setValue("customer_name", tempCustomer.name)
    form.setValue("customer_email", data.email || "")
    form.setValue("customer_phone", data.phone || "")

    setIsQuickCustomerOpen(false)
    quickCustomerForm.reset()
  }

  function handleSubmit(values: z.infer<typeof formSchema>) {
    // Si es un cliente nuevo (ID temporal), enviamos los datos completos
    if (values.customer_id === -1 && newCustomer) {
      const orderData = {
        ...values,
        customer_id: undefined, // Eliminamos el ID temporal
        customer_name: newCustomer.name,
        customer_email: newCustomer.email || "",
        customer_phone: newCustomer.phone || "",
      }

      if (initialData) {
        onSubmit({
          ...initialData,
          ...orderData,
        })
      } else {
        onSubmit(orderData)
      }
    } else {
      // Si es un cliente existente, enviamos solo el ID
      const customer = customers.find((c) => c.id === values.customer_id)
      if (customer) {
        const orderData = {
          ...values,
          customer_name: customer.name,
          customer_email: customer.email || "",
          customer_phone: customer.phone || "",
        }

        if (initialData) {
          onSubmit({
            ...initialData,
            ...orderData,
          })
        } else {
          onSubmit(orderData)
        }
      }
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => {
                            field.onChange(Number(value))
                            handleCustomerChange(Number(value))
                          }}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {newCustomer && (
                              <SelectItem key={newCustomer.id} value={newCustomer.id.toString()}>
                                {newCustomer.name} (Nuevo)
                              </SelectItem>
                            )}
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog open={isQuickCustomerOpen} onOpenChange={setIsQuickCustomerOpen}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="icon">
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Agregar Cliente Rápido</DialogTitle>
                              <DialogDescription>
                                Ingrese los datos del nuevo cliente. Podrá completar más información después.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...quickCustomerForm}>
                              <form
                                onSubmit={quickCustomerForm.handleSubmit(handleQuickCustomerSubmit)}
                                className="space-y-4"
                              >
                                <FormField
                                  control={quickCustomerForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Nombre</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Nombre del cliente" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={quickCustomerForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email (opcional)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Email del cliente" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={quickCustomerForm.control}
                                  name="phone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Teléfono (opcional)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Teléfono del cliente" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter>
                                  <Button type="submit">Agregar Cliente</Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas adicionales sobre el pedido" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Productos</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ product_id: 0, quantity: 1, price: 0 })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-4 border rounded-md">
                  <p className="text-muted-foreground">No hay productos en el pedido</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-md">
                      <FormField
                        control={form.control}
                        name={`items.${index}.product_id`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Producto</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                handleProductChange(index, Number(value))
                              }}
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione un producto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} ({product.sku}) - {formatCurrency(product.price)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="w-full md:w-24">
                            <FormLabel>Cantidad</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                  field.onChange(value === "" ? 1 : Number.parseInt(value, 10))
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.price`}
                        render={({ field }) => (
                          <FormItem className="w-full md:w-32">
                            <FormLabel>Precio</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                  field.onChange(value === "" ? 0 : Number.parseFloat(value))
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end mb-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end p-4 border rounded-md bg-muted/20">
                    <div className="text-lg font-medium">Total: {formatCurrency(calculateTotal())}</div>
                  </div>
                </div>
              )}
              {form.formState.errors.items?.message && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.items?.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {initialData ? "Actualizando..." : "Guardando..."}
                  </>
                ) : (
                  <>{initialData ? "Actualizar" : "Guardar"} Pedido</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
