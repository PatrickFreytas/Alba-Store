import logoBag from '../../assets/logo-bag-sm.svg'
import iconSearch from '../../assets/icon-search.svg'
import iconUser from '../../assets/icon-user.svg'
import iconCart from '../../assets/icon-cart.svg'
import './Header.css'

interface HeaderProps {
  search: string
  onSearchChange: (value: string) => void
  cartCount: number
  accountLabel?: string
  onLogoClick?: () => void
  onAccountClick?: () => void
  onCartClick?: () => void
}

function Header({
  search,
  onSearchChange,
  cartCount,
  accountLabel = 'Mi cuenta',
  onLogoClick,
  onAccountClick,
  onCartClick,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header__inner">
        <button type="button" className="header-logo" onClick={onLogoClick}>
          <span className="header-logo__mark">
            <img src={logoBag} width="11.8333" height="15.1667" alt="" />
          </span>
          Alba Store
        </button>

        <label className="header-search">
          <img src={iconSearch} width="13.5" height="13.5" alt="" />
          <input
            type="search"
            placeholder="Buscar productos, marcas o categorías"
            aria-label="Buscar productos"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>

        <nav className="header-nav">
          <button type="button" className="header-account" onClick={onAccountClick}>
            <img src={iconUser} width="15.0005" height="15.8336" alt="" />
            {accountLabel}
          </button>
          <button type="button" className="header-cart" onClick={onCartClick}>
            <img src={iconCart} width="16.6667" height="16.25" alt="" />
            Carrito
            {cartCount > 0 && (
              <span className="header-cart__count" aria-label={`${cartCount} productos`}>
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
