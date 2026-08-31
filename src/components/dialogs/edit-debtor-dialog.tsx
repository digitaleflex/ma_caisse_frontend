"use client"

import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch, applyServerValidationErrors } from "@/lib/api"
import { AmountValidator } from "@/components/ui/amount-validator"
import { toast } from "sonner"
import { Loader2, User, Phone, Wallet } from "lucide-react"

interface Debtor {
    _id: string
    name: string
    amount: number
    phone?: string
}

interface EditDebtorDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    debtor: Debtor | null
}

const formSchema = z.object({
    name: z.string().trim().min(1, "Le nom est requis"),
    amount: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
        z.number().min(1, "Le montant doit être supérieur à 0")
    ),
    phone: z.string().trim().optional().refine((val) => {
        if (!val) return true;
        const cleanVal = val.replace(/\s/g, '').replace(/^\+229/, '').replace(/^00229/, '');
        return cleanVal === "" || /^\d{10}$/.test(cleanVal);
    }, "Numéro invalide (10 chiffres requis)"),
})

type FormValues = z.infer<typeof formSchema>

export function EditDebtorDialog({ open, onOpenChange, debtor }: EditDebtorDialogProps) {
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        reset,
        setError,
        control,
        formState: { errors, isValid, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        mode: "onChange",
        defaultValues: { name: "", amount: 0, phone: "" },
    })

    const amount = useWatch({ control, name: "amount" })

    useEffect(() => {
        if (debtor && open) {
            reset({
                name: debtor.name,
                phone: debtor.phone || "",
                amount: debtor.amount,
            })
            setTouched({})
        }
    }, [debtor, open, reset])

    const updateDebtorMutation = useMutation({
        mutationFn: async (data: FormValues) => {
            return apiFetch(`/api/debtors/update-debtor/${debtor?._id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["debtors"] })
            toast.success("Client mis à jour", {
                description: "Les informations du client ont été modifiées avec succès",
            })
            onOpenChange(false)
        },
        onError: (error: any) => {
            applyServerValidationErrors(setError, error.body)
            toast.error("Erreur", {
                description: error.body?.message || "Impossible de mettre à jour le client",
            })
        },
    })

    const onSubmit = (values: FormValues) => {
        updateDebtorMutation.mutate(values)
    }

    const handleFieldTouch = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-md max-h-[80vh] overflow-y-auto border-border">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Modifier le Client</DialogTitle>
                    <DialogDescription>
                        Mettez à jour les informations du crédit pour ce client.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <div className="space-y-2">
                        <label htmlFor="edit-debtor-name" className="text-sm font-semibold text-foreground">
                            Nom du Client
                        </label>
                        <Input
                            id="edit-debtor-name"
                            {...register("name")}
                            onBlur={() => handleFieldTouch("name")}
                            placeholder="Ex: Jean Kouassi"
                            className="h-10 rounded-full text-sm"
                        />
                        {touched.name && errors.name && (
                            <p className="text-xs text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="edit-debtor-phone" className="text-sm font-semibold text-foreground">
                            Téléphone (Optionnel)
                        </label>
                        <Input
                            id="edit-debtor-phone"
                            type="tel"
                            {...register("phone")}
                            onBlur={() => handleFieldTouch("phone")}
                            placeholder="Ex: 0102030405"
                            className="h-10 rounded-full text-sm"
                        />
                        {touched.phone && errors.phone && (
                            <p className="text-xs text-destructive">{errors.phone.message}</p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="edit-debtor-amount" className="text-sm font-semibold text-foreground">
                            Montant (FCFA)
                        </label>
                        <Input
                            id="edit-debtor-amount"
                            type="number"
                            {...register("amount", { valueAsNumber: true })}
                            onBlur={() => handleFieldTouch("amount")}
                            placeholder="0"
                            className="h-10 rounded-full text-sm font-bold"
                        />
                        {touched.amount && errors.amount && (
                            <p className="text-xs text-destructive">{errors.amount.message}</p>
                        )}
                        <AmountValidator amount={String(amount || "")} showValidation={touched.amount} />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            size="lg"
                            disabled={!isValid || isSubmitting || updateDebtorMutation.isPending}
                            className="h-10 w-full rounded-full text-sm font-semibold transition-all shadow-lg text-white"
                        >
                            {updateDebtorMutation.isPending ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Mise à jour...</>
                            ) : (
                                "Enregistrer les modifications"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
