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
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"
import { PasswordRequirements } from "@/components/ui/password-requirements"
import { PasswordMatchIndicator } from "@/components/ui/password-match-indicator"

interface SetPasswordScreenProps {
  email: string
  setupToken?: string
  onSuccess: () => void
  onBack?: () => void
  onTokenExpired?: (email: string) => void
}

export function SetPasswordScreen({ email, setupToken, onSuccess, onBack, onTokenExpired }: SetPasswordScreenProps) {
  const [touched, setTouched] = useState<{ password: boolean; confirm: boolean }>({ password: false, confirm: false })
  const [tokenExpired, setTokenExpired] = useState(false)
  const [isRequestingNewCode, setIsRequestingNewCode] = useState(false)
  const { setPassword } = useAuth()

  const schema = z
    .object({
      password: z
        .string()
        .min(8, "Au moins 8 caractères")
        .max(128, "Maximum 128 caractères"),
      confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, {
      message: "Les mots de passe ne correspondent pas",
      path: ["confirm"],
    })

  type FormValues = z.infer<typeof schema>

  const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, setError, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { password: "", confirm: "" },
  })

  // Watch password fields for real-time validation
  const password = useWatch({ control, name: "password", defaultValue: "" })
  const confirmPassword = useWatch({ control, name: "confirm", defaultValue: "" })

  const onSubmit = async (_values: FormValues) => {
    try {
      await setPassword(email, _values.password, setupToken || '')
      toast.success('Mot de passe enregistré', { description: 'Vous pouvez maintenant vous connecter.' })
      onSuccess()
    } catch (e: any) {
      // Check if token expired
      if (e?.body?.message?.includes('expiré') || e?.body?.message?.includes('invalide')) {
        setTokenExpired(true)
        toast.error('Jeton expiré', { description: 'Votre jeton de configuration a expiré. Veuillez demander un nouveau code.' })
      } else {
        toast.error('Échec', { description: e?.body?.message || 'Veuillez réessayer.' })
      }
    }
  }

  const handleRequestNewCode = async () => {
    setIsRequestingNewCode(true)
    try {
      const response = await fetch(`/api/auth/resend-setup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('Failed to send OTP')
      }

      toast.success('Code envoyé', { description: 'Un nouveau code OTP a été envoyé à votre email.' })

      // Navigate back to OTP screen
      onTokenExpired?.(email)
    } catch (e: any) {
      toast.error('Erreur', { description: 'Impossible d\'envoyer le code OTP.' })
    } finally {
      setIsRequestingNewCode(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 md:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Mot de passe</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold opacity-60">Compte: {email}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mot de passe</label>
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
          <div className="space-y-2">
            <label htmlFor="confirm" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirmer</label>
            <PasswordInput
              id="confirm"
              aria-invalid={touched.confirm && !!errors.confirm ? true : undefined}
              {...register("confirm", {
                onChange: () => setTouched((t) => ({ ...t, confirm: true })),
                onBlur: () => setTouched((t) => ({ ...t, confirm: true })),
              })}
              className="h-10 rounded-xl"
            />
            {touched.confirm && errors.confirm && (
              <p className="text-[10px] font-medium text-destructive">{errors.confirm.message}</p>
            )}
            <PasswordMatchIndicator password={password} confirmPassword={confirmPassword} />
          </div>

          {errors.root?.message && (
            <p className="text-[10px] font-medium text-destructive">{errors.root.message}</p>
          )}

          {tokenExpired && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="mb-3 text-sm text-red-800 dark:text-red-200">
                Votre jeton de configuration a expiré. Veuillez demander un nouveau code OTP pour continuer.
              </p>
              <Button
                type="button"
                onClick={handleRequestNewCode}
                disabled={isRequestingNewCode}
                className="h-10 w-full bg-red-600 hover:bg-red-700"
              >
                {isRequestingNewCode ? 'Envoi en cours...' : 'Demander un nouveau code'}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            <Button type="submit" disabled={!isValid || isSubmitting} className="h-10 w-full rounded-xl font-bold text-xs uppercase tracking-wide">Enregistrer</Button>
            {onBack && (
              <Button type="button" variant="ghost" onClick={onBack} className="h-10 w-full rounded-xl font-bold text-xs uppercase tracking-wide">
                Retour
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}


