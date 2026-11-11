import logoBag from '../../assets/logo-bag-sm.svg'
import iconSearch from '../../assets/icon-search.svg'
import iconUser from '../../assets/icon-user.svg'
import './Header.css'

interface HeaderProps {
  search: string
  onSearchChange: (value: string) => void
  accountLabel?: string
  onLogoClick?: () => void
  onAccountClick?: () => void
}

function Header({
  search,
  onSearchChange,
  accountLabel = 'Mi cuenta',
  onLogoClick,
  onAccountClick,
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
        </nav>
      </div>
    </header>
  )
}

export default Header
