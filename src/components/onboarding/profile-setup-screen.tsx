"use client"

import type React from "react"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Check, X } from "lucide-react"
import { FieldValidator } from "@/components/ui/field-validator"

interface ProfileSetupScreenProps {
  email: string
  onComplete: () => void
  onBack?: () => void
}

export function ProfileSetupScreen({ email, onComplete, onBack }: ProfileSetupScreenProps) {
  const [touched, setTouched] = useState<{ firstName: boolean; shopName: boolean; phoneNumber: boolean }>({ firstName: false, shopName: false, phoneNumber: false })
  const { requestOtp } = useAuth()

  const schema = z.object({
    firstName: z.string().trim().min(1, "Le prénom est requis"),
    shopName: z.string().trim().min(1, "Le nom de la boutique est requis"),
    phoneNumber: z.string()
      .trim()
      .transform(val => val.replace(/\s/g, ''))
      .refine(val => /^\+22901\d{8}$/.test(val), {
        message: "Format requis : +229 01 XX XX XX XX (ex: +229 01 97 00 00 00)"
      }),
  })

  type FormValues = z.infer<typeof schema>

  const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { firstName: "", shopName: "", phoneNumber: "" },
  })

  // Watch fields for real-time validation
  const firstName = useWatch({ control, name: "firstName", defaultValue: "" })
  const shopName = useWatch({ control, name: "shopName", defaultValue: "" })
  const phoneNumberValue = useWatch({ control, name: "phoneNumber", defaultValue: "" })

  const onSubmit = async (values: FormValues) => {
    try {
      await requestOtp(values.firstName.trim(), values.shopName.trim(), email, values.phoneNumber.trim())
      toast.success('Profil enregistré', { description: 'OTP envoyé par email.' })
      onComplete()
    } catch (e: any) {
      toast.error('Erreur', { description: e?.body?.message || 'Veuillez réessayer.' })
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 md:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurez votre profil</h1>
          <p className="text-xs text-muted-foreground">Dites-nous en plus sur vous et votre boutique</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Votre prénom
            </label>
            <Input
              id="firstName"
              type="text"
              placeholder="Ex: Kofi"
              {...register("firstName", {
                onChange: () => setTouched((t) => ({ ...t, firstName: true })),
                onBlur: () => setTouched((t) => ({ ...t, firstName: true })),
              })}
              className="h-10 rounded-xl border-input text-sm"
            />
            {touched.firstName && errors.firstName && (
              <p className="text-[10px] font-medium text-destructive">{errors.firstName.message}</p>
            )}
            <FieldValidator value={firstName} label="Prénom" showValidation={touched.firstName} />
          </div>

          <div className="space-y-2">
            <label htmlFor="shopName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Nom de votre boutique
            </label>
            <Input
              id="shopName"
              type="text"
              placeholder="Ex: Boutique Kofi"
              {...register("shopName", {
                onChange: () => setTouched((t) => ({ ...t, shopName: true })),
                onBlur: () => setTouched((t) => ({ ...t, shopName: true })),
              })}
              className="h-10 rounded-xl border-input text-sm"
            />
            {touched.shopName && errors.shopName && (
              <p className="text-[10px] font-medium text-destructive">{errors.shopName.message}</p>
            )}
            <FieldValidator value={shopName} label="Nom de la boutique" showValidation={touched.shopName} />
          </div>

          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Téléphone Principal (WhatsApp)
            </label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+229 97 00 00 00"
              {...register("phoneNumber", {
                onChange: () => setTouched((t) => ({ ...t, phoneNumber: true })),
                onBlur: () => setTouched((t) => ({ ...t, phoneNumber: true })),
              })}
              className="h-10 rounded-xl border-input text-sm"
            />
            {touched.phoneNumber && errors.phoneNumber && (
              <p className="text-[10px] font-medium text-destructive">{errors.phoneNumber.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1 px-1">
              ⚠️ Assurez-vous d'entrer un numéro valide et fonctionnel. Nous vous contacterons via WhatsApp ou appel téléphonique.
            </p>
            {touched.phoneNumber && phoneNumberValue && (
              <div className="flex items-center gap-2 text-sm mt-2">
                {/^\+22901\d{8}$/.test(phoneNumberValue.replace(/\s/g, '')) ? (
                  <>
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-success font-medium">Téléphone valide</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-destructive flex-shrink-0" />
                    <span className="text-destructive">Format incomplet</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 pt-2">
            <Button type="submit" disabled={!isValid || isSubmitting} className="h-10 w-full rounded-xl font-bold text-xs uppercase tracking-wide">
              {isSubmitting ? "Envoi..." : "Recevoir mon code OTP"}
            </Button>
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
