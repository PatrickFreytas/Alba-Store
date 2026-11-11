import { useEffect, useRef } from 'react'
import StoreTopbar from '../StoreTopbar/StoreTopbar'
import ProductThumb from '../Account/ProductThumb'
import { formatPrice } from '../../data/products'
import { countItems } from '../../data/cart'
import { formatLongDate, formatWeekdayDate, statusInfo, trackingSteps, type Order } from '../../data/orders'
import '../Account/Account.css'
import './OrderTracking.css'

interface OrderTrackingProps {
  order: Order
  onBack: () => void
  onCatalog: () => void
  onCompletePayment: () => void
}

const StepCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

/** Seguimiento de un pedido (diseño "Seguimiento pedido"). */
function OrderTracking({ order, onBack, onCatalog, onCompletePayment }: OrderTrackingProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const status = statusInfo[order.status]
  const steps = trackingSteps(order)
  const pending = order.status === 'pending_payment'
  const totalLabel = pending ? 'Total a pagar' : order.paymentMethod === 'cash' ? 'Total a pagar al recibir' : 'Total pagado'

  return (
    <div className="tracking">
      <StoreTopbar onLogoClick={onCatalog} actionLabel="Mi cuenta" onAction={onBack} />

      <main className="tracking__main">
        <button type="button" className="tracking__back" onClick={onBack}>
          ← Volver a mis pedidos
        </button>
        <div className="tracking__head">
          <div>
            <h1 ref={titleRef} tabIndex={-1} className="tracking__title">
              Pedido {order.number}
            </h1>
            <p className="tracking__sub">
              Realizado el {formatLongDate(order.createdAt)} · Entrega estimada:{' '}
              <strong>{formatWeekdayDate(order.estimatedDelivery)}</strong>
            </p>
          </div>
          <span className={`status-pill is-${status.tone}`}>{status.label}</span>
        </div>

        {pending && (
          <div className="tracking-alert" role="status">
            <span>Tu pedido está reservado, pero aún falta completar el pago con tu billetera digital.</span>
            <button type="button" className="account-btn" onClick={onCompletePayment}>
              Completar pago
            </button>
          </div>
        )}

        <section className="tracking-card" aria-labelledby="tracking-status-title">
          <h2 id="tracking-status-title" className="tracking-card__title">
            Estado del pedido
          </h2>
          <ol className="tracking-steps">
            {steps.map((step, i) => (
              <li key={step.label} className={`tracking-step is-${step.state}`} aria-current={step.state === 'current' ? 'step' : undefined}>
                <div className="tracking-step__track">
                  <span className="tracking-step__dot">{step.state === 'done' ? <StepCheck /> : i + 1}</span>
                  {i < steps.length - 1 && <span className="tracking-step__line" aria-hidden="true" />}
                </div>
                <strong className="tracking-step__label">{step.label}</strong>
                <span className="tracking-step__detail">{step.detail}</span>
                <span className="sr-only">
                  {step.state === 'done' ? '(completado)' : step.state === 'current' ? '(siguiente paso)' : '(pendiente)'}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="tracking__grid">
          <section className="tracking-card" aria-labelledby="tracking-products-title">
            <h2 id="tracking-products-title" className="tracking-card__title">
              Productos ({countItems(order.items)})
            </h2>
            <ul className="tracking-items">
              {order.items.map(({ product, quantity }) => (
                <li key={product.id} className="tracking-item">
                  <ProductThumb product={product} />
                  <div className="tracking-item__info">
                    <strong>{product.name}</strong>
                    <span>Cantidad: {quantity}</span>
                  </div>
                  <strong className="tracking-item__price">{formatPrice(product.price * quantity)}</strong>
                </li>
              ))}
            </ul>
          </section>

          <aside className="tracking-card" aria-labelledby="tracking-delivery-title">
            <h2 id="tracking-delivery-title" className="tracking-card__title">
              Detalle de entrega
            </h2>
            <dl className="tracking-details">
              <div>
                <dt>Dirección</dt>
                <dd>
                  {order.shipping.fullName} · {order.shipping.phone}
                  <br />
                  {order.shipping.address}, {order.shipping.district}, {order.shipping.city}
                </dd>
              </div>
              <div>
                <dt>Método de pago</dt>
                <dd>{order.paymentLabel}</dd>
              </div>
              <div>
                <dt>Courier</dt>
                <dd>Se asignará cuando el pedido salga a reparto</dd>
              </div>
            </dl>
            <div className="tracking-total">
              <span>{totalLabel}</span>
              <strong>{formatPrice(order.totals.total)}</strong>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default OrderTracking
