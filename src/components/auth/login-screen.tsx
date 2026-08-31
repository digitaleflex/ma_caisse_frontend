"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { apiFetch, applyServerValidationErrors } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { EmailValidator } from "@/components/ui/email-validator"

interface LoginScreenProps {
  onBack: () => void
  onSuccess?: () => void
  onCompleteRegistration?: (email: string) => void
  onForgotPassword?: () => void
}

export function LoginScreen({ onBack, onSuccess, onCompleteRegistration, onForgotPassword }: LoginScreenProps) {
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({ email: false, password: false })
  const [incompleteRegistration, setIncompleteRegistration] = useState<{ email: string } | null>(null)
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  const { login } = useAuth()

  const schema = z.object({
    email: z.string().trim().toLowerCase().email("Email invalide"),
    password: z.string().min(8, "Au moins 8 caractères"),
  })

  type FormValues = z.infer<typeof schema>

  const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, setError, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  })

  // Watch email for real-time validation
  const email = useWatch({ control, name: "email", defaultValue: "" })

  const onSubmit = async (_values: FormValues) => {
    try {
      // Use auth context's login method which properly updates React state
      await login(_values.email, _values.password)

      toast.success('Connexion réussie')
      onSuccess?.()
    } catch (e: any) {
      // Check if this is an incomplete registration error
      if (e?.body?.requiresSetup) {
        setIncompleteRegistration({ email: _values.email })
        toast.info('Inscription incomplète', {
          description: 'Veuillez compléter votre inscription en définissant un mot de passe.'
        })
      } else {
        applyServerValidationErrors(setError, e?.body)
        toast.error('Connexion échouée', {
          description: e?.body?.message || 'Veuillez vérifier vos identifiants.'
        })
      }
    }
  }

  const handleCompleteRegistration = async () => {
    if (!incompleteRegistration) return

    setIsResendingOtp(true)
    try {
      await apiFetch(`/api/auth/resend-setup-otp`, {
        method: 'POST',
        body: JSON.stringify({ email: incompleteRegistration.email }),
      })

      toast.success('Code envoyé', {
        description: 'Un nouveau code OTP a été envoyé à votre email.'
      })

      // Navigate to OTP screen
      onCompleteRegistration?.(incompleteRegistration.email)
      setIncompleteRegistration(null)
    } catch (e: any) {
      toast.error('Erreur', {
        description: e?.body?.message || 'Impossible d\'envoyer le code OTP.'
      })
    } finally {
      setIsResendingOtp(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 sm:px-4 md:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Se connecter</h1>
          <p className="text-xs text-muted-foreground">Entrez vos identifiants pour accéder à votre boutique</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
            <Input
              id="email"
              type="email"
              aria-invalid={touched.email && !!errors.email ? true : undefined}
              {...register("email", {
                onChange: () => setTouched((t) => ({ ...t, email: true })),
                onBlur: () => setTouched((t) => ({ ...t, email: true })),
              })}
              className="h-10 rounded-xl"
            />
            {touched.email && errors.email && (
              <p className="text-[10px] font-medium text-destructive">{errors.email.message}</p>
            )}
            <EmailValidator email={email} showValidation={touched.email} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mot de passe</label>
              {onForgotPassword && (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wide"
                >
                  Oublié ?
                </button>
              )}
            </div>
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
          </div>
          {errors.root?.message && (
            <p className="text-[10px] font-medium text-destructive">{errors.root.message}</p>
          )}

          {incompleteRegistration && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <p className="mb-3 text-sm text-amber-800 dark:text-amber-200">
                Votre inscription n'est pas terminée. Cliquez ci-dessous pour recevoir un nouveau code et définir votre mot de passe.
              </p>
              <Button
                type="button"
                onClick={handleCompleteRegistration}
                disabled={isResendingOtp}
                className="h-10 w-full bg-amber-600 hover:bg-amber-700"
              >
                {isResendingOtp ? 'Envoi en cours...' : 'Compléter mon inscription'}
              </Button>
            </div>
          )}

          <Button type="submit" disabled={!isValid || isSubmitting || !!incompleteRegistration} className="h-10 w-full rounded-xl font-bold text-xs uppercase tracking-wide">Se connecter</Button>
          <Button type="button" variant="ghost" onClick={onBack} className="h-10 w-full rounded-xl font-bold text-xs uppercase tracking-wide">Retour</Button>
        </form>
      </div>
    </div>
  )
}


