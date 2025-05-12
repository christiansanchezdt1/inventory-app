"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Printer } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { OrderWithItems } from "@/types/order"

interface OrderPrintProps {
  order: OrderWithItems
}

export default function OrderPrint({ order }: OrderPrintProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (printRef.current) {
      // Crear un iframe oculto
      const iframe = document.createElement("iframe")
      iframe.style.display = "none"
      document.body.appendChild(iframe)

      // Escribir el contenido en el iframe
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDocument) {
        iframeDocument.open()
        iframeDocument.write(`
          <html>
            <head>
              <title>Pedido ${order.order_number}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                }
                .header {
                  text-align: center;
                  margin-bottom: 20px;
                  padding-bottom: 10px;
                  border-bottom: 1px solid #ddd;
                }
                .info {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 20px;
                }
                .info-section {
                  width: 48%;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                }
                th, td {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
                }
                th {
                  background-color: #f2f2f2;
                }
                .total {
                  text-align: right;
                  font-weight: bold;
                  font-size: 1.2em;
                  margin-top: 20px;
                }
                .footer {
                  margin-top: 30px;
                  text-align: center;
                  font-size: 0.8em;
                  color: #666;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Pedido: ${order.order_number}</h1>
                <p>Fecha: ${new Date(order.created_at).toLocaleDateString("es-AR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
              </div>
              
              <div class="info">
                <div class="info-section">
                  <h3>Información del Cliente</h3>
                  <p><strong>Nombre:</strong> ${order.customer_name}</p>
                  ${order.customer_email ? `<p><strong>Email:</strong> ${order.customer_email}</p>` : ""}
                  ${order.customer_phone ? `<p><strong>Teléfono:</strong> ${order.customer_phone}</p>` : ""}
                </div>
                <div class="info-section">
                  <h3>Información del Pedido</h3>
                  <p><strong>Estado:</strong> ${order.status}</p>
                  ${order.notes ? `<p><strong>Notas:</strong> ${order.notes}</p>` : ""}
                </div>
              </div>
              
              <h3>Productos</h3>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.product_name}</td>
                      <td>${item.product_sku}</td>
                      <td>${formatCurrency(item.price)}</td>
                      <td>${item.quantity}</td>
                      <td>${formatCurrency(item.subtotal)}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
              
              <div class="total">
                Total: ${formatCurrency(order.total_amount)}
              </div>
              
              <div class="footer">
                <p>Este documento no tiene valor fiscal.</p>
                <p>Sistema de Gestión de Inventario - ${new Date().getFullYear()}</p>
              </div>
            </body>
          </html>
        `)
        iframeDocument.close()

        // Imprimir y eliminar el iframe
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.print()
            document.body.removeChild(iframe)
          }, 500)
        }
      }
    }
  }

  return (
    <div>
      <Button onClick={handlePrint} className="mb-4">
        <Printer className="mr-2 h-4 w-4" />
        Imprimir Pedido
      </Button>

      <div className="hidden">
        <div ref={printRef}>{/* Contenido para imprimir - no se muestra en la UI */}</div>
      </div>

      {/* Vista previa */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="text-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold">Pedido: {order.order_number}</h2>
            <p className="text-muted-foreground">
              Fecha:{" "}
              {new Date(order.created_at).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Información del Cliente</h3>
              <p>
                <span className="font-medium">Nombre:</span> {order.customer_name}
              </p>
              {order.customer_email && (
                <p>
                  <span className="font-medium">Email:</span> {order.customer_email}
                </p>
              )}
              {order.customer_phone && (
                <p>
                  <span className="font-medium">Teléfono:</span> {order.customer_phone}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Información del Pedido</h3>
              <p>
                <span className="font-medium">Estado:</span> {order.status}
              </p>
              {order.notes && (
                <p>
                  <span className="font-medium">Notas:</span> {order.notes}
                </p>
              )}
            </div>
          </div>

          <h3 className="text-lg font-medium mb-2">Productos</h3>
          <div className="border rounded-md overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Producto</th>
                  <th className="p-2 text-left">SKU</th>
                  <th className="p-2 text-right">Precio</th>
                  <th className="p-2 text-right">Cantidad</th>
                  <th className="p-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-2">{item.product_name}</td>
                    <td className="p-2">{item.product_sku}</td>
                    <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-right text-xl font-bold">Total: {formatCurrency(order.total_amount)}</div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Este documento no tiene valor fiscal.</p>
            <p>Sistema de Gestión de Inventario - {new Date().getFullYear()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
