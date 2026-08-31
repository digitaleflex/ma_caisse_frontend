"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Crown } from "lucide-react"

interface LimitReachedDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    limitType: 'Ventes' | 'Dépenses' | 'Crédits'
    currentLimit: number
    onUpgrade: () => void
}

export function LimitReachedDialog({ open, onOpenChange, limitType, currentLimit, onUpgrade }: LimitReachedDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader className="flex flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
                        <Crown className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-bold">Passez à la vitesse supérieure !</DialogTitle>
                    <DialogDescription className="pt-2 text-sm">
                        Vous avez atteint votre limite gratuite de <span className="font-bold text-foreground">{currentLimit} {limitType.toLowerCase()}</span> ce mois-ci.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    <div className="rounded-xl bg-muted p-3 border border-border">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-foreground">Basculez en mode ILLIMITÉ</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-foreground">Sauvegarde automatique Cloud</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-foreground">Support prioritaire WhatsApp</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                    <Button onClick={() => {
                        onOpenChange(false)
                        onUpgrade()
                    }} className="w-full h-10 rounded-full text-base font-bold shadow-lg shadow-primary/20" size="lg">
                        Passer Pro maintenant
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="w-full h-10 text-muted-foreground hover:bg-transparent"
                    >
                        Plus tard
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
