import { useState, type FormEvent } from 'react'
import AuthPage from '../AuthLayout/AuthPage'
import iconEye from '../../assets/icon-eye.svg'

const MIN_PASSWORD_LENGTH = 12

interface ResetPasswordProps {
  onSubmit: (password: string) => Promise<void>
  onRequestNewLink?: () => void
}

function CheckIcon({ met }: { met: boolean }) {
  return met ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

function ResetPassword({ onSubmit, onRequestNewLink }: ResetPasswordProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rules = [
    { label: `Al menos ${MIN_PASSWORD_LENGTH} caracteres`, met: password.length >= MIN_PASSWORD_LENGTH },
    { label: 'Letras y números', met: /[a-zA-Z]/.test(password) && /\d/.test(password) },
    { label: 'Ambas contraseñas coinciden', met: password.length > 0 && password === confirm },
  ]
  const allMet = rules.every((rule) => rule.met)
  const linkExpired = error?.includes('expiró') ?? false

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!allMet) {
      setError('Revisa que la contraseña cumpla todos los requisitos.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(password)
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <AuthPage>
      <form className="auth-card auth-card--page" onSubmit={handleSubmit}>
        <header className="auth-card__header">
          <h2 className="auth-card__title">Crea una nueva contraseña</h2>
          <p className="auth-card__subtitle">
            Debe ser diferente a la anterior y tener al menos {MIN_PASSWORD_LENGTH} caracteres.
          </p>
        </header>

        <div className="auth-field">
          <label htmlFor="reset-password" className="auth-label">
            Nueva contraseña
          </label>
          <div className="auth-input">
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
            <button
              type="button"
              className="auth-input__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
              aria-pressed={showPassword}
            >
              <img src={iconEye} width="18.3333" height="13.3333" alt="" />
            </button>
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="reset-confirm" className="auth-label">
            Confirmar contraseña
          </label>
          <div className="auth-input">
            <input
              id="reset-confirm"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
        </div>

        <ul className="auth-checklist" aria-label="Requisitos de la contraseña">
          {rules.map((rule) => (
            <li key={rule.label} className={rule.met ? 'is-met' : undefined}>
              <CheckIcon met={rule.met} />
              {rule.label}
              <span className="sr-only">{rule.met ? ' (cumplido)' : ' (pendiente)'}</span>
            </li>
          ))}
        </ul>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="auth-btn" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Guardar contraseña'}
        </button>

        {linkExpired && (
          <p className="auth-foot">
            <button type="button" className="auth-link auth-link--bold" onClick={onRequestNewLink}>
              Solicitar un nuevo enlace
            </button>
          </p>
        )}
      </form>
    </AuthPage>
  )
}

export default ResetPassword
