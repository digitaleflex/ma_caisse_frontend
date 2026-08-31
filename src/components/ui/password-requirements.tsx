"use client"

import { Check, X } from "lucide-react"

interface PasswordRequirementsProps {
    password: string
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
    const requirements = [
        {
            label: "Au moins 8 caractères",
            met: password.length >= 8,
        },
        {
            label: "Contient des lettres",
            met: /[a-zA-Z]/.test(password),
        },
        {
            label: "Contient des chiffres (recommandé)",
            met: /[0-9]/.test(password),
            optional: true,
        },
    ]

    if (!password) return null

    return (
        <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Exigences :</p>
            <ul className="space-y-1">
                {requirements.map((req, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                        {req.met ? (
                            <Check className="h-4 w-4 text-success flex-shrink-0" />
                        ) : (
                            <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={req.met ? "text-foreground" : "text-muted-foreground"}>
                            {req.label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
