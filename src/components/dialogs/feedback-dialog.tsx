import { useState } from "react"
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
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { submitFeedback } from "@/lib/api/feedback"

interface FeedbackDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
    const [type, setType] = useState<string>("")
    const [message, setMessage] = useState<string>("")

    const mutation = useMutation({
        mutationFn: submitFeedback,
        onSuccess: () => {
            toast.success("Merci pour votre retour !", {
                description: "Votre suggestion a été envoyée avec succès.",
            })
            // Réinitialiser le formulaire
            setType("")
            setMessage("")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error("Erreur", {
                description: error.response?.data?.error || "Impossible d'envoyer votre feedback.",
            })
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!type) {
            toast.error("Type requis", {
                description: "Veuillez sélectionner un type de feedback.",
            })
            return
        }

        if (!message || message.trim().length < 10) {
            toast.error("Message trop court", {
                description: "Votre message doit contenir au moins 10 caractères.",
            })
            return
        }

        if (message.trim().length > 2000) {
            toast.error("Message trop long", {
                description: "Votre message ne peut pas dépasser 2000 caractères.",
            })
            return
        }

        mutation.mutate({ type, message: message.trim() })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">💡 Envoyer une suggestion</DialogTitle>
                    <DialogDescription className="text-xs">
                        Partagez vos idées d'amélioration, signalez un bug ou posez une question.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type" className="text-sm">Type de feedback</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger id="type" className="h-10">
                                    <SelectValue placeholder="Sélectionnez un type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="suggestion">💡 Suggestion</SelectItem>
                                    <SelectItem value="bug">🐛 Bug</SelectItem>
                                    <SelectItem value="question">❓ Question</SelectItem>
                                    <SelectItem value="autre">📝 Autre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="message" className="text-sm">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Décrivez votre suggestion, bug ou question..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                {message.length}/2000 caractères (minimum 10)
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={mutation.isPending}
                            className="flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-wide"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-wide"
                        >
                            {mutation.isPending ? "Envoi..." : "Envoyer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
