import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateFeedbackStatus } from "@/lib/api/feedback"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface FeedbackDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    feedback: any
    onNext?: () => void
    onPrevious?: () => void
}

export function FeedbackDetailsDialog({
    open,
    onOpenChange,
    feedback,
    onNext,
    onPrevious
}: FeedbackDetailsDialogProps) {
    const [status, setStatus] = useState<string>("nouveau")
    const [adminResponse, setAdminResponse] = useState<string>("")
    const queryClient = useQueryClient()

    // Mettre à jour les états quand le feedback change
    useEffect(() => {
        if (feedback) {
            setStatus(feedback.status || "nouveau")
            setAdminResponse(feedback.adminResponse || "")
        }
    }, [feedback])

    const mutation = useMutation({
        mutationFn: () => updateFeedbackStatus(feedback._id, status, adminResponse),
        onSuccess: () => {
            toast.success("Feedback mis à jour")
            queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error("Erreur", {
                description: error.response?.data?.error || "Impossible de mettre à jour le feedback.",
            })
        },
    })

    if (!feedback) return null

    const typeLabels: any = {
        suggestion: '💡 Suggestion',
        bug: '🐛 Bug',
        question: '❓ Question',
        autre: '📝 Autre'
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader className="relative">
                    <div className="flex items-center justify-between mb-4 mt-2">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={onPrevious}
                                disabled={!onPrevious || mutation.isPending}
                                title="Précédent"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={onNext}
                                disabled={!onNext || mutation.isPending}
                                title="Suivant"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-fit">
                                {typeLabels[feedback.type] || feedback.type}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                                Soumis le {new Date(feedback.createdAt).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <DialogTitle>Détails du Feedback</DialogTitle>
                    <DialogDescription>
                        De : <strong>{feedback.userId?.firstName}</strong> ({feedback.userId?.shopName})
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Message de l'utilisateur</Label>
                        <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap border max-h-[200px] overflow-y-auto">
                            {feedback.message}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Modifier le statut</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Choisir un statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="nouveau">Nouveau</SelectItem>
                                    <SelectItem value="en_cours">En cours</SelectItem>
                                    <SelectItem value="planifié">Planifié</SelectItem>
                                    <SelectItem value="terminé">Terminé</SelectItem>
                                    <SelectItem value="rejeté">Rejeté</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="response" className="flex items-center gap-2">
                            Réponse administrative
                            {feedback.adminResponse && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] hover:bg-emerald-100">
                                    Déjà envoyée
                                </Badge>
                            )}
                        </Label>
                        <Textarea
                            id="response"
                            placeholder="Saisissez votre réponse ici..."
                            value={adminResponse}
                            onChange={(e) => setAdminResponse(e.target.value)}
                            rows={6}
                            className="resize-none focus-visible:ring-primary"
                        />
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="text-primary font-bold">INFO :</span> Cette réponse est envoyée par email à l'utilisateur dès que vous enregistrez.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between gap-4">
                    <div className="text-[10px] text-muted-foreground italic">
                        ID: {feedback._id}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                            Annuler
                        </Button>
                        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                            {mutation.isPending ? "Mise à jour..." : "Enregistrer"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
