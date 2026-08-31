"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreditCard, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getToken } from "@/lib/auth"
import { API_URL } from "@/lib/config"

interface PaymentConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    plan: "monthly" | "quarterly" | "annual"
    onConfirm: () => void
}

const planDetails = {
    monthly: {
        name: "Mensuel",
        price: "1 500 FCFA",
        period: "par mois",
        amount: 1500
    },
    quarterly: {
        name: "Trimestriel",
        price: "4 000 FCFA",
        period: "tous les 3 mois",
        amount: 4000
    },
    annual: {
        name: "Annuel",
        price: "15 000 FCFA",
        period: "par an",
        amount: 15000
    }
}

export function PaymentConfirmationDialog({ open, onOpenChange, plan, onConfirm }: PaymentConfirmationDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const details = planDetails[plan]

    const handleConfirmPayment = async () => {
        setIsLoading(true)

        try {
            // Récupérer le token d'authentification
            const token = getToken()

            if (!token) {
                toast.error('Erreur', {
                    description: 'Vous devez être connecté pour effectuer un paiement'
                })
                setIsLoading(false)
                return
            }

            // Appeler l'API backend pour créer le paiement
            const response = await fetch(`${API_URL}/api/payment/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    plan: plan
                })
            })

            const data = await response.json()

            if (data.success) {
                // Fermer le dialog
                onOpenChange(false)

                // Afficher un message de redirection
                toast.success('Redirection vers le paiement', {
                    description: 'Vous allez être redirigé vers la page de paiement Mobile Money'
                })

                // Rediriger vers la page de paiement FedaPay
                setTimeout(() => {
                    window.location.href = data.paymentUrl
                }, 1500)
            } else {
                toast.error('Erreur', {
                    description: data.message || 'Impossible de créer le paiement'
                })
            }
        } catch (error) {
            console.error('Erreur paiement:', error)
            toast.error('Erreur', {
                description: 'Une erreur est survenue lors de la création du paiement'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col max-h-[80vh] rounded-3xl sm:max-w-md overflow-hidden p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold">Confirmer votre abonnement</DialogTitle>
                    <DialogDescription className="text-center text-sm">
                        Vous êtes sur le point de souscrire au plan {details.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-2">
                    <div className="space-y-4">
                        {/* Plan Summary */}
                        <div className="rounded-2xl border border-border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Plan sélectionné</p>
                                    <p className="text-xl font-bold text-foreground">{details.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary">{details.price}</p>
                                    <p className="text-xs text-muted-foreground">{details.period}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Instructions */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-foreground">Instructions de paiement</h3>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-success" />
                                    <p>Vous serez redirigé vers la page de paiement Mobile Money</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-success" />
                                    <p>Choisissez votre opérateur (MTN ou Moov)</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-success" />
                                    <p>Entrez votre numéro de téléphone Mobile Money</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-success" />
                                    <p>Validez le paiement sur votre téléphone</p>
                                </div>
                            </div>
                        </div>

                        {/* Security Note */}
                        <div className="rounded-xl bg-primary/5 p-3">
                            <p className="text-xs text-center text-muted-foreground">
                                🔒 Paiement 100% sécurisé via FedaPay
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 p-6 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto"
                        disabled={isLoading}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleConfirmPayment}
                        className="w-full sm:w-auto"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Chargement...
                            </>
                        ) : (
                            'Procéder au paiement'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
