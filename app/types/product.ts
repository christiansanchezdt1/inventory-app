export interface Product {
    id: number
    name: string
    description: string
    sku: string
    category_id: number
    supplier_id: number
    stock: number
    price: number
    cost_price: number
    status: string
    image_url?: string
    created_at: string
    updated_at: string
    // Campos calculados para la UI
    category_name?: string
    supplier_name?: string
  }
  
  export interface Category {
    id: number
    name: string
    description: string
  }
  
  export interface Supplier {
    id: number
    name: string
    contact_name: string
    email: string
    phone: string
    address: string
  }
  