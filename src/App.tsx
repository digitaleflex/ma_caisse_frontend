import { useState, useEffect } from "react"
import { AppSkeleton } from "@/components/skeletons/app-skeleton"
import { EmailScreen } from "@/components/onboarding/email-screen"
import { OTPScreen } from "@/components/onboarding/otp-screen"
import { ProfileSetupScreen } from "@/components/onboarding/profile-setup-screen"
import { MainApp } from "@/components/main-app"
import { LoginScreen } from "@/components/auth/login-screen"
import { SetPasswordScreen } from "@/components/auth/set-password-screen"
import { useAuth } from "@/lib/auth-context"

import { ForgotPasswordScreen } from "@/components/auth/forgot-password-screen"
import { ResetPasswordScreen } from "@/components/auth/reset-password-screen"
import { Toaster } from "@/components/ui/sonner"
import { InstallPrompt } from "@/components/pwa/install-prompt"

type Screen = "email" | "login" | "profile" | "otp" | "setPassword" | "app" | "forgotPassword" | "resetPassword"

export default function App() {
  const { user, isAuthenticated, isLoading } = useAuth()

  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    // Initialiser l'écran en fonction de l'état d'authentification
    if (isAuthenticated) {
      return "app"
    }
    return "email"
  })
  const [email, setEmail] = useState("")
  const [setupToken, setSetupToken] = useState("")

  // Synchroniser l'écran avec l'état d'authentification
  useEffect(() => {
    if (!isLoading) {
      setCurrentScreen(isAuthenticated ? "app" : "email")
    }
  }, [isAuthenticated, isLoading])

  // Afficher le squelette pendant la vérification de l'authentification
  if (isLoading) {
    return <AppSkeleton />
  }

  // Créer le profil utilisateur à partir du contexte d'authentification
  const userProfile = user
    ? {
      firstName: user.firstName,
      shopName: user.shopName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      role: user.role,
      lowStockThreshold: user.lowStockThreshold
    }
    : { firstName: "", shopName: "", email: "", phoneNumber: "", createdAt: "" }

  const handleEmailSubmit = (address: string) => {
    setEmail(address)
    setCurrentScreen("profile")
  }

  const goToLogin = () => setCurrentScreen("login")
  const goBackToEmail = () => setCurrentScreen("email")
  const goBackToProfile = () => setCurrentScreen("profile")
  const goBackToOtp = () => setCurrentScreen("otp")
  const goToForgotPassword = () => setCurrentScreen("forgotPassword")

  const handleProfileComplete = () => {
    setCurrentScreen("otp")
  }

  const handleOTPVerified = (token: string) => {
    setSetupToken(token)
    setCurrentScreen("setPassword")
  }

  const handlePasswordSet = () => {
    setCurrentScreen("login")
  }

  const handleResetRequestSuccess = (emailAddress: string) => {
    setEmail(emailAddress)
    setCurrentScreen("resetPassword")
  }

  const handlePasswordResetSuccess = () => {
    setCurrentScreen("login")
  }

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === "email" && <EmailScreen onContinue={handleEmailSubmit} onLogin={goToLogin} />}
      {currentScreen === "login" && (
        <LoginScreen
          onBack={goBackToEmail}
          onSuccess={() => {
            // Nettoyer l'URL avant de monter l'application principale
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', window.location.pathname)
            }
            setCurrentScreen("app")
          }}
          onCompleteRegistration={(emailAddress) => { setEmail(emailAddress); setCurrentScreen("otp"); }}
          onForgotPassword={goToForgotPassword}
        />
      )}
      {currentScreen === "profile" && <ProfileSetupScreen email={email} onComplete={handleProfileComplete} onBack={goBackToEmail} />}
      {currentScreen === "otp" && <OTPScreen email={email} onVerified={handleOTPVerified} onBack={goBackToProfile} />}
      {currentScreen === "setPassword" && <SetPasswordScreen email={email} setupToken={setupToken} onSuccess={handlePasswordSet} onBack={goBackToOtp} onTokenExpired={(emailAddress) => { setEmail(emailAddress); setCurrentScreen("otp"); }} />}
      {currentScreen === "forgotPassword" && <ForgotPasswordScreen onBack={goToLogin} onSuccess={handleResetRequestSuccess} />}
      {currentScreen === "resetPassword" && <ResetPasswordScreen email={email} onBack={goToLogin} onSuccess={handlePasswordResetSuccess} />}
      {currentScreen === "app" && <MainApp userProfile={userProfile} isLoading={isLoading} />}
      <Toaster />
      {/* Invite d'installation PWA */}
      <InstallPrompt />
    </div>
  )
}
