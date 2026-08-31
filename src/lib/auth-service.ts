/**
 * Service d'authentification centralisé
 * Utilise les fonctions low-level from auth.ts
 */

import { apiFetch } from './api'
import { 
  setAccessToken, 
  getAccessToken, 
  setAuthData, 
  getAuthData, 
  clearAuthData, 
  getUser, 
  isAuthenticatedAndValid 
} from './auth'

export interface LoginPayload {
  email: string
  password: string
}

export interface OtpRequestPayload {
  firstName: string
  shopName: string
  email: string
  phoneNumber: string
}

export interface OtpVerifyPayload {
  email: string
  code: string
}

export interface SetPasswordPayload {
  email: string
  password: string
  setupToken: string
}

export interface PasswordResetRequestPayload {
  email: string
}

export interface PasswordResetPayload {
  email: string
  code: string
  password: string
}

export interface UpdateProfilePayload {
  firstName: string
  shopName: string
  phoneNumber?: string
  lowStockThreshold?: number
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface EmailChangeRequestPayload {
  currentPassword: string
  newEmail: string
}

export interface EmailChangeConfirmPayload {
  newEmail: string
  code: string
}

export interface AuthResponse {
  token: string
  user: import('./auth').User
}

export interface OtpVerifyResponse {
  setupToken: string
}

export interface RefreshTokenResponse {
  token: string
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    // Store auth data after successful login
    if (response && response.token && response.user) {
      setAuthData({ token: response.token, user: response.user })
    }
    return response as AuthResponse
  },

  async logout(): Promise<void> {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    clearAuthData()
  },

  async refresh(): Promise<AuthResponse | null> {
    try {
      const response = await apiFetch('/api/auth/refresh', {
        method: 'POST',
      })
      if (response && response.token) {
        setAccessToken(response.token)
        // Re-establish auth data with new token
        const user = getUser()
        if (user) {
          setAuthData({ token: response.token, user })
        }
      }
      return response ? (response as AuthResponse) : null
    } catch (error) {
      clearAuthData()
      return null
    }
  },

  async requestOtp(payload: OtpRequestPayload): Promise<void> {
    await apiFetch('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async verifyOtp(payload: OtpVerifyPayload): Promise<OtpVerifyResponse> {
    const response = await apiFetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return response as OtpVerifyResponse
  },

  async setPassword(payload: SetPasswordPayload): Promise<void> {
    await apiFetch('/api/auth/set-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async requestPasswordReset(payload: PasswordResetRequestPayload): Promise<void> {
    await apiFetch('/api/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async resetPassword(payload: PasswordResetPayload): Promise<void> {
    await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<{ user: import('./auth').User }> {
    const response = await apiFetch('/api/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    if (response && response.user) {
      setAuthData({ token: getAuthData()?.token || '', user: response.user })
    }
    return response as { user: import('./auth').User }
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async requestEmailChange(payload: EmailChangeRequestPayload): Promise<void> {
    await apiFetch('/api/auth/request-email-change', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async confirmEmailChange(payload: EmailChangeConfirmPayload): Promise<AuthResponse> {
    const response = await apiFetch('/api/auth/confirm-email-change', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (response && response.token && response.user) {
      setAuthData({ token: response.token, user: response.user })
    }
    return response as AuthResponse
  },

  persistAuth(token: string, user: import('./auth').User): void {
    setAuthData({ token, user })
  },

  getStoredUser(): import('./auth').User | null {
    return getUser()
  },

  getStoredAuth() {
    return getAuthData()
  },

  clearAuth(): void {
    clearAuthData()
  },

  isValid(): boolean {
    return isAuthenticatedAndValid()
  },
}