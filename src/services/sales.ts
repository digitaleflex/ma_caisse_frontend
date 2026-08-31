import { apiFetch } from '../lib/api'

/**
 * Service pour la gestion des ventes (API)
 */
export const salesService = {
    /**
     * Récupère la liste des ventes
     */
    listSales: async () => {
        const res = await apiFetch('/api/sales/list-sales')
        return res.data
    },

    /**
     * Supprime une vente
     */
    deleteSale: async (id: string) => {
        await apiFetch(`/api/sales/delete-sale/${id}`, {
            method: 'DELETE',
        })
    },
}
