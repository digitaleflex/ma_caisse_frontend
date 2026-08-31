"use client"

import { Check, X } from "lucide-react"

interface AmountValidatorProps {
    amount: string
    showValidation?: boolean
}

export function AmountValidator({ amount, showValidation = true }: AmountValidatorProps) {
    if (!amount || !showValidation) return null

    const numAmount = parseFloat(amount)
    const isValid = !isNaN(numAmount) && numAmount > 0

    return (
        <div className="flex items-center gap-2 text-sm">
            {isValid ? (
                <>
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-success font-medium">Montant valide</span>
                </>
            ) : (
                <>
                    <X className="h-4 w-4 text-destructive flex-shrink-0" />
                    <span className="text-destructive">Le montant doit être un nombre positif</span>
                </>
            )}
        </div>
    )
}
