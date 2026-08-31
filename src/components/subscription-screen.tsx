import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Check, ArrowLeft, Loader2, Calendar, Crown, ShieldCheck, Sparkles, AlertCircle, MessageCircle, Database, Smartphone, Lock, HelpCircle } from "lucide-react"
import { PaymentConfirmationDialog } from "@/components/dialogs/payment-confirmation-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiFetch } from "@/lib/api"
import { cn } from "@/lib/utils"

interface SubscriptionScreenProps {
  onBack: () => void
  userProfile: {
    createdAt: string
    firstName: string
  }
}

type PlanType = "monthly" | "quarterly" | "annual"

interface PlanData {
  id: PlanType
  name: string
  priceFormatted: string
  duration: string
  saving?: string
  description: string
  isRecommended?: boolean
}

const PLANS_CONFIG: PlanData[] = [
  {
    id: "monthly",
    name: "Plan Mensuel",
    priceFormatted: "1 500",
    duration: "mois",
    description: "La flexibilité totale pour votre boutique.",
  },
  {
    id: "quarterly",
    name: "Plan Trimestriel",
    priceFormatted: "4 000",
    duration: "3 mois",
    saving: "11% DE RÉEUDCTION",
    description: "Le choix équilibré pour la gestion.",
  },
  {
    id: "annual",
    name: "Plan Annuel",
    priceFormatted: "15 000",
    duration: "an",
    saving: "16% - 2 MOIS OFFERTS",
    description: "Maximisez vos profits avec l'illimité.",
    isRecommended: true,
  },
]

const FEATURES = [
  "Enregistrements 100% Illimités",
  "Rapports PDF & Exports Excel",
  "Sauvegarde sécurisée dans le Cloud",
  "Accès multi-appareils",
  "Support client prioritaire via WhatsApp"
]

const FAQS = [
  { q: "Que se passe-t-il après mon mois d'essai ?", a: "Votre boutique reste accessible. Vous basculez sur le plan Standard gratuit (limité à 15 ventes, 15 dépenses et 15 crédits par mois)." },
  { q: "Puis-je changer de plan plus tard ?", a: "Oui, vous pouvez passer à un plan supérieur à tout moment. Votre abonnement actuel sera prolongé sans perte de jours." },
  { q: "Comment se passe le paiement ?", a: "Le paiement est simple et local via FedaPay (MTN MoMo ou Moov Money). Vos transactions sont 100% sécurisées." },
  { q: "Est-ce que mes données sont protégées ?", a: "Absolument. Vos données sont sauvegardées en temps réel sur nos serveurs Cloud sécurisés. Même en cas de perte de téléphone, tout est récupérable." }
]

export function SubscriptionScreen({ onBack, userProfile }: SubscriptionScreenProps) {
  const [activePlan, setActivePlan] = useState<PlanType | null>(null)
  const [activeEndDate, setActiveEndDate] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [planToConfirm, setPlanToConfirm] = useState<PlanType>("annual")

  useEffect(() => {
    window.scrollTo(0, 0)
    const fetchStatus = async () => {
      try {
        const data: any = await apiFetch('/api/payment/subscription')
        if (data && data.hasActiveSubscription && data.subscription) {
          setActivePlan(data.subscription.plan as PlanType)
          setActiveEndDate(data.subscription.endDate)
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStatus()
  }, [])

  const trialStatus = useMemo(() => {
    const trialEndDate = new Date(userProfile.createdAt)
    trialEndDate.setDate(trialEndDate.getDate() + 30)
    const now = new Date()
    const diffDays = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return {
      isExpired: now > trialEndDate,
      daysRemaining: Math.max(0, diffDays)
    }
  }, [userProfile.createdAt])

  const handleSelectPlan = (planId: PlanType) => {
    setPlanToConfirm(planId)
    setShowPaymentDialog(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="bg-[#FDFDFD] text-slate-950 font-sans antialiased selection:bg-primary/10">
      <nav className="fixed top-0 left-0 right-0 md:left-72 z-50 border-b bg-white h-16">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            RETOUR
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-sm font-black tracking-tight uppercase">Ma Caisse Pro</span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 pt-6 md:pt-28 pb-12">
        {/* SECTION 1 : HERO & TRIAL */}
        <section className="text-center mb-10 md:mb-24 space-y-3 md:space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border rounded-md text-slate-600 mx-auto">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Espace Professionnel</span>
          </div>

          <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-tight uppercase">
            La gestion de boutique <span className="text-primary italic">sans aucune limite</span>
          </h1>

          <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed px-4">
            Libérez le potentiel de votre commerce. Débloquez les rapports,
            la sauvegarde cloud et l'accès multi-appareils.
          </p>

          {!activePlan && (
            <div className="mt-10 flex justify-center">
              <div className={cn(
                "inline-flex items-center gap-3 px-5 py-3 border rounded-md font-bold text-[11px] shadow-sm",
                trialStatus.isExpired
                  ? "bg-red-50 border-red-200 text-red-900"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              )}>
                {trialStatus.isExpired ? (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <span>
                  {trialStatus.isExpired
                    ? "Attention : Votre limite de 15 ventes/mois est activée."
                    : `Mois de charme : ${trialStatus.daysRemaining} jours restants.`}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2 : GRILLE DE PRIX */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-15 md:mb-24">
          {PLANS_CONFIG.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col bg-white border rounded-md transition-all relative h-full overflow-hidden",
                plan.isRecommended
                  ? "border-primary border-2 shadow-xl"
                  : "border-slate-200 shadow-sm"
              )}
            >
              {plan.isRecommended && (
                <div className="bg-primary text-white text-center py-2 text-[10px] font-black uppercase tracking-widest">
                  Choix Recommandé
                </div>
              )}

              <div className="p-8 border-b space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black uppercase tracking-tight">{plan.name}</h3>
                  {plan.saving && (
                    <Badge className="bg-green-600 text-white font-black text-[9px] rounded-sm border-none px-2 py-0.5 tracking-tight">
                      {plan.saving}
                    </Badge>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tighter text-slate-950">{plan.priceFormatted}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-400 uppercase leading-none">FCFA</span>
                    <span className="text-[10px] font-black text-slate-500 mt-1 uppercase opacity-60">/ {plan.duration}</span>
                  </div>
                </div>
              </div>

              <div className="p-8 flex-grow space-y-8">
                <ul className="space-y-3">
                  {FEATURES.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-50">
                        <Check className="h-3 w-3 text-green-700 stroke-[4px]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-8 pt-0 mt-auto">
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={cn(
                    "w-full h-12 text-[11px] font-black rounded-2xl uppercase tracking-widest transition-all duration-200 shadow-lg",
                    activePlan === plan.id
                      ? "bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:border-green-300 active:scale-95"
                      : plan.isRecommended
                        ? "bg-primary text-white hover:bg-primary/90 hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95"
                        : "bg-white border-2 border-slate-200 text-slate-900 hover:border-slate-950 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 shadow-sm"
                  )}
                >
                  {activePlan === plan.id ? "Prolonger l'offre" : "Choisir ce plan"}
                </Button>

                {activePlan === plan.id && activeEndDate && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-green-700 font-black uppercase tracking-widest border-t border-green-50 pt-4">
                    <Crown className="h-4 w-4 fill-green-700" />
                    Expire le {formatDate(activeEndDate)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* SECTION 3 : POURQUOI PASSER PRO ? (VALEUR AJOUTÉE) */}
        <section className="mb-15 md:mb-25">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black uppercase tracking-tight">C'est la version qu'il vous faut</h2>
            <div className="w-12 h-1 bg-primary mx-auto mt-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <ValueCard
              icon={<Database className="h-6 w-6 text-primary" />}
              title="Données Eternelles"
              desc="Sauvegarde cloud automatique. Changez de téléphone sans jamais perdre une seule vente."
            />
            <ValueCard
              icon={<Smartphone className="h-6 w-6 text-primary" />}
              title="Multi-accès"
              desc="Connectez votre boutique sur plusieurs appareils simultanément avec votre numéro."
            />
            <ValueCard
              icon={<Lock className="h-6 w-6 text-primary" />}
              title="Sécurité Totale"
              desc="Chiffrement des données de niveau bancaire. Vos chiffres restent vos chiffres."
            />
          </div>
        </section>

        {/* SECTION 4 : FAQ SIMPLIFIÉE */}
        <section className="max-w-3xl mx-auto mb-12 bg-slate-50 p-10 border rounded-md">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold uppercase tracking-tight">Questions fréquentes</h2>
          </div>
          <div className="space-y-8">
            {FAQS.map((faq, i) => (
              <div key={i} className="space-y-1">
                <p className="font-bold text-slate-900 text-sm leading-tight">Q: {faq.q}</p>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

      </div >

      <PaymentConfirmationDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        plan={planToConfirm}
        onConfirm={() => setShowPaymentDialog(false)}
      />
    </div >
  )
}

function ValueCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 border-l-2 border-slate-100 bg-white hover:border-primary hover:bg-slate-50/50 transition-all duration-300">
      <div className="mb-6">{icon}</div>
      <h4 className="text-sm font-bold uppercase tracking-tight mb-3 text-slate-900">{title}</h4>
      <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  )
}

