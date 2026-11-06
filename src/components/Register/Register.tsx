import { useState, type FormEvent } from 'react'
import AuthLayout from '../AuthLayout/AuthLayout'
import iconEye from '../../assets/icon-eye.svg'
import iconCheck from '../../assets/icon-check.svg'
import './Register.css'

export interface RegisterData {
  fullName: string
  email: string
  password: string
}

interface RegisterProps {
  onSubmit?: (data: RegisterData) => void
  onLogin?: () => void
  onTerms?: () => void
  onPrivacy?: () => void
  error?: string | null
  submitting?: boolean
}

const benefits = [
  'Seguimiento de tus pedidos',
  'Lista de favoritos',
  'Direcciones guardadas para tu próxima compra',
]

const MIN_PASSWORD_LENGTH = 12

// 0–4: longitud mínima, letras, números y mayúsculas/símbolos
function getPasswordStrength(password: string) {
  if (!password) return 0
  let score = 0
  if (password.length >= MIN_PASSWORD_LENGTH) score++
  if (/[a-zA-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[A-Z]/.test(password) && /[^a-zA-Z0-9]/.test(password)) score++
  return score
}

function Register({ onSubmit, onLogin, onTerms, onPrivacy, error, submitting = false }: RegisterProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const strength = getPasswordStrength(password)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit?.({ fullName, email, password })
  }

  return (
    <AuthLayout
      title="Crea tu cuenta gratis."
      description="Guarda tus favoritos, compra más rápido y sigue tus pedidos desde un solo lugar."
      footer={
        <ul className="register-benefits">
          {benefits.map((benefit) => (
            <li key={benefit} className="register-benefit">
              <img src={iconCheck} width="12.375" height="9" alt="" />
              {benefit}
            </li>
          ))}
        </ul>
      }
    >
      <form className="auth-card auth-card--wide" onSubmit={handleSubmit}>
        <header className="auth-card__header">
          <h2 className="auth-card__title">Crear cuenta</h2>
          <p className="auth-card__subtitle">Completa tus datos para registrarte.</p>
        </header>

        <div className="auth-field">
          <label htmlFor="register-name" className="auth-label">
            Nombre completo
          </label>
          <div className="auth-input">
            <input
              id="register-name"
              type="text"
              placeholder="Nombre y apellidos"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="register-email" className="auth-label">
            Correo electrónico
          </label>
          <div className="auth-input">
            <input
              id="register-email"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="register-password" className="auth-label">
            Contraseña
          </label>
          <div className="auth-input">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="register-password-hint"
              required
            />
            <button
              type="button"
              className="auth-input__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
            >
              <img src={iconEye} width="18.3333" height="13.3333" alt="" />
            </button>
          </div>
          <div className="register-strength" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={i < strength ? 'is-active' : undefined} />
            ))}
          </div>
          <p id="register-password-hint" className="register-hint">
            Usa al menos {MIN_PASSWORD_LENGTH} caracteres, con letras y números.
          </p>
        </div>

        <label className="auth-check register-terms">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            required
          />
          <span className="auth-check__box" aria-hidden="true" />
          <span>
            Acepto los{' '}
            <button type="button" className="auth-link auth-link--bold" onClick={onTerms}>
              Términos y condiciones
            </button>{' '}
            y la{' '}
            <button type="button" className="auth-link auth-link--bold" onClick={onPrivacy}>
              Política de privacidad
            </button>
            .
          </span>
        </label>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="auth-btn" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>

        <p className="auth-foot">
          ¿Ya tienes cuenta?{' '}
          <button type="button" className="auth-link auth-link--bold" onClick={onLogin}>
            Inicia sesión
          </button>
        </p>
      </form>
    </AuthLayout>
  )
}

export default Register
