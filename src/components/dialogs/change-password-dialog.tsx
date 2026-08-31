"use client"

import { useForm, useWatch } from "react-hook-form"
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
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"
import { PasswordRequirements } from "@/components/ui/password-requirements"
import { PasswordMatchIndicator } from "@/components/ui/password-match-indicator"

interface ChangePasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const { changePassword } = useAuth()

    const schema = z.object({
        currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
        newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
        confirmPassword: z.string().min(1, "Veuillez confirmer le mot de passe"),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Les mots de passe ne correspondent pas",
        path: ["confirmPassword"],
    })

    type FormValues = z.infer<typeof schema>

    const { register, handleSubmit, formState: { errors, isSubmitting }, setError, reset, control } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    })

    // Watch password fields for real-time validation
    const newPassword = useWatch({ control, name: "newPassword", defaultValue: "" })
    const confirmPassword = useWatch({ control, name: "confirmPassword", defaultValue: "" })

    const onSubmit = async (values: FormValues) => {
        try {
            await changePassword(values.currentPassword, values.newPassword)
            toast.success('Mot de passe changé', { description: 'Votre mot de passe a été modifié avec succès.' })
            reset()
            onOpenChange(false)
        } catch (e: any) {
            applyServerValidationErrors(setError, e?.body)
            toast.error('Erreur', { description: e?.body?.message || 'Impossible de changer le mot de passe.' })
        }
    }

    // Reset form when dialog opens
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            reset()
        }
        onOpenChange(newOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md rounded-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Changer le mot de passe</DialogTitle>
                    <DialogDescription>
                        Entrez votre mot de passe actuel et choisissez un nouveau mot de passe.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <div className="space-y-2">
                        <label htmlFor="currentPassword" className="text-sm font-medium">
                            Mot de passe actuel
                        </label>
                        <PasswordInput
                            id="currentPassword"
                            {...register("currentPassword")}
                            className="h-10"
                        />
                        {errors.currentPassword && (
                            <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                        )}
                    </div>
                    <div className="space-y-3">
                        <label htmlFor="newPassword" className="text-sm font-medium">
                            Nouveau mot de passe
                        </label>
                        <PasswordInput
                            id="newPassword"
                            {...register("newPassword")}
                            className="h-10"
                        />
                        {errors.newPassword && (
                            <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                        )}
                        <PasswordStrengthIndicator password={newPassword} />
                        <PasswordRequirements password={newPassword} />
                    </div>
                    <div className="space-y-3">
                        <label htmlFor="confirmPassword" className="text-sm font-medium">
                            Confirmer le mot de passe
                        </label>
                        <PasswordInput
                            id="confirmPassword"
                            {...register("confirmPassword")}
                            className="h-10"
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                        )}
                        <PasswordMatchIndicator password={newPassword} confirmPassword={confirmPassword} />
                    </div>
                    {errors.root?.message && (
                        <p className="text-sm text-destructive">{errors.root.message}</p>
                    )}
                    <DialogFooter className="flex-row gap-2 mt-4 pt-2 border-t border-border/40">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wide">
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wide">
                            {isSubmitting ? '...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
