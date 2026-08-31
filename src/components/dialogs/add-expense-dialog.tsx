"use client"

import type React from "react"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch, applyServerValidationErrors } from "@/lib/api"
import { AmountValidator } from "@/components/ui/amount-validator"
import { toast } from "sonner"

import { LimitReachedDialog } from "@/components/dialogs/limit-reached-dialog"

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateToSubscription?: () => void
}

const formSchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || isNaN(Number(val)) ? 0 : Number(val)),
    z.number().min(1, "Le montant doit être supérieur à 0")
  ),
  description: z.string().trim().min(1, "La description est requise"),
})

type FormValues = z.infer<typeof formSchema>

export function AddExpenseDialog({ open, onOpenChange, onNavigateToSubscription }: AddExpenseDialogProps) {
  const [touched, setTouched] = useState<{ amount: boolean; description: boolean }>({ amount: false, description: false })
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitInfo, setLimitInfo] = useState({ limit: 15 })
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid, isSubmitting },
    setValue,
    control,
  } = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { amount: 0, description: "" },
  })

  // Watch amount for real-time validation
  const amount = useWatch({ control, name: "amount", defaultValue: "" as any })

  const createExpenseMutation = useMutation({
    mutationFn: async (data: { amount: number; description: string }) => {
      return apiFetch("/api/expenses/add-expense", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
    onSuccess: (data, variables) => {
      // Invalider les queries pour rafraîchir la liste
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      toast.success("Dépense enregistrée", {
        description: `Dépense de ${variables.amount} FCFA ajoutée avec succès`,
      })
      reset()
      setTouched({ amount: false, description: false })
      onOpenChange(false)
    },
    onError: (error: any) => {
      if (error.status === 403 && error.body?.code === 'LIMIT_REACHED') {
        setLimitInfo({ limit: error.body.limit || 15 })
        onOpenChange(false)
        setShowLimitDialog(true)
        return
      }
      applyServerValidationErrors(setError, error.body)
      toast.error("Erreur", {
        description: error.body?.message || "Impossible d'ajouter la dépense",
      })
    },
  })

  const onSubmit = (values: FormValues) => {
    createExpenseMutation.mutate({
      amount: values.amount,
      description: values.description.trim(),
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-3xl sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Ajouter une Dépense</DialogTitle>
            <DialogDescription>
              Renseignez le montant et la raison de cette dépense.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="expense-amount" className="text-sm font-semibold text-foreground">
                Montant (FCFA)
              </label>
              <Input
                id="expense-amount"
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
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold text-foreground">
                Description
              </label>
              <Input
                id="description"
                type="text"
                placeholder="Ex: Achat de stock"
                aria-invalid={touched.description && !!errors.description ? true : undefined}
                {...register("description", {
                  onChange: () => setTouched((t) => ({ ...t, description: true })),
                  onBlur: () => setTouched((t) => ({ ...t, description: true })),
                })}
                className="h-10 rounded-full text-sm"
              />
              {touched.description && errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
            <Button type="submit" size="lg" disabled={!isValid || isSubmitting || createExpenseMutation.isPending} className="h-10 w-full rounded-full text-sm font-semibold">
              {createExpenseMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <LimitReachedDialog
        open={showLimitDialog}
        onOpenChange={setShowLimitDialog}
        limitType="Dépenses"
        currentLimit={limitInfo.limit}
        onUpgrade={() => {
          setShowLimitDialog(false)
          onNavigateToSubscription?.()
        }}
      />
    </>
  )
}
