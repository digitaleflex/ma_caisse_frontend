// Service d'authentification pour gérer le token JWT de manière sécurisée en mémoire

const USER_KEY = 'auth_user'

// Stockage en mémoire du token (disparaît au redémarrage de la page)
let accessToken: string | null = null

// Nettoyage de l'ancien token potentiellement présent dans le localStorage (sécurité)
try {
  localStorage.removeItem('auth_token')
} catch (e) {
  // Ignorer erreur si localStorage non dispo
}

export interface User {
  _id: string
  email: string
  firstName: string
  shopName: string
  emailVerified: boolean
  createdAt: string
  phoneNumber?: string
  role: 'user' | 'admin'
  lowStockThreshold?: number
}

export interface AuthData {
  token: string
  user: User
}

/**
 * Définit le token d'accès en mémoire
 */
export function setAccessToken(token: string) {
  accessToken = token
}

/**
 * Récupère le token d'accès depuis la mémoire
 */
export function getAccessToken(): string | null {
  return accessToken
}

/**
 * Stocke les données d'authentification (token en mémoire, user en localStorage)
 */
export function setAuthData(data: AuthData): void {
  try {
    accessToken = data.token
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  } catch (error) {
    console.error('Erreur lors du stockage des données d\'authentification:', error)
  }
}

/**
 * Récupère le token (alias pour compatibilité, mais préférer getAccessToken explicitement)
 */
export function getToken(): string | null {
  return accessToken
}

/**
 * Récupère les données utilisateur depuis localStorage
 */
export function getUser(): User | null {
  try {
    const userStr = localStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error)
    return null
  }
}

/**
 * Récupère toutes les données d'authentification
 */
export function getAuthData(): AuthData | null {
  const token = accessToken
  const user = getUser()

  if (!token || !user) {
    return null
  }

  return { token, user }
}

/**
 * Vérifie si l'utilisateur est authentifié en mémoire
 */
export function isAuthenticated(): boolean {
  return !!accessToken
}

/**
 * Supprime toutes les données d'authentification (déconnexion)
 */
export function clearAuthData(): void {
  try {
    accessToken = null
    localStorage.removeItem(USER_KEY)
  } catch (error) {
    console.error('Erreur lors de la suppression des données d\'authentification:', error)
  }
}

/**
 * Vérifie si le token est expiré (basé sur la structure JWT)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    return payload.exp < currentTime
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error)
    return true
  }
}

/**
 * Vérifie si l'utilisateur est authentifié et que le token n'est pas expiré
 */
export function isAuthenticatedAndValid(): boolean {
  if (!accessToken) return false
  return !isTokenExpired(accessToken)
}