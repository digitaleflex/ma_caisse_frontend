"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { OverviewChart } from "@/components/ui/overview-chart"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, isAfter, isBefore, format } from "date-fns"
import { fr } from "date-fns/locale"
import { FileText, Download } from "lucide-react"
import { generateMonthlyReport } from "@/lib/pdf-service"
import { FeatureLockedDialog } from "@/components/dialogs/feature-locked-dialog"
import { toast } from "sonner"

type Period = "day" | "week" | "month" | "year"

interface Transaction {
  amount: number
  createdAt: string
  description?: string
  note?: string
  productId?: string | any
  quantitySold?: number
}

interface SummaryTabProps {
  userProfile?: {
    firstName: string
    shopName: string
    email?: string
    phoneNumber?: string
  }
  isPro?: boolean
  isLoadingSubscription?: boolean
  onNavigateToSubscription?: () => void
}

export function SummaryTab({ userProfile, isPro, isLoadingSubscription, onNavigateToSubscription }: SummaryTabProps) {
  const [period, setPeriod] = useState<Period>("month")
  const [showFeatureLock, setShowFeatureLock] = useState(false)

  // Fetch Sales
  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const response = await apiFetch("/api/sales/list-sales", { method: "GET" })
      return (response as { data: Transaction[] }).data || []
    },
  })

  // Fetch Expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const response = await apiFetch("/api/expenses/list-expenses", { method: "GET" })
      return (response as { data: Transaction[] }).data || []
    },
  })

  // Fetch Products for Cost Calculation
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await apiFetch("/api/products/list-products", { method: "GET" })
      return (response as { data: any[] }).data || []
    },
  })

  // Calculate period label
  const periodLabel = useMemo(() => {
    const now = new Date()

    switch (period) {
      case "day":
        return `Aujourd'hui - ${format(now, "d MMMM yyyy", { locale: fr })}`
      case "week":
        const weekStart = startOfWeek(now, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
        return `Semaine du ${format(weekStart, "d MMM", { locale: fr })} au ${format(weekEnd, "d MMM yyyy", { locale: fr })}`
      case "month":
        return format(now, "MMMM yyyy", { locale: fr })
      case "year":
        return `Année ${format(now, "yyyy", { locale: fr })}`
      default:
        return ""
    }
  }, [period])

  // Calculate Totals and Chart Data
  const { totalSales, totalExpenses, profit, chartData } = useMemo(() => {
    const now = new Date()
    let startDate: Date
    let dateFormat: string

    switch (period) {
      case "day":
        startDate = startOfDay(now)
        dateFormat = "HH:mm"
        break
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 })
        dateFormat = "EEEE" // Lundi, Mardi...
        break
      case "month":
        startDate = startOfMonth(now)
        dateFormat = "dd/MM"
        break
      case "year":
        startDate = startOfYear(now)
        dateFormat = "MMMM" // Janvier, Février...
        break
    }

    const filteredSales = sales.filter((s) => !isBefore(new Date(s.createdAt), startDate))
    const filteredExpenses = expenses.filter((e) => !isBefore(new Date(e.createdAt), startDate))

    const salesSum = filteredSales.reduce((sum, s) => sum + Number(s.amount), 0)
    const expensesSum = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

    // Calculate Real Profit based on margins (Home Tab logic)
    const salesProfitSum = filteredSales.reduce((sum, sale: any) => {
      // Find product to get cost price
      const product = products.find((p: any) => p._id === (typeof sale.productId === 'object' ? sale.productId?._id : sale.productId))

      if (product) {
        const uPrice = product.price || 0
        const cPrice = product.costPrice || 0
        const qSold = sale.quantitySold || 1

        // Margin = (Sale Price - Cost Price) * Quantity
        // Note: We use product.price (Unit Price) as reference, as done in Home Tab
        const margin = (uPrice - cPrice) * qSold
        return sum + margin
      }

      // If no product linked (Quick Sale), we assume 0 cost ? 
      // Home Tab logic falls back to 0 profit if no product info.
      // But typically Quick Sale IS pure profit if no cost recorded?
      // User requested EXACT Home Tab logic, so we return 0 if no product.
      return sum + 0
    }, 0)

    const calculatedProfit = salesProfitSum - expensesSum

    // Aggregate data for chart
    const dataMap = new Map<string, { name: string; sales: number; expenses: number }>()

    filteredSales.forEach((s) => {
      const date = new Date(s.createdAt)
      const key = format(date, dateFormat, { locale: fr })
      const existing = dataMap.get(key) || { name: key, sales: 0, expenses: 0 }
      existing.sales += Number(s.amount)
      dataMap.set(key, existing)
    })

    filteredExpenses.forEach((e) => {
      const date = new Date(e.createdAt)
      const key = format(date, dateFormat, { locale: fr })
      const existing = dataMap.get(key) || { name: key, sales: 0, expenses: 0 }
      existing.expenses += Number(e.amount)
      dataMap.set(key, existing)
    })

    const chartData = Array.from(dataMap.values())

    return {
      totalSales: salesSum,
      totalExpenses: expensesSum,
      profit: calculatedProfit,
      chartData
    }
  }, [sales, expenses, period, products])

  const handleExport = () => {
    if (!isPro) {
      setShowFeatureLock(true)
      return
    }

    if (!userProfile) return

    // Use the same filtered data as displayed in the UI
    const now = new Date()
    let startDate: Date

    switch (period) {
      case "day":
        startDate = startOfDay(now)
        break
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 })
        break
      case "month":
        startDate = startOfMonth(now)
        break
      case "year":
        startDate = startOfYear(now)
        break
    }

    const filteredSales = sales.filter((s) => !isBefore(new Date(s.createdAt), startDate)).map(sale => {
      const product = products.find((p: any) => p._id === (typeof sale.productId === 'object' ? sale.productId?._id : sale.productId))
      return {
        ...sale,
        productName: product?.name,
        quantitySold: sale.quantitySold,
        unitPrice: product?.price
      }
    })
    const filteredExpenses = expenses.filter((e) => !isBefore(new Date(e.createdAt), startDate))

    let reportTitle = "Bilan Mensuel"
    if (period === "day") reportTitle = "Bilan Journalier"
    else if (period === "week") reportTitle = "Bilan Hebdomadaire"
    else if (period === "year") reportTitle = "Bilan Annuel"

    generateMonthlyReport(
      filteredSales,
      filteredExpenses,
      {
        name: userProfile.shopName || "Mon Magasin",
        ownerName: userProfile.firstName || "Propriétaire",
        phone: userProfile.phoneNumber,
        email: userProfile.email
      },
      reportTitle
    )

    toast.success("Votre téléchargement a démarré", {
      description: "Vérifiez vos téléchargements ou notifications"
    })
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bilan</h1>
          <p className="text-sm text-muted-foreground">Analysez vos performances</p>
          <p className="text-[11px] font-bold text-primary mt-1 uppercase tracking-wider">{periodLabel}</p>
        </div>

        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 h-8 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary active:scale-90 transition-all duration-200 px-2.5"
        >
          <FileText className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-tight">
            {period === "day" && "Rapport du Jour"}
            {period === "week" && "Rapport Hebdo"}
            {period === "month" && "Rapport Mensuel"}
            {period === "year" && "Rapport Annuel"}
          </span>
        </Button>
      </div>

      <FeatureLockedDialog
        open={showFeatureLock}
        onOpenChange={setShowFeatureLock}
        featureTitle="Rapports PDF"
        onUpgrade={() => {
          setShowFeatureLock(false)
          onNavigateToSubscription?.()
        }}
      />

      {/* Period Selector */}
      <div className="flex gap-1.5 rounded-full bg-secondary p-1">
        <button
          onClick={() => setPeriod("day")}
          className={`flex-1 rounded-full px-2 py-1.5 text-xs font-bold transition-colors ${period === "day" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground"
            }`}
        >
          Jour
        </button>
        <button
          onClick={() => setPeriod("week")}
          className={`flex-1 rounded-full px-2 py-1.5 text-xs font-bold transition-colors ${period === "week" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground"
            }`}
        >
          Semaine
        </button>
        <button
          onClick={() => setPeriod("month")}
          className={`flex-1 rounded-full px-2 py-1.5 text-xs font-bold transition-colors ${period === "month" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground"
            }`}
        >
          Mois
        </button>
        <button
          onClick={() => setPeriod("year")}
          className={`flex-1 rounded-full px-2 py-1.5 text-xs font-bold transition-colors ${period === "year" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground"
            }`}
        >
          Année
        </button>
      </div>

      {/* Chart Section */}
      <Card className="rounded-2xl border-border bg-card p-4 md:p-6 shadow-sm">
        <h3 className="mb-6 text-xl font-bold">Aperçu des Transactions</h3>
        <div className="pl-0">
          <OverviewChart data={chartData} />
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Sales */}
        <Card className="rounded-2xl border-border bg-card p-4 md:p-6 shadow-sm">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total des Ventes</p>
          <p className="text-2xl font-black text-success tracking-tight">{totalSales.toLocaleString()} FCFA</p>
        </Card>

        {/* Total Expenses */}
        <Card className="rounded-2xl border-border bg-card p-4 md:p-6 shadow-sm">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total des Dépenses</p>
          <p className="text-2xl font-black text-destructive tracking-tight">{totalExpenses.toLocaleString()} FCFA</p>
        </Card>

        {/* Net Profit */}
        <Card
          className={`rounded-2xl border-border p-4 md:p-6 shadow-sm ${profit >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            }`}
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider opacity-90">Bénéfice Net</p>
          <p className="text-2xl font-black tracking-tight">{profit.toLocaleString()} FCFA</p>
        </Card>
      </div>
    </div>
  )
}
