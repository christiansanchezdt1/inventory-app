"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent } from "@/components/ui/card"

interface InventoryStatsProps {
  categoryCounts: { category: string; count: number }[]
}

export default function InventoryStats({ categoryCounts }: InventoryStatsProps) {
  if (!categoryCounts || categoryCounts.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay datos de categorías disponibles</div>
  }

  // Preparar datos para el gráfico
  const chartData = categoryCounts.map((item) => ({
    name: item.category,
    total: Number.parseInt(item.count.toString()),
  }))

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
            }}
          />
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} className="fill-primary" />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryCounts.map((item) => (
          <Card key={item.category}>
            <CardContent className="p-4 flex justify-between items-center">
              <span className="font-medium">{item.category}</span>
              <span className="text-muted-foreground">{item.count} productos</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
