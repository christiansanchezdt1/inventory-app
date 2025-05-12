"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import type { Customer } from "@/types/customer"
import type { Order } from "@/types/order"

interface CustomerStatsProps {
  customers: Customer[]
  customerOrders: Record<number, Order[]>
}

export default function CustomerStats({ customers, customerOrders }: CustomerStatsProps) {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    averageOrdersPerCustomer: 0,
    topCustomers: [] as { name: string; orders: number; total: number }[],
    orderDistribution: [] as { name: string; value: number }[],
  })

  useEffect(() => {
    if (customers.length > 0) {
      // Calcular estadísticas básicas
      const totalCustomers = customers.length
      const activeCustomers = Object.keys(customerOrders).length
      const inactiveCustomers = totalCustomers - activeCustomers

      // Total de pedidos
      const totalOrders = Object.values(customerOrders).reduce((sum, orders) => sum + orders.length, 0)

      // Promedio de pedidos por cliente
      const averageOrdersPerCustomer = activeCustomers > 0 ? totalOrders / activeCustomers : 0

      // Top clientes por monto total
      const customersWithStats = customers.map((customer) => {
        const orders = customerOrders[customer.id] || []
        const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount), 0)

        return {
          id: customer.id,
          name: customer.name,
          orders: orders.length,
          total: totalSpent,
        }
      })

      const topCustomers = [...customersWithStats].sort((a, b) => b.total - a.total).slice(0, 5)

      // Distribución de pedidos
      const orderCounts = [0, 0, 0, 0, 0] // 0, 1, 2-5, 6-10, >10

      customersWithStats.forEach((customer) => {
        if (customer.orders === 0) orderCounts[0]++
        else if (customer.orders === 1) orderCounts[1]++
        else if (customer.orders >= 2 && customer.orders <= 5) orderCounts[2]++
        else if (customer.orders >= 6 && customer.orders <= 10) orderCounts[3]++
        else orderCounts[4]++
      })

      const orderDistribution = [
        { name: "0 pedidos", value: orderCounts[0] },
        { name: "1 pedido", value: orderCounts[1] },
        { name: "2-5 pedidos", value: orderCounts[2] },
        { name: "6-10 pedidos", value: orderCounts[3] },
        { name: ">10 pedidos", value: orderCounts[4] },
      ]

      setStats({
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        averageOrdersPerCustomer,
        topCustomers,
        orderDistribution,
      })
    }
  }, [customers, customerOrders])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <CardDescription className="text-xs">Con al menos un pedido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes Inactivos</CardTitle>
            <CardDescription className="text-xs">Sin pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactiveCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Promedio de Pedidos</CardTitle>
            <CardDescription className="text-xs">Por cliente activo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageOrdersPerCustomer.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Pedidos</CardTitle>
            <CardDescription>Cantidad de clientes por número de pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.orderDistribution}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes</CardTitle>
            <CardDescription>Por monto total de compras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topCustomers.length > 0 ? (
                stats.topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.orders} pedidos</p>
                      </div>
                    </div>
                    <div className="font-medium">
                      ${customer.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No hay datos disponibles</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
