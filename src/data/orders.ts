import { countItems, estimateDelivery, getTotals, paymentLabel, type CartItem, type PaymentMethod, type ShippingData } from './cart'

export type OrderStatus = 'pending_payment' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  number: string
  createdAt: Date
  items: CartItem[]
  totals: ReturnType<typeof getTotals>
  shipping: ShippingData
  paymentMethod: PaymentMethod
  paymentLabel: string
  estimatedDelivery: Date
  status: OrderStatus
  confirmedAt: Date | null
  /** Solo billetera digital: vencimiento del código QR. */
  paymentExpiresAt: Date | null
}

export const WALLET_PAYMENT_MINUTES = 15

export type StatusTone = 'amber' | 'blue' | 'green' | 'gray'

export const statusInfo: Record<OrderStatus, { label: string; tone: StatusTone }> = {
  pending_payment: { label: 'Pago pendiente', tone: 'amber' },
  confirmed: { label: 'Confirmado', tone: 'blue' },
  preparing: { label: 'En preparación', tone: 'blue' },
  shipped: { label: 'En camino', tone: 'amber' },
  delivered: { label: 'Entregado', tone: 'green' },
  cancelled: { label: 'Cancelado', tone: 'gray' },
}

export type OrderFilter = 'all' | 'active' | 'delivered' | 'cancelled'

export const orderFilters: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'En curso' },
  { id: 'delivered', label: 'Entregados' },
  { id: 'cancelled', label: 'Cancelados' },
]

export function matchesFilter(order: Order, filter: OrderFilter) {
  if (filter === 'all') return true
  if (filter === 'delivered') return order.status === 'delivered'
  if (filter === 'cancelled') return order.status === 'cancelled'
  return order.status !== 'delivered' && order.status !== 'cancelled'
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** "26 de octubre" */
export const formatLongDate = (d: Date) => `${d.getDate()} de ${MONTHS[d.getMonth()]}`

/** "jueves 29 de octubre" */
export const formatWeekdayDate = (d: Date) => `${DAYS_LONG[d.getDay()]} ${formatLongDate(d)}`

/** "Lun 26 oct · 10:42 a. m." */
export function formatDateTime(d: Date) {
  const hours = d.getHours()
  const h12 = hours % 12 || 12
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${formatShortDate(d)} · ${h12}:${minutes} ${hours < 12 ? 'a. m.' : 'p. m.'}`
}

/** "Lun 26 oct" */
export const formatShortDate = (d: Date) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`

export const itemCountLabel = (order: Order) => {
  const n = countItems(order.items)
  return `${n} ${n === 1 ? 'artículo' : 'artículos'}`
}

export function orderMessage(order: Order) {
  switch (order.status) {
    case 'pending_payment':
      return 'Completa el pago con tu billetera digital'
    case 'delivered':
      return 'Entregado'
    case 'cancelled':
      return 'Pedido cancelado'
    default:
      return `Llega el ${formatWeekdayDate(order.estimatedDelivery)}`
  }
}

export interface TrackingStep {
  label: string
  detail: string
  state: 'done' | 'current' | 'pending'
}

const STEP_INDEX: Partial<Record<OrderStatus, number>> = { confirmed: 0, preparing: 1, shipped: 2, delivered: 3 }

export function trackingSteps(order: Order): TrackingStep[] {
  const reached = STEP_INDEX[order.status] ?? -1
  const steps = [
    {
      label: order.status === 'pending_payment' ? 'Pago pendiente' : 'Pedido confirmado',
      detail: order.confirmedAt ? formatDateTime(order.confirmedAt) : 'Esperando tu pago',
    },
    { label: 'En preparación', detail: 'Pendiente' },
    { label: 'En camino', detail: 'Pendiente' },
    { label: 'Entregado', detail: `Estimado: ${formatShortDate(order.estimatedDelivery).toLowerCase()}` },
  ]
  return steps.map((step, i) => ({
    ...step,
    state: i <= reached ? 'done' : i === reached + 1 ? 'current' : 'pending',
  }))
}

const createOrderNumber = () => `#AS-${Math.floor(10000 + Math.random() * 90000)}`

interface NewOrder {
  items: CartItem[]
  totals: Order['totals']
  shipping: ShippingData
  method: PaymentMethod
  cardNumber: string
}

/** Solo frontend: la pasarela se simula. La billetera queda pendiente hasta que el cliente confirma el pago. */
export function createOrder({ items, totals, shipping, method, cardNumber }: NewOrder, now = new Date()): Order {
  const pending = method === 'wallet'
  return {
    number: createOrderNumber(),
    createdAt: now,
    items,
    totals,
    shipping: {
      fullName: shipping.fullName.trim(),
      phone: shipping.phone.trim(),
      address: shipping.address.trim(),
      city: shipping.city.trim(),
      district: shipping.district.trim(),
    },
    paymentMethod: method,
    paymentLabel: paymentLabel(method, cardNumber),
    estimatedDelivery: estimateDelivery(items, now),
    status: pending ? 'pending_payment' : 'confirmed',
    confirmedAt: pending ? null : now,
    paymentExpiresAt: pending ? new Date(now.getTime() + WALLET_PAYMENT_MINUTES * 60_000) : null,
  }
}

export function confirmPayment(order: Order, now = new Date()): Order {
  // La fecha de entrega se recalcula desde el momento del pago
  return {
    ...order,
    status: 'confirmed',
    confirmedAt: now,
    paymentExpiresAt: null,
    estimatedDelivery: estimateDelivery(order.items, now),
  }
}

export function renewPaymentCode(order: Order, now = new Date()): Order {
  return { ...order, paymentExpiresAt: new Date(now.getTime() + WALLET_PAYMENT_MINUTES * 60_000) }
}

export const shortAddress = (order: Order) => `${order.shipping.address}, ${order.shipping.district}`
