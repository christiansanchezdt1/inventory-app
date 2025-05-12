export interface Order {
    id: number
    order_number: string
    customer_name: string
    customer_email: string | null
    customer_phone: string | null
    status: string
    total_amount: number
    notes: string | null
    created_at: string
    updated_at: string
  }
  
  export interface OrderItem {
    id: number
    order_id: number
    product_id: number
    quantity: number
    price: number
    subtotal: number
    created_at: string
    // Campos calculados para la UI
    product_name?: string
    product_sku?: string
  }
  
  export interface OrderWithItems extends Order {
    items: (OrderItem & { product_name: string; product_sku: string })[]
  }
  
  export interface OrderHistoryEntry {
    id: number
    order_id: number
    action_type: "create" | "update" | "delete"
    changes: Record<string, any>
    user_id?: number
    created_at: string
    order_number?: string
  }
  