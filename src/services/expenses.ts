import { apiFetch } from '../lib/api'

/**
 * Service pour la gestion des dépenses (API)
 */
export const expensesService = {
    /**
     * Récupère la liste des dépenses
     */
    listExpenses: async () => {
        const res = await apiFetch('/api/expenses/list-expenses')
        return res.data
    },

    /**
     * Supprime une dépense
     */
    deleteExpense: async (id: string) => {
        await apiFetch(`/api/expenses/delete-expense/${id}`, {
            method: 'DELETE',
        })
    },
}
