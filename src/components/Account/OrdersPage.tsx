import { useState } from 'react'
import ProductThumb from './ProductThumb'
import { formatPrice } from '../../data/products'
import {
  formatLongDate,
  itemCountLabel,
  matchesFilter,
  orderFilters,
  orderMessage,
  statusInfo,
  type Order,
  type OrderFilter,
} from '../../data/orders'
import './Orders.css'

interface OrdersPageProps {
  orders: Order[]
  signedIn: boolean
  onOpenOrder: (order: Order) => void
  onCatalog: () => void
  onLogin: () => void
}

const MAX_THUMBS = 3

/** "Mis pedidos": historial con filtros por estado. */
function OrdersPage({ orders, signedIn, onOpenOrder, onCatalog, onLogin }: OrdersPageProps) {
  const [filter, setFilter] = useState<OrderFilter>('all')
  const visible = orders.filter((order) => matchesFilter(order, filter))

  if (!signedIn) {
    return (
      <section className="account-empty">
        <h1 className="account-empty__title">Inicia sesión para ver tus pedidos</h1>
        <p className="account-empty__text">Tus pedidos y su seguimiento se guardan en tu cuenta.</p>
        <button type="button" className="account-btn" onClick={onLogin}>
          Iniciar sesión
        </button>
      </section>
    )
  }

  return (
    <>
      <div className="account-head">
        <div>
          <h1 className="account-head__title">Mis pedidos</h1>
          <p className="account-head__sub">
            {orders.length} {orders.length === 1 ? 'pedido realizado' : 'pedidos realizados'}
          </p>
        </div>
        {orders.length > 0 && (
          <div className="orders-filters" role="group" aria-label="Filtrar pedidos">
            {orderFilters.map((f) => {
              const count = orders.filter((order) => matchesFilter(order, f.id)).length
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`orders-filter${filter === f.id ? ' is-active' : ''}`}
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                  <span>{count}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <section className="account-empty">
          <span className="account-empty__icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h18l-1.5 13h-15z" />
              <path d="M8 7a4 4 0 0 1 8 0" />
            </svg>
          </span>
          <h2 className="account-empty__title">Aún no tienes pedidos</h2>
          <p className="account-empty__text">Cuando compres algo, aquí podrás ver su estado y seguir la entrega.</p>
          <button type="button" className="account-btn" onClick={onCatalog}>
            Explorar catálogo
          </button>
        </section>
      ) : visible.length === 0 ? (
        <p className="orders-none">No tienes pedidos en esta categoría.</p>
      ) : (
        <ul className="orders-list">
          {visible.map((order) => {
            const status = statusInfo[order.status]
            const extra = order.items.length - MAX_THUMBS
            const pending = order.status === 'pending_payment'
            return (
              <li key={order.number} className="order-card">
                <div className="order-card__thumbs" aria-hidden="true">
                  {order.items.slice(0, MAX_THUMBS).map(({ product }) => (
                    <ProductThumb key={product.id} product={product} />
                  ))}
                  {extra > 0 && <span className="order-card__more">+{extra}</span>}
                </div>
                <div className="order-card__info">
                  <h2 className="order-card__number">Pedido {order.number}</h2>
                  <span className="order-card__meta">
                    Realizado el {formatLongDate(order.createdAt)} · {itemCountLabel(order)}
                  </span>
                  <span className="order-card__message">{orderMessage(order)}</span>
                </div>
                <div className="order-card__side">
                  <span className={`status-pill is-${status.tone}`}>{status.label}</span>
                  <strong className="order-card__total">{formatPrice(order.totals.total)}</strong>
                </div>
                <button type="button" className="account-btn order-card__action" onClick={() => onOpenOrder(order)}>
                  {pending ? 'Completar pago' : 'Ver seguimiento'}
                  <span className="sr-only"> del pedido {order.number}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

export default OrdersPage
