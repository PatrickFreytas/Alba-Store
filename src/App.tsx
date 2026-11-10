import { useState } from 'react'
import Login from './components/Login/Login'
import { login, type User } from './data/auth'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  if (user) {
    return (
      <main style={{ padding: 32 }}>
        <p>Hola, {user.fullName}. Aquí se mostrará el catálogo.</p>
        <button type="button" onClick={() => setUser(null)}>
          Cerrar sesión
        </button>
      </main>
    )
  }

  return (
    <Login
      error={authError}
      submitting={submitting}
      onSubmit={({ email, password }) => authenticate(() => login(email, password))}
    />
  )
}

export default App
