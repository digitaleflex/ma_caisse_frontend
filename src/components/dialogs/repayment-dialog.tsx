"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/api"
import { AmountValidator } from "@/components/ui/amount-validator"
import { toast } from "sonner"

interface Debtor {
  _id: string
  name: string
  amount: number
}

interface RepaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debtor: Debtor | null
}

export function RepaymentDialog({ open, onOpenChange, debtor }: RepaymentDialogProps) {
  const [amount, setAmount] = useState("")
  const [touched, setTouched] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (open && debtor) {
      setAmount(debtor.amount.toString())
      setTouched(false)
    }
  }, [open, debtor])

  const createRepaymentMutation = useMutation({
    mutationFn: async (data: { debtorId: string; amount: number }) => {
      return apiFetch("/api/repayments/add-repayment", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["debtors"] })
      queryClient.invalidateQueries({ queryKey: ["repayments"] })
      toast.success("Remboursement enregistré", {
        description: `Remboursement de ${variables.amount} FCFA effectué`,
      })
      setAmount("")
      setTouched(false)
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error("Erreur", {
        description: error.body?.message || "Impossible d'enregistrer le remboursement",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = Number.parseFloat(amount)
    if (amountNum > 0 && debtor && amountNum <= debtor.amount) {
      createRepaymentMutation.mutate({
        debtorId: debtor._id,
        amount: amountNum,
      })
    }
  }

  if (!debtor) return null

  const amountNum = Number.parseFloat(amount)
  const isValid = !isNaN(amountNum) && amountNum > 0 && amountNum <= debtor.amount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Remboursement</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-2xl bg-secondary p-3">
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="text-lg font-bold text-foreground break-all">{debtor.name}</p>
            <p className="mt-2 text-sm text-muted-foreground">Montant dû</p>
            <p className="text-xl font-bold text-primary">{debtor.amount.toLocaleString()} FCFA</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <label htmlFor="repayment-amount" className="text-sm font-medium text-foreground">
                Montant à Rembourser (FCFA)
              </label>
              <Input
                id="repayment-amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setTouched(true)
                }}
                onBlur={() => setTouched(true)}
                className="h-10 rounded-full text-sm"
                required
                min="0"
                max={debtor.amount}
                step="1"
              />
              <AmountValidator amount={amount} showValidation={touched} />
              {touched && amountNum > debtor.amount && (
                <p className="text-sm text-destructive">Le montant ne peut pas dépasser {debtor.amount.toLocaleString()} FCFA</p>
              )}
            </div>
            <Button type="submit" size="lg" disabled={!isValid || createRepaymentMutation.isPending} className="h-10 w-full rounded-full text-sm font-semibold">
              {createRepaymentMutation.isPending ? "Traitement..." : "Confirmer"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
