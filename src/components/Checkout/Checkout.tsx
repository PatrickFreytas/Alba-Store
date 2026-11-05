import { useState, type FormEvent, type InputHTMLAttributes } from 'react'
import StoreTopbar from '../StoreTopbar/StoreTopbar'
import { formatPrice } from '../../data/products'
import type { User } from '../../data/auth'
import { MAX_QUANTITY, countItems, getTotals, type CartItem, type ShippingData } from '../../data/cart'
import iconImage from '../../assets/icon-image.svg'
import './Checkout.css'

interface CheckoutProps {
  items: CartItem[]
  user: User | null
  onQuantityChange: (productId: number, quantity: number) => void
  onContinueShopping: () => void
  /** Datos de envío previos, p. ej. al volver desde "Cambiar método". */
  initialShipping?: ShippingData | null
}

type Errors = Partial<Record<keyof ShippingData, string>>

const digitsOf = (value: string) => value.replace(/\D/g, '')

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

function Checkout({
  items,
  user,
  onQuantityChange,
  onContinueShopping,
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
  const [submitted, setSubmitted] = useState(false)

  const itemCount = countItems(items)
  const totals = getTotals(items)

  const shippingErrors = validateShipping(shipping)
  const errors: Errors = submitted ? shippingErrors : {}

  const steps = [
    { label: 'Carrito', done: itemCount > 0 },
    { label: 'Envío', done: Object.keys(shippingErrors).length === 0 },
  ]

  const updateShipping = (field: keyof ShippingData) => (value: string) =>
    setShipping((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
    const firstInvalid = Object.keys(shippingErrors)[0]
    if (firstInvalid) document.getElementById(`checkout-${firstInvalid}`)?.focus()
  }

  const field = (
    name: keyof ShippingData,
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
          </div>

          <aside className="checkout-card checkout-summary" aria-labelledby="checkout-summary-title">
            <h2 id="checkout-summary-title" className="checkout-card__title">
              Resumen del pedido
            </h2>

            <dl className="checkout-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(totals.subtotal)}</dd>
              </div>
              <div>
                <dt>Envío</dt>
                <dd>{totals.shipping === 0 ? 'Gratis' : formatPrice(totals.shipping)}</dd>
              </div>
            </dl>

            <div className="checkout-total">
              <span>Total</span>
              <strong>{formatPrice(totals.total)}</strong>
            </div>

            <button type="submit" className="checkout-btn checkout-pay">
              Continuar al pago
            </button>
          </aside>
        </div>
      </form>
    </div>
  )
}

export default Checkout
