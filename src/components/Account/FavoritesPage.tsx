import { useEffect, useRef, useState } from 'react'
import { fetchProducts, formatPrice, type Product } from '../../data/products'
import iconImage from '../../assets/icon-image.svg'
import './Favorites.css'

interface FavoritesPageProps {
  favoriteIds: number[]
  onToggleFavorite: (id: number) => void
  onAddToCart: (product: Product) => void
  onCatalog: () => void
}

const HeartIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 21s-9-5.7-9-12.2A5 5 0 0 1 12 6a5 5 0 0 1 9 2.8C21 15.3 12 21 12 21z" />
  </svg>
)

/** "Mis favoritos": productos guardados con el corazón del catálogo. */
function FavoritesPage({ favoriteIds, onToggleFavorite, onAddToCart, onCatalog }: FavoritesPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [addedId, setAddedId] = useState<number | null>(null)
  const addedTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const controller = new AbortController()
    fetchProducts(controller.signal)
      .then((data) => {
        setProducts(data)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        console.error(error)
        setStatus('error')
      })
    return () => controller.abort()
  }, [])

  useEffect(() => () => window.clearTimeout(addedTimer.current), [])

  const favorites = products.filter((p) => favoriteIds.includes(p.id))

  const add = (product: Product) => {
    onAddToCart(product)
    setAddedId(product.id)
    window.clearTimeout(addedTimer.current)
    addedTimer.current = window.setTimeout(() => setAddedId(null), 1600)
  }

  const count = status === 'ready' ? favorites.length : favoriteIds.length

  return (
    <>
      <div className="account-head">
        <div>
          <h1 className="account-head__title">Mis favoritos</h1>
          <p className="account-head__sub">
            {count} {count === 1 ? 'producto guardado' : 'productos guardados'}
          </p>
        </div>
      </div>

      {status === 'loading' && favoriteIds.length > 0 ? (
        <p className="favorites-status">Cargando tus favoritos…</p>
      ) : status === 'error' ? (
        <p className="favorites-status">No se pudieron cargar los productos. Verifica que la API esté encendida.</p>
      ) : favorites.length === 0 ? (
        <section className="account-empty">
          <span className="account-empty__icon is-heart" aria-hidden="true">
            <HeartIcon size={32} />
          </span>
          <h2 className="account-empty__title">Aún no tienes favoritos</h2>
          <p className="account-empty__text">
            Toca el corazón de cualquier producto del catálogo para guardarlo aquí y encontrarlo rápido.
          </p>
          <button type="button" className="account-btn" onClick={onCatalog}>
            Explorar catálogo
          </button>
        </section>
      ) : (
        <ul className="favorites-grid">
          {favorites.map((product) => (
            <li key={product.id} className="favorite-card">
              <div className="favorite-card__media" style={{ background: product.imageBg }}>
                {product.image ? (
                  <img className="favorite-card__image" src={product.image} alt="" />
                ) : (
                  <img src={iconImage} width="35.75" height="32.0833" alt="" />
                )}
                <button
                  type="button"
                  className="favorite-card__fav"
                  onClick={() => onToggleFavorite(product.id)}
                  aria-label={`Quitar ${product.name} de favoritos`}
                >
                  <HeartIcon />
                </button>
              </div>
              <div className="favorite-card__body">
                <span className="favorite-card__category">{product.category}</span>
                <h2 className="favorite-card__name">{product.name}</h2>
                <span className={`favorite-card__stock${product.inStock ? '' : ' is-out'}`}>
                  {product.inStock ? 'En stock' : 'Agotado'}
                </span>
                <div className="favorite-card__footer">
                  <span className="favorite-card__price">{formatPrice(product.price)}</span>
                  {product.inStock ? (
                    <button
                      type="button"
                      className={`favorite-card__add${addedId === product.id ? ' is-added' : ''}`}
                      onClick={() => add(product)}
                    >
                      {addedId === product.id ? 'Agregado ✓' : 'Agregar'}
                    </button>
                  ) : (
                    <button type="button" className="favorite-card__add" disabled>
                      Agotado
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="sr-only" role="status">
        {addedId !== null ? 'Producto agregado al carrito' : ''}
      </p>
    </>
  )
}

export default FavoritesPage
