"use client"

import { Check, X } from "lucide-react"

interface FieldValidatorProps {
    value: string
    label: string
    minLength?: number
    showValidation?: boolean
}

export function FieldValidator({ value, label, minLength = 1, showValidation = true }: FieldValidatorProps) {
    if (!value || !showValidation) return null

    const isValid = value.trim().length >= minLength

    return (
        <div className="flex items-center gap-2 text-sm">
            {isValid ? (
                <>
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-success font-medium">{label} valide</span>
                </>
            ) : (
                <>
                    <X className="h-4 w-4 text-destructive flex-shrink-0" />
                    <span className="text-destructive">{label} requis{minLength > 1 ? ` (min ${minLength} caractères)` : ""}</span>
                </>
            )}
        </div>
    )
}
