/**
 * API Client - Feedback
 *
 * Fonctions pour interagir avec l'API feedback
 */
import { apiFetch } from "@/lib/api"

interface SubmitFeedbackParams {
    type: string
    message: string
}

/**
 * Soumettre un feedback
 */
export const submitFeedback = async ({ type, message }: SubmitFeedbackParams) => {
    return await apiFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ type, message }),
    })
}
/**
 * Récupérer tous les feedbacks (admin)
 */
export const getAllFeedbacks = async (filters: any = {}) => {
    const params = new URLSearchParams()
    if (filters.status) params.append("status", filters.status)
    if (filters.type) params.append("type", filters.type)

    return await apiFetch(`/api/feedback?${params.toString()}`)
}

/**
 * Mettre à jour un feedback (admin)
 */
export const updateFeedbackStatus = async (id: string, status: string, adminResponse?: string) => {
    return await apiFetch(`/api/feedback/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminResponse }),
    })
}
