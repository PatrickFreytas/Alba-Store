import logoBag from '../../assets/logo-bag-sm.svg'
import iconUser from '../../assets/icon-user.svg'
import './Header.css'

interface HeaderProps {
  accountLabel?: string
  onLogoClick?: () => void
  onAccountClick?: () => void
}

function Header({
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
