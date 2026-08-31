"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch, applyServerValidationErrors } from "@/lib/api"
import { AmountValidator } from "@/components/ui/amount-validator"
import { toast } from "sonner"

import { LimitReachedDialog } from "@/components/dialogs/limit-reached-dialog"

interface AddDebtorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateToSubscription?: () => void
}

const formSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  amount: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || isNaN(Number(val)) ? 0 : Number(val)),
    z.number().min(1, "Le montant doit être supérieur à 0")
  ),
  phone: z.string().trim().optional().refine((val) => {
    if (!val) return true;
    // Format Bénin : Passage à 10 chiffres (01 + ancien numéro)
    const cleanVal = val.replace(/\s/g, '').replace(/^\+229/, '').replace(/^00229/, '');
    return /^\d{10}$/.test(cleanVal);
  }, "Numéro invalide (10 chiffres requis pour le Bénin)"),
})

type FormValues = z.infer<typeof formSchema>

export function AddDebtorDialog({ open, onOpenChange, onNavigateToSubscription }: AddDebtorDialogProps) {
  const [touched, setTouched] = useState<{ name: boolean; amount: boolean; phone: boolean }>({ name: false, amount: false, phone: false })
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitInfo, setLimitInfo] = useState({ limit: 15 })
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
    control,
  } = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { name: "", amount: 0, phone: "" },
  })

  // Watch field values to check if form is filled
  const nameValue = watch("name") || ""
  const amountValue = watch("amount")
  const amount = useWatch({ control, name: "amount", defaultValue: "" as any })

  // Check if all required fields are filled with valid values
  const isFormFilled = nameValue.trim() !== "" && Number(amountValue) > 0

  const createDebtorMutation = useMutation({
    mutationFn: async (data: { name: string; amount: number; phone?: string }) => {
      return apiFetch("/api/debtors/add-debtor", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["debtors"] })
      toast.success("Crédit enregistré", {
        description: `Crédit de ${variables.amount} FCFA pour ${variables.name} ajouté`,
      })
      reset()
      setTouched({ name: false, amount: false, phone: false })
      onOpenChange(false)
    },
    onError: (error: any) => {
      if (error.status === 403 && error.body?.code === 'LIMIT_REACHED') {
        setLimitInfo({ limit: error.body.limit || 15 })
        onOpenChange(false)
        setShowLimitDialog(true)
        return
      }
      console.error(error)
      applyServerValidationErrors(setError, error.body)
      toast.error("Erreur", {
        description: error.body?.message || "Impossible d'ajouter le crédit",
      })
    },
  })

  const onSubmit = (values: FormValues) => {
    createDebtorMutation.mutate({
      name: values.name.trim(),
      amount: values.amount as number,
      phone: values.phone?.trim(),
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-3xl sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Ajouter un Crédit</DialogTitle>
            <DialogDescription>
              Enregistrez une nouvelle dette client.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="debtor-name" className="text-sm font-semibold text-foreground">
                Nom du Client
              </label>
              <Input
                id="debtor-name"
                type="text"
                placeholder="Ex: Kofi Mensah"
                aria-invalid={touched.name && !!errors.name ? true : undefined}
                {...register("name", {
                  onChange: () => setTouched((t) => ({ ...t, name: true })),
                  onBlur: () => setTouched((t) => ({ ...t, name: true })),
                })}
                className="h-10 rounded-full text-sm"
              />
              {touched.name && errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="debtor-phone" className="text-sm font-semibold text-foreground">
                Téléphone (Optionnel)
              </label>
              <Input
                id="debtor-phone"
                type="tel"
                placeholder="Ex: 01 97 00 00 00"
                aria-invalid={touched.phone && !!errors.phone ? true : undefined}
                {...register("phone", {
                  onChange: () => setTouched((t) => ({ ...t, phone: true })),
                  onBlur: () => setTouched((t) => ({ ...t, phone: true })),
                })}
                className="h-10 rounded-full text-sm"
              />
              {touched.phone && errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <label htmlFor="debt-amount" className="text-sm font-semibold text-foreground">
                Montant (FCFA)
              </label>
              <Input
                id="debt-amount"
                type="number"
                placeholder="0"
                inputMode="numeric"
                aria-invalid={touched.amount && !!errors.amount ? true : undefined}
                {...register("amount", {
                  valueAsNumber: true,
                  onChange: () => setTouched((t) => ({ ...t, amount: true })),
                  onBlur: () => setTouched((t) => ({ ...t, amount: true })),
                })}
                className="h-10 rounded-full text-sm"
                min="0"
                step="1"
              />
              {touched.amount && errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
              <AmountValidator amount={String(amount || "")} showValidation={touched.amount} />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={!isFormFilled || isSubmitting || createDebtorMutation.isPending}
              className="h-10 w-full rounded-full text-sm font-semibold"
            >
              {createDebtorMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog >

      <LimitReachedDialog
        open={showLimitDialog}
        onOpenChange={setShowLimitDialog}
        limitType="Crédits"
        currentLimit={limitInfo.limit}
        onUpgrade={() => {
          setShowLimitDialog(false)
          onNavigateToSubscription?.()
        }}
      />
    </>
  )
}
