"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Store } from "lucide-react"

interface WelcomeScreenProps {
  onContinue: (email: string) => void
  onLogin: () => void
}

export function WelcomeScreen({ onContinue, onLogin }: WelcomeScreenProps) {
  const [touched, setTouched] = useState<{ email: boolean }>({ email: false })

  const schema = z.object({
    email: z.string().trim().toLowerCase().email("Email invalide"),
  })

  type FormValues = z.infer<typeof schema>

  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "" },
  })

  const onSubmit = (values: FormValues) => {
    onContinue(values.email.trim())
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 md:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Store className="h-10 w-10 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-center text-2xl font-bold tracking-tight text-foreground">Ma Caisse</h1>
          <p className="text-center text-sm text-muted-foreground">Votre caisse dans votre poche</p>
        </div>

        {/* Email Input Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2 text-center sm:text-left">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground block text-center">
              Votre adresse email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@domaine.com"
              aria-invalid={touched.email && !!errors.email ? true : undefined}
              {...register("email", {
                onChange: () => setTouched({ email: true }),
                onBlur: () => setTouched({ email: true }),
              })}
              className="h-10 rounded-xl border-input text-center"
            />
            {touched.email && errors.email && (
              <p className="text-[10px] font-medium text-destructive text-center">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button type="submit" disabled={!isValid} className="h-10 w-full rounded-xl font-bold text-xs uppercase tracking-wide shadow-sm">
              S’inscrire
            </Button>
            <Button type="button" variant="ghost" onClick={onLogin} className="h-10 w-full rounded-xl font-bold text-xs uppercase tracking-wide text-muted-foreground">
              Se connecter
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
