"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

// Définition de l'interface pour l'événement beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

// Composant pour gérer l'invite d'installation PWA
export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)

    // Écouter l'événement beforeinstallprompt
    useEffect(() => {
        const handler = (e: Event) => {
            // Empêcher l'affichage par défaut du navigateur
            e.preventDefault()
            // Stocker l'événement pour l'utiliser plus tard
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            // Afficher notre propre interface
            setShowPrompt(true)
        }

        window.addEventListener("beforeinstallprompt", handler)

        return () => {
            window.removeEventListener("beforeinstallprompt", handler)
        }
    }, [])

    // Gérer le clic sur le bouton Installer
    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        // Afficher l'invite native
        await deferredPrompt.prompt()

        // Attendre le choix de l'utilisateur
        const { outcome } = await deferredPrompt.userChoice

        // Réinitialiser l'état
        setDeferredPrompt(null)
        setShowPrompt(false)

        if (outcome === "accepted") {
            console.log("L'utilisateur a accepté l'installation")
        } else {
            console.log("L'utilisateur a refusé l'installation")
        }
    }

    // Gérer le clic sur Plus tard
    const handleDismiss = () => {
        setShowPrompt(false)
    }

    if (!showPrompt) return null

    return (
        <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Download className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">Installer Ma Caisse</DialogTitle>
                    <DialogDescription className="text-center">
                        Installez l'application pour un accès plus rapide, une meilleure expérience et une utilisation hors ligne.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={handleDismiss} className="w-full sm:w-auto">
                        Plus tard
                    </Button>
                    <Button onClick={handleInstallClick} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                        Installer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
