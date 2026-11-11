import type { ReactNode } from 'react'
import type { User } from '../../data/auth'
import logoBag from '../../assets/logo-bag-sm.svg'
import iconCart from '../../assets/icon-cart.svg'
import '../Header/Header.css'
import './Account.css'

export type AccountSection = 'orders' | 'favorites'

interface AccountLayoutProps {
  user: User | null
  active: AccountSection
  favoritesCount: number
  cartCount: number
  onCatalog: () => void
  onCart: () => void
  onNavigate: (section: AccountSection) => void
  onLogout: () => void
  onLogin: () => void
  children: ReactNode
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

/** Pantallas de "Mi cuenta": barra superior y menú lateral (diseño "Mis-favoritos"). */
function AccountLayout({
  user,
  active,
  favoritesCount,
  cartCount,
  onCatalog,
  onCart,
  onNavigate,
  onLogout,
  onLogin,
  children,
}: AccountLayoutProps) {
  const items: { id: AccountSection; label: string; count?: number }[] = [
    { id: 'orders', label: 'Mis pedidos' },
    { id: 'favorites', label: 'Favoritos', count: favoritesCount },
  ]

  return (
    <div className="account">
      <header className="account-topbar">
        <button type="button" className="account-topbar__logo" onClick={onCatalog}>
          <span className="account-topbar__mark">
            <img src={logoBag} width="11.8333" height="15.1667" alt="" />
          </span>
          Alba Store
        </button>
        <nav className="account-topbar__nav">
          <button type="button" className="account-topbar__link" onClick={onCatalog}>
            Catálogo
          </button>
          <button type="button" className="header-cart" onClick={onCart}>
            <img src={iconCart} width="16.6667" height="16.25" alt="" />
            Carrito
            {cartCount > 0 && (
              <span className="header-cart__count" aria-label={`${cartCount} productos`}>
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      </header>

      <div className="account__layout">
        <aside className="account-menu">
          <div className="account-menu__profile">
            <span className="account-menu__avatar" aria-hidden="true">
              {user ? initials(user.fullName) : '?'}
            </span>
            <div className="account-menu__who">
              <strong>{user ? user.fullName : 'Invitado'}</strong>
              <span>{user ? user.email : 'Sin sesión iniciada'}</span>
            </div>
          </div>

          <nav className="account-menu__nav" aria-label="Mi cuenta">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`account-menu__item${active === item.id ? ' is-active' : ''}`}
                aria-current={active === item.id ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
                {item.count !== undefined && item.count > 0 && <span className="account-menu__count">{item.count}</span>}
              </button>
            ))}
            {/* Aún sin pantalla: se muestran como en el diseño, pero deshabilitadas */}
            {['Direcciones', 'Datos personales'].map((label) => (
              <button key={label} type="button" className="account-menu__item" disabled>
                {label}
                <span className="account-menu__soon">Pronto</span>
              </button>
            ))}
            {user ? (
              <button type="button" className="account-menu__item" onClick={onLogout}>
                Cerrar sesión
              </button>
            ) : (
              <button type="button" className="account-menu__item account-menu__item--login" onClick={onLogin}>
                Iniciar sesión
              </button>
            )}
          </nav>
        </aside>

        <main className="account__content">{children}</main>
      </div>
    </div>
  )
}

export default AccountLayout
