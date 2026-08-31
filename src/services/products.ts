import { apiFetch } from '../lib/api'
import { Product, ProductInput } from '../types'

/**
 * Service pour la gestion des produits (API)
 */
export const productsService = {
    /**
     * Récupère la liste des produits
     */
    listProducts: async (): Promise<Product[]> => {
        const res = await apiFetch('/api/products/list-products')
        return res.data
    },

    /**
     * Récupère un produit par son ID
     */
    getProduct: async (id: string): Promise<Product> => {
        const res = await apiFetch(`/api/products/get-product/${id}`)
        return res.data
    },

    /**
     * Crée un nouveau produit
     */
    createProduct: async (data: ProductInput): Promise<Product> => {
        const res = await apiFetch('/api/products/add-product', {
            method: 'POST',
            body: JSON.stringify(data),
        })
        return res.data
    },

    /**
     * Met à jour un produit existant
     */
    updateProduct: async (id: string, data: Partial<ProductInput>): Promise<Product> => {
        const res = await apiFetch(`/api/products/update-product/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
        return res.data
    },

    /**
     * Supprime un produit
     */
    deleteProduct: async (id: string): Promise<void> => {
        await apiFetch(`/api/products/delete-product/${id}`, {
            method: 'DELETE',
        })
    },
}
