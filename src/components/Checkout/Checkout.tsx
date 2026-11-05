import StoreTopbar from '../StoreTopbar/StoreTopbar'
import { formatPrice } from '../../data/products'
import { MAX_QUANTITY, countItems, getTotals, type CartItem } from '../../data/cart'
import iconImage from '../../assets/icon-image.svg'
import './Checkout.css'

interface CheckoutProps {
  items: CartItem[]
  onQuantityChange: (productId: number, quantity: number) => void
  onContinueShopping: () => void
}

function Checkout({
  items,
  onQuantityChange,
  onContinueShopping,
}: CheckoutProps) {

  const itemCount = countItems(items)
  const totals = getTotals(items)

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
        actionLabel="← Seguir comprando"
        onAction={onContinueShopping}
      />

      <div className="checkout__main">
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
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Checkout
