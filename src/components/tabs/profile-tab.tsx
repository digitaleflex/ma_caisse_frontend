import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { ChevronRight, CreditCard, HelpCircle, Info, LogOut, Pencil, Key, Loader2, Lightbulb, Package2 } from "lucide-react"

import { clearAuthData, getToken } from "@/lib/auth"
import { API_URL } from "@/lib/config"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api"

import { EditProfileDialog } from "@/components/dialogs/edit-profile-dialog"
import { ChangePasswordDialog } from "@/components/dialogs/change-password-dialog"
import { ChangeEmailDialog } from "@/components/dialogs/change-email-dialog"
import { HelpSupportDialog } from "@/components/dialogs/help-support-dialog"
import { AboutDialog } from "@/components/dialogs/about-dialog"
import { FeedbackDialog } from "@/components/dialogs/feedback-dialog"
import { toast } from "sonner"

interface ProfileTabProps {
  userProfile: {
    firstName: string
    shopName: string
    email: string
    phoneNumber?: string
    createdAt?: string
    role?: 'user' | 'admin'
    lowStockThreshold?: number
  }
  isPro?: boolean
  isLoadingSubscription?: boolean
  subscriptionStatus?: { hasActiveSubscription: boolean; subscription?: any }
  onNavigateToSubscription?: () => void
}

export function ProfileTab({ userProfile, isPro, isLoadingSubscription, subscriptionStatus: subscriptionStatusProp, onNavigateToSubscription }: ProfileTabProps) {
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showChangeEmail, setShowChangeEmail] = useState(false)

  const [showHelpSupport, setShowHelpSupport] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const { logout, user: authUser, updateProfile } = useAuth()

  const [subscriptionStatus, setSubscriptionStatus] = useState<string>(isPro ? "Actif" : "Inactif")
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [justVerified, setJustVerified] = useState(false)
  const [verificationFailed, setVerificationFailed] = useState(false)

  const isAdmin = userProfile.role === 'admin'

  const handleConfirmLogout = async () => {
    await logout() // Attendre la fin de la requête serveur
    window.location.reload()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
  }

  // Vérifier le statut de l'abonnement
  const fetchSubscriptionStatus = async () => {
    if (isAdmin) return // Pas besoin pour admin

    try {
      const data: any = await apiFetch('/api/payment/subscription')

      if (data && data.hasActiveSubscription) {
        setSubscriptionStatus("Actif")
      } else {
        setSubscriptionStatus("Inactif")
      }
    } catch (error) {
      console.error("Erreur récupération abonnement", error)
      setSubscriptionStatus("Erreur")
    }
  }

  // Mettre à jour l'état quand la prop change
  useEffect(() => {
    if (!isVerifyingPayment && !justVerified && !verificationFailed) {
      if (isLoadingSubscription) {
        setSubscriptionStatus("Chargement...")
      } else {
        setSubscriptionStatus(isPro ? "Actif" : "Inactif")
      }
    }
  }, [isPro, isLoadingSubscription, isVerifyingPayment, justVerified, verificationFailed])

  // Effectuer la vérification au chargement
  useEffect(() => {
    // Vérifier si retour de paiement
    const searchParams = new URLSearchParams(window.location.search)
    const paymentStatus = searchParams.get('payment_status')
    const transactionId = searchParams.get('id')

    if (paymentStatus === 'check' && transactionId) {
      verifyPayment(transactionId)
    }
  }, [])

  const verifyPayment = async (transactionId: string) => {
    setIsVerifyingPayment(true)
    const toastId = toast.loading("Vérification du paiement en cours...")

    try {

      const data: any = await apiFetch(`/api/payment/verify/${transactionId}`)

      if (data && data.success && data.status === 'success') {
        toast.success("Paiement validé avec succès !", { id: toastId })
        setJustVerified(true)
        setSubscriptionStatus("Actif")

        // Rafraichir la page pour mettre à jour l'état global et nettoyer l'URL
        setTimeout(() => {
          window.location.href = window.location.pathname + "?tab=profile"
        }, 1500)

      } else {
        setVerificationFailed(true)
        // Récupérer le vrai statut depuis le backend au lieu d'utiliser isPro qui peut être obsolète
        await fetchSubscriptionStatus()
        toast.error(`Paiement échoué ou en attente: ${data?.message || data?.status}`, { id: toastId })
        // Nettoyer l'URL en cas d'échec
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    } catch (error) {
      setVerificationFailed(true)
      // Récupérer le vrai statut depuis le backend au lieu d'utiliser isPro qui peut être obsolète
      await fetchSubscriptionStatus()
      toast.error("Erreur lors de la vérification du paiement", { id: toastId })
      // Nettoyer l'URL en cas d'erreur
      window.history.replaceState({}, document.title, window.location.pathname)
    } finally {
      setIsVerifyingPayment(false)
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profil</h1>
          <p className="text-sm text-muted-foreground">Gérez votre compte</p>
        </div>

        {/* Logout Button with Professional Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-xs md:text-sm font-semibold">Se déconnecter</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase tracking-tight">Confirmer la déconnexion</DialogTitle>
              <DialogDescription className="text-xs">
                Vous serez déconnecté de votre session actuelle. Vous pourrez vous reconnecter avec votre email.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-2 mt-4">
              <DialogClose asChild>
                <Button variant="outline" className="flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-wide">Annuler</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleConfirmLogout} className="flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-wide">Se déconnecter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Info Card */}
      <Card className="rounded-2xl border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Informations personnelles</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowEditProfile(true)}
            className="h-10 w-10 hover:text-foreground hover:bg-primary/5 hover:border-primary/30"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Nom</p>
            <p className="text-base font-bold text-foreground leading-tight">{userProfile.firstName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "Statut" : "Boutique"}
            </p>
            {isAdmin ? (
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-primary/10 text-primary uppercase tracking-wide">
                Administrateur
              </div>
            ) : (
              <p className="text-base font-bold text-foreground leading-tight">{userProfile.shopName}</p>
            )}

          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChangeEmail(true)}
                className="h-8 text-xs"
              >
                Modifier
              </Button>
            </div>
            <p className="text-base font-medium text-foreground break-all">{userProfile.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Téléphone (WhatsApp)</p>
            <p className="text-sm font-medium text-foreground">{userProfile.phoneNumber || "Non renseigné"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Membre depuis</p>
            <p className="text-sm text-foreground font-medium">{formatDate(userProfile.createdAt)}</p>
          </div>
        </div>
      </Card>

      {/* Shop Settings Card */}
      <Card className="rounded-2xl border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Package2 className="h-4.5 w-4.5 text-primary" />
          </div>
          <h2 className="text-base font-bold text-foreground">Paramètres boutique</h2>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Seuil d'alerte stock</p>
                <p className="text-[11px] text-muted-foreground">Les produits sous ce seuil seront signalés.</p>
              </div>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                {authUser?.lowStockThreshold || 5}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-2">
              {[5, 10, 20, 50].map((val) => (
                <Button
                  key={val}
                  variant={(authUser?.lowStockThreshold || 5) === val ? "default" : "outline"}
                  className="h-9 rounded-xl text-sm"
                  onClick={async () => {
                    if (authUser) {
                      const tid = toast.loading(`Mise à jour du seuil à ${val}...`)
                      try {
                        await updateProfile(authUser.firstName, authUser.shopName, authUser.phoneNumber, val)
                        toast.success(`Seuil d'alerte mis à jour à ${val}`, { id: tid })
                      } catch (err) {
                        toast.error("Erreur lors de la mise à jour", { id: tid })
                      }
                    }
                  }}
                >
                  {val}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Menu Items - Grid 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Change Password */}
        <button
          onClick={() => setShowChangePassword(true)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-secondary"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Key className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Changer mot de passe</p>
              <p className="text-sm text-muted-foreground">Sécurité</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Subscription - HIDDEN FOR ADMIN */}
        {!isAdmin && (
          <button
            onClick={onNavigateToSubscription}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-secondary"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <CreditCard className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Abonnement</p>
                {isVerifyingPayment ? (
                  <div className="flex items-center gap-1 text-sm text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Vérification...</span>
                  </div>
                ) : (
                  <p className={`text-sm ${subscriptionStatus === 'Actif' ? 'text-success' : 'text-muted-foreground'}`}>
                    {subscriptionStatus}
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        )}

        {/* Feedback - HIDDEN FOR ADMIN */}
        {!isAdmin && (
          <button
            onClick={() => setShowFeedback(true)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-secondary"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Lightbulb className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Envoyer une suggestion</p>
                <p className="text-sm text-muted-foreground">Idées & Bugs</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        )}

        {/* Help & Support - HIDDEN FOR ADMIN */}
        {!isAdmin && (
          <button
            onClick={() => setShowHelpSupport(true)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-secondary"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10">
                <HelpCircle className="h-4.5 w-4.5 text-success" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Aide et Support</p>
                <p className="text-sm text-muted-foreground">FAQ & Contact</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        )}

        {/* About */}
        <button
          onClick={() => setShowAbout(true)}
          className={`flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-secondary ${!isAdmin ? 'md:col-span-2' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <Info className="h-4.5 w-4.5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">À propos</p>
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Dialogs */}
      <EditProfileDialog
        open={showEditProfile}
        onOpenChange={setShowEditProfile}
        currentFirstName={userProfile.firstName}
        currentShopName={userProfile.shopName}
        currentPhoneNumber={userProfile.phoneNumber}
      />
      <ChangePasswordDialog
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />

      <ChangeEmailDialog
        open={showChangeEmail}
        onOpenChange={setShowChangeEmail}
        currentEmail={userProfile.email}
      />

      <HelpSupportDialog
        open={showHelpSupport}
        onOpenChange={setShowHelpSupport}
      />

      <AboutDialog
        open={showAbout}
        onOpenChange={setShowAbout}
      />

      <FeedbackDialog
        open={showFeedback}
        onOpenChange={setShowFeedback}
      />
    </div>
  )
}
