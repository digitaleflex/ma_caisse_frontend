"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { applyServerValidationErrors } from "@/lib/api"
import { EmailValidator } from "@/components/ui/email-validator"

interface ChangeEmailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentEmail: string
}

export function ChangeEmailDialog({ open, onOpenChange, currentEmail }: ChangeEmailDialogProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [newEmailValue, setNewEmailValue] = useState("")
    const { requestEmailChange, confirmEmailChange } = useAuth()

    // Step 1: Request email change
    const step1Schema = z.object({
        currentPassword: z.string().min(1, "Le mot de passe est requis"),
        newEmail: z.string().email("Email invalide"),
    })

    type Step1Values = z.infer<typeof step1Schema>

    const step1Form = useForm<Step1Values>({
        resolver: zodResolver(step1Schema),
        mode: "onChange",
        defaultValues: {
            currentPassword: "",
            newEmail: "",
        },
    })

    // Step 2: Confirm with OTP
    const step2Schema = z.object({
        code: z.string().length(6, "Le code doit contenir 6 chiffres"),
    })

    type Step2Values = z.infer<typeof step2Schema>

    const step2Form = useForm<Step2Values>({
        resolver: zodResolver(step2Schema),
        mode: "onChange",
        defaultValues: {
            code: "",
        },
    })

    const onStep1Submit = async (values: Step1Values) => {
        try {
            await requestEmailChange(values.currentPassword, values.newEmail)
            setNewEmailValue(values.newEmail)
            toast.success('Code envoyé', { description: `Un code de vérification a été envoyé à ${values.newEmail}` })
            setStep(2)
        } catch (e: any) {
            applyServerValidationErrors(step1Form.setError, e?.body)
            toast.error('Erreur', { description: e?.body?.message || 'Impossible d\'envoyer le code' })
        }
    }

    const onStep2Submit = async (values: Step2Values) => {
        try {
            await confirmEmailChange(newEmailValue, values.code)
            toast.success('Email modifié', { description: 'Votre email a été changé avec succès' })
            handleClose()
        } catch (e: any) {
            applyServerValidationErrors(step2Form.setError, e?.body)
            toast.error('Erreur', { description: e?.body?.message || 'Code invalide' })
        }
    }

    const handleClose = () => {
        setStep(1)
        setNewEmailValue("")
        step1Form.reset()
        step2Form.reset()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md rounded-2xl max-h-[75vh] overflow-hidden p-0 gap-0">
                <DialogHeader className="p-4 pb-2 border-b border-border/40">
                    <DialogTitle className="text-lg font-bold tracking-tight">Modifier l'email</DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                        {step === 1
                            ? "Identification requise"
                            : "Vérification en cours"}
                    </DialogDescription>
                </DialogHeader>
                <div className="p-4 overflow-y-auto scrollbar-thin">

                    {step === 1 ? (
                        <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email actuel</label>
                                <Input value={currentEmail} disabled className="h-10 rounded-xl bg-muted/50" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="currentPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Mot de passe actuel
                                </label>
                                <PasswordInput
                                    id="currentPassword"
                                    {...step1Form.register("currentPassword")}
                                    className="h-10 rounded-xl"
                                />
                                {step1Form.formState.errors.currentPassword && (
                                    <p className="text-[10px] font-medium text-destructive">
                                        {step1Form.formState.errors.currentPassword.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="newEmail" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Nouvel email
                                </label>
                                <Input
                                    id="newEmail"
                                    type="email"
                                    {...step1Form.register("newEmail")}
                                    className="h-10 rounded-xl"
                                />
                                {step1Form.formState.errors.newEmail && (
                                    <p className="text-[10px] font-medium text-destructive">
                                        {step1Form.formState.errors.newEmail.message}
                                    </p>
                                )}
                                <EmailValidator
                                    email={step1Form.watch("newEmail")}
                                    showValidation={!!step1Form.watch("newEmail")}
                                />
                            </div>
                            <DialogFooter className="flex-row gap-2 mt-4 pt-4 border-t border-border/40">
                                <Button type="button" variant="outline" onClick={handleClose} className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wide">
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={step1Form.formState.isSubmitting} className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wide shadow-sm">
                                    {step1Form.formState.isSubmitting ? '...' : 'Suivant'}
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : (
                        <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground text-center">
                                    Code envoyé à : <span className="font-bold text-foreground">{newEmailValue}</span>
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center block">
                                    Code de vérification
                                </label>
                                <Input
                                    id="code"
                                    placeholder="000000"
                                    maxLength={6}
                                    {...step2Form.register("code")}
                                    className="h-12 rounded-xl text-center text-xl font-black tracking-[0.5em] bg-muted/30 border-dashed"
                                />
                                {step2Form.formState.errors.code && (
                                    <p className="text-[10px] font-medium text-destructive text-center">
                                        {step2Form.formState.errors.code.message}
                                    </p>
                                )}
                            </div>
                            <DialogFooter className="flex-row gap-2 mt-4 pt-4 border-t border-border/40">
                                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wide">
                                    Retour
                                </Button>
                                <Button type="submit" disabled={step2Form.formState.isSubmitting} className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wide shadow-sm">
                                    {step2Form.formState.isSubmitting ? '...' : 'Confirmer'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
