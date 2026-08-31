"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Shield } from "lucide-react"

interface PrivacyPolicyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PrivacyPolicyDialog({ open, onOpenChange }: PrivacyPolicyDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col max-h-[85vh] rounded-3xl sm:max-w-2xl overflow-hidden p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl font-black uppercase tracking-tight">Politique de Confidentialité</DialogTitle>
                    <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Dernière mise à jour : Décembre 2025
                    </DialogDescription>
                </DialogHeader>

                <div
                    className="flex-1 overflow-y-auto px-6 py-2"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 transparent'
                    }}
                >
                    <div className="space-y-6 text-sm pb-4">
                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">1. Introduction</h3>
                            <p className="text-muted-foreground">
                                Ma Caisse s'engage à protéger la confidentialité de vos données personnelles.
                                Cette politique explique comment nous collectons, utilisons et protégeons vos informations.
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">2. Données Collectées</h3>
                            <p className="text-muted-foreground mb-2">Nous collectons les informations suivantes :</p>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                <li>Informations de compte (nom, email, numéro de téléphone)</li>
                                <li>Données de votre boutique (ventes, dépenses, clients)</li>
                                <li>Informations d'utilisation de l'application</li>
                                <li>Données de connexion et d'authentification</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">3. Utilisation des Données</h3>
                            <p className="text-muted-foreground mb-2">Vos données sont utilisées pour :</p>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                <li>Fournir et améliorer nos services</li>
                                <li>Synchroniser vos données entre vos appareils</li>
                                <li>Assurer la sécurité de votre compte</li>
                                <li>Vous envoyer des notifications importantes</li>
                                <li>Analyser l'utilisation pour améliorer l'expérience utilisateur</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">4. Protection des Données</h3>
                            <p className="text-muted-foreground mb-2">
                                Nous mettons en œuvre des mesures de sécurité robustes :
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                <li>Chiffrement des données en transit et au repos</li>
                                <li>Authentification sécurisée avec vérification OTP</li>
                                <li>Sauvegardes automatiques et sécurisées</li>
                                <li>Accès restreint aux données personnelles</li>
                                <li>Surveillance continue de la sécurité</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">5. Partage des Données</h3>
                            <p className="text-muted-foreground">
                                Nous ne vendons jamais vos données personnelles. Vos informations peuvent être partagées
                                uniquement dans les cas suivants :
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                <li>Avec votre consentement explicite</li>
                                <li>Pour se conformer aux obligations légales</li>
                                <li>Avec des prestataires de services de confiance (hébergement, support)</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">6. Vos Droits</h3>
                            <p className="text-muted-foreground mb-2">Vous avez le droit de :</p>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                <li>Accéder à vos données personnelles</li>
                                <li>Corriger ou mettre à jour vos informations</li>
                                <li>Supprimer votre compte et vos données</li>
                                <li>Exporter vos données</li>
                                <li>Retirer votre consentement à tout moment</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">7. Cookies et Technologies Similaires</h3>
                            <p className="text-muted-foreground">
                                Nous utilisons des cookies et technologies similaires pour améliorer votre expérience,
                                mémoriser vos préférences et analyser l'utilisation de l'application.
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">8. Conservation des Données</h3>
                            <p className="text-muted-foreground">
                                Nous conservons vos données aussi longtemps que votre compte est actif ou selon les
                                exigences légales. Vous pouvez demander la suppression de vos données à tout moment.
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">9. Modifications de la Politique</h3>
                            <p className="text-muted-foreground">
                                Nous pouvons mettre à jour cette politique de temps en temps. Nous vous informerons
                                de tout changement important par email ou via l'application.
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">10. Contact</h3>
                            <p className="text-muted-foreground">
                                Pour toute question concernant cette politique de confidentialité, contactez-nous à :
                            </p>
                            <ul className="list-none pl-0 space-y-1 text-muted-foreground mt-2">
                                <li>📧 Email : ma-caisse@eurinhash.com</li>
                                <li>📱 WhatsApp : +229 0197460140</li>
                                <li>📞 Téléphone : +229 0197460140</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
