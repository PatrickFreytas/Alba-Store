import { useState } from 'react'
import Login from './components/Login/Login'
import Register from './components/Register/Register'
import { login, register, type User } from './data/auth'

type View = 'login' | 'register'

function App() {
  const [view, setView] = useState<View>('login')
  const [user, setUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const goTo = (next: View) => {
    setAuthError(null)
    setView(next)
  }

  const authenticate = async (request: () => Promise<User>) => {
    setSubmitting(true)
    setAuthError(null)
    try {
      setUser(await request())
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

  return (
    <Login
      error={authError}
      submitting={submitting}
      onSubmit={({ email, password }) => authenticate(() => login(email, password))}
      onRegister={() => goTo('register')}
    />
  )
}

export default App
