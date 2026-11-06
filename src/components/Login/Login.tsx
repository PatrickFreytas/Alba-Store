import { useState, type FormEvent } from 'react'
import AuthLayout from '../AuthLayout/AuthLayout'
import iconEye from '../../assets/icon-eye.svg'
import './Login.css'

export interface LoginCredentials {
  email: string
  password: string
  remember: boolean
}

interface LoginProps {
  onSubmit?: (credentials: LoginCredentials) => void
  onForgotPassword?: () => void
  onRegister?: () => void
  error?: string | null
  /** Mensaje informativo, p. ej. tras cambiar la contraseña. */
  notice?: string | null
  submitting?: boolean
}

const perks = ['Envío a todo el país', 'Pago seguro', 'Devoluciones fáciles']

function Login({ onSubmit, onForgotPassword, onRegister, error, notice, submitting = false }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit?.({ email, password, remember })
  }

  return (
    <AuthLayout
      title="Todo lo que buscas, en un solo lugar."
      description="Inicia sesión para ver tu carrito, seguir tus pedidos y comprar en pocos pasos."
      footer={
        <ul className="login-perks">
          {perks.map((perk) => (
            <li key={perk} className="login-perk">
              {perk}
            </li>
          ))}
        </ul>
      }
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <header className="auth-card__header">
          <h2 className="auth-card__title">Iniciar sesión</h2>
          <p className="auth-card__subtitle">Bienvenido de nuevo. Ingresa tus datos.</p>
        </header>

        {notice && (
          <p className="auth-notice" role="status">
            {notice}
          </p>
        )}

        <div className="auth-field">
          <label htmlFor="login-email" className="auth-label">
            Correo electrónico
          </label>
          <div className="auth-input">
            <input
              id="login-email"
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
          <div className="auth-field__top">
            <label htmlFor="login-password" className="auth-label">
              Contraseña
            </label>
            <button type="button" className="auth-link" onClick={onForgotPassword}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="auth-input">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </div>

        <label className="auth-check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span className="auth-check__box" aria-hidden="true" />
          Recordarme en este dispositivo
        </label>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="auth-btn" disabled={submitting}>
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>

        <p className="auth-foot">
          ¿No tienes cuenta?{' '}
          <button type="button" className="auth-link auth-link--bold" onClick={onRegister}>
            Regístrate gratis
          </button>
        </p>
      </form>
    </AuthLayout>
  )
}

export default Login
