"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { History, Trash2, Check, X } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"

interface Repayment {
    _id: string
    amount: number
    createdAt: string
}

interface RepaymentHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    debtorName: string
    repayments: Repayment[]
}

export function RepaymentHistoryDialog({
    open,
    onOpenChange,
    debtorName,
    repayments,
}: RepaymentHistoryDialogProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const queryClient = useQueryClient()
    const totalRepaid = repayments.reduce((sum, r) => sum + r.amount, 0)

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiFetch(`/api/repayments/delete-repayment/${id}`, { method: "DELETE" })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["debtors"] })
            queryClient.invalidateQueries({ queryKey: ["repayments"] })
            toast.success("Remboursement supprimé")
            setDeletingId(null)
        },
        onError: (error: any) => {
            toast.error("Erreur", {
                description: error.body?.message || "Impossible de supprimer le remboursement",
            })
        },
    })

    const handleConfirmDelete = (id: string) => {
        deleteMutation.mutate(id)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Historique - {debtorName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Summary */}
                    <div className="bg-muted/50 rounded-xl p-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total remboursé</p>
                        <p className="text-lg font-black text-primary">{totalRepaid.toLocaleString()} FCFA</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {repayments.length} remboursement{repayments.length > 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Repayments List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {repayments.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">Aucun historique.</p>
                        ) : (
                            repayments.map((repayment) => (
                                <div
                                    key={repayment._id}
                                    className="flex items-center justify-between bg-background rounded-lg p-3 border border-border"
                                >
                                    <div>
                                        <p className="text-base font-semibold text-foreground">
                                            {repayment.amount.toLocaleString()} FCFA
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(repayment.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1">
                                        {deletingId === repayment._id ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleConfirmDelete(repayment._id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    onClick={() => setDeletingId(null)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeletingId(repayment._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
