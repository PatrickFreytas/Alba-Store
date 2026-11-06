import { useEffect, useMemo, useRef, useState } from 'react'
import StoreTopbar from '../StoreTopbar/StoreTopbar'
import { formatPrice } from '../../data/products'
import { formatDeliveryDate } from '../../data/cart'
import { itemCountLabel, shortAddress, type Order } from '../../data/orders'
import '../Checkout/Checkout.css'
import './OrderConfirmation.css'

interface OrderConfirmationProps {
  order: Order
  onBackToCatalog: () => void
  onTrackOrder: () => void
  /** Billetera digital: el cliente indica que ya pagó. */
  onConfirmPayment: () => void
  /** Billetera digital: vuelve al checkout con los productos del pedido. */
  onChangeMethod: () => void
  /** Billetera digital: genera un código nuevo cuando el anterior venció. */
  onRenewCode: () => void
}

/** Hora actual que se actualiza cada segundo mientras `active` sea true. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])
  return now
}

/** QR decorativo generado a partir del número de pedido (demostración, no se puede escanear). */
function DemoQr({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    const N = 25
    let h = [...seed].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7)
    const rnd = () => (h = (h * 1103515245 + 12345) >>> 0) / 4294967296
    const finders = [[0, 0], [0, N - 7], [N - 7, 0]]
    const inFinder = (r: number, c: number) => finders.some(([fr, fc]) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7)
    const out: [number, number][] = []
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!inFinder(r, c) && rnd() > 0.52) out.push([r, c])
    return { N, out, finders }
  }, [seed])

  return (
    <svg className="payment-qr__code" viewBox={`0 0 ${cells.N} ${cells.N}`} role="img" aria-label="Código QR de pago (demostración)" shapeRendering="crispEdges">
      <rect width={cells.N} height={cells.N} fill="#fff" />
      {cells.out.map(([r, c]) => (
        <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0e1a17" />
      ))}
      {cells.finders.map(([r, c]) => (
        <g key={`f${r}-${c}`}>
          <rect x={c} y={r} width="7" height="7" fill="#0e1a17" />
          <rect x={c + 1} y={r + 1} width="5" height="5" fill="#fff" />
          <rect x={c + 2} y={r + 2} width="3" height="3" fill="#0e1a17" />
        </g>
      ))}
    </svg>
  )
}

const CheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const ClockIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.5" />
  </svg>
)

function OrderConfirmation({
  order,
  onBackToCatalog,
  onTrackOrder,
  onConfirmPayment,
  onChangeMethod,
  onRenewCode,
}: OrderConfirmationProps) {
  const pending = order.status === 'pending_payment'
  const cash = order.paymentMethod === 'cash'
  const now = useNow(pending)
  const titleRef = useRef<HTMLHeadingElement>(null)

  // Al montar y al pasar de "pago pendiente" a confirmado, el foco va al nuevo título
  useEffect(() => {
    titleRef.current?.focus()
  }, [order.status])

  const remainingMs = pending && order.paymentExpiresAt ? Math.max(0, order.paymentExpiresAt.getTime() - now) : 0
  const expired = pending && remainingMs === 0
  const minutes = Math.floor(remainingMs / 60000)
  const seconds = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0')

  const variant = pending
    ? {
        tone: 'amber',
        icon: <ClockIcon />,
        title: 'Completa tu pago',
        text: 'Tu pedido está reservado. Escanea el código con tu billetera digital para confirmarlo.',
      }
    : cash
      ? {
          tone: 'green',
          icon: <CheckIcon />,
          title: '¡Pedido confirmado!',
          text: 'Pagarás al recibir tu pedido. Te enviamos el detalle a tu correo electrónico.',
        }
      : {
          tone: 'green',
          icon: <CheckIcon />,
          title: '¡Gracias por tu compra!',
          text: 'Tu pedido fue confirmado. Te enviamos el detalle a tu correo electrónico.',
        }

  const rows: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'N.º de pedido', value: order.number },
    { label: 'Productos', value: itemCountLabel(order) },
    pending
      ? { label: 'Estado del pago', value: 'Pendiente', highlight: true }
      : { label: 'Entrega estimada', value: formatDeliveryDate(order.estimatedDelivery) },
    { label: 'Enviar a', value: shortAddress(order) },
    { label: 'Método de pago', value: order.paymentLabel },
  ]
  const totalLabel = pending ? 'Total a pagar' : cash ? 'Total a pagar al recibir' : 'Total pagado'

  return (
    <div className="confirmation">
      <StoreTopbar onLogoClick={onBackToCatalog} />

      <main className="confirmation__main">
        <section className="confirmation-card">
          <span className={`confirmation-card__icon is-${variant.tone}`} aria-hidden="true">
            {variant.icon}
          </span>
          <h1 ref={titleRef} tabIndex={-1} className="confirmation-card__title">
            {variant.title}
          </h1>
          <p className="confirmation-card__text">{variant.text}</p>

          {pending && (
            <div className={`payment-qr${expired ? ' is-expired' : ''}`}>
              <DemoQr seed={order.number + String(order.paymentExpiresAt?.getTime())} />
              <strong className="payment-qr__amount">{formatPrice(order.totals.total)}</strong>
              <span className="payment-qr__hint">Escanea con la app de tu billetera digital</span>
              {expired ? (
                <>
                  <span className="payment-qr__timer is-expired" role="status">
                    El código venció
                  </span>
                  <button type="button" className="checkout-link" onClick={onRenewCode}>
                    Generar un código nuevo
                  </button>
                </>
              ) : (
                <span className="payment-qr__timer" aria-live="off">
                  El código vence en {minutes}:{seconds}
                </span>
              )}
            </div>
          )}

          {!pending && cash && (
            <div className="confirmation-notice">
              <InfoIcon />
              <div>
                <strong>Ten listo {formatPrice(order.totals.total)} al recibir tu pedido</strong>
                <p>Aceptamos efectivo y tarjeta. Si pagas en efectivo, procura tener el monto exacto.</p>
              </div>
            </div>
          )}

          <dl className="confirmation-details">
            {rows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd className={row.highlight ? 'is-pending' : undefined}>{row.value}</dd>
              </div>
            ))}
            <div className="confirmation-details__total">
              <dt>{totalLabel}</dt>
              <dd>{formatPrice(order.totals.total)}</dd>
            </div>
          </dl>

          <div className="confirmation-actions">
            {pending ? (
              <>
                <button type="button" className="checkout-btn" onClick={onConfirmPayment} disabled={expired}>
                  Ya realicé el pago
                </button>
                <button type="button" className="confirmation-btn-outline" onClick={onChangeMethod}>
                  Cambiar método
                </button>
              </>
            ) : (
              <>
                <button type="button" className="checkout-btn" onClick={onTrackOrder}>
                  Seguir mi pedido
                </button>
                <button type="button" className="confirmation-btn-outline" onClick={onBackToCatalog}>
                  Volver al catálogo
                </button>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default OrderConfirmation
