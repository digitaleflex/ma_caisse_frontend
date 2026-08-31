"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Lock } from "lucide-react"

interface FeatureLockedDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    featureTitle: string
    onUpgrade: () => void
}

export function FeatureLockedDialog({ open, onOpenChange, featureTitle, onUpgrade }: FeatureLockedDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader className="flex flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
                        <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-bold">Fonctionnalité Pro</DialogTitle>
                    <DialogDescription className="pt-2 text-sm">
                        L'accès à <span className="font-bold text-foreground">{featureTitle}</span> est réservé aux membres Pro.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="rounded-xl bg-muted p-4 border border-border">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium text-foreground">Rapports PDF illimités</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium text-foreground">Sauvegarde automatique Cloud</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium text-foreground">Support prioritaire</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                    <Button onClick={() => {
                        onOpenChange(false)
                        onUpgrade()
                    }} className="w-full h-10 rounded-full text-base font-bold shadow-lg shadow-primary/20" size="lg">
                        Débloquer maintenant
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
