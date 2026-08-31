"use client"

import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch, applyServerValidationErrors } from "@/lib/api"
import { AmountValidator } from "@/components/ui/amount-validator"
import { FieldValidator } from "@/components/ui/field-validator"
import { toast } from "sonner"

interface EditExpenseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    expense: {
        id: string
        amount: number
        description: string
    } | null
}

const formSchema = z.object({
    amount: z.preprocess(
        (val) => (val === "" || val === null || val === undefined || isNaN(Number(val)) ? 0 : Number(val)),
        z.number().min(1, "Le montant doit être supérieur à 0")
    ),
    description: z.string().trim().min(1, "La description est requise"),
})

type FormValues = z.infer<typeof formSchema>

export function EditExpenseDialog({ open, onOpenChange, expense }: EditExpenseDialogProps) {
    const [touched, setTouched] = useState<{ amount: boolean; description: boolean }>({ amount: false, description: false })
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

    // Watch fields for real-time validation
    const amount = useWatch({ control, name: "amount", defaultValue: "" as any })
    const description = useWatch({ control, name: "description", defaultValue: "" })

    useEffect(() => {
        if (expense && open) {
            setValue("amount", expense.amount)
            setValue("description", expense.description)
            setTouched({ amount: false, description: false })
        }
    }, [expense, open, setValue])

    const updateExpenseMutation = useMutation({
        mutationFn: async (data: { amount: number; description: string }) => {
            if (!expense) return
            return apiFetch(`/api/expenses/update-expense/${expense.id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] })
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
            toast.success("Dépense modifiée", {
                description: "La dépense a été mise à jour avec succès",
            })
            onOpenChange(false)
            reset()
        },
        onError: (error: any) => {
            applyServerValidationErrors(setError, error.body)
            toast.error("Erreur", {
                description: error.body?.message || "Impossible de modifier la dépense",
            })
        },
    })

    const onSubmit = (values: FormValues) => {
        updateExpenseMutation.mutate({
            amount: values.amount,
            description: values.description.trim(),
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Modifier la Dépense</DialogTitle>
                    <DialogDescription>
                        Mettez à jour les informations de cette dépense.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <div className="space-y-2">
                        <label htmlFor="edit-expense-amount" className="text-sm font-semibold text-foreground">
                            Montant (FCFA)
                        </label>
                        <Input
                            id="edit-expense-amount"
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
                        <label htmlFor="edit-expense-description" className="text-sm font-semibold text-foreground">
                            Description
                        </label>
                        <Input
                            id="edit-expense-description"
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
                        <FieldValidator value={description} label="Description" showValidation={touched.description} />
                    </div>
                    <Button type="submit" size="lg" disabled={!isValid || isSubmitting || updateExpenseMutation.isPending} className="h-10 w-full rounded-full text-sm font-semibold">
                        {updateExpenseMutation.isPending ? "Modification..." : "Modifier"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
