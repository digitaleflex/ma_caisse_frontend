"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UserPlus, History, FileText, Phone, User, MoreVertical, Pencil, Trash2, Search, Plus } from "lucide-react"
import { SearchBar } from "@/components/ui/search-bar"
import { AddDebtorDialog } from "@/components/dialogs/add-debtor-dialog"
import { RepaymentDialog } from "@/components/dialogs/repayment-dialog"
import { RepaymentHistoryDialog } from "@/components/dialogs/repayment-history-dialog"
import { DebtorDetailsDialog } from "@/components/dialogs/debtor-details-dialog"
import { EditDebtorDialog } from "@/components/dialogs/edit-debtor-dialog"
import { FeatureLockedDialog } from "@/components/dialogs/feature-locked-dialog"
import { apiFetch } from "@/lib/api"
import { generateDebtorsReport } from "@/lib/pdf-service"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Filter, ChevronDown, Check, Download } from "lucide-react"
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

interface Debtor {
  _id: string
  name: string
  amount: number
  phone?: string
}

interface Repayment {
  _id: string
  debtorId: {
    _id: string
    name: string
  }
  amount: number
  createdAt: string
}

interface CreditsTabProps {
  userProfile?: {
    firstName: string
    shopName: string
    email?: string
    phoneNumber?: string
  }
  isPro?: boolean
  isLoadingSubscription?: boolean
  onNavigateToSubscription?: () => void
  onOpenNewCredit?: () => void
}

const ITEMS_PER_PAGE = 10

export function CreditsTab({ userProfile, isPro, isLoadingSubscription, onNavigateToSubscription, onOpenNewCredit }: CreditsTabProps) {
  const [showRepaymentDialog, setShowRepaymentDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showFeatureLock, setShowFeatureLock] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "cleared">("all")
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "amount-desc" | "amount-asc">("name-asc")
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null)
  const [selectedDebtorForHistory, setSelectedDebtorForHistory] = useState<{ name: string; id: string } | null>(null)
  const [selectedDebtorForDetails, setSelectedDebtorForDetails] = useState<Debtor | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const queryClient = useQueryClient()

  // Fetch debtors from API
  const { data: allDebtors = [], isLoading } = useQuery({
    queryKey: ["debtors"],
    queryFn: async () => {
      const response = await apiFetch("/api/debtors/list-debtors", { method: "GET" })
      return (response as { data: Debtor[] }).data || []
    },
  })

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, sortBy])

  const filteredDebtors = allDebtors.filter(d => {
    // 1. Filter by SEARCH
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!(
        d.name.toLowerCase().includes(query) ||
        d.phone?.toLowerCase().includes(query) ||
        d.amount.toString().includes(query)
      )) return false
    }

    // 2. Filter by STATUS
    if (filterStatus === "active" && d.amount <= 0) return false
    if (filterStatus === "cleared" && d.amount > 0) return false

    return true
  })

  // Apply SORTING
  const sortedDebtors = [...filteredDebtors].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name)
      case "name-desc":
        return b.name.localeCompare(a.name)
      case "amount-desc":
        return b.amount - a.amount
      case "amount-asc":
        return a.amount - b.amount
      default:
        return 0
    }
  })

  // Pagination logic
  const totalPages = Math.ceil(sortedDebtors.length / ITEMS_PER_PAGE)
  const debtors = sortedDebtors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Fetch repayments from API
  const { data: repayments = [] } = useQuery({
    queryKey: ["repayments"],
    queryFn: async () => {
      const response = await apiFetch("/api/repayments/list-repayments", { method: "GET" })
      return (response as { data: Repayment[] }).data || []
    },
  })

  const deleteDebtorMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`/api/debtors/delete-debtor/${id}`, { method: "DELETE" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debtors"] })
      queryClient.invalidateQueries({ queryKey: ["repayments"] })
      toast.success("Client supprimé")
      setShowDeleteAlert(false)
    },
    onError: (error: any) => {
      toast.error("Erreur de suppression", {
        description: error.body?.message || "Une erreur est survenue",
      })
    },
  })

  const totalDebt = allDebtors.reduce((sum, debtor) => sum + debtor.amount, 0)

  // Group repayments by debtor
  const repaymentsByDebtor = repayments.reduce((acc, repayment) => {
    // Safety check: handle both populated (object) and unpopulated (string) debtorId
    const debtorId = typeof repayment.debtorId === 'object'
      ? repayment.debtorId?._id
      : repayment.debtorId

    if (!debtorId) return acc

    if (!acc[debtorId.toString()]) {
      acc[debtorId.toString()] = []
    }
    acc[debtorId.toString()].push(repayment)
    return acc
  }, {} as Record<string, Repayment[]>)

  const openRepaymentDialog = (debtor: Debtor) => {
    setSelectedDebtor(debtor)
    setShowRepaymentDialog(true)
  }

  const openHistoryDialog = (debtor: Debtor) => {
    setSelectedDebtorForHistory({ name: debtor.name, id: debtor._id })
    setShowHistoryDialog(true)
  }

  const openDetailsDialog = (debtor: Debtor) => {
    setSelectedDebtorForDetails(debtor)
    setShowDetailsDialog(true)
  }

  const openEditDialog = (debtor: Debtor) => {
    setSelectedDebtor(debtor)
    setShowEditDialog(true)
  }

  const confirmDelete = (debtor: Debtor) => {
    setSelectedDebtor(debtor)
    setShowDeleteAlert(true)
  }

  const handleExport = () => {
    if (!isPro) {
      setShowFeatureLock(true)
      return
    }

    if (!userProfile) return

    // Transform debtors list to match the interface expected by pdf-service
    // pdf-service expects { name, totalDebt, phone? }
    const reportData = debtors.map(d => ({
      name: d.name,
      totalDebt: d.amount,
      phone: d.phone
    }))

    generateDebtorsReport(
      reportData,
      {
        name: userProfile.shopName || "Mon Magasin",
        ownerName: userProfile.firstName || "Propriétaire",
        phone: userProfile.phoneNumber,
        email: userProfile.email
      }
    )
    toast.success("Votre téléchargement a démarré", {
      description: "Vérifiez vos téléchargements ou notifications"
    })
  }

  return (
    <div className="pb-16 md:pb-0 md:flex md:flex-col md:h-full md:overflow-hidden">
      {/* Header - fixed, never scrolls on desktop */}
      <div className="flex flex-col gap-4 shrink-0 p-4 md:p-6 md:pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Crédits</h1>
            <p className="text-sm text-muted-foreground">Gérez les dettes de vos clients</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Action Button */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                onClick={() => onOpenNewCredit?.()}
                className="gap-2 bg-primary text-white hover:bg-primary/90"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Nouveau Crédit
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="flex gap-1.5 rounded-md h-8 md:h-10 px-2.5 md:px-4 active:scale-90 transition-all duration-200"
              onClick={handleExport}
              title="Exporter en PDF"
            >
              <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="text-[10px] md:text-sm font-bold uppercase">PDF</span>
            </Button>
          </div>
        </div>

        {/* Total Debt Summary Card */}
        <Card className="rounded-2xl border-border bg-card p-4 md:p-6 shadow-sm">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Montant total que vos clients vous doivent</p>
          <p className="text-3xl font-black text-primary tracking-tight">{totalDebt.toLocaleString()} FCFA</p>
        </Card>
      </div>

      {/* Search & Filter - Fixed in Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 px-4 md:px-6 pb-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-1 md:w-72">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher un client..."
              className="w-full"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={`gap-1.5 shrink-0 h-9 px-3 rounded-md active:scale-90 data-[state=open]:scale-90 transition-all duration-200 ${filterStatus !== "all" ? "border-primary text-primary bg-primary/5" : ""}`}>
                <Filter className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold text-foreground">
                  {filterStatus === "all" ? "Filtres" :
                    filterStatus === "active" ? "Crédits actifs" : "Crédits soldés"}
                </span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-[300px] overflow-y-auto scrollbar-thin shadow-xl border-border/50">
              <DropdownMenuLabel>Statut</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                <Check className={`h-4 w-4 mr-2 ${filterStatus === "all" ? "opacity-100" : "opacity-0"}`} />
                Tous les clients
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                <Check className={`h-4 w-4 mr-2 ${filterStatus === "active" ? "opacity-100" : "opacity-0"}`} />
                Dettes actives
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("cleared")}>
                <Check className={`h-4 w-4 mr-2 ${filterStatus === "cleared" ? "opacity-100" : "opacity-0"}`} />
                Dettes soldées
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Trier par</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSortBy("name-asc")}>
                <Check className={`h-4 w-4 mr-2 ${sortBy === "name-asc" ? "opacity-100" : "opacity-0"}`} />
                Nom (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name-desc")}>
                <Check className={`h-4 w-4 mr-2 ${sortBy === "name-desc" ? "opacity-100" : "opacity-0"}`} />
                Nom (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("amount-desc")}>
                <Check className={`h-4 w-4 mr-2 ${sortBy === "amount-desc" ? "opacity-100" : "opacity-0"}`} />
                Montant élevé
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("amount-asc")}>
                <Check className={`h-4 w-4 mr-2 ${sortBy === "amount-asc" ? "opacity-100" : "opacity-0"}`} />
                Montant faible
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scrollable list area */}

      {/* Scrollable list area */}
      <div className="md:flex-1 md:overflow-y-auto md:px-6 px-4 space-y-6 scrollbar-thin pb-24">
        <div className="space-y-4">

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex h-[88px] w-full items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-28 rounded-full" />
                    <Skeleton className="h-10 w-28 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : debtors.length === 0 ? (
            <Card className="rounded-2xl border-border bg-card p-8 text-center shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <UserPlus className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">Aucun client trouvé</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajustez vos filtres ou ajoutez un nouveau client
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {debtors.map((debtor) => {
                  const debtorRepayments = repaymentsByDebtor[debtor._id] || []
                  const hasRepayments = debtorRepayments.length > 0

                  return (
                    <Card key={debtor._id} className="relative group overflow-hidden rounded-md border-border bg-card shadow-sm transition-all hover:shadow-md">
                      <div className="p-2 sm:p-3">
                        <div className="flex items-center justify-between gap-5">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                              <User className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="pr-1">
                                <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground">{debtor.name}</h3>
                              </div>

                              <div>
                                <p className="text-sm font-black text-primary leading-none">
                                  {debtor.amount.toLocaleString()} <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">FCFA</span>
                                </p>
                                {debtor.phone && (
                                  <div className="flex items-center gap-1 mt-1 text-muted-foreground/60">
                                    <Phone className="h-2.5 w-2.5" />
                                    <span className="text-[10px] font-medium">{debtor.phone}</span>
                                  </div>
                                )}
                              </div>

                              {hasRepayments && (
                                <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 whitespace-nowrap">
                                  <History className="h-3 w-3 shrink-0" />
                                  {debtorRepayments.length} remboursement{debtorRepayments.length > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              {hasRepayments && (
                                <Button
                                  onClick={() => openHistoryDialog(debtor)}
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs justify-center rounded-full border-primary/20 bg-background font-semibold text-primary hover:bg-primary/5 hover:text-primary w-full sm:w-auto"
                                >
                                  <History className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  <span>Historique</span>
                                </Button>
                              )}
                              <Button
                                onClick={() => openRepaymentDialog(debtor)}
                                size="sm"
                                className="h-7 px-3 text-[10px] sm:h-8 sm:px-4 sm:text-xs rounded-full font-semibold shadow-sm w-full sm:w-auto"
                              >
                                Rembourser
                              </Button>
                            </div>

                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-transparent">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDetailsDialog(debtor)}>
                                  <History className="mr-2 h-4 w-4" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(debtor)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => confirmDelete(debtor)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                    Précédent
                  </Button>

                  <div className="text-sm font-medium text-muted-foreground">
                    Page {currentPage} sur {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    Suivant
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dialogs */}
        <RepaymentDialog
          open={showRepaymentDialog}
          onOpenChange={setShowRepaymentDialog}
          debtor={selectedDebtor}
        />
        <RepaymentHistoryDialog
          open={showHistoryDialog}
          onOpenChange={setShowHistoryDialog}
          debtorName={selectedDebtorForHistory?.name || ""}
          repayments={selectedDebtorForHistory ? repaymentsByDebtor[selectedDebtorForHistory.id] || [] : []}
        />
        <DebtorDetailsDialog
          key={selectedDebtorForDetails?._id || "details-dialog"}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          debtor={selectedDebtorForDetails}
          repayments={selectedDebtorForDetails ? repaymentsByDebtor[selectedDebtorForDetails._id] || [] : []}
          onOpenRepayment={() => selectedDebtorForDetails && openRepaymentDialog(selectedDebtorForDetails)}
        />
        <EditDebtorDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          debtor={selectedDebtor}
        />

        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer <strong>{selectedDebtor?.name}</strong> ?
                <br />
                Cette action est irréversible et supprimera également tout l'historique associé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedDebtor && deleteDebtorMutation.mutate(selectedDebtor._id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Feature Locked Dialog for PDF Export */}
        <FeatureLockedDialog
          open={showFeatureLock}
          onOpenChange={setShowFeatureLock}
          featureTitle="Export Liste Créditeurs"
          onUpgrade={() => {
            setShowFeatureLock(false)
            onNavigateToSubscription?.()
          }}
        />
      </div>
    </div>
  )
}
