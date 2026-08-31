"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { History, Trash2, Check, X, User, Phone, CreditCard, Receipt, Wallet, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"

interface Repayment {
    _id: string
    amount: number
    createdAt: string
}

interface DebtorDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    debtor: {
        _id: string
        name: string
        amount: number
        phone?: string
    } | null
    repayments: Repayment[]
    onOpenRepayment: () => void
}

export function DebtorDetailsDialog({
    open,
    onOpenChange,
    debtor,
    repayments,
    onOpenRepayment
}: DebtorDetailsDialogProps) {
    const queryClient = useQueryClient()

    const totalRepaid = repayments.reduce((sum, r) => sum + r.amount, 0)
    const initialDebt = (debtor?.amount || 0) + totalRepaid
    const remainingBalance = debtor?.amount || 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-md max-h-[90vh] overflow-y-auto p-0 border-none bg-background shadow-2xl">
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-6 pt-6 pb-2">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black flex items-center gap-3 tracking-tight">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col items-start leading-none">
                                <span>Fiche Client</span>
                                <span className="text-xs font-medium text-muted-foreground mt-1">{debtor?.name}</span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="px-6 pb-6 space-y-6">
                    {/* Contact Info */}
                    {debtor?.phone && (
                        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-2xl border border-border/50">
                            <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-muted-foreground">
                                <Phone className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{debtor.phone}</span>
                        </div>
                    )}

                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-1 gap-3">
                        <Card className="p-4 rounded-2xl border-none bg-muted/30 group">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dette Initiale</p>
                            <p className="text-xl font-bold mt-1">{initialDebt.toLocaleString()} <span className="text-sm font-normal">FCFA</span></p>
                        </Card>

                        <div className="grid grid-cols-2 gap-3">
                            <Card className="p-4 rounded-2xl border-none bg-emerald-500/10 text-emerald-600 group">
                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Remboursé</p>
                                <p className="text-lg font-black mt-0.5">{totalRepaid.toLocaleString()} <span className="text-[10px] uppercase opacity-70">FCFA</span></p>
                            </Card>
                            <Card className="p-4 rounded-2xl border-none bg-primary text-white shadow-lg shadow-primary/20 group">
                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Reste</p>
                                <p className="text-lg font-black mt-0.5">{remainingBalance.toLocaleString()} <span className="text-[10px] uppercase opacity-70">FCFA</span></p>
                            </Card>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                        {remainingBalance > 0 && (
                            <Button
                                onClick={() => {
                                    onOpenChange(false)
                                    onOpenRepayment()
                                }}
                                className="w-full h-10 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 active:bg-emerald-800 active:scale-95 transition-all duration-200 gap-2 uppercase tracking-wide"
                            >
                                Enregistrer un paiement
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-full h-10 rounded-xl font-bold text-xs border active:scale-95 transition-all duration-200 uppercase tracking-wide"
                        >
                            Fermer
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
