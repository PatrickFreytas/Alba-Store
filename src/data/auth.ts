export interface User {
  id: number
  fullName: string
  email: string
}

async function post<T>(url: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)
  return data as T
}

export function login(email: string, password: string) {
  return post<User>('/api/auth/login', { email, password })
}

export function register(fullName: string, email: string, password: string) {
  return post<User>('/api/auth/register', { fullName, email, password })
}

/** `devResetUrl` solo llega en desarrollo, mientras no haya envío real de correos. */
export function requestPasswordReset(email: string) {
  return post<{ ok: true; devResetUrl?: string }>('/api/auth/forgot-password', { email })
}

export function resetPassword(token: string, password: string) {
  return post<{ ok: true }>('/api/auth/reset-password', { token, password })
}
