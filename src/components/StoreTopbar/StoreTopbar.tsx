import type { ReactNode } from 'react'
import logoBag from '../../assets/logo-bag-sm.svg'
import './StoreTopbar.css'

interface StoreTopbarProps {
  onLogoClick?: () => void
  center?: ReactNode
  /** Enlace a la derecha, p. ej. "← Seguir comprando" o "Mi cuenta". */
  actionLabel?: string
  onAction?: () => void
}

/** Barra superior simple del flujo de compra (sin buscador). */
function StoreTopbar({ onLogoClick, center, actionLabel, onAction }: StoreTopbarProps) {
  return (
    <header className="store-topbar">
      <button type="button" className="store-topbar__logo" onClick={onLogoClick}>
        <span className="store-topbar__mark">
          <img src={logoBag} width="11.8333" height="15.1667" alt="" />
        </span>
        Alba Store
      </button>
      {center && <div className="store-topbar__center">{center}</div>}
      {actionLabel && (
        <button type="button" className="store-topbar__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </header>
  )
}

export default StoreTopbar
