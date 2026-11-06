import type { ReactNode } from 'react'
import logoBag from '../../assets/logo-bag.svg'
import './AuthLayout.css'

interface AuthPageProps {
  /** Enlace opcional a la derecha de la barra superior (p. ej. "Volver a iniciar sesión"). */
  backLabel?: string
  onBack?: () => void
  children: ReactNode
}

/** Página con barra superior y tarjeta centrada: Recuperar y Nueva contraseña. */
function AuthPage({ backLabel, onBack, children }: AuthPageProps) {
  return (
    <div className="auth auth--page">
      <header className="auth-topbar">
        <div className="auth-logo">
          <div className="auth-logo__mark auth-logo__mark--sm">
            <img src={logoBag} width="13.0167" height="16.6833" alt="" />
          </div>
          <span className="auth-logo__text auth-logo__text--dark">Alba Store</span>
        </div>
        {backLabel && (
          <button type="button" className="auth-link auth-link--bold" onClick={onBack}>
            ← {backLabel}
          </button>
        )}
      </header>

      <main className="auth-main">{children}</main>
    </div>
  )
}

export default AuthPage
