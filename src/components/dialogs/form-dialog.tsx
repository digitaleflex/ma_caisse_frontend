"use client"

import React, { useEffect, useState } from "react"
import { FieldValues, useForm, UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useFormMutation } from "@/lib/hooks/use-form-mutation"

interface FormDialogProps<TFormValues extends FieldValues> {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    schema: z.ZodType<any, any, any>
    defaultValues?: Record<string, any> | (() => Record<string, any>)
    /** Valeurs à injecter à l'ouverture (mode édition) */
    editValues?: Record<string, any> | null
    contentClassName?: string
    /** Fonction de mutation. Reçoit les valeurs, retourne la promesse. */
    mutationFn?: (values: TFormValues) => Promise<any>
    /** Clés de query à invalider après succès */
    invalidateKeys?: string[]
    successMessage?: string
    successDescription?: string
    errorMessage?: string
    /** Callback après succès */
    onSuccess?: (data: any, form: UseFormReturn<TFormValues>) => void
    submitLabel?: string
    submittingLabel?: string
    /** Rend le bouton de soumission désactivé quand formulaire invalide */
    disableWhenInvalid?: boolean
    /** Rendu des champs du formulaire */
    children: (props: {
        form: UseFormReturn<TFormValues>
        touched: Record<string, boolean>
        handleFieldTouch: (field: string) => void
        isSubmitting: boolean
    }) => React.ReactNode
}

/**
 * Dialogue générique avec formulaire validé par Zod + mutation React Query.
 * Centralise le pattern commun à tous les dialogues de formulaire :
 * open/close, reset, mutation avec toast, erreurs serveur, invalidation de queries, soumission.
 */
export function FormDialog<TFormValues extends FieldValues = any>({
    open,
    onOpenChange,
    title,
    description,
    schema,
    defaultValues = {},
    editValues,
    contentClassName = "",
    mutationFn,
    invalidateKeys = [],
    successMessage,
    successDescription,
    errorMessage,
    onSuccess,
    submitLabel = "Enregistrer",
    submittingLabel = "Enregistrement...",
    disableWhenInvalid = true,
    children,
}: FormDialogProps<TFormValues>) {
    const [touched, setTouched] = useState<Record<string, boolean>>({})

    const form = useForm<TFormValues>({
        resolver: zodResolver(schema) as any,
        mode: "onChange",
        defaultValues: (typeof defaultValues === "function" ? defaultValues() : defaultValues) as any,
    })

    const { reset, setError, formState: { isValid, isSubmitting } } = form

    // Reset du formulaire à l'ouverture / au changement des valeurs d'édition
    useEffect(() => {
        if (open) {
            const values = editValues || (typeof defaultValues === "function" ? defaultValues() : defaultValues)
            reset(values as any)
            setTouched({})
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, reset])

    // Si une mutationFn est fournie, gérer tout en interne. Sinon, onSubmit gère la mutation.
    const mutation = mutationFn ? useFormMutation<TFormValues>({
        mutationFn: mutationFn as any,
        invalidateKeys,
        successMessage,
        successDescription,
        errorMessage,
        setError,
        onSuccess: (data) => onSuccess?.(data as any, form),
    }) : null

    const handleFormSubmit = (values: TFormValues) => {
        // Si mutation fournie, on la déclenche. Sinon, on passe les valeurs au parent via onSuccess contract.
        if (mutation) {
            mutation.mutate(values as any, {
                onSuccess: () => reset(),
            })
        }
    }

    const handleFieldTouch = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }))
    }

    const handleClose = (next: boolean) => {
        if (!next) {
            reset()
            setTouched({})
        }
        onOpenChange(next)
    }

    const isPending = mutation?.isPending || isSubmitting

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className={`rounded-3xl sm:max-w-md max-h-[80vh] overflow-y-auto border-border ${contentClassName}`}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-3">
                    {children({ form, touched, handleFieldTouch, isSubmitting: isPending })}
                    <div className="pt-2">
                        <Button
                            type="submit"
                            size="lg"
                            disabled={(disableWhenInvalid && !isValid) || isPending}
                            className="h-10 w-full rounded-full font-semibold transition-all shadow-lg text-white text-sm"
                        >
                            {isPending ? submittingLabel : submitLabel}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}