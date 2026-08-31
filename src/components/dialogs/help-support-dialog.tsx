"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Phone, Mail, MessageCircle, HelpCircle } from "lucide-react"

interface HelpSupportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function HelpSupportDialog({ open, onOpenChange }: HelpSupportDialogProps) {
    const handleWhatsApp = () => {
        window.open("https://wa.me/2290197460140?text=Bonjour,%20j'ai%20besoin%20d'aide%20avec%20Boutique%20Facile", "_blank")
    }

    const handleCall = () => {
        window.open("tel:+2290197460140")
    }

    const handleEmail = () => {
        window.open("mailto:ma-caisse@eurinhash.com?subject=Demande%20d'aide")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[75vh] flex-col rounded-3xl sm:max-w-md overflow-hidden p-0 gap-0">
                <DialogHeader className="p-4 pb-2 shrink-0">
                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-success/10">
                        <HelpCircle className="h-4.5 w-4.5 text-success" />
                    </div>
                    <DialogTitle className="text-center text-lg font-black uppercase tracking-tight">Aide et Support</DialogTitle>
                    <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest opacity-70">
                        Besoin d'aide ?
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-2 px-4 scrollbar-thin">
                    <div className="flex flex-col gap-4">
                        {/* Contact Options */}
                        <div className="grid grid-cols-3 gap-2 shrink-0">
                            <Button
                                variant="outline"
                                className="flex h-12 flex-col gap-1 p-2 rounded-xl hover:bg-success/5 hover:text-success hover:border-success/30 active:scale-90 transition-all border-border/40"
                                onClick={handleWhatsApp}
                            >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span className="text-[9px] font-black uppercase">WhatsApp</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex h-12 flex-col gap-1 p-2 rounded-xl hover:bg-primary/5 hover:text-primary hover:border-primary/30 active:scale-90 transition-all border-border/40"
                                onClick={handleCall}
                            >
                                <Phone className="h-3.5 w-3.5" />
                                <span className="text-[9px] font-black uppercase">Appeler</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex h-12 flex-col gap-1 p-2 rounded-xl hover:bg-secondary active:scale-90 transition-all border-border/40"
                                onClick={handleEmail}
                            >
                                <Mail className="h-3.5 w-3.5" />
                                <span className="text-[9px] font-black uppercase">Email</span>
                            </Button>
                        </div>

                        {/* FAQ Section */}
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 shrink-0">Questions Fréquentes</h3>
                        <div className="pr-1">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>Comment ajouter une vente ?</AccordionTrigger>
                                    <AccordionContent>
                                        Allez sur l'écran d'accueil et appuyez sur le bouton "+" en bas à droite, puis sélectionnez "Ajouter une Vente". Entrez le montant et une note optionnelle.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger>Comment gérer les crédits clients ?</AccordionTrigger>
                                    <AccordionContent>
                                        Dans l'onglet "Clients", vous pouvez ajouter un nouveau client et enregistrer ses dettes. Pour un remboursement, sélectionnez le client et cliquez sur "Rembourser".
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger>Mes données sont-elles sécurisées ?</AccordionTrigger>
                                    <AccordionContent>
                                        Oui, toutes vos données sont chiffrées et sauvegardées automatiquement dans le cloud. Vous pouvez y accéder depuis n'importe quel appareil avec votre compte.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4">
                                    <AccordionTrigger>Comment changer mon mot de passe ?</AccordionTrigger>
                                    <AccordionContent>
                                        Allez dans l'onglet "Profil", cliquez sur "Changer mot de passe" et suivez les instructions.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-5">
                                    <AccordionTrigger>L'application fonctionne-t-elle hors ligne ?</AccordionTrigger>
                                    <AccordionContent>
                                        Pour garantir la synchronisation de vos données, une connexion internet est recommandée. Cependant, vous pouvez consulter vos données déjà chargées sans connexion.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>

                    {/* Support Hours */}
                    <div className="rounded-xl border border-border/40 bg-muted/30 p-3 text-center text-[11px] text-muted-foreground shrink-0 mt-2">
                        <p>Disponible <span className="font-bold text-foreground mx-1">Lundi - Samedi</span></p>
                        <p className="font-black text-foreground uppercase tracking-wider mt-0.5">8h00 - 20h00</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
