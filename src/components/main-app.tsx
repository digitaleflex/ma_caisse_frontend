"use client"

import { useState, useEffect } from "react"
import { HomeTab } from "@/components/tabs/home-tab"
import { SummaryTab } from "@/components/tabs/summary-tab"
import { CreditsTab } from "@/components/tabs/credits-tab"
import { ProfileTab } from "@/components/tabs/profile-tab"
import { AdminTab } from "@/components/tabs/admin-tab"
import { InventoryTab } from "@/components/tabs/inventory-tab"
import { SubscriptionScreen } from "@/components/subscription-screen"
import { Home, TrendingUp, Users, User, ShieldCheck, Package, Plus, DollarSign, ShoppingCart, Menu, TrendingDown, UserPlus } from "lucide-react"
import { ProfileSkeleton } from "@/components/skeletons/profile-skeleton"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { Toaster } from "@/components/ui/sonner"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { productsService } from "@/services/products"
import { AddSaleDialog } from "@/components/dialogs/add-sale-dialog"
import { AddExpenseDialog } from "@/components/dialogs/add-expense-dialog"
import { AddProductDialog } from "@/components/dialogs/add-product-dialog"
import { AddDebtorDialog } from "@/components/dialogs/add-debtor-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface MainAppProps {
  userProfile: {
    firstName: string
    shopName: string
    email: string
    phoneNumber?: string
    createdAt: string
    role?: 'user' | 'admin'
    lowStockThreshold?: number
  }
  isLoading?: boolean
}

type Tab = "home" | "inventory" | "summary" | "credits" | "profile" | "admin"

export function MainApp({ userProfile, isLoading = false }: MainAppProps) {
  // Initialiser l'onglet actif depuis le paramètre URL (pour persistance au rechargement)
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab')
      if (tabParam && ['home', 'inventory', 'summary', 'credits', 'profile', 'admin'].includes(tabParam)) {
        return tabParam as Tab
      }
    }
    // Redirection automatique pour admin
    if (userProfile.role === 'admin') {
      return "admin"
    }
    return "home"
  })

  // Global Dialog States
  const [showSaleDialog, setShowSaleDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [showCreditDialog, setShowCreditDialog] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState(false)

  // Vérifier le statut de l'abonnement au niveau global
  const { data: subscriptionData, isLoading: isLoadingSub } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: async () => {
      const response = await apiFetch("/api/payment/subscription", { method: "GET" })
      return response as { hasActiveSubscription: boolean; subscription?: any }
    },
    enabled: userProfile.role !== 'admin', // Pas besoin pour admin
    retry: 1,
    staleTime: 5 * 60 * 1000, // Garder en cache 5 minutes
  })

  const isPro = subscriptionData?.hasActiveSubscription || false

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: productsService.listProducts,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const lowStockThreshold = userProfile.lowStockThreshold || 5
  const outOfStockCount = products.filter(p => p.quantity <= lowStockThreshold).length

  // Synchroniser les changements d'onglet avec l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') !== activeTab) {
      params.set('tab', activeTab)
      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.pushState(null, '', newUrl)
    }
    // Scroll to top when tab changes
    window.scrollTo(0, 0)

    // Quitter la vue abonnement si on change d'onglet via la nav bar
    setShowSubscription(false)
  }, [activeTab])

  // Gérer les boutons Précédent/Suivant du navigateur
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab')
      if (tabParam && ['home', 'inventory', 'summary', 'credits', 'profile', 'admin'].includes(tabParam)) {
        setActiveTab(tabParam as Tab)
      } else if (!tabParam) {
        setActiveTab("home")
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  const [showSubscription, setShowSubscription] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row bg-background">

      {/* MOBILE HEADER */}
      {!showSubscription && (
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-md border-b border-border z-50 px-4 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate max-w-[200px]">
              {userProfile.shopName}
            </h1>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Espace {userProfile.role === 'admin' ? 'Administrateur' : 'Boutique'}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('profile')}
            className={`p-2 rounded-full transition-colors ${activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
          >
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {userProfile.firstName.charAt(0)}
            </div>
          </button>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <nav className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-72 border-r bg-card z-50">
        <div className="flex flex-col gap-1 p-8 mb-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
            {userProfile.shopName}
          </h1>
          <p className="text-sm text-muted-foreground">Espace {userProfile.role === 'admin' ? 'Administrateur' : 'Boutique'}</p>
        </div>

        <div className="flex flex-col gap-2 px-4 flex-1">
          {userProfile.role !== 'admin' && (
            <>
              <NavButton active={activeTab === "home"} onClick={() => setActiveTab("home")} icon={Home} label="Accueil" />
              <NavButton active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")} icon={Package} label="Inventaire" badgeCount={outOfStockCount} />
              <NavButton active={activeTab === "summary"} onClick={() => setActiveTab("summary")} icon={TrendingUp} label="Bilan" />
              <NavButton active={activeTab === "credits"} onClick={() => setActiveTab("credits")} icon={Users} label="Crédits" />
              {/* Desktop "Action" Buttons are usually in the content area, but we can add shortcuts here if needed. 
                    For now, keep standard nav. Profil is accessible via bottom user info or potentially a tab.
                    Let's keep Profile as a Tab in Desktop Sidebar for consistency with previous PC layout.
                */}
              <NavButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={User} label="Profil" />
            </>
          )}
          {userProfile.role === 'admin' && (
            <>
              <NavButton active={activeTab === "admin"} onClick={() => setActiveTab("admin")} icon={ShieldCheck} label="Dashboard" />
              <NavButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={User} label="Profil" />
            </>
          )}
        </div>

        {/* User Info (Desktop Bottom) */}
        <div className="p-4 mt-auto border-t border-border/50">
          <div className="flex items-center gap-3 px-4 py-3 w-full bg-muted/50 rounded-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
              {userProfile.firstName.charAt(0)}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-bold truncate">{userProfile.firstName}</p>
              <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg pb-safe">
        <div className="flex items-center justify-around px-2 h-16">
          {userProfile.role !== 'admin' ? (
            <>
              <MobileNavButton active={activeTab === "home"} onClick={() => setActiveTab("home")} icon={Home} label="Accueil" />
              <MobileNavButton active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")} icon={Package} label="Stock" badgeCount={outOfStockCount} />

              {/* CENTRAL ACTION BUTTON */}
              <DropdownMenu onOpenChange={setActionMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center justify-center outline-none focus:outline-none focus-visible:ring-0 select-none">
                    <div className={`h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center transition-all duration-200 active:scale-90 ${actionMenuOpen ? "scale-110 bg-primary/80" : "hover:scale-105"}`}>
                      <Plus className={`h-5 w-5 transition-transform duration-200 ${actionMenuOpen ? "rotate-45" : ""}`} />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="top" className="w-56 mb-2 p-2 rounded-2xl">
                  <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Actions rapides</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ActionMenuItem
                    icon={ShoppingCart}
                    label="Nouvelle Vente"
                    colorClass="bg-green-100 text-green-700"
                    activeColorClass="bg-green-200"
                    onAction={() => setShowSaleDialog(true)}
                  />
                  <ActionMenuItem
                    icon={TrendingDown}
                    label="Nouvelle Dépense"
                    colorClass="bg-red-100 text-red-700"
                    activeColorClass="bg-red-200"
                    onAction={() => setShowExpenseDialog(true)}
                  />
                  <ActionMenuItem
                    icon={UserPlus}
                    label="Nouveau Crédit"
                    colorClass="bg-yellow-100 text-yellow-700"
                    activeColorClass="bg-yellow-200"
                    onAction={() => setShowCreditDialog(true)}
                  />
                  <DropdownMenuSeparator />
                  <ActionMenuItem
                    icon={Package}
                    label="Ajouter un Produit"
                    colorClass="bg-blue-100 text-blue-700"
                    activeColorClass="bg-blue-200"
                    onAction={() => setShowProductDialog(true)}
                  />
                </DropdownMenuContent>
              </DropdownMenu>

              <MobileNavButton active={activeTab === "credits"} onClick={() => setActiveTab("credits")} icon={Users} label="Crédits" />
              <MobileNavButton active={activeTab === "summary"} onClick={() => setActiveTab("summary")} icon={TrendingUp} label="Bilan" />
            </>
          ) : (
            // Admin Mobile Nav (Simplified)
            <>
              <MobileNavButton active={activeTab === "admin"} onClick={() => setActiveTab("admin")} icon={ShieldCheck} label="Admin" />
              <MobileNavButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={User} label="Profil" />
            </>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-16 pb-24 md:pt-0 md:pb-0 md:pl-72">
        {showSubscription ? (
          <SubscriptionScreen
            onBack={() => setShowSubscription(false)}
            userProfile={{
              createdAt: userProfile.createdAt,
              firstName: userProfile.firstName
            }}
          />
        ) : (
          <>
            {activeTab === "home" && (
              <HomeTab
                userProfile={{
                  firstName: userProfile.firstName,
                  shopName: userProfile.shopName,
                  email: userProfile.email,
                  phoneNumber: userProfile.phoneNumber
                }}
                isPro={isPro}
                isLoadingSubscription={isLoadingSub}
                subscriptionStatus={subscriptionData}
                onNavigateToSubscription={() => setShowSubscription(true)}
                onNavigateToInventory={() => setActiveTab("inventory")}
                onOpenSale={() => setShowSaleDialog(true)}
                onOpenExpense={() => setShowExpenseDialog(true)}
                onOpenNewCredit={() => setShowCreditDialog(true)}
              />
            )}
            {activeTab === "inventory" && (
              <InventoryTab
                isPro={isPro}
                onNavigateToSubscription={() => setShowSubscription(true)}
                onOpenProduct={() => setShowProductDialog(true)}
              />
            )}
            {activeTab === "summary" && (
              <SummaryTab
                userProfile={{
                  firstName: userProfile.firstName,
                  shopName: userProfile.shopName,
                  email: userProfile.email,
                  phoneNumber: userProfile.phoneNumber
                }}
                isPro={isPro}
                isLoadingSubscription={isLoadingSub}
                onNavigateToSubscription={() => setShowSubscription(true)}
              />
            )}
            {activeTab === "credits" && (
              <CreditsTab
                userProfile={{
                  firstName: userProfile.firstName,
                  shopName: userProfile.shopName,
                  email: userProfile.email,
                  phoneNumber: userProfile.phoneNumber
                }}
                onNavigateToSubscription={() => setShowSubscription(true)}
                onOpenNewCredit={() => setShowCreditDialog(true)}
              />
            )}
            {activeTab === "profile" && (
              isLoading || !userProfile ? (
                <ProfileSkeleton />
              ) : (
                <ProfileTab
                  userProfile={userProfile}
                  isPro={isPro}
                  isLoadingSubscription={isLoadingSub}
                  subscriptionStatus={subscriptionData}
                  onNavigateToSubscription={() => setShowSubscription(true)}
                />
              )
            )}
            {activeTab === "admin" && userProfile.role === 'admin' && <AdminTab />}
          </>
        )}
      </main>

      {/* GLOBAL DIALOGS */}
      <AddSaleDialog open={showSaleDialog} onOpenChange={setShowSaleDialog} userProfile={userProfile} />
      <AddExpenseDialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog} />
      <AddProductDialog open={showProductDialog} onOpenChange={setShowProductDialog} />
      <AddDebtorDialog open={showCreditDialog} onOpenChange={setShowCreditDialog} onNavigateToSubscription={() => setShowSubscription(true)} />

      <Toaster />
      <InstallPrompt />
    </div>
  )
}

// Helpers Components for cleaner code

function NavButton({ active, onClick, icon: Icon, label, badgeCount }: { active: boolean, onClick: () => void, icon: any, label: string, badgeCount?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 w-full transition-all rounded-xl relative group ${active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted font-medium"
        }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1 text-left truncate">{label}</span>
      {badgeCount && badgeCount > 0 ? (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-black text-white shadow-sm ring-2 ring-transparent group-hover:ring-destructive/20 transition-all">
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      ) : null}
    </button>
  )
}

function MobileNavButton({ active, onClick, icon: Icon, label, badgeCount }: { active: boolean, onClick: () => void, icon: any, label: string, badgeCount?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition-colors ${active ? "text-primary" : "text-muted-foreground"
        }`}
    >
      <div className={`relative p-0.5 rounded-xl transition-all ${active ? "bg-primary/10" : "bg-transparent"}`}>
        <Icon className={`h-5 w-5 ${active ? "fill-current" : ""}`} />
        {badgeCount && badgeCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white ring-2 ring-card shadow-md">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        ) : null}
      </div>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  )
}

function ActionMenuItem({ icon: Icon, label, colorClass, activeColorClass, onAction }: { icon: any, label: string, colorClass: string, activeColorClass: string, onAction: () => void }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-all duration-100 ${pressed ? `${activeColorClass} scale-[0.97]` : "hover:bg-muted"}`}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onAction(); }}
      onPointerLeave={() => setPressed(false)}
    >
      <div className={`p-1.5 rounded-lg ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  )
}
