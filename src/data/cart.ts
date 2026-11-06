import type { Product } from './products'

export interface CartItem {
  product: Product
  quantity: number
}

export type PaymentMethod = 'card' | 'wallet' | 'cash'

export interface ShippingData {
  fullName: string
  phone: string
  address: string
  city: string
  district: string
}

export const MAX_QUANTITY = 99
/** Igual que el banner del catálogo: "Envío gratis en compras desde S/ 199". */
export const FREE_SHIPPING_FROM = 199
export const SHIPPING_COST = 15

/** Solo frontend: códigos de demostración hasta que exista una API de descuentos. */
const DISCOUNT_CODES: Record<string, number> = { ALBA10: 0.1 }

export function discountRateFor(code: string): number | null {
  return DISCOUNT_CODES[code.trim().toUpperCase()] ?? null
}

export function addToCart(items: CartItem[], product: Product): CartItem[] {
  const existing = items.find((item) => item.product.id === product.id)
  if (!existing) return [...items, { product, quantity: 1 }]
  return items.map((item) =>
    item === existing ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + 1) } : item,
  )
}

export function setQuantity(items: CartItem[], productId: number, quantity: number): CartItem[] {
  if (quantity < 1) return items.filter((item) => item.product.id !== productId)
  return items.map((item) =>
    item.product.id === productId ? { ...item, quantity: Math.min(MAX_QUANTITY, quantity) } : item,
  )
}

/** Devuelve al carrito los productos de un pedido (p. ej. al cambiar el método de pago). */
export function mergeItems(items: CartItem[], extra: CartItem[]): CartItem[] {
  return extra.reduce((acc, { product, quantity }) => {
    const current = acc.find((item) => item.product.id === product.id)?.quantity ?? 0
    return current ? setQuantity(acc, product.id, current + quantity) : [...acc, { product, quantity: Math.min(MAX_QUANTITY, quantity) }]
  }, items)
}

export const countItems =(items: CartItem[]) => items.reduce((sum, item) => sum + item.quantity, 0)

const round2 = (value: number) => Math.round(value * 100) / 100

export function getTotals(items: CartItem[], discountRate = 0) {
  const subtotal = round2(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0))
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST
  const discount = round2(subtotal * discountRate)
  return { subtotal, shipping, discount, total: round2(subtotal + shipping - discount) }
}

export function paymentLabel(method: PaymentMethod, cardNumber: string) {
  if (method === 'wallet') return 'Billetera digital'
  if (method === 'cash') return 'Contra entrega'
  const digits = cardNumber.replace(/\D/g, '')
  const brand = digits.startsWith('4') ? 'Visa' : /^5[1-5]/.test(digits) ? 'Mastercard' : 'Tarjeta'
  return `${brand} •••• ${digits.slice(-4)}`
}

/** Entrega en 1 día hábil si todo tiene envío en 24 h; si no, en 3. */
export function estimateDelivery(items: CartItem[], from = new Date()) {
  let businessDays = items.every((item) => item.product.fastShipping) ? 1 : 3
  const date = new Date(from)
  while (businessDays > 0) {
    date.setDate(date.getDate() + 1)
    const day = date.getDay()
    if (day !== 0 && day !== 6) businessDays--
  }
  return date
}

export function formatDeliveryDate(date: Date) {
  const text = date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1).replace(',', '')
}
