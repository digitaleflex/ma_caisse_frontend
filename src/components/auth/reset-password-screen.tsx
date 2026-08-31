"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { applyServerValidationErrors } from "@/lib/api"
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"
import { PasswordRequirements } from "@/components/ui/password-requirements"

interface ResetPasswordScreenProps {
    email: string
    onBack: () => void
    onSuccess: () => void
}

export function ResetPasswordScreen({ email, onBack, onSuccess }: ResetPasswordScreenProps) {
    const [touched, setTouched] = useState<{ code: boolean; password: boolean }>({ code: false, password: false })
    const { resetPassword } = useAuth()

    const schema = z.object({
        code: z.string().length(6, "Le code doit contenir 6 chiffres"),
        password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    })

    type FormValues = z.infer<typeof schema>

    const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, setError, control } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: { code: "", password: "" },
    })

    // Watch password for real-time validation
    const password = useWatch({ control, name: "password", defaultValue: "" })

    const onSubmit = async (values: FormValues) => {
        try {
            await resetPassword(email, values.code, values.password)
            toast.success('Mot de passe réinitialisé', { description: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.' })
            onSuccess()
        } catch (e: any) {
            applyServerValidationErrors(setError, e?.body)
            toast.error('Erreur', { description: e?.body?.message || 'Impossible de réinitialiser le mot de passe.' })
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 md:px-6">
            <div className="w-full max-w-md space-y-6">
                <div className="space-y-1 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Réinitialisation</h1>
                    <p className="text-xs text-muted-foreground">Entrez le code reçu par email et votre nouveau mot de passe</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center block">Code de vérification</label>
                        <Input
                            id="code"
                            type="text"
                            placeholder="000000"
                            maxLength={6}
                            aria-invalid={touched.code && !!errors.code ? true : undefined}
                            {...register("code", {
                                onChange: () => setTouched((t) => ({ ...t, code: true })),
                                onBlur: () => setTouched((t) => ({ ...t, code: true })),
                            })}
                            className="h-12 rounded-xl text-center text-xl font-black tracking-[0.5em] bg-muted/30 border-dashed"
                        />
                        {touched.code && errors.code && (
                            <p className="text-[10px] font-medium text-destructive text-center">{errors.code.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nouveau mot de passe</label>
                        <PasswordInput
                            id="password"
                            aria-invalid={touched.password && !!errors.password ? true : undefined}
                            {...register("password", {
                                onChange: () => setTouched((t) => ({ ...t, password: true })),
                                onBlur: () => setTouched((t) => ({ ...t, password: true })),
                            })}
                            className="h-10 rounded-xl"
                        />
                        {touched.password && errors.password && (
                            <p className="text-[10px] font-medium text-destructive">{errors.password.message}</p>
                        )}
                        <PasswordStrengthIndicator password={password} />
                        <PasswordRequirements password={password} />
                    </div>

                    <Button type="submit" disabled={!isValid || isSubmitting} className="h-10 w-full rounded-xl font-bold text-xs uppercase tracking-wide">
                        Réinitialiser le mot de passe
                    </Button>
                    <Button type="button" variant="ghost" onClick={onBack} className="h-10 w-full rounded-xl font-bold text-xs uppercase tracking-wide">
                        Retour
                    </Button>
                </form>
            </div>
        </div>
    )
}
