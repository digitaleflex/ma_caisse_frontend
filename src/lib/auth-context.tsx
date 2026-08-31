"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './api'
import { setAuthData, getAuthData, clearAuthData, isAuthenticatedAndValid, User, getUser } from './auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  requestOtp: (firstName: string, shopName: string, email: string, phoneNumber: string) => Promise<void>
  verifyOtp: (email: string, code: string) => Promise<{ setupToken: string }>
  setPassword: (email: string, password: string, setupToken: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (email: string, code: string, password: string) => Promise<void>
  updateProfile: (firstName: string, shopName: string, phoneNumber?: string, lowStockThreshold?: number) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  requestEmailChange: (currentPassword: string, newEmail: string) => Promise<void>
  confirmEmailChange: (newEmail: string, code: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getUser())
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // Vérifier l'authentification au démarrage via Refresh Token (Cookie)
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Tenter de rafraîchir le token silencieusement
        // Cela permet de récupérer un accessToken frais si le cookie httpOnly est présent
        const response = await apiFetch('/api/auth/refresh', { method: 'POST' })

        if (response && (response as any).token && (response as any).user) {
          const token = (response as any).token
          const user = (response as any).user
          setAuthData({ token, user })
          setUser(user)
        }
        // Pour toute autre erreur (réseau, 503, etc.), on conserve l'état local optimiste
      } catch (error: any) {
        console.error("Erreur init auth:", error)
        // Si c'est une 401 (token expiré ou absent), on déconnecte
        if (error.status === 401) {
          clearAuthData()
          setUser(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Mutation pour la connexion
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      return response as { token: string; user: User }
    },
    onSuccess: (data) => {
      setAuthData({ token: data.token, user: data.user })
      setUser(data.user)
      queryClient.invalidateQueries()
    },
  })

  // Mutation pour demander OTP
  const requestOtpMutation = useMutation({
    mutationFn: async ({ firstName, shopName, email, phoneNumber }: { firstName: string; shopName: string; email: string; phoneNumber: string }) => {
      return apiFetch('/api/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ firstName, shopName, email, phoneNumber }),
      })
    },
  })

  // Mutation pour vérifier OTP
  const verifyOtpMutation = useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      const response = await apiFetch('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      })
      return response as { setupToken: string }
    },
  })

  // Mutation pour définir le mot de passe
  const setPasswordMutation = useMutation({
    mutationFn: async ({ email, password, setupToken }: { email: string; password: string; setupToken: string }) => {
      return apiFetch('/api/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({ email, password, setupToken }),
      })
    },
  })

  // Mutation pour rafraîchir le token
  const refreshMutation = useMutation({
    mutationFn: async () => {
      // The cookie is sent automatically by the browser
      const response = await apiFetch('/api/auth/refresh', {
        method: 'POST',
      })
      return response as { token: string }
    },
    onSuccess: (data) => {
      const authData = getAuthData()
      if (authData) {
        setAuthData({ ...authData, token: data.token })
      }
    },
  })

  // Mutation pour demander la réinitialisation du mot de passe
  const requestPasswordResetMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      return apiFetch('/api/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    },
  })

  // Mutation pour réinitialiser le mot de passe
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email, code, password }: { email: string; code: string; password: string }) => {
      return apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, password }),
      })
    },
  })

  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation({
    mutationFn: async ({ firstName, shopName, phoneNumber, lowStockThreshold }: { firstName: string; shopName: string; phoneNumber?: string; lowStockThreshold?: number }) => {
      const response = await apiFetch('/api/auth/update-profile', {
        method: 'PUT',
        body: JSON.stringify({ firstName, shopName, phoneNumber, lowStockThreshold }),
      })
      return response as { user: User }
    },
    onSuccess: (data) => {
      console.log('Profile update success, new user data:', data.user);
      const authData = getAuthData()
      if (authData) {
        setAuthData({ ...authData, user: data.user })
        setUser(data.user)
      }
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
    }
  })

  // Mutation pour changer le mot de passe
  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      return apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
    },
  })

  // Mutation pour la déconnexion
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiFetch('/api/auth/logout', {
        method: 'POST',
      })
    },
  })

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password })
  }

  const logout = async () => {
    try {
      // Attendre que la requête parte au serveur pour supprimer le cookie
      await logoutMutation.mutateAsync()
    } catch (e) {
      console.error("Erreur lors de la déconnexion serveur:", e)
    } finally {
      // Quoi qu'il arrive, on nettoie le côté client
      clearAuthData()
      setUser(null)
      queryClient.clear()
      // Nettoyer l'URL (enlever ?tab=profile)
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
  }

  const requestOtp = async (firstName: string, shopName: string, email: string, phoneNumber: string) => {
    await requestOtpMutation.mutateAsync({ firstName, shopName, email, phoneNumber })
  }

  const verifyOtp = async (email: string, code: string) => {
    return await verifyOtpMutation.mutateAsync({ email, code })
  }

  const setPassword = async (email: string, password: string, setupToken: string) => {
    await setPasswordMutation.mutateAsync({ email, password, setupToken })
  }

  const refreshToken = async () => {
    await refreshMutation.mutateAsync()
  }

  const requestPasswordReset = async (email: string) => {
    await requestPasswordResetMutation.mutateAsync({ email })
  }

  const resetPassword = async (email: string, code: string, password: string) => {
    await resetPasswordMutation.mutateAsync({ email, code, password })
  }

  const updateProfile = async (firstName: string, shopName: string, phoneNumber?: string, lowStockThreshold?: number) => {
    await updateProfileMutation.mutateAsync({ firstName, shopName, phoneNumber, lowStockThreshold })
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await changePasswordMutation.mutateAsync({ currentPassword, newPassword })
  }

  // Email change mutations
  const requestEmailChangeMutation = useMutation({
    mutationFn: async ({ currentPassword, newEmail }: { currentPassword: string; newEmail: string }) => {
      return apiFetch('/api/auth/request-email-change', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newEmail }),
      })
    },
  })

  const confirmEmailChangeMutation = useMutation({
    mutationFn: async ({ newEmail, code }: { newEmail: string; code: string }) => {
      return apiFetch('/api/auth/confirm-email-change', {
        method: 'POST',
        body: JSON.stringify({ newEmail, code }),
      })
    },
    onSuccess: (data) => {
      // Update auth data with new token and user info
      setAuthData({ token: data.token, user: data.user })
      setUser(data.user)
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })

  const requestEmailChange = async (currentPassword: string, newEmail: string) => {
    await requestEmailChangeMutation.mutateAsync({ currentPassword, newEmail })
  }

  const confirmEmailChange = async (newEmail: string, code: string) => {
    await confirmEmailChangeMutation.mutateAsync({ newEmail, code })
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    requestOtp,
    verifyOtp,
    setPassword,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    changePassword,
    requestEmailChange,
    confirmEmailChange,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}