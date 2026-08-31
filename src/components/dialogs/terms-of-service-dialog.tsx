"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FileText } from "lucide-react"

interface TermsOfServiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TermsOfServiceDialog({ open, onOpenChange }: TermsOfServiceDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col max-h-[85vh] rounded-3xl sm:max-w-2xl overflow-hidden p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl font-black uppercase tracking-tight">Conditions d'Utilisation</DialogTitle>
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
                            <h3 className="mb-2 font-semibold text-foreground">1. Acceptation des Conditions</h3>
                            <p className="text-muted-foreground">
                                En utilisant Ma Caisse, vous acceptez d'être lié par ces conditions d'utilisation.
                                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">2. Description du Service</h3>
                            <p className="text-muted-foreground">
                                Ma Caisse est une application de gestion de boutique qui vous permet de :
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                <li>Enregistrer et suivre vos ventes quotidiennes</li>
                                <li>Gérer vos dépenses et revenus</li>
                                <li>Suivre les crédits de vos clients</li>
                                <li>Générer des rapports et statistiques</li>
                                <li>Synchroniser vos données sur plusieurs appareils</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">3. Compte Utilisateur</h3>
                            <p className="text-muted-foreground mb-2">Pour utiliser Ma Caisse, vous devez :</p>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                <li>Créer un compte avec des informations exactes et à jour</li>
                                <li>Maintenir la sécurité de votre mot de passe</li>
                                <li>Être responsable de toutes les activités sur votre compte</li>
                                <li>Nous informer immédiatement de toute utilisation non autorisée</li>
                                <li>Avoir au moins 18 ans ou l'âge légal dans votre pays</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">4. Utilisation Acceptable</h3>
                            <p className="text-muted-foreground mb-2">Vous vous engagez à :</p>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                <li>Utiliser l'application uniquement à des fins légales</li>
                                <li>Ne pas tenter de contourner les mesures de sécurité</li>
                                <li>Ne pas utiliser l'application pour des activités frauduleuses</li>
                                <li>Ne pas partager votre compte avec d'autres personnes</li>
                                <li>Respecter les droits de propriété intellectuelle</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">5. Abonnements et Paiements</h3>
                            <p className="text-muted-foreground mb-2">Concernant les abonnements :</p>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                <li>Les abonnements sont facturés selon la période choisie (mensuel/annuel)</li>
                                <li>Le renouvellement est automatique sauf annulation</li>
                                <li>Vous pouvez annuler à tout moment depuis votre profil</li>
                                <li>Les remboursements sont traités selon notre politique de remboursement</li>
                                <li>Les prix peuvent être modifiés avec un préavis de 30 jours</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">6. Propriété Intellectuelle</h3>
                            <p className="text-muted-foreground">
                                Tous les droits de propriété intellectuelle de l'application, y compris le code,
                                le design, les logos et le contenu, appartiennent à Ma Caisse. Vous conservez
                                tous les droits sur les données que vous créez dans l'application.
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">7. Disponibilité du Service</h3>
                            <p className="text-muted-foreground">
                                Nous nous efforçons de maintenir l'application disponible 24/7, mais nous ne garantissons
                                pas une disponibilité ininterrompue. Nous pouvons effectuer des maintenances programmées
                                avec notification préalable.
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">8. Limitation de Responsabilité</h3>
                            <p className="text-muted-foreground">
                                Ma Caisse est fourni "tel quel". Nous ne sommes pas responsables des pertes
                                financières, pertes de données ou dommages indirects résultant de l'utilisation de
                                l'application. Nous vous recommandons de faire des sauvegardes régulières de vos données.
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">9. Résiliation</h3>
                            <p className="text-muted-foreground mb-2">
                                Nous nous réservons le droit de suspendre ou résilier votre compte si :
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                <li>Vous violez ces conditions d'utilisation</li>
                                <li>Vous utilisez l'application de manière abusive</li>
                                <li>Vous ne payez pas votre abonnement</li>
                                <li>Requis par la loi</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">
                                Vous pouvez supprimer votre compte à tout moment depuis les paramètres.
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">10. Modifications des Conditions</h3>
                            <p className="text-muted-foreground">
                                Nous pouvons modifier ces conditions à tout moment. Les modifications importantes
                                vous seront notifiées par email ou via l'application. Votre utilisation continue
                                après les modifications constitue votre acceptation des nouvelles conditions.
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">11. Loi Applicable</h3>
                            <p className="text-muted-foreground">
                                Ces conditions sont régies par les lois en vigueur au Bénin. Tout litige sera
                                soumis à la juridiction exclusive des tribunaux compétents.
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-2 font-semibold text-foreground">12. Contact</h3>
                            <p className="text-muted-foreground">
                                Pour toute question concernant ces conditions d'utilisation, contactez-nous :
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
