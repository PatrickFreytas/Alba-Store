import { useEffect, useRef } from 'react'
import { formatPrice } from '../../data/products'

interface GuestCheckoutModalProps {
  open: boolean
  itemCount: number
  total: number
  onClose: () => void
  onLogin: () => void
  onRegister: () => void
  onKeepBrowsing: () => void
}

/** "Invitado al pagar": pide iniciar sesión antes de pagar. Usa <dialog> para el foco y la tecla Esc. */
function GuestCheckoutModal({ open, itemCount, total, onClose, onLogin, onRegister, onKeepBrowsing }: GuestCheckoutModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="guest-modal"
      aria-labelledby="guest-modal-title"
      onClose={onClose}
      onClick={(e) => {
        // Clic en el fondo oscuro
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="guest-modal__body">
        <div className="guest-modal__top">
          <span className="guest-modal__icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </span>
          <button type="button" className="guest-modal__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <h2 id="guest-modal-title" className="guest-modal__title">
          Inicia sesión para continuar
        </h2>
        <p className="guest-modal__text">
          Estás comprando como invitado. Para pagar necesitas una cuenta. Tu carrito se guardará al iniciar sesión.
        </p>

        <div className="guest-modal__cart">
          <span>
            Tu carrito · {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </span>
          <strong>{formatPrice(total)}</strong>
        </div>

        <button type="button" className="checkout-btn" onClick={onLogin} autoFocus>
          Iniciar sesión
        </button>
        <button type="button" className="checkout-btn-outline guest-modal__secondary" onClick={onRegister}>
          Crear cuenta gratis
        </button>
        <button type="button" className="checkout-link guest-modal__browse" onClick={onKeepBrowsing}>
          Seguir explorando como invitado
        </button>
      </div>
    </dialog>
  )
}

export default GuestCheckoutModal
