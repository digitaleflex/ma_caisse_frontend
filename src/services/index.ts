/**
 * Service de données centralisé
 * Regroupe tous les services de données
 */

import { apiFetch } from '../lib/api'
import { Product, ProductInput, Sale, Expense, Transaction } from '../types'

// Products
export const productsService = {
  async listProducts(): Promise<Product[]> {
    const res = await apiFetch('/api/products/list-products')
    return res.data
  },

  async getProduct(id: string): Promise<Product> {
    const res = await apiFetch(`/api/products/get-product/${id}`)
    return res.data
  },

  async createProduct(data: ProductInput): Promise<Product> {
    const res = await apiFetch('/api/products/add-product', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  async updateProduct(id: string, data: Partial<ProductInput>): Promise<Product> {
    const res = await apiFetch(`/api/products/update-product/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return res.data
  },

  async deleteProduct(id: string): Promise<void> {
    await apiFetch(`/api/products/delete-product/${id}`, {
      method: 'DELETE',
    })
  },
}

// Sales
export const salesService = {
  async listSales(): Promise<Sale[]> {
    const res = await apiFetch('/api/sales/list-sales')
    return res.data
  },

  async deleteSale(id: string): Promise<void> {
    await apiFetch(`/api/sales/delete-sale/${id}`, {
      method: 'DELETE',
    })
  },
}

// Expenses
export const expensesService = {
  async listExpenses(): Promise<Expense[]> {
    const res = await apiFetch('/api/expenses/list-expenses')
    return res.data
  },

  async deleteExpense(id: string): Promise<void> {
    await apiFetch(`/api/expenses/delete-expense/${id}`, {
      method: 'DELETE',
    })
  },
}

// Fetch helpers pour rappels de données brutes (raw API)
export const businessApi = {
  async getSales(): Promise<Sale[]> {
    const res = await apiFetch('/api/sales/list-sales', { method: 'GET' })
    return res?.data || []
  },
  async getExpenses(): Promise<Expense[]> {
    const res = await apiFetch('/api/expenses/list-expenses', { method: 'GET' })
    return res?.data || []
  },
  async getProducts(): Promise<Product[]> {
    const res = await apiFetch('/api/products/list-products', { method: 'GET' })
    return res?.data || []
  },
  async getCredits(): Promise<any> {
    const res = await apiFetch('/api/credits/list-credits', { method: 'GET' })
    return res?.data || []
  },
  async getDebtors(): Promise<Debtor[]> {
    const res = await apiFetch('/api/debtors/list-debtors', { method: 'GET' })
    return res?.data || []
  },
  async getRepayments(): Promise<any> {
    const res = await apiFetch('/api/repayments/list-repayments', { method: 'GET' })
    return res?.data || []
  },
}

export interface Debtor {
  _id: string
  name: string
  amount: number
  phone?: string
}

// Stats
export const statsService = {
  async getDashboardStats() {
    const [salesData, expensesData] = await Promise.all([
      salesService.listSales(),
      expensesService.listExpenses(),
    ])

    const sales = Array.isArray(salesData) ? salesData : []
    const expenses = Array.isArray(expensesData) ? expensesData : []

    const totalSales = sales.reduce((sum: number, s: Sale) => sum + Number(s.amount), 0)
    const totalExpenses = expenses.reduce((sum: number, e: Expense) => sum + Number(e.amount), 0)
    const profit = totalSales - totalExpenses

    return {
      totalSales: sales.length,
      totalExpenses: expenses.length,
      totalSalesAmount: totalSales,
      totalExpensesAmount: totalExpenses,
      profit,
    }
  },
}

// Transactions
export const transactionsService = {
  async getAllTransactions(): Promise<Transaction[]> {
    const [salesData, expensesData] = await Promise.all([
      salesService.listSales(),
      expensesService.listExpenses(),
    ])

    const sales = Array.isArray(salesData) ? salesData : []
    const expenses = Array.isArray(expensesData) ? expensesData : []

    const transactions: Transaction[] = [
      ...sales.map((sale: Sale) => {
        // L'API peut renvoyer soit sale.productId comme string, soit comme objet peuplé
        const productInfo = typeof sale.productId === 'object' && sale.productId !== null ? sale.productId : null
        const profit = productInfo ? (productInfo.price - productInfo.costPrice) * (sale.quantitySold || 1) : 0
        return {
          id: sale._id,
          type: 'sale' as const,
          amount: Number(sale.amount),
          note: sale.note,
          timestamp: new Date(sale.createdAt || Date.now()),
          productId: typeof sale.productId === 'string' ? sale.productId : productInfo?._id || '',
          productName: productInfo?.name,
          quantitySold: sale.quantitySold,
          profit,
          unitPrice: productInfo?.price,
        }
      }),
      ...expenses.map((expense: Expense) => ({
        id: expense._id,
        type: 'expense' as const,
        amount: Number(expense.amount),
        note: expense.description,
        timestamp: new Date(expense.createdAt || Date.now()),
      })),
    ]

    return transactions
  },
}