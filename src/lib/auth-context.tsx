import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from './auth-service'
import { User } from './auth'

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
  updateProfile: (firstName: string, shopName: string, phoneNumber?: string, lowStockThreshold?: number) => Promise<{ user: User }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  requestEmailChange: (currentPassword: string, newEmail: string) => Promise<void>
  confirmEmailChange: (newEmail: string, code: string) => Promise<{ token: string; user: User }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // Initialize auth on mount - try to refresh token
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authService.refresh()
        if (response) {
          setUser(response.user)
          setIsLoading(false)
          return
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
      }

      // Try to get stored user from localStorage
      const storedUser = authService.getStoredUser()
      if (storedUser) {
        setUser(storedUser)
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password })
    if (response) {
      setUser(response.user)
      queryClient.invalidateQueries()
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      authService.clearAuth()
      setUser(null)
      queryClient.clear()
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
  }

  const refreshToken = async () => {
    const response = await authService.refresh()
    if (response) {
      setUser(response.user)
      queryClient.invalidateQueries()
    }
  }

  const requestOtp = async (firstName: string, shopName: string, email: string, phoneNumber: string) => {
    await authService.requestOtp({ firstName, shopName, email, phoneNumber })
  }

  const verifyOtp = async (email: string, code: string) => {
    const response = await authService.verifyOtp({ email, code })
    return response
  }

  const setPassword = async (email: string, password: string, setupToken: string) => {
    await authService.setPassword({ email, password, setupToken })
  }

  const requestPasswordReset = async (email: string) => {
    await authService.requestPasswordReset({ email })
  }

  const resetPassword = async (email: string, code: string, password: string) => {
    await authService.resetPassword({ email, code, password })
  }

  const updateProfile = async (firstName: string, shopName: string, phoneNumber?: string, lowStockThreshold?: number) => {
    const response = await authService.updateProfile({ firstName, shopName, phoneNumber, lowStockThreshold })
    if (response) {
      setUser(response.user)
    }
    return response
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await authService.changePassword({ currentPassword, newPassword })
  }

  const requestEmailChange = async (currentPassword: string, newEmail: string) => {
    await authService.requestEmailChange({ currentPassword, newEmail })
  }

  const confirmEmailChange = async (newEmail: string, code: string) => {
    const response = await authService.confirmEmailChange({ newEmail, code })
    if (response) {
      setUser(response.user)
      queryClient.invalidateQueries()
    }
    return response
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}