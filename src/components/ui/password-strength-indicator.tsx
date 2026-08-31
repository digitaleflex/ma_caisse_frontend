"use client"

interface PasswordStrengthIndicatorProps {
    password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
        if (!pwd) return { score: 0, label: "", color: "" }

        let score = 0

        // Length check
        if (pwd.length >= 8) score++
        if (pwd.length >= 12) score++

        // Character variety
        if (/[a-z]/.test(pwd)) score++ // lowercase
        if (/[A-Z]/.test(pwd)) score++ // uppercase
        if (/[0-9]/.test(pwd)) score++ // numbers
        if (/[^a-zA-Z0-9]/.test(pwd)) score++ // special chars

        // Determine strength
        if (score <= 2) return { score: 1, label: "Faible", color: "bg-destructive" }
        if (score <= 4) return { score: 2, label: "Moyen", color: "bg-yellow-500" }
        if (score <= 5) return { score: 3, label: "Fort", color: "bg-success" }
        return { score: 4, label: "Très fort", color: "bg-green-600" }
    }

    const strength = getPasswordStrength(password)

    if (!password) return null

    return (
        <div className="space-y-2">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                    <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${level <= strength.score ? strength.color : "bg-muted"
                            }`}
                    />
                ))}
            </div>
            <p className={`text-sm font-medium ${strength.score === 1 ? "text-destructive" :
                    strength.score === 2 ? "text-yellow-600 dark:text-yellow-500" :
                        "text-success"
                }`}>
                Force du mot de passe : {strength.label}
            </p>
        </div>
    )
}
