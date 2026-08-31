
import { API_URL } from './config'
import { getAccessToken, setAccessToken, clearAuthData } from './auth'


const getBackendUrl = () => {
  return API_URL
}

export type JoiDetail = { message: string; path: (string | number)[] }

export type ValidationErrorResponse = {
  error: 'Validation error'
  details: JoiDetail[]
}

export type MessageErrorResponse = {
  message: string
  error?: string
}

export type KnownErrorResponse = ValidationErrorResponse | MessageErrorResponse

let isRefreshing = false

/**
 * Tente de rafraîchir le token via le cookie HttpOnly.
 * Réutilisée par l'intercepteur 401 et par authService.refresh.
 * Retourne true en cas de succès, false sinon (jamais d'exception).
 */
export async function refreshToken(): Promise<boolean> {
  try {
    const refreshRes = await fetch(`${getBackendUrl()}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Send the refresh token cookie
    })

    if (!refreshRes.ok) return false

    const refreshData = await refreshRes.json()
    if (!refreshData.token) return false

    // Update token in memory
    setAccessToken(refreshData.token)
    return true
  } catch (e) {
    return false
  }
}

export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const token = getAccessToken()
  const headers = new Headers(init?.headers)
  if (init?.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Prepend backend URL if input is a string starting with /api
  const url = typeof input === 'string' && input.startsWith('/api')
    ? `${getBackendUrl()}${input}`
    : input

  // Le chemin de refresh (pour ne pas redéclencher le refresh sur une 401 du refresh lui-même)
  const isRefreshRequest = typeof input === 'string' && input === '/api/auth/refresh'

  // Include credentials (cookies) for all requests
  const fetchInit: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
  }

  let res = await fetch(url, fetchInit)

  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await res.json().catch(() => ({})) : undefined

  // Handle 401 Unauthorized (Token expired)
  if (res.status === 401 && !isRefreshRequest && !isRefreshing) {
    isRefreshing = true
    try {
      const refreshed = await refreshToken()

      if (!refreshed) {
        // Refresh échoué : session expire, déconnexion propre
        clearAuthData()
        window.location.href = '/'
        throw new Error('AUTH_REFRESH_FAILED')
      }

      // Retry original request with new token
      const freshToken = getAccessToken()
      headers.set('Authorization', `Bearer ${freshToken}`)
      res = await fetch(url, {
        ...fetchInit,
        headers,
      })

      const newBody = isJson ? await res.json().catch(() => ({})) : undefined
      if (!res.ok) {
        const err: any = new Error('APIError')
        err.status = res.status
        err.body = newBody
        throw err
      }
      return newBody
    } finally {
      isRefreshing = false
    }
  }

  if (!res.ok) {
    const err: any = new Error('APIError')
    err.status = res.status
    err.body = body
    throw err
  }

  return body
}

// Maps backend validation errors to react-hook-form setError calls
export function applyServerValidationErrors<TFieldValues>(
  setError: (name: any, error: { type?: string; message?: string }) => void,
  server: unknown,
) {
  const payload = server as KnownErrorResponse | undefined
  if (!payload) return

  if ((payload as ValidationErrorResponse).error === 'Validation error') {
    const details = (payload as ValidationErrorResponse).details || []
    for (const d of details) {
      const field = Array.isArray(d.path) && d.path.length ? String(d.path[0]) : 'root'
      setError(field as any, { type: 'server', message: d.message })
    }
    return
  }

  if ((payload as MessageErrorResponse).message) {
    setError('root' as any, { type: 'server', message: (payload as MessageErrorResponse).message })
  }
}

