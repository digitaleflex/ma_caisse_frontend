"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface OTPScreenProps {
  phoneNumber?: string
  email?: string
  onVerified: (setupToken: string) => void
  onBack?: () => void
}

export function OTPScreen({ phoneNumber, email, onVerified, onBack }: OTPScreenProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { verifyOtp } = useAuth()

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    const code = otp.join("")
    if (otp.every((digit) => digit !== "")) {
      try {
        const result = await verifyOtp(email, code)
        toast.success('OTP vérifié', { description: 'Vous pouvez définir votre mot de passe.' })
        onVerified(result.setupToken)
      } catch (e: any) {
        toast.error('Échec OTP', { description: e?.body?.message || 'Veuillez réessayer.' })
      }
    }
  }

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""])
    inputRefs.current[0]?.focus()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 md:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{email ? "Vérifiez votre email" : "Vérifiez votre numéro"}</h1>
          <p className="text-xs text-muted-foreground">
            Entrez le code à 6 chiffres envoyé à <span className="font-bold text-foreground">{email ?? phoneNumber}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-12 w-full max-w-[48px] rounded-xl border-border/40 text-center text-xl font-black bg-muted/20"
              />
            ))}
          </div>

          <div className="space-y-3">
            <Button type="submit" className="h-10 w-full rounded-xl font-bold text-xs uppercase tracking-wide">
              Vérifier le code
            </Button>

            <button
              type="button"
              onClick={handleResend}
              className="w-full text-center text-[11px] font-bold text-primary hover:underline uppercase tracking-wide"
            >
              Renvoyer le code
            </button>
            {onBack && (
              <Button type="button" variant="ghost" onClick={onBack} className="h-10 w-full rounded-xl font-bold text-xs uppercase tracking-wide text-muted-foreground">
                Retour
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
