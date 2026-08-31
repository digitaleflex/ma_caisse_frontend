"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { applyServerValidationErrors } from "@/lib/api"
import { EmailValidator } from "@/components/ui/email-validator"

interface ForgotPasswordScreenProps {
    onBack: () => void
    onSuccess: (email: string) => void
}

export function ForgotPasswordScreen({ onBack, onSuccess }: ForgotPasswordScreenProps) {
    const [touched, setTouched] = useState<{ email: boolean }>({ email: false })
    const { requestPasswordReset } = useAuth()

    const schema = z.object({
        email: z.string().trim().toLowerCase().email("Email invalide"),
    })

    type FormValues = z.infer<typeof schema>

    const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, setError, control } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: { email: "" },
    })

    // Watch email for real-time validation
    const email = useWatch({ control, name: "email", defaultValue: "" })

    const onSubmit = async (values: FormValues) => {
        try {
            await requestPasswordReset(values.email)
            toast.success('Code envoyé', { description: 'Si un compte existe avec cet email, vous recevrez un code de réinitialisation.' })
            onSuccess(values.email)
        } catch (e: any) {
            applyServerValidationErrors(setError, e?.body)
            toast.error('Erreur', { description: e?.body?.message || 'Une erreur est survenue.' })
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 sm:px-4 md:px-6">
            <div className="w-full max-w-md space-y-6">
                <div className="space-y-1 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Mot de passe oublié</h1>
                    <p className="text-xs text-muted-foreground">Entrez votre email pour recevoir un code de réinitialisation</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="exemple@email.com"
                            aria-invalid={touched.email && !!errors.email ? true : undefined}
                            {...register("email", {
                                onChange: () => setTouched({ email: true }),
                                onBlur: () => setTouched({ email: true }),
                            })}
                            className="h-10 rounded-xl"
                        />
                        {touched.email && errors.email && (
                            <p className="text-[10px] font-medium text-destructive">{errors.email.message}</p>
                        )}
                        <EmailValidator email={email} showValidation={touched.email} />
                    </div>

                    <Button type="submit" disabled={!isValid || isSubmitting} className="h-10 w-full rounded-xl font-bold text-xs uppercase tracking-wide">
                        Envoyer le code
                    </Button>
                    <Button type="button" variant="ghost" onClick={onBack} className="h-10 w-full rounded-xl font-bold text-xs uppercase tracking-wide">
                        Retour
                    </Button>
                </form>
            </div>
        </div>
    )
}
