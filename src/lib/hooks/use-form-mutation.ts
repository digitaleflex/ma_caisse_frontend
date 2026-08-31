"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FieldValues, Path, PathValue } from "react-hook-form"
import { applyServerValidationErrors } from "@/lib/api"
import { toast } from "sonner"

interface UseFormMutationOptions<TData, TVariables> {
    mutationFn: (variables: TVariables) => Promise<TData>
    /** Clés de query à invalider après succès */
    invalidateKeys?: string[]
    /** Toast de succès */
    successMessage?: string | ((data: TData) => string)
    successDescription?: string
    /** Toast d'erreur par défaut */
    errorMessage?: string
    /** Callback après succès (close dialog, onSuccess mut...) */
    onSuccess?: (data: TData) => void
    /** Callback après erreur (en plus du toast et des erreurs serveur) */
    onError?: (error: any) => void
    /** setError de react-hook-form pour appliquer les erreurs serveur */
    setError?: (name: any, error: { type?: string; message?: string }) => void
}

/**
 * Hook centralisé pour une mutation React Query avec :
 * - Toast de succès / erreur
 * - Application des erreurs de validation serveur au formulaire
 * - Invalidation automatique des queries
 */
export function useFormMutation<TData = any, TVariables = any>({
    mutationFn,
    invalidateKeys = [],
    successMessage,
    successDescription,
    errorMessage,
    onSuccess,
    onError,
    setError,
}: UseFormMutationOptions<TData, TVariables>) {
    const queryClient = useQueryClient()

    return useMutation<TData, any, TVariables>({
        mutationFn,
        onSuccess: (data) => {
            if (invalidateKeys.length > 0) {
                invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
            }

            if (successMessage) {
                toast.success(typeof successMessage === "function" ? successMessage(data) : successMessage, {
                    description: successDescription,
                })
            }

            onSuccess?.(data)
        },
        onError: (error: any) => {
            if (setError && error?.body) {
                applyServerValidationErrors(setError, error.body)
            }
            // Erreur réseau (fetch reject => TypeError sans body) vs erreur HTTP
            const isNetworkError = !error?.status && !error?.body
            const message = error?.body?.message || errorMessage || (isNetworkError ? "Erreur réseau, veuillez réessayer" : "Une erreur est survenue")
            toast.error("Erreur", {
                description: message,
            })
            onError?.(error)
        },
    })
}