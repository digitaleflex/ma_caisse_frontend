"use client"

import React from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: "destructive" | "default"
    loading?: boolean
    onConfirm?: () => void
}

/**
 * Dialogue de confirmation générique (suppression, actions critiques).
 * Centralise le pattern AlertDialog répété dans tous les onglets.
 */
export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    variant = "destructive",
    loading = false,
    onConfirm,
}: ConfirmationDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-center">{title}</AlertDialogTitle>
                    {description && (
                        <AlertDialogDescription className="text-center">
                            {description}
                        </AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row justify-center gap-3">
                    <AlertDialogCancel className="rounded-xl font-bold flex-1" disabled={loading}>
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={loading}
                        className={`rounded-xl font-bold flex-1 ${variant === "destructive"
                            ? "bg-destructive hover:bg-destructive/90"
                            : "bg-primary hover:bg-primary/90"
                            }`}
                    >
                        {loading ? "..." : confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}