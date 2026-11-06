import { useState, type FormEvent } from 'react'
import AuthPage from '../AuthLayout/AuthPage'

interface ForgotPasswordProps {
  onSubmit: (email: string) => Promise<{ devResetUrl?: string }>
  onLogin?: () => void
}

function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.33" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.33" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  )
}

function ForgotPassword({ onSubmit, onLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<{ devResetUrl?: string } | null>(null)

  const send = async () => {
    setSubmitting(true)
    setError(null)
    try {
      setSent(await onSubmit(email.trim()))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    void send()
  }

  return (
    <AuthPage backLabel="Volver a iniciar sesión" onBack={onLogin}>
      {sent ? (
        <section className="auth-card auth-card--page" aria-live="polite">
          <div className="auth-card__icon">
            <MailIcon />
          </div>
          <header className="auth-card__header">
            <h2 className="auth-card__title">Revisa tu correo</h2>
            <p className="auth-card__subtitle">
              Si <strong>{email.trim()}</strong> tiene una cuenta en Alba Store, te enviamos un enlace para crear una
              nueva contraseña. El enlace vence en 1 hora.
            </p>
          </header>

          {sent.devResetUrl && (
            <p className="auth-notice">
              Modo desarrollo (aún no se envían correos):{' '}
              <a className="auth-dev-link" href={sent.devResetUrl}>
                abrir el enlace de recuperación
              </a>
            </p>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="button" className="auth-btn" onClick={onLogin}>
            Volver a iniciar sesión
          </button>

          <p className="auth-foot">
            ¿No te llegó?{' '}
            <button type="button" className="auth-link auth-link--bold" onClick={send} disabled={submitting}>
              {submitting ? 'Reenviando…' : 'Reenviar enlace'}
            </button>
          </p>
        </section>
      ) : (
        <form className="auth-card auth-card--page" onSubmit={handleSubmit}>
          <div className="auth-card__icon">
            <LockIcon />
          </div>
          <header className="auth-card__header">
            <h2 className="auth-card__title">¿Olvidaste tu contraseña?</h2>
            <p className="auth-card__subtitle">
              Ingresa el correo de tu cuenta y te enviaremos un enlace para crear una nueva.
            </p>
          </header>

          <div className="auth-field">
            <label htmlFor="forgot-email" className="auth-label">
              Correo electrónico
            </label>
            <div className="auth-input">
              <input
                id="forgot-email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-btn" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar enlace'}
          </button>

          <p className="auth-foot">
            ¿La recordaste?{' '}
            <button type="button" className="auth-link auth-link--bold" onClick={onLogin}>
              Inicia sesión
            </button>
          </p>
        </form>
      )}
    </AuthPage>
  )
}

export default ForgotPassword
