"use client"

import { useState, useEffect, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Pencil,
  Trash2,
  Crown,
  AlertOctagon,
  Search,
  Filter,
  ChevronDown,
  Check,
  Download,
  FileText,
  Eye,
  UserPlus,
  Plus,
  RefreshCw,
  ArrowLeft
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SearchBar } from "@/components/ui/search-bar"
import { AddSaleDialog } from "@/components/dialogs/add-sale-dialog"
import { AddExpenseDialog } from "@/components/dialogs/add-expense-dialog"
import { EditSaleDialog } from "@/components/dialogs/edit-sale-dialog"
import { EditExpenseDialog } from "@/components/dialogs/edit-expense-dialog"
import { FeatureLockedDialog } from "@/components/dialogs/feature-locked-dialog"
import { salesService } from "../../services/sales"
import { expensesService } from "../../services/expenses"
import { productsService } from "../../services/products"
import { Transaction, Product, Sale, Expense } from "@/types"
import { toast } from "sonner"
import { generateDigitalReceipt, generateTransactionsReport } from "@/lib/pdf-service"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface HomeTabProps {
  userProfile: {
    firstName: string
    shopName: string
    email: string
    phoneNumber?: string
  }
  isPro?: boolean
  isLoadingSubscription?: boolean
  subscriptionStatus?: any
  onNavigateToSubscription?: () => void
  onNavigateToInventory?: () => void
  onOpenSale?: () => void
  onOpenExpense?: () => void
  onOpenNewCredit?: () => void
}

const ITEMS_PER_PAGE = 10

export function HomeTab({
  userProfile,
  isPro: isProProp,
  isLoadingSubscription: isLoadingSubProp,
  subscriptionStatus: subscriptionStatusProp,
  onNavigateToSubscription,
  onNavigateToInventory,
  onOpenSale,
  onOpenExpense,
  onOpenNewCredit
}: HomeTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"sale" | "expense" | "">("")
  const [filterPeriod, setFilterPeriod] = useState<"all" | "today" | "week" | "month">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount-desc" | "amount-asc">("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [editingSale, setEditingSale] = useState<any>(null)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null)
  const [lastActiveTransaction, setLastActiveTransaction] = useState<Transaction | null>(null)
  const [showFeatureLock, setShowFeatureLock] = useState(false)
  const [mobileView, setMobileView] = useState<'dashboard' | 'transactions'>('dashboard')

  // Persist transaction data for smooth exit animation
  useEffect(() => {
    if (viewingTransaction) {
      setLastActiveTransaction(viewingTransaction)
    }
  }, [viewingTransaction])

  const queryClient = useQueryClient()

  const { data: salesData, isLoading: isLoadingSales } = useQuery<Sale[]>({
    queryKey: ["sales"],
    queryFn: async () => salesService.listSales(),
  })

  const { data: expensesData, isLoading: isLoadingExpenses } = useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async () => expensesService.listExpenses(),
  })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => productsService.listProducts(),
  })

  const deleteSaleMutation = useMutation({
    mutationFn: (id: string) => salesService.deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Vente supprimée et stock mis à jour")
      setDeletingTransaction(null)
    },
    onError: (error: any) => {
      toast.error("Erreur", {
        description: error.body?.message || "Impossible de supprimer la vente"
      })
    }
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => expensesService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      toast.success("Dépense supprimée")
      setDeletingTransaction(null)
    },
    onError: (error: any) => {
      toast.error("Erreur", {
        description: error.body?.message || "Impossible de supprimer la dépense"
      })
    }
  })

  const isPro = isProProp
  const isLoadingSubscription = isLoadingSubProp

  const allTransactions: Transaction[] = useMemo(() => {
    const sData = Array.isArray(salesData) ? salesData : []
    const eData = Array.isArray(expensesData) ? expensesData : []
    const pData = Array.isArray(products) ? products : []

    const sales: Transaction[] = sData.map((sale: Sale) => {
      const isPopulated = typeof sale.productId === 'object' && sale.productId !== null
      const productInfo = isPopulated ? (sale.productId as any) : pData.find((p: Product) => p._id === sale.productId)

      const uPrice = productInfo?.price || 0
      const cPrice = productInfo?.costPrice || 0
      const qSold = sale.quantitySold || 1
      const calculatedProfit = productInfo ? (uPrice - cPrice) * qSold : 0

      return {
        id: sale._id,
        type: "sale" as const,
        amount: Number(sale.amount),
        note: sale.note,
        timestamp: new Date(sale.createdAt || Date.now()),
        productId: isPopulated ? (sale.productId as any)?._id : (sale.productId as string),
        quantitySold: qSold,
        profit: calculatedProfit,
        productName: productInfo?.name,
        unitPrice: uPrice
      }
    })

    const expenses: Transaction[] = eData.map((expense: Expense) => ({
      id: expense._id,
      type: "expense" as const,
      amount: Number(expense.amount),
      description: expense.description,
      timestamp: new Date(expense.createdAt || Date.now())
    }))

    return [...sales, ...expenses]
  }, [salesData, expensesData, products])

  const filteredTransactions = useMemo(() => {
    let now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return allTransactions
      .filter((t) => {
        if (filterType && t.type !== filterType) return false

        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const note = t.type === "sale" ? (t.note || "") : (t.description || "")
          const amount = t.amount.toString()
          const productName = t.productName || ""
          if (!note.toLowerCase().includes(query) && !amount.includes(query) && !productName.toLowerCase().includes(query)) return false
        }

        if (filterPeriod !== "all") {
          if (filterPeriod === "today") return t.timestamp >= startOfDay
          if (filterPeriod === "week") return t.timestamp >= startOfWeek
          if (filterPeriod === "month") return t.timestamp >= startOfMonth
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === "newest") return b.timestamp.getTime() - a.timestamp.getTime()
        if (sortBy === "oldest") return a.timestamp.getTime() - b.timestamp.getTime()
        if (sortBy === "amount-desc") return b.amount - a.amount
        if (sortBy === "amount-asc") return a.amount - b.amount
        return 0
      })
  }, [allTransactions, filterType, searchQuery, filterPeriod, sortBy])

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const todayTransactions = allTransactions.filter(t => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return t.timestamp >= today
  })

  const todaySales = todayTransactions
    .filter(t => t.type === "sale")
    .reduce((sum, t) => sum + t.amount, 0)

  const todayExpenses = todayTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const todayProfit = todayTransactions
    .filter(t => t.type === "sale")
    .reduce((sum, t) => sum + (t.profit || 0), 0)

  // Products alerts
  const lowStockThreshold = 5 // Could be dynamic
  const outOfStockProducts = products.filter(p => p.quantity <= 0)
  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= lowStockThreshold)
  const hasCriticalStock = outOfStockProducts.length > 0 || lowStockProducts.length > 0

  const handleEdit = (transaction: Transaction) => {
    if (transaction.type === "sale") {
      const originalSale = salesData?.find((s: Sale) => s._id === transaction.id)
      if (originalSale) {
        setEditingSale({ ...originalSale, id: originalSale._id })
      }
    } else {
      const originalExpense = expensesData?.find((e: Expense) => e._id === transaction.id)
      if (originalExpense) {
        setEditingExpense({ ...originalExpense, id: originalExpense._id })
      }
    }
  }

  const confirmDelete = () => {
    if (!deletingTransaction) return
    if (deletingTransaction.type === "sale") {
      deleteSaleMutation.mutate(deletingTransaction.id)
    } else {
      deleteExpenseMutation.mutate(deletingTransaction.id)
    }
  }

  const formatDate = (date: Date) => {
    return {
      date: format(date, "d MMM yyyy", { locale: fr }),
      time: format(date, "HH:mm")
    }
  }

  const handleGenerateReceipt = (transaction: Transaction) => {
    if (transaction.type !== "sale") return
    if (!userProfile) return

    const originalSale = salesData?.find((s: Sale) => s._id === transaction.id)
    if (!originalSale) return

    generateDigitalReceipt(
      {
        ...originalSale,
        productName: transaction.productName,
        quantity: transaction.quantitySold,
        unitPrice: transaction.unitPrice
      },
      {
        name: userProfile.shopName,
        ownerName: userProfile.firstName,
        email: userProfile.email,
        phone: userProfile.phoneNumber
      }
    )
  }

  const handleExportPDF = () => {
    if (!isPro && filteredTransactions.length > 5) {
      setShowFeatureLock(true)
      return
    }

    try {
      generateTransactionsReport(
        filteredTransactions.map(t => ({
          amount: t.amount,
          createdAt: t.timestamp.toISOString(),
          type: t.type,
          note: t.note,
          description: t.description,
          productName: t.productName,
          quantitySold: t.quantitySold,
          unitPrice: t.unitPrice
        })),
        {
          name: userProfile.shopName,
          ownerName: userProfile.firstName,
          phone: userProfile.phoneNumber,
          email: userProfile.email
        }
      )
      toast.success("PDF généré avec succès")
    } catch (error) {
      console.error(error)
      toast.error("Erreur lors de la génération du PDF")
    }
  }

  const handleExportCSV = () => {
    if (!isPro && filteredTransactions.length > 5) {
      setShowFeatureLock(true)
      return
    }

    try {
      const headers = ["Date", "Type", "Description/Note", "Montant (FCFA)"];
      const rows = filteredTransactions.map(t => [
        format(t.timestamp, 'dd/MM/yyyy HH:mm'),
        t.type === 'sale' ? 'Vente' : 'Dépense',
        (t.type === 'sale' ? t.note : t.description) || '-',
        t.amount
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Transactions_${format(new Date(), 'yyyyMMdd')}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV exporté avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'export CSV");
    }
  }

  // Reset pagination when filters or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterType, searchQuery, filterPeriod, sortBy])

  // Helper for filter label
  const getFilterLabel = () => {
    switch (filterType) {
      case "sale": return "Ventes"
      case "expense": return "Dépenses"
      default: return "Filtres"
    }
  }

  // Trial check
  const isTrialOver = allTransactions.length >= 45 // 15 + 15 + 15 approximation

  return (
    <div className="pb-10 md:pb-0 md:flex md:flex-col md:h-full md:overflow-hidden">
      {/* Header with Greeting and Actions - FIXED on Desktop (never scrolls) */}
      <div className={`hidden md:flex flex-col gap-4 shrink-0 z-30 bg-background py-4 px-4 border-b border-border/40 shadow-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Bonjour, {userProfile.firstName} !</h1>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              onClick={() => onOpenSale?.()}
              className="gap-2 bg-success text-white hover:bg-success/90 rounded-xl h-11 px-6 shadow-sm font-bold"
            >
              <ShoppingCart className="h-4 w-4" />
              Vendre
            </Button>
            <Button
              onClick={() => onOpenExpense?.()}
              className="gap-2 bg-destructive text-white hover:bg-destructive/90 rounded-xl h-11 px-6 shadow-sm font-bold"
            >
              <TrendingDown className="h-4 w-4" />
              Dépense
            </Button>
            <Button
              onClick={() => onOpenNewCredit?.()}
              className="gap-2 bg-yellow-500 text-white hover:bg-yellow-600 rounded-xl h-11 px-6 shadow-sm font-bold"
            >
              <UserPlus className="h-4 w-4" />
              Crédit
            </Button>
          </div>
        </div>

        {/* Search Row - Only visible on lg and up, inside the same fixed block */}
        <div className="hidden lg:flex items-center justify-between gap-4 pt-3 border-t border-border/30">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Dernières Activités
            <span className="text-[9px] font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase tracking-widest">
              {filteredTransactions.length}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-64 rounded-lg border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handleExportPDF} title="PDF" className="h-9 px-3 gap-2 rounded-lg text-xs"><FileText className="h-3.5 w-3.5" />PDF</Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} title="CSV" className="h-9 px-3 gap-2 rounded-lg text-xs"><Download className="h-3.5 w-3.5" />CSV</Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 gap-2 shadow-sm rounded-lg ${filterType ? "border-primary text-primary bg-primary/5" : ""}`}
                >
                  <Filter className="h-4 w-4" />
                  {getFilterLabel()}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-0 rounded-lg shadow-xl border-border/50">
                <div className="max-h-[40vh] overflow-y-auto p-2 scrollbar-thin">
                  <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">Type</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setFilterType("")} className="rounded-lg"><Check className={`h-4 w-4 mr-2 ${filterType === "" ? "opacity-100" : "opacity-0"}`} />Tout</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("sale")} className="rounded-lg"><Check className={`h-4 w-4 mr-2 ${filterType === "sale" ? "opacity-100" : "opacity-0"}`} />Ventes uniquement</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("expense")} className="rounded-lg"><Check className={`h-4 w-4 mr-2 ${filterType === "expense" ? "opacity-100" : "opacity-0"}`} />Dépenses uniquement</DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">Période</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setFilterPeriod("all")} className="rounded-lg"><Check className={`h-4 w-4 mr-2 ${filterPeriod === "all" ? "opacity-100" : "opacity-0"}`} />Toutes les dates</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPeriod("today")} className="rounded-lg"><Check className={`h-4 w-4 mr-2 ${filterPeriod === "today" ? "opacity-100" : "opacity-0"}`} />Aujourd'hui</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPeriod("week")} className="rounded-lg"><Check className={`h-4 w-4 mr-2 ${filterPeriod === "week" ? "opacity-100" : "opacity-0"}`} />Cette semaine</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPeriod("month")} className="rounded-lg"><Check className={`h-4 w-4 mr-2 ${filterPeriod === "month" ? "opacity-100" : "opacity-0"}`} />Ce mois</DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">Tri</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setSortBy("newest")} className="rounded-lg"><Check className={`h-4 w-4 mr-2 ${sortBy === "newest" ? "opacity-100" : "opacity-0"}`} />Plus récent d'abord</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("oldest")} className="rounded-lg"><Check className={`h-4 w-4 mr-2 ${sortBy === "oldest" ? "opacity-100" : "opacity-0"}`} />Plus ancien d'abord</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("amount-desc")} className="rounded-lg"><Check className={`h-4 w-4 mr-2 ${sortBy === "amount-desc" ? "opacity-100" : "opacity-0"}`} />Montant décroissant</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("amount-asc")} className="rounded-lg"><Check className={`h-4 w-4 mr-2 ${sortBy === "amount-asc" ? "opacity-100" : "opacity-0"}`} />Montant croissant</DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content area - on lg: flex row with fixed sidebar */}
      <div className="md:flex-1 md:overflow-hidden md:p-4 lg:flex lg:gap-6">
        {/* Transaction column - scrollable */}
        <div className="lg:flex-1 lg:overflow-y-auto space-y-6 lg:pr-2 scrollbar-thin">

          {/* MOBILE CONTENT LOGIC: DASHBOARD vs TRANSACTIONS */}
          <div className="lg:hidden">
            {mobileView === 'dashboard' ? (
              <div className="space-y-4 px-2">
                <div className="flex items-center justify-between py-2">
                  <h1 className="text-lg font-bold text-foreground tracking-tight">Bonjour, {userProfile.firstName} !</h1>
                </div>

                {/* Main Hero Balance Card */}
                <div className={`relative overflow-hidden p-6 rounded-[2.5rem] bg-gradient-to-br transition-all duration-500 border border-white/10 ${todayProfit - todayExpenses >= 0 ? "from-primary via-orange-500 to-orange-600" : "from-destructive via-red-500 to-red-600"
                  }`}>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-24 h-24 bg-black/10 rounded-full blur-2xl" />

                  <div className="relative z-10 space-y-1">
                    <span className="text-white/80 text-[11px] font-bold uppercase tracking-[0.2em]">
                      {todayProfit - todayExpenses >= 0 ? "Bénéfice Réel" : "Perte Réelle"} (Aujourd'hui)
                    </span>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl font-black text-white tracking-tighter">
                        {(todayProfit - todayExpenses).toLocaleString()}
                      </h2>
                      <span className="text-white/70 font-bold text-base">FCFA</span>
                    </div>
                  </div>

                  {/* Icon Decoration */}
                  <div className="absolute bottom-3 right-8 opacity-20 transform rotate-12">
                    <TrendingUp className="h-15 w-15 text-white" />
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card border border-border/50 p-4 rounded-3xl shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-2 w-2 rounded-full bg-success" />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Ventes du jour</span>
                    </div>
                    <p className="text-lg font-black text-success tracking-tight">
                      {todaySales.toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal ml-0.5">FCFA</span>
                    </p>
                  </div>
                  <div className="bg-card border border-border/50 p-4 rounded-3xl shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Dépenses du jour</span>
                    </div>
                    <p className="text-lg font-black text-destructive tracking-tight">
                      {todayExpenses.toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal ml-0.5">FCFA</span>
                    </p>
                  </div>
                </div>

                {/* Mobile Stock Alerts - NO DUPLICATES */}
                {hasCriticalStock && (
                  <Card className="p-4 rounded-3xl border-destructive/20 bg-destructive/5 shadow-sm border-l-4 border-l-destructive">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-destructive font-black uppercase text-[10px] tracking-widest">
                        <AlertOctagon className="h-4 w-4" />
                        Alertes Stock
                      </div>
                      <Button
                        onClick={onNavigateToInventory}
                        variant="secondary"
                        size="sm"
                        className="h-7 px-3 text-[10px] font-black uppercase tracking-widest rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-90 transition-all duration-200 shadow-none border-none"
                      >
                        Voir tout
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {[...outOfStockProducts, ...lowStockProducts].slice(0, 2).map(p => (
                        <div key={p._id} className="flex items-center justify-between bg-white/50 p-2 rounded-xl">
                          <span className="text-xs font-bold truncate max-w-[120px]">{p.name}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.quantity === 0 ? "bg-destructive text-white" : "bg-orange-500/10 text-orange-600"}`}>
                            {p.quantity === 0 ? "RUPTURE" : `${p.quantity} restants`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Button
                  variant="secondary"
                  className="w-full h-10 text-xs font-bold rounded-xl shadow-sm border border-border/50 bg-muted/50 hover:bg-muted active:bg-muted/80 text-muted-foreground active:scale-95 transition-all duration-200 uppercase tracking-widest"
                  size="lg"
                  onClick={() => setMobileView('transactions')}
                >
                  Historique
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4 px-2">
                <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur z-20 py-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-muted/40 border border-border/50 text-foreground active:scale-95 transition-all"
                    onClick={() => setMobileView('dashboard')}
                  >
                    <ArrowLeft className="h-5 w-5 text-foreground" />
                  </Button>
                  <h2 className="text-xl font-bold">Historique</h2>
                </div>
              </div>
            )}
          </div>

          <div className={`space-y-4 ${mobileView === 'dashboard' ? 'hidden lg:block' : 'block'} px-2 md:px-0`}>

            {/* Mobile-only Search Bar (Visible only when in 'transactions' view on mobile) */}
            <div className="lg:hidden flex flex-col gap-4 mb-4">
              <div className="flex flex-col gap-2">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Rechercher..."
                  className="w-full h-10"
                />
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1.5 rounded-md text-[10px] font-bold uppercase shrink-0 active:scale-90 transition-all" onClick={handleExportPDF}>
                    <FileText className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1.5 rounded-md text-[10px] font-bold uppercase shrink-0 active:scale-90 transition-all" onClick={handleExportCSV}>
                    <Download className="h-3.5 w-3.5" />
                    CSV
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className={`h-8 px-2.5 gap-1.5 rounded-md text-[11px] font-bold shrink-0 active:scale-90 data-[state=open]:scale-90 transition-all ${filterType !== "" ? "border-primary text-primary bg-primary/5" : ""}`}>
                        <Filter className="h-3.5 w-3.5" />
                        {filterType === "" ? "Filtres" :
                          filterType === "sale" ? "Ventes" : "Dépenses"}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-0 rounded-lg shadow-xl border-border/50">
                      <div className="max-h-[40vh] overflow-y-auto p-2 scrollbar-thin">
                        <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">Type</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setFilterType("")} className="rounded-lg">
                          <Check className={`h-4 w-4 mr-2 ${filterType === "" ? "opacity-100" : "opacity-0"}`} />
                          Tout
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType("sale")} className="rounded-lg">
                          <Check className={`h-4 w-4 mr-2 ${filterType === "sale" ? "opacity-100" : "opacity-0"}`} />
                          Ventes uniquement
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType("expense")} className="rounded-lg">
                          <Check className={`h-4 w-4 mr-2 ${filterType === "expense" ? "opacity-100" : "opacity-0"}`} />
                          Dépenses uniquement
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">Période</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setFilterPeriod("all")} className="rounded-lg">
                          <Check className={`h-4 w-4 mr-2 ${filterPeriod === "all" ? "opacity-100" : "opacity-0"}`} />
                          Toutes les dates
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterPeriod("today")} className="rounded-lg">
                          <Check className={`h-4 w-4 mr-2 ${filterPeriod === "today" ? "opacity-100" : "opacity-0"}`} />
                          Aujourd'hui
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterPeriod("week")} className="rounded-lg">
                          <Check className={`h-4 w-4 mr-2 ${filterPeriod === "week" ? "opacity-100" : "opacity-0"}`} />
                          Cette semaine
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterPeriod("month")} className="rounded-lg">
                          <Check className={`h-4 w-4 mr-2 ${filterPeriod === "month" ? "opacity-100" : "opacity-0"}`} />
                          Ce mois
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">Tri</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSortBy("newest")} className="rounded-lg">
                          <Check className={`h-4 w-4 mr-2 ${sortBy === "newest" ? "opacity-100" : "opacity-0"}`} />
                          Plus récent d'abord
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("oldest")} className="rounded-lg">
                          <Check className={`h-4 w-4 mr-2 ${sortBy === "oldest" ? "opacity-100" : "opacity-0"}`} />
                          Plus ancien d'abord
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("amount-desc")} className="rounded-lg">
                          <Check className={`h-4 w-4 mr-2 ${sortBy === "amount-desc" ? "opacity-100" : "opacity-0"}`} />
                          Montant décroissant
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("amount-asc")} className="rounded-lg">
                          <Check className={`h-4 w-4 mr-2 ${sortBy === "amount-asc" ? "opacity-100" : "opacity-0"}`} />
                          Montant croissant
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {isLoadingSales || isLoadingExpenses ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <Card className="p-12 text-center bg-muted/20 border-dashed rounded-[2rem] flex flex-col items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-muted/40 flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-foreground font-bold">Aucune transaction trouvée</p>
                </div>
                <Button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["sales"] })
                    queryClient.invalidateQueries({ queryKey: ["expenses"] })
                    queryClient.invalidateQueries({ queryKey: ["products"] })
                    toast.info("Mise à jour des données...")
                  }}
                  variant="outline"
                  className="mt-2 gap-2 rounded-xl h-11 px-6 border-2 hover:bg-primary/5 hover:text-primary hover:border-primary transition-all duration-300 font-bold"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </Button>
              </Card>
            ) : (
              <div className="space-y-2">
                {paginatedTransactions.map((t) => (
                  <Card
                    key={t.id}
                    className="group relative overflow-hidden bg-card rounded-3xl border-border/40 shadow-sm transition-all hover:bg-muted/50 cursor-pointer p-3"
                    onClick={() => setViewingTransaction(t)}
                  >
                    <div className="flex items-center">
                      <div className="relative ml-2 mr-2 shrink-0">
                        <div className={`h-11 w-11 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 ${t.type === 'sale' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {t.type === 'sale' ? <ArrowUpRight className="h-5 w-5 stroke-[2.5px]" /> : <ArrowDownRight className="h-5 w-5 stroke-[2.5px]" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-sm leading-tight truncate">
                          {t.type === 'sale' ? t.note || "Vente" : t.description || "Dépense"}
                        </h3>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/50">
                            <span>{formatDate(t.timestamp).date}</span>
                            <span className="opacity-50">•</span>
                            <time>{formatDate(t.timestamp).time}</time>
                          </div>
                          {t.productName && (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-primary/80">
                              <span className="truncate max-w-[180px]">{t.productName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <p className={`text-sm md:text-lg font-black tracking-tighter ${t.type === 'sale' ? 'text-success' : 'text-destructive'}`}>
                          {t.type === 'sale' ? '+' : '-'}{t.amount.toLocaleString()}
                          <span className="text-[9px] ml-1 font-bold opacity-60 uppercase">FCFA</span>
                        </p>

                        <div className="flex items-center mr-2" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground transition-all duration-300"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="p-2 rounded-lg shadow-2xl border-border/50 bg-card/95 backdrop-blur-lg">
                              <DropdownMenuItem onClick={() => setViewingTransaction(t)} className="rounded-xl flex items-center gap-3 py-2 px-4 font-semibold text-sm focus:bg-muted focus:text-foreground transition-all duration-75">
                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                  <Eye className="h-3.5 w-3.5" />
                                </div>
                                Voir détails
                              </DropdownMenuItem>

                              {t.type === 'sale' && (
                                <DropdownMenuItem onClick={() => handleGenerateReceipt(t)} className="rounded-xl flex items-center gap-3 py-2 px-4 font-semibold text-sm focus:bg-green-500/10 focus:text-green-600 transition-colors">
                                  <div className="p-1.5 rounded-lg bg-green-500/10 text-green-600">
                                    <FileText className="h-3.5 w-3.5" />
                                  </div>
                                  Reçu PDF
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => handleEdit(t)} className="rounded-xl flex items-center gap-3 py-2 px-4 font-semibold text-sm focus:bg-primary/10 focus:text-primary transition-colors">
                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                  <Pencil className="h-3.5 w-3.5" />
                                </div>
                                Modifier
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="my-1 bg-border/40" />

                              <DropdownMenuItem
                                onClick={() => setDeletingTransaction(t)}
                                className="rounded-xl flex items-center gap-3 py-2 px-4 font-semibold text-sm text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors"
                              >
                                <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive border-destructive/20">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </div>
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="rounded-lg font-bold h-9 px-4"
                >
                  Précédent
                </Button>
                <span className="text-sm font-bold text-muted-foreground">
                  Page {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="rounded-lg font-bold h-9 px-4"
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Area (Desktop Only) - NOT scrollable */}
        <aside className="space-y-6 hidden lg:block lg:w-1/3 shrink-0 pt-0">
          <Card className="p-6 rounded-2xl border-border bg-card shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Chiffres du Jour
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  Ventes
                  <span className="text-success bg-success/10 px-2 py-0.5 rounded-full text-[10px]">REVENUS</span>
                </div>
                <p className="text-3xl font-black text-success tracking-tighter">{todaySales.toLocaleString()} <span className="text-sm">FCFA</span></p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  Dépenses
                  <span className="text-destructive bg-destructive/10 px-2 py-0.5 rounded-full text-[10px]">SORTIES</span>
                </div>
                <p className="text-3xl font-black text-destructive tracking-tighter">{todayExpenses.toLocaleString()} <span className="text-sm">FCFA</span></p>
              </div>
              <div className="pt-6 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">
                  {todayProfit - todayExpenses >= 0 ? "Bénéfice Réel" : "Perte Réelle"}
                </div>
                <p className={`text-4xl font-black tracking-tighter ${todayProfit - todayExpenses >= 0 ? "text-primary" : "text-destructive"}`}>
                  {(todayProfit - todayExpenses).toLocaleString()} <span className="text-sm">FCFA</span>
                </p>
              </div>
            </div>
          </Card>

          {hasCriticalStock && (
            <Card className="p-5 rounded-2xl border-destructive/20 bg-destructive/5 shadow-sm border-l-4 border-l-destructive">
              <div className="flex items-center gap-2 text-destructive font-black uppercase text-xs tracking-widest mb-4">
                <AlertOctagon className="h-4 w-4" />
                Alertes Stock
              </div>
              <div className="space-y-3">
                {[...outOfStockProducts, ...lowStockProducts].slice(0, 3).map(p => (
                  <div key={p._id} className="flex items-center justify-between border-b border-border/10 pb-2 last:border-0 last:pb-0">
                    <span className="text-sm font-bold truncate max-w-[150px]">{p.name}</span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${p.quantity === 0 ? "bg-destructive text-white" : "bg-orange-500/10 text-orange-600"}`}>
                      {p.quantity === 0 ? "RUPTURE" : `${p.quantity} restants`}
                    </span>
                  </div>
                ))}
                <Button
                  onClick={onNavigateToInventory}
                  variant="link"
                  className="w-full text-destructive text-xs font-black uppercase tracking-widest p-0 h-auto"
                >
                  Voir tout l'inventaire
                </Button>
              </div>
            </Card>
          )}

          {isTrialOver && !isPro && (
            <Card className="p-5 rounded-2xl border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Crown className="h-5 w-5 text-orange-600" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-orange-800">Essai terminé</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Quota gratuit : <span className="font-bold text-foreground">15</span> ventes / mois.
                    Passez à l'offre illimitée pour ne plus être bloqué.
                  </p>
                  <Button
                    onClick={onNavigateToSubscription}
                    className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-orange-500/20"
                  >
                    Passer Pro Illimité
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </aside>

        <EditSaleDialog
          open={!!editingSale}
          onOpenChange={(open: boolean) => !open && setEditingSale(null)}
          sale={editingSale}
        />
        <EditExpenseDialog
          open={!!editingExpense}
          onOpenChange={(open: boolean) => !open && setEditingExpense(null)}
          expense={editingExpense}
        />

        <AlertDialog
          open={!!deletingTransaction}
          onOpenChange={(open: boolean) => !open && setDeletingTransaction(null)}
        >
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette transaction ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible et mettra à jour votre stock si c'est une vente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl font-bold">Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="rounded-xl font-bold bg-destructive hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!viewingTransaction} onOpenChange={(open) => !open && setViewingTransaction(null)}>
          <DialogContent className="w-[92%] sm:max-w-md rounded-[2.5rem] overflow-y-auto max-h-[80vh] p-0 border-none shadow-2xl focus:outline-none scrollbar-none">
            <div className={`p-4 sm:p-6 text-center relative ${lastActiveTransaction?.type === 'sale' ? 'bg-success/5' : 'bg-destructive/5'}`}>
              <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-2 sm:mb-4 ${lastActiveTransaction?.type === 'sale' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {lastActiveTransaction?.type === 'sale' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
              </div>

              <DialogHeader className="p-0 border-none space-y-1 flex flex-col items-center">
                <DialogTitle className="text-base sm:text-lg font-black text-foreground px-4 tracking-tight text-center">
                  {lastActiveTransaction?.type === 'sale' ? 'Détails de la vente' : 'Détails de la dépense'}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-base font-bold text-muted-foreground/80">
                  {lastActiveTransaction?.type === 'sale' ? lastActiveTransaction.productName : ''}
                </DialogDescription>
              </DialogHeader>

              <p className={`text-xl sm:text-4xl font-black tracking-tighter ${lastActiveTransaction?.type === 'sale' ? 'text-success' : 'text-destructive'}`}>
                {lastActiveTransaction?.amount?.toLocaleString()} <span className="text-xs sm:text-sm">FCFA</span>
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Date</span>
                  <p className="text-sm font-bold">{lastActiveTransaction && formatDate(lastActiveTransaction.timestamp).date}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Heure</span>
                  <p className="text-sm font-bold">{lastActiveTransaction && formatDate(lastActiveTransaction.timestamp).time}</p>
                </div>
              </div>

              {lastActiveTransaction?.type === 'sale' && (
                <div className="grid grid-cols-3 gap-2 pt-3 sm:pt-4 border-t border-border/50">
                  <div className="space-y-1 col-span-1 border-r border-border/50">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Quantité</span>
                    <p className="text-sm font-bold">x{lastActiveTransaction.quantitySold || 1}</p>
                  </div>
                  <div className="space-y-1 col-span-1 border-r border-border/50 pl-2">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Prix Unitaire</span>
                    <p className="text-sm font-bold">{lastActiveTransaction.unitPrice?.toLocaleString()}</p>
                  </div>
                  {lastActiveTransaction.profit && lastActiveTransaction.profit > 0 && (
                    <div className="space-y-1 col-span-1 pl-2">
                      <span className="text-[10px] font-black text-green-600 uppercase tracking-wider">Bénéfice</span>
                      <p className="text-sm font-black text-green-600">+{lastActiveTransaction.profit.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 sm:pt-4 border-t border-border/50">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1 sm:mb-2 block">Notes</span>
                <div className="bg-muted/30 p-3 rounded-xl text-sm font-medium italic">
                  {lastActiveTransaction?.type === 'sale'
                    ? lastActiveTransaction.note || "Aucune note ajoutée."
                    : lastActiveTransaction?.description || "Aucune description ajoutée."}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="bare"
                    onClick={() => {
                      if (lastActiveTransaction) {
                        setTimeout(() => {
                          handleEdit(lastActiveTransaction)
                          setViewingTransaction(null)
                        }, 150)
                      }
                    }}
                    className="h-10 rounded-2xl font-black uppercase tracking-widest text-xs border border-primary/20 text-primary hover:bg-primary hover:text-white active:bg-primary active:text-white active:scale-[0.97] transition-all"
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="bare"
                    onClick={() => {
                      if (lastActiveTransaction) {
                        setTimeout(() => {
                          setDeletingTransaction(lastActiveTransaction)
                          setViewingTransaction(null)
                        }, 150)
                      }
                    }}
                    className="h-10 rounded-2xl font-black uppercase tracking-widest text-xs border border-destructive/20 text-destructive hover:bg-destructive hover:text-white active:bg-destructive active:text-white active:scale-[0.97] transition-all"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Supprimer
                  </Button>
                </div>
                <Button
                  variant="bare"
                  onClick={() => {
                    setTimeout(() => setViewingTransaction(null), 150)
                  }}
                  className="h-10 rounded-2xl font-black uppercase tracking-widest text-xs bg-secondary hover:bg-neutral-600 hover:text-white active:bg-neutral-600 active:text-white active:scale-[0.97] transition-all"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <FeatureLockedDialog
          open={showFeatureLock}
          onOpenChange={setShowFeatureLock}
          featureTitle="Export CSV/PDF"
          onUpgrade={() => {
            setShowFeatureLock(false)
            onNavigateToSubscription?.()
          }}
        />
      </div>
    </div>
  )
}
