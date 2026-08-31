"use client"

import { Check, X } from "lucide-react"

interface PasswordMatchIndicatorProps {
    password: string
    confirmPassword: string
    showMatch?: boolean
}

export function PasswordMatchIndicator({ password, confirmPassword, showMatch = true }: PasswordMatchIndicatorProps) {
    if (!confirmPassword || !showMatch) return null

    const passwordsMatch = password === confirmPassword

    return (
        <div className="flex items-center gap-2 text-sm">
            {passwordsMatch ? (
                <>
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-success font-medium">Les mots de passe correspondent</span>
                </>
            ) : (
                <>
                    <X className="h-4 w-4 text-destructive flex-shrink-0" />
                    <span className="text-destructive">Les mots de passe ne correspondent pas</span>
                </>
            )}
        </div>
    )
}
