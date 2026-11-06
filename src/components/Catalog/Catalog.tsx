import { useEffect, useMemo, useState } from 'react'
import Header from '../Header/Header'
import ProductCard from '../ProductCard/ProductCard'
import { categories, fetchProducts, type Category, type Product } from '../../data/products'
import type { User } from '../../data/auth'
import iconChevronDown from '../../assets/icon-chevron-down.svg'
import iconCheckmark from '../../assets/icon-checkmark.svg'
import './Catalog.css'

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating'

const priceRanges = [
  { id: 'lt100', label: 'Hasta S/ 100', test: (p: number) => p <= 100 },
  { id: '100-300', label: 'S/ 100 – S/ 300', test: (p: number) => p > 100 && p <= 300 },
  { id: 'gt300', label: 'Más de S/ 300', test: (p: number) => p > 300 },
]

const PAGE_SIZE = 8

interface CatalogProps {
  user: User | null
  onAccountClick?: () => void
}

function Catalog({
  user,
  onAccountClick,
}: CatalogProps) {
  const [category, setCategory] = useState<Category | null>(null)
  const [selectedPrices, setSelectedPrices] = useState<string[]>([])
  const [inStockOnly, setInStockOnly] = useState(true)
  const [fastShippingOnly, setFastShippingOnly] = useState(false)
  const [sort, setSort] = useState<SortOption>('relevance')
  const [page, setPage] = useState(1)
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

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const filtered = useMemo(() => {
    const result = products.filter((p) => {
      if (category && p.category !== category) return false
      if (selectedPrices.length && !priceRanges.some((r) => selectedPrices.includes(r.id) && r.test(p.price))) return false
      if (inStockOnly && !p.inStock) return false
      if (fastShippingOnly && !p.fastShipping) return false
      return true
    })
    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') result.sort((a, b) => b.price - a.price)
    if (sort === 'rating') result.sort((a, b) => b.rating - a.rating)
    return result
  }, [products, category, selectedPrices, inStockOnly, fastShippingOnly, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const togglePrice = (id: string) => {
    setSelectedPrices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    setPage(1)
  }

  const countFor = (c: Category | null) => (c ? products.filter((p) => p.category === c).length : products.length)

  return (
    <div className="catalog">
      <Header
        accountLabel={user ? user.fullName.split(' ')[0] : 'Mi cuenta'}
        onLogoClick={() => {
          setCategory(null)
          setPage(1)
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
                  onClick={() => resetPage(setCategory)(c)}
                  aria-pressed={category === c}
                >
                  {c ?? 'Todos'}
                  <span>{countFor(c)}</span>
                </button>
              ))}
            </div>

            <div className="catalog-filters__group">
              <h2 className="catalog-filters__title">Precio</h2>
              {priceRanges.map((range) => (
                <label key={range.id} className="catalog-check">
                  <input
                    type="checkbox"
                    checked={selectedPrices.includes(range.id)}
                    onChange={() => togglePrice(range.id)}
                  />
                  <span className="catalog-check__box" aria-hidden="true">
                    <img src={iconCheckmark} width="12" height="9" alt="" />
                  </span>
                  {range.label}
                </label>
              ))}
            </div>

            <div className="catalog-filters__group">
              <h2 className="catalog-filters__title">Disponibilidad</h2>
              <label className="catalog-check">
                <input type="checkbox" checked={inStockOnly} onChange={(e) => resetPage(setInStockOnly)(e.target.checked)} />
                <span className="catalog-check__box" aria-hidden="true">
                  <img src={iconCheckmark} width="12" height="9" alt="" />
                </span>
                En stock
              </label>
              <label className="catalog-check">
                <input
                  type="checkbox"
                  checked={fastShippingOnly}
                  onChange={(e) => resetPage(setFastShippingOnly)(e.target.checked)}
                />
                <span className="catalog-check__box" aria-hidden="true">
                  <img src={iconCheckmark} width="12" height="9" alt="" />
                </span>
                Envío en 24 h
              </label>
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
              <label className="catalog-sort">
                Ordenar por
                <span className="catalog-sort__select">
                  <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}>
                    <option value="relevance">Más relevantes</option>
                    <option value="price-asc">Menor precio</option>
                    <option value="price-desc">Mayor precio</option>
                    <option value="rating">Mejor valorados</option>
                  </select>
                  <img src={iconChevronDown} width="12" height="7" alt="" />
                </span>
              </label>
            </div>

            {status === 'loading' ? (
              <p className="catalog-empty">Cargando productos…</p>
            ) : status === 'error' ? (
              <p className="catalog-empty">No se pudieron cargar los productos. Verifica que la API esté encendida.</p>
            ) : pageItems.length > 0 ? (
              <div className="catalog-grid">
                {pageItems.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <p className="catalog-empty">No encontramos productos con esos filtros.</p>
            )}

            <nav className="catalog-pagination" aria-label="Paginación">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Página anterior"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n === currentPage ? 'is-active' : undefined}
                  onClick={() => setPage(n)}
                  aria-current={n === currentPage ? 'page' : undefined}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Página siguiente"
              >
                ›
              </button>
            </nav>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Catalog
