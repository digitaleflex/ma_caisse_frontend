"use client"

import { Check, X } from "lucide-react"

interface EmailValidatorProps {
    email: string
    showValidation?: boolean
}

export function EmailValidator({ email, showValidation = true }: EmailValidatorProps) {
    if (!email || !showValidation) return null

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = emailRegex.test(email)

    return (
        <div className="flex items-center gap-2 text-sm">
            {isValid ? (
                <>
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-success font-medium">Format email valide</span>
                </>
            ) : (
                <>
                    <X className="h-4 w-4 text-destructive flex-shrink-0" />
                    <span className="text-destructive">Format email invalide</span>
                </>
            )}
        </div>
    )
}
