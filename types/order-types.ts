export type CartItem = {
  id: string
  name: string
  price: string
  quantity: number
  priceValue: number
}

export type Order = {
  id: string
  items: CartItem[]
  totalAmount: number
  status: "未提供" | "提供済み" | "キャンセル"
  tableNumber: string
  timestamp: Date
}
