"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Store, Shield, FileText } from "lucide-react"
import { PrivacyPolicyDialog } from "./privacy-policy-dialog"
import { TermsOfServiceDialog } from "./terms-of-service-dialog"

interface AboutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
    const currentYear = new Date().getFullYear()
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
    const [showTermsOfService, setShowTermsOfService] = useState(false)

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex flex-col max-h-[75vh] rounded-3xl sm:max-w-md overflow-hidden p-0 gap-0">
                    <DialogHeader>
                        <DialogTitle className="sr-only">À propos de Ma Caisse</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col items-center space-y-5 text-center scrollbar-none">
                        {/* Logo & Version */}
                        <div className="space-y-3">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                                <Store className="h-8 w-8 text-primary-foreground" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Ma Caisse</h2>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Version 1.0.0</p>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-[13px] text-muted-foreground font-medium leading-relaxed px-2">
                            La solution tout-en-un pour gérer votre boutique simplement. Suivez vos ventes, dépenses et crédits clients en toute sécurité.
                        </p>

                        {/* Links */}
                        <div className="w-full space-y-2 px-1">
                            <Button
                                variant="outline"
                                className="w-full justify-start h-10 rounded-xl hover:bg-primary/5 border-border/40 active:scale-95 transition-all group"
                                onClick={() => setShowTermsOfService(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-primary group-hover:text-primary" />
                                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">Conditions d'Utilisation</span>
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start h-10 rounded-xl hover:bg-primary/5 border-border/40 active:scale-95 transition-all group"
                                onClick={() => setShowPrivacyPolicy(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <Shield className="h-4 w-4 text-primary group-hover:text-primary" />
                                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">Politique de Confidentialité</span>
                                </div>
                            </Button>
                        </div>

                        {/* Footer */}
                        <div className="pt-2 text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">
                            <p>© {currentYear} Ma Caisse</p>
                            <p className="mt-0.5">Fait avec ❤️ pour les commerçants</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Legal Dialogs */}
            <PrivacyPolicyDialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy} />
            <TermsOfServiceDialog open={showTermsOfService} onOpenChange={setShowTermsOfService} />
        </>
    )
}
