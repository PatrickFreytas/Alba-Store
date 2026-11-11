import { useState, type FormEvent, type InputHTMLAttributes } from 'react'
import StoreTopbar from '../StoreTopbar/StoreTopbar'
import GuestCheckoutModal from './GuestCheckoutModal'
import { formatPrice } from '../../data/products'
import type { User } from '../../data/auth'
import {
  MAX_QUANTITY,
  countItems,
  discountRateFor,
  getTotals,
  type CartItem,
  type PaymentMethod,
  type ShippingData,
} from '../../data/cart'
import { createOrder, type Order } from '../../data/orders'
import iconImage from '../../assets/icon-image.svg'
import './Checkout.css'

interface CheckoutProps {
  items: CartItem[]
  user: User | null
  onQuantityChange: (productId: number, quantity: number) => void
  onContinueShopping: () => void
  onOrderPlaced: (order: Order) => void
  onLogin: () => void
  onRegister: () => void
  /** Datos de envío previos, p. ej. al volver desde "Cambiar método". */
  initialShipping?: ShippingData | null
}

interface CardData {
  number: string
  expiry: string
  cvv: string
}

type Errors = Partial<Record<keyof ShippingData | keyof CardData, string>>

const paymentMethods: { id: PaymentMethod; title: string; text: string }[] = [
  { id: 'card', title: 'Tarjeta', text: 'Crédito o débito' },
  { id: 'wallet', title: 'Billetera digital', text: 'Pago con QR desde tu celular' },
  { id: 'cash', title: 'Contra entrega', text: 'Paga al recibir tu pedido' },
]

const digitsOf = (value: string) => value.replace(/\D/g, '')

function passesLuhn(digits: string) {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

function validateShipping(data: ShippingData): Errors {
  const errors: Errors = {}
  if (!data.fullName.trim()) errors.fullName = 'Ingresa el nombre de quien recibe.'
  const phone = digitsOf(data.phone)
  if (phone.length < 7 || phone.length > 15) errors.phone = 'Ingresa un teléfono válido.'
  if (!data.address.trim()) errors.address = 'Ingresa la dirección de entrega.'
  if (!data.city.trim()) errors.city = 'Ingresa la ciudad.'
  if (!data.district.trim()) errors.district = 'Ingresa el distrito.'
  return errors
}

function validateCard(card: CardData, now = new Date()): Errors {
  const errors: Errors = {}
  const number = digitsOf(card.number)
  if (number.length < 13 || number.length > 19 || !passesLuhn(number)) errors.number = 'Revisa el número de tarjeta.'

  const match = /^(\d{2})\/(\d{2})$/.exec(card.expiry)
  const month = match ? Number(match[1]) : 0
  const year = match ? 2000 + Number(match[2]) : 0
  const expired = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)
  if (!match || month < 1 || month > 12) errors.expiry = 'Usa el formato MM/AA.'
  else if (expired) errors.expiry = 'La tarjeta está vencida.'

  if (!/^\d{3,4}$/.test(card.cvv)) errors.cvv = 'CVV de 3 o 4 dígitos.'
  return errors
}

const formatCardNumber = (value: string) =>
  digitsOf(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ')

function formatExpiry(value: string) {
  const digits = digitsOf(value).slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

function Checkout({
  items,
  user,
  onQuantityChange,
  onContinueShopping,
  onOrderPlaced,
  onLogin,
  onRegister,
  initialShipping,
}: CheckoutProps) {
  const [shipping, setShipping] = useState<ShippingData>(
    () =>
      initialShipping ?? {
        fullName: user?.fullName ?? '',
        phone: '',
        address: '',
        city: '',
        district: '',
      },
  )
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [card, setCard] = useState<CardData>({ number: '', expiry: '', cvv: '' })
  const [codeInput, setCodeInput] = useState('')
  const [discount, setDiscount] = useState<{ code: string; rate: number } | null>(null)
  const [codeMessage, setCodeMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [guestModalOpen, setGuestModalOpen] = useState(false)

  const itemCount = countItems(items)
  const totals = getTotals(items, discount?.rate)

  const shippingErrors = validateShipping(shipping)
  const cardErrors = method === 'card' ? validateCard(card) : {}
  const errors: Errors = submitted ? { ...shippingErrors, ...cardErrors } : {}

  const steps = [
    { label: 'Carrito', done: itemCount > 0 },
    { label: 'Envío', done: Object.keys(shippingErrors).length === 0 },
    { label: 'Pago', done: Object.keys(cardErrors).length === 0 && Object.keys(shippingErrors).length === 0 },
  ]

  const updateShipping = (field: keyof ShippingData) => (value: string) =>
    setShipping((prev) => ({ ...prev, [field]: value }))

  const applyCode = () => {
    const rate = discountRateFor(codeInput)
    if (!codeInput.trim()) return
    if (rate === null) {
      setDiscount(null)
      setCodeMessage({ ok: false, text: 'Ese código no es válido.' })
    } else {
      setDiscount({ code: codeInput.trim().toUpperCase(), rate })
      setCodeMessage({ ok: true, text: `Código aplicado: ${Math.round(rate * 100)}% de descuento.` })
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) {
      setGuestModalOpen(true)
      return
    }
    setSubmitted(true)
    const allErrors = { ...shippingErrors, ...cardErrors }
    const firstInvalid = Object.keys(allErrors)[0]
    if (firstInvalid) {
      document.getElementById(`checkout-${firstInvalid}`)?.focus()
      return
    }

    setProcessing(true)
    // Solo frontend: se simula la pasarela de pago.
    window.setTimeout(() => {
      onOrderPlaced(createOrder({ items, totals, shipping, method, cardNumber: card.number }))
    }, 900)
  }

  const field = (
    name: keyof ShippingData | keyof CardData,
    label: string,
    input: { value: string; onChange: (value: string) => void } & Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'value' | 'onChange'
    >,
    className = '',
  ) => {
    const { value, onChange, ...rest } = input
    const error = errors[name]
    return (
      <div className={`checkout-field ${className}`}>
        <label htmlFor={`checkout-${name}`} className="checkout-label">
          {label}
        </label>
        <input
          id={`checkout-${name}`}
          className={`checkout-input${error ? ' is-invalid' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `checkout-${name}-error` : undefined}
          {...rest}
        />
        {error && (
          <span id={`checkout-${name}-error`} className="checkout-field__error">
            {error}
          </span>
        )}
      </div>
    )
  }

  const stepper = (
    <ol className="checkout-steps" aria-label="Pasos de la compra">
      {steps.map((step, i) => {
        const active = step.done || steps.slice(0, i).every((s) => s.done)
        return (
          <li key={step.label} className={`checkout-step${active ? ' is-active' : ''}`}>
            {i > 0 && <span className={`checkout-step__line${steps[i - 1].done ? ' is-done' : ''}`} aria-hidden="true" />}
            <span className="checkout-step__num">{i + 1}</span>
            {step.label}
          </li>
        )
      })}
    </ol>
  )

  if (items.length === 0) {
    return (
      <div className="checkout">
        <StoreTopbar onLogoClick={onContinueShopping} actionLabel="← Seguir comprando" onAction={onContinueShopping} />
        <main className="checkout__main">
          <section className="checkout-card checkout-empty">
            <h1 className="checkout-empty__title">Tu carrito está vacío</h1>
            <p className="checkout-empty__text">Agrega productos del catálogo para empezar tu compra.</p>
            <button type="button" className="checkout-btn" onClick={onContinueShopping}>
              Ver productos
            </button>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="checkout">
      <StoreTopbar
        onLogoClick={onContinueShopping}
        center={stepper}
        actionLabel="← Seguir comprando"
        onAction={onContinueShopping}
      />

      <form className="checkout__main" onSubmit={handleSubmit} noValidate>
        <h1 className="checkout__title">Finalizar compra</h1>

        <div className="checkout__layout">
          <div className="checkout__col">
            <section className="checkout-card" aria-labelledby="checkout-cart-title">
              <h2 id="checkout-cart-title" className="checkout-card__title">
                Tu carrito ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})
              </h2>
              <ul className="checkout-items">
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className="checkout-item">
                    <div className="checkout-item__thumb" style={{ background: product.imageBg }}>
                      {product.image ? (
                        <img src={product.image} alt="" />
                      ) : (
                        <img src={iconImage} width="22" height="20" alt="" />
                      )}
                    </div>
                    <div className="checkout-item__info">
                      <span className="checkout-item__name">{product.name}</span>
                      <span className="checkout-item__meta">
                        {product.category}
                        {product.fastShipping ? ' · Envío en 24 h' : ''}
                      </span>
                      <button
                        type="button"
                        className="checkout-link"
                        onClick={() => onQuantityChange(product.id, 0)}
                      >
                        Eliminar
                      </button>
                    </div>
                    <div className="checkout-qty" role="group" aria-label={`Cantidad de ${product.name}`}>
                      <button
                        type="button"
                        onClick={() => onQuantityChange(product.id, quantity - 1)}
                        disabled={quantity <= 1}
                        aria-label="Disminuir cantidad"
                      >
                        −
                      </button>
                      <span aria-live="polite">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => onQuantityChange(product.id, quantity + 1)}
                        disabled={quantity >= MAX_QUANTITY}
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                    <span className="checkout-item__price">{formatPrice(product.price * quantity)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="checkout-card" aria-labelledby="checkout-shipping-title">
              <h2 id="checkout-shipping-title" className="checkout-card__title">
                Datos de envío
              </h2>
              <div className="checkout-grid">
                {field('fullName', 'Nombre completo', {
                  value: shipping.fullName,
                  onChange: updateShipping('fullName'),
                  autoComplete: 'name',
                  placeholder: 'Nombre y apellidos',
                })}
                {field('phone', 'Teléfono', {
                  value: shipping.phone,
                  onChange: updateShipping('phone'),
                  type: 'tel',
                  autoComplete: 'tel',
                  inputMode: 'tel',
                  placeholder: '987 654 321',
                })}
                {field(
                  'address',
                  'Dirección',
                  {
                    value: shipping.address,
                    onChange: updateShipping('address'),
                    autoComplete: 'street-address',
                    placeholder: 'Av., calle, número, dpto.',
                  },
                  'is-full',
                )}
                {field('city', 'Ciudad', {
                  value: shipping.city,
                  onChange: updateShipping('city'),
                  autoComplete: 'address-level1',
                  placeholder: 'Lima',
                })}
                {field('district', 'Distrito', {
                  value: shipping.district,
                  onChange: updateShipping('district'),
                  autoComplete: 'address-level2',
                  placeholder: 'Lince',
                })}
              </div>
            </section>

            <section className="checkout-card" aria-labelledby="checkout-payment-title">
              <h2 id="checkout-payment-title" className="checkout-card__title">
                Método de pago
              </h2>
              <div className="checkout-methods" role="radiogroup" aria-labelledby="checkout-payment-title">
                {paymentMethods.map((pm) => (
                  <label key={pm.id} className={`checkout-method${method === pm.id ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment-method"
                      value={pm.id}
                      checked={method === pm.id}
                      onChange={() => setMethod(pm.id)}
                    />
                    <span className="checkout-method__title">{pm.title}</span>
                    <span className="checkout-method__text">{pm.text}</span>
                  </label>
                ))}
              </div>

              {method === 'card' && (
                <div className="checkout-grid checkout-grid--card">
                  {field(
                    'number',
                    'Número de tarjeta',
                    {
                      value: card.number,
                      onChange: (v) => setCard((c) => ({ ...c, number: formatCardNumber(v) })),
                      autoComplete: 'cc-number',
                      inputMode: 'numeric',
                      placeholder: '0000 0000 0000 0000',
                    },
                    'is-full',
                  )}
                  {field('expiry', 'Vencimiento', {
                    value: card.expiry,
                    onChange: (v) => setCard((c) => ({ ...c, expiry: formatExpiry(v) })),
                    autoComplete: 'cc-exp',
                    inputMode: 'numeric',
                    placeholder: 'MM/AA',
                  })}
                  {field('cvv', 'CVV', {
                    value: card.cvv,
                    onChange: (v) => setCard((c) => ({ ...c, cvv: digitsOf(v).slice(0, 4) })),
                    type: 'password',
                    autoComplete: 'cc-csc',
                    inputMode: 'numeric',
                    placeholder: '•••',
                  })}
                </div>
              )}
              {method === 'wallet' && (
                <p className="checkout-note">Al confirmar te mostraremos un código QR para pagar desde tu billetera.</p>
              )}
              {method === 'cash' && (
                <p className="checkout-note">Pagas en efectivo o con tarjeta cuando recibas tu pedido.</p>
              )}
            </section>
          </div>

          <aside className="checkout-card checkout-summary" aria-labelledby="checkout-summary-title">
            <h2 id="checkout-summary-title" className="checkout-card__title">
              Resumen del pedido
            </h2>

            <div className="checkout-code">
              <input
                className="checkout-input"
                placeholder="Código de descuento"
                aria-label="Código de descuento"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyCode()
                  }
                }}
              />
              <button type="button" className="checkout-btn-outline" onClick={applyCode}>
                Aplicar
              </button>
            </div>
            {codeMessage && (
              <p className={`checkout-code__msg${codeMessage.ok ? ' is-ok' : ''}`} role="status">
                {codeMessage.text}
              </p>
            )}

            <dl className="checkout-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(totals.subtotal)}</dd>
              </div>
              <div>
                <dt>Envío</dt>
                <dd>{totals.shipping === 0 ? 'Gratis' : formatPrice(totals.shipping)}</dd>
              </div>
              <div>
                <dt>Descuento{discount ? ` (${discount.code})` : ''}</dt>
                <dd>{totals.discount > 0 ? `− ${formatPrice(totals.discount)}` : formatPrice(0)}</dd>
              </div>
            </dl>

            <div className="checkout-total">
              <span>Total</span>
              <strong>{formatPrice(totals.total)}</strong>
            </div>

            <button type="submit" className="checkout-btn checkout-pay" disabled={processing}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              {processing ? 'Procesando pago…' : `Pagar ${formatPrice(totals.total)}`}
            </button>

            <p className="checkout-legal">
              Pago protegido. Al confirmar aceptas los <a href="#terminos">Términos y condiciones</a>.
            </p>
          </aside>
        </div>
      </form>

      <GuestCheckoutModal
        open={guestModalOpen}
        itemCount={itemCount}
        total={totals.total}
        onClose={() => setGuestModalOpen(false)}
        onLogin={onLogin}
        onRegister={onRegister}
        onKeepBrowsing={onContinueShopping}
      />
    </div>
  )
}

export default Checkout
