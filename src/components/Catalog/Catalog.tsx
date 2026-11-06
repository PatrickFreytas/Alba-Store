import { useEffect, useMemo, useState } from 'react'
import Header from '../Header/Header'
import ProductCard from '../ProductCard/ProductCard'
import { categories, fetchProducts, type Category, type Product } from '../../data/products'
import type { User } from '../../data/auth'
import './Catalog.css'

interface CatalogProps {
  user: User | null
  onAccountClick?: () => void
}

function Catalog({
  user,
  onAccountClick,
}: CatalogProps) {
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

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

  const filtered = useMemo(() => {
    const result = products.filter((p) => {
      if (category && p.category !== category) return false
      return true
    })
    return result
  }, [products, category])

  const countFor = (c: Category | null) => (c ? products.filter((p) => p.category === c).length : products.length)

  return (
    <div className="catalog">
      <Header
        accountLabel={user ? user.fullName.split(' ')[0] : 'Mi cuenta'}
        onLogoClick={() => {
          setCategory(null)
        }}
        onAccountClick={onAccountClick}
      />

      <main className="catalog__main">
        <section className="catalog-banner">
          <div>
            <span className="catalog-banner__eyebrow">Temporada nueva</span>
            <h1 className="catalog-banner__title">Descubre lo nuevo del catálogo</h1>
            <p className="catalog-banner__text">Envío gratis en compras desde S/ 199.</p>
          </div>
          <a href="#productos" className="catalog-banner__cta">
            Ver productos
          </a>
        </section>

        <div className="catalog__layout" id="productos">
          <aside className="catalog-filters">
            <div className="catalog-filters__group">
              <h2 className="catalog-filters__title">Categorías</h2>
              {[null, ...categories].map((c) => (
                <button
                  key={c ?? 'all'}
                  type="button"
                  className={`catalog-category${category === c ? ' is-active' : ''}`}
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                >
                  {c ?? 'Todos'}
                  <span>{countFor(c)}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="catalog-results">
            <div className="catalog-results__head">
              <div>
                <h2 className="catalog-results__title">{category ?? 'Todos los productos'}</h2>
                <p className="catalog-results__count">
                  {filtered.length} {filtered.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                </p>
              </div>
            </div>

            {status === 'loading' ? (
              <p className="catalog-empty">Cargando productos…</p>
            ) : status === 'error' ? (
              <p className="catalog-empty">No se pudieron cargar los productos. Verifica que la API esté encendida.</p>
            ) : filtered.length > 0 ? (
              <div className="catalog-grid">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <p className="catalog-empty">No encontramos productos con esos filtros.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default Catalog
