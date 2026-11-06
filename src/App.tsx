import { useState } from 'react'
import Login from './components/Login/Login'
import Register from './components/Register/Register'
import ForgotPassword from './components/ForgotPassword/ForgotPassword'
import ResetPassword from './components/ResetPassword/ResetPassword'
import { login, register, requestPasswordReset, resetPassword, type User } from './data/auth'

type View = 'login' | 'register' | 'forgot' | 'reset'

// El enlace del correo de recuperación llega como /?reset=<token>
const initialResetToken = new URLSearchParams(window.location.search).get('reset')

function App() {
  const [view, setView] = useState<View>(initialResetToken ? 'reset' : 'login')
  const [resetToken, setResetToken] = useState(initialResetToken)
  const [user, setUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const goTo = (next: View) => {
    setAuthError(null)
    setNotice(null)
    if (next !== 'reset' && resetToken) {
      // Quita el token de la URL para que no quede en el historial
      window.history.replaceState(null, '', window.location.pathname)
      setResetToken(null)
    }
    setView(next)
  }

  const authenticate = async (request: () => Promise<User>) => {
    setSubmitting(true)
    setAuthError(null)
    try {
      setUser(await request())
      setNotice(null)
    } catch (error) {
      setAuthError((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const logout = () => {
    setUser(null)
    goTo('login')
  }

  if (user) {
    return (
      <main style={{ padding: 32 }}>
        <p>Hola, {user.fullName}. Aquí se mostrará el catálogo.</p>
        <button type="button" onClick={logout}>
          Cerrar sesión
        </button>
      </main>
    )
  }

  if (view === 'register') {
    return (
      <Register
        error={authError}
        submitting={submitting}
        onSubmit={({ fullName, email, password }) => authenticate(() => register(fullName, email, password))}
        onLogin={() => goTo('login')}
      />
    )
  }

  if (view === 'forgot') {
    return <ForgotPassword onSubmit={requestPasswordReset} onLogin={() => goTo('login')} />
  }

  if (view === 'reset' && resetToken) {
    return (
      <ResetPassword
        onSubmit={async (password) => {
          await resetPassword(resetToken, password)
          goTo('login')
          setNotice('Tu contraseña se actualizó. Ya puedes iniciar sesión con la nueva.')
        }}
        onRequestNewLink={() => goTo('forgot')}
      />
    )
  }

  return (
    <Login
      error={authError}
      notice={notice}
      submitting={submitting}
      onSubmit={({ email, password }) => authenticate(() => login(email, password))}
      onForgotPassword={() => goTo('forgot')}
      onRegister={() => goTo('register')}
    />
  )
}

export default App
