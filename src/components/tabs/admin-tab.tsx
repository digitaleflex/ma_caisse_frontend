"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
    Users,
    ShoppingBag,
    ShieldCheck,
    Trash2,
    ArrowUpRight,
    ArrowLeft,
    CreditCard,
    Mail,
    MessageCircle,
    Download,
    FileText,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Shield,
    ChevronDown,
    Check,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { SearchBar } from "@/components/ui/search-bar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Skeleton } from "@/components/ui/skeleton"
import { FeedbackDetailsDialog } from "@/components/dialogs/feedback-details-dialog"

// --- HELPER: FORMAT PRICE ---
const formatPrice = (amount: number) => {
    return (amount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

// --- HELPER: TABLE SKELETON ---
function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number, cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j}>
                            <Skeleton className="h-5 w-full bg-muted/50" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    )
}

// --- HELPER: STATS SKELETON ---
function StatsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="rounded-md shadow-sm border-l-4 border-l-muted overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

// --- HELPER: EXPORT TO CSV ---
function exportToCSV(data: any[], filename: string, columns: { header: string, key: string, transform?: (val: any) => string }[]) {
    if (!data || data.length === 0) {
        toast.error("Aucune donnée à exporter")
        return
    }

    const toastId = toast.info("Préparation du fichier CSV...", { duration: Infinity })

    try {
        const headerRow = columns.map(col => col.header).join(',')
        const dataRows = data.map(item => {
            return columns.map(col => {
                let val = item[col.key] || ''
                if (col.transform) val = col.transform(item)
                const escaped = ('' + val).replace(/"/g, '""').replace(/\n/g, ' ')
                return `"${escaped}"`
            }).join(',')
        })

        const csvContent = [headerRow, ...dataRows].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.setAttribute('href', url)
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
        link.click()

        toast.dismiss(toastId)
        toast.success("Fichier CSV téléchargé !")
    } catch (e) {
        toast.dismiss(toastId)
        toast.error("Échec de l'exportation CSV")
    }
}

// --- HELPER: EXPORT TO PDF ---
function exportToPDF(data: any[], filename: string, title: string, columns: { header: string, key: string, transform?: (val: any) => string }[]) {
    if (!data || data.length === 0) {
        toast.error("Aucune donnée à exporter")
        return
    }

    const toastId = toast.info("Génération du rapport premium...", { duration: Infinity })

    try {
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.width
        const pageHeight = doc.internal.pageSize.height

        doc.setFillColor(16, 185, 129)
        doc.rect(15, 15, 30, 2, 'F')

        doc.setTextColor(148, 163, 184)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text("BOUTIQUE EASY SYSTEM", 15, 25)

        doc.setTextColor(30, 41, 59)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text(title, 15, 38)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139)
        const dateStr = new Date().toLocaleString('fr-FR', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
        doc.text(`Rapport généré le ${dateStr}`, 15, 45)

        const tableHeaders = [columns.map(col => col.header)]
        const tableRows = data.map(item => {
            return columns.map(col => {
                let val = item[col.key] || ''
                if (col.transform) val = col.transform(item)
                return val
            })
        })

        autoTable(doc, {
            head: tableHeaders,
            body: tableRows,
            startY: 55,
            theme: 'plain',
            styles: {
                fontSize: 9,
                cellPadding: 6,
                font: 'helvetica',
                textColor: [71, 85, 105],
                lineWidth: 0.1,
                lineColor: [241, 245, 249]
            },
            headStyles: {
                fillColor: [248, 250, 252],
                textColor: [30, 41, 59],
                fontStyle: 'bold',
                halign: 'left',
                lineWidth: 0
            },
            margin: { left: 15, right: 15 },
            didDrawPage: (data) => {
                doc.setFontSize(8)
                doc.setTextColor(148, 163, 184)
                const pageStr = `Page ${doc.getNumberOfPages()}`
                doc.text(pageStr, pageWidth - 15, pageHeight - 10, { align: 'right' })
                doc.text("© Ma Caisse - Intelligence Commerciale", 15, pageHeight - 10)
            }
        })

        doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
        toast.dismiss(toastId)
        toast.success("Rapport PDF prêt !")
    } catch (e) {
        toast.dismiss(toastId)
        toast.error("Échec de la génération PDF")
        console.error(e)
    }
}

interface AdminStats {
    totalUsers: number
    activeShops: number
    admins: number
    activeSubscriptions: number
    platformRevenue: number
    totalSalesVolume: number
    topShops: any[]
    recentSales: any[]
    totalSuggestions: number
    version: string
}

interface User {
    _id: string
    firstName: string
    shopName: string
    email: string
    role: string
    phoneNumber?: string
    emailVerified?: boolean
    hasPassword?: boolean
    createdAt: string
    updatedAt: string
}

const isProfileComplete = (user: User | any) => {
    return !!(user.firstName && user.shopName && user.phoneNumber && user.emailVerified && user.hasPassword)
}

type ViewMode = 'dashboard' | 'sales' | 'shops' | 'subscriptions' | 'feedback'

const ITEMS_PER_PAGE = 10

export function AdminTab() {
    const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
    const [adminPage, setAdminPage] = useState(1)
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [userToDelete, setUserToDelete] = useState<string | null>(null)

    const [allSales, setAllSales] = useState<any[]>([])
    const [allShops, setAllShops] = useState<any[]>([])
    const [allSubscriptions, setAllSubscriptions] = useState<any[]>([])
    const [allFeedbacks, setAllFeedbacks] = useState<any[]>([])
    const [isLoadingSubData, setIsLoadingSubData] = useState(false)
    const [selectedFeedback, setSelectedFeedback] = useState<any>(null)
    const [showFeedbackDetails, setShowFeedbackDetails] = useState(false)

    // Search queries
    const [userSearch, setUserSearch] = useState("")
    const [saleSearch, setSaleSearch] = useState("")
    const [shopSearch, setShopSearch] = useState("")
    const [subSearch, setSubSearch] = useState("")
    const [feedbackSearch, setFeedbackSearch] = useState("")

    // Pagination for users
    const [userPage, setUserPage] = useState(1)
    const [userTotalPages, setUserTotalPages] = useState(1)

    // Filters for users
    const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
    const [userProfileFilter, setUserProfileFilter] = useState<'all' | 'complete' | 'incomplete'>('all')

    // Additional filters for specialized views
    const [salePeriodFilter, setSalePeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
    const [shopSortFilter, setShopSortFilter] = useState<'revenue-desc' | 'sales-desc' | 'name-asc'>('revenue-desc')
    const [subStatusFilter, setSubStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all')
    const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<'all' | 'nouveau' | 'en_cours' | 'planifié' | 'terminé' | 'rejeté'>('all')
    const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<'all' | 'suggestion' | 'bug' | 'question' | 'autre'>('all')

    // --- SCROLL TO TOP ON VIEW CHANGE ---
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [viewMode])

    const fetchUsers = async (page: number) => {
        try {
            // Construire les paramètres de requête
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '10');

            if (userSearch) params.append('search', userSearch);
            if (userRoleFilter !== 'all') params.append('role', userRoleFilter);

            const url = `/api/admin/users?${params.toString()}`;
            console.log("Fetching users with URL:", url);

            const usersData: any = await apiFetch(url);
            console.log("Users received:", usersData.users.length, usersData.users);

            setUsers(usersData.users)
            setUserTotalPages(usersData.pagination.pages)
        } catch (error) {
            console.error("Erreur chargement utilisateurs:", error)
            toast.error("Impossible de charger les utilisateurs")
        }
    }

    // Effet pour recharger quand la page, la recherche ou le filtre de rôle change
    // Note: Le filtre de profil reste côté client car c'est une propriété calculée, ou alors il faudrait l'ajouter au backend
    useEffect(() => {
        // Debounce pour la recherche
        const timer = setTimeout(() => {
            fetchUsers(1);
            // Reset à la page 1 si on cherche/filtre, sauf si c'est juste un changement de page
            // Mais ici on simplifie : chaque changement de filtre recharge. 
            // Idéalement, on devrait séparer le changement de page des autres.
        }, 300);

        return () => clearTimeout(timer);
    }, [userSearch, userRoleFilter])

    // Effet dédié à la pagination uniquement
    useEffect(() => {
        if (userPage !== 1) { // Eviter double fetch au chargement initial qui est géré au dessus
            fetchUsers(userPage);
        }
    }, [userPage])

    const fetchData = async () => {
        try {
            const statsData = await apiFetch('/api/admin/stats')
            setStats(statsData as AdminStats)
            // fetchUsers est déclenché par le useEffect initial
        } catch (error) {
            console.error("Erreur chargement admin:", error)
            toast.error("Impossible de charger les données administrateur")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (!isLoading) fetchUsers(userPage)
    }, [userPage])

    const fetchAllSales = async () => {
        setIsLoadingSubData(true)
        try {
            const data: any = await apiFetch('/api/admin/sales?limit=100')
            setAllSales(data.sales)
        } catch (e) {
            toast.error("Erreur chargement ventes")
        } finally {
            setIsLoadingSubData(false)
        }
    }

    const fetchAllShops = async () => {
        setIsLoadingSubData(true)
        try {
            const data: any = await apiFetch('/api/admin/shops-stats')
            setAllShops(data)
        } catch (e) {
            toast.error("Erreur chargement boutiques")
        } finally {
            setIsLoadingSubData(false)
        }
    }

    const fetchAllSubscriptions = async () => {
        setIsLoadingSubData(true)
        try {
            const data: any = await apiFetch('/api/admin/subscriptions?limit=100')
            setAllSubscriptions(data.subscriptions)
        } catch (e) {
            toast.error("Erreur chargement abonnements")
        } finally {
            setIsLoadingSubData(false)
        }
    }

    const fetchAllFeedbacks = async () => {
        setIsLoadingSubData(true)
        try {
            const data: any = await apiFetch('/api/feedback?limit=100')
            setAllFeedbacks(data.feedbacks)
        } catch (e) {
            toast.error("Erreur chargement suggestions")
        } finally {
            setIsLoadingSubData(false)
        }
    }

    useEffect(() => {
        if (viewMode === 'sales') fetchAllSales()
        if (viewMode === 'shops') fetchAllShops()
        if (viewMode === 'subscriptions') fetchAllSubscriptions()
        if (viewMode === 'feedback') fetchAllFeedbacks()
        setAdminPage(1)
    }, [viewMode])

    // Reset pagination when searching or filtering
    useEffect(() => {
        setAdminPage(1)
    }, [saleSearch, salePeriodFilter, shopSearch, shopSortFilter, subSearch, subStatusFilter, feedbackSearch, feedbackStatusFilter, feedbackTypeFilter])

    const handleDeleteUser = async () => {
        if (!userToDelete) return
        try {
            await apiFetch(`/api/admin/users/${userToDelete}`, { method: 'DELETE' })
            toast.success("Utilisateur supprimé avec succès")
            fetchData()
        } catch (error) {
            toast.error("Erreur lors de la suppression")
        } finally {
            setUserToDelete(null)
        }
    }

    const translatePlan = (plan: string) => {
        switch (plan) {
            case 'monthly': return 'Mensuel'
            case 'quarterly': return 'Trimestriel'
            case 'annual': return 'Annuel'
            default: return plan
        }
    }

    if (isLoading && viewMode === 'dashboard') {
        return (
            <div className="space-y-6 p-6 pb-24">
                <div className="space-y-1">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-5 w-64" />
                </div>
                <StatsSkeleton />
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="rounded-md shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b pb-3">
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <TableSkeleton rows={5} cols={4} />
                        </CardContent>
                    </Card>
                    <Card className="rounded-md shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b pb-3">
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="p-0">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <Skeleton className="h-5 w-24" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (viewMode === 'sales') {
        // ... (logique de filtrage)
        const filteredSales = allSales.filter(s => {
            const query = saleSearch.toLowerCase()
            const matchesSearch = !saleSearch || (
                s.userId?.shopName?.toLowerCase().includes(query) ||
                s.userId?.firstName?.toLowerCase().includes(query) ||
                s.note?.toLowerCase().includes(query) ||
                s.amount?.toString().includes(query)
            )

            if (!matchesSearch) return false
            if (salePeriodFilter === 'all') return true

            const saleDate = new Date(s.createdAt)
            const now = new Date()
            if (salePeriodFilter === 'today') {
                return saleDate.toDateString() === now.toDateString()
            }
            if (salePeriodFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                return saleDate >= weekAgo
            }
            if (salePeriodFilter === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                return saleDate >= monthAgo
            }
            return true
        })

        const saleTotalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE)
        const paginatedSales = filteredSales.slice((adminPage - 1) * ITEMS_PER_PAGE, adminPage * ITEMS_PER_PAGE)

        return (
            <div className="space-y-4 md:space-y-6 p-3 md:p-6 pb-24">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setViewMode('dashboard')}
                        className="hover:bg-primary/5 hover:text-primary transition-colors text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Historique des Ventes</h1>
                        <p className="text-sm text-muted-foreground">Toutes les transactions boutiques</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <SearchBar
                        value={saleSearch}
                        onChange={setSaleSearch}
                        placeholder="Rechercher une boutique, un client..."
                        className="w-full sm:max-w-xs"
                    />
                    <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 h-9">
                                    <Filter className="h-4 w-4" />
                                    <span className="truncate">{salePeriodFilter === 'all' ? 'Toutes' :
                                        salePeriodFilter === 'today' ? "Auj." :
                                            salePeriodFilter === 'week' ? "7j" : "30j"}</span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Période</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={salePeriodFilter} onValueChange={(v: any) => setSalePeriodFilter(v)}>
                                    <DropdownMenuRadioItem value="all">Toutes les ventes</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="today">Aujourd'hui</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="week">7 derniers jours</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="month">30 derniers jours</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="hidden sm:block h-4 w-[1px] bg-border mx-1" />

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 hover:bg-primary !hover:text-white transition-colors"
                            onClick={() => exportToCSV(
                                filteredSales,
                                "ventes_plateforme",
                                [
                                    { header: "Date Création", key: "createdAt", transform: (s) => new Date(s.createdAt).toLocaleString() },
                                    { header: "Mise à jour", key: "updatedAt", transform: (s) => new Date(s.updatedAt).toLocaleString() },
                                    { header: "Boutique", key: "shopName", transform: (s) => s.userId?.shopName || '' },
                                    { header: "Client", key: "firstName", transform: (s) => s.userId?.firstName || '' },
                                    { header: "Montant", key: "amount" },
                                    { header: "Note", key: "note" }
                                ]
                            )}
                        >
                            <Download className="h-4 w-4" /> <span className="hidden sm:inline">CSV</span><span className="sm:hidden">CSV</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 hover:bg-primary !hover:text-white transition-colors"
                            onClick={() => exportToPDF(
                                filteredSales,
                                "ventes_plateforme",
                                "Historique des Ventes - Ma Caisse",
                                [
                                    { header: "Date", key: "createdAt", transform: (s) => new Date(s.createdAt).toLocaleString() },
                                    { header: "Mis à jour", key: "updatedAt", transform: (s) => new Date(s.updatedAt).toLocaleString() },
                                    { header: "Boutique", key: "shopName", transform: (s) => s.userId?.shopName || '' },
                                    { header: "Client", key: "firstName", transform: (s) => s.userId?.firstName || '' },
                                    { header: "Montant", key: "amount", transform: (s) => `${formatPrice(s.amount)} FCFA` },
                                    { header: "Note", key: "note" }
                                ]
                            )}
                        >
                            <FileText className="h-4 w-4" /> <span className="hidden sm:inline">PDF</span><span className="sm:hidden">PDF</span>
                        </Button>
                    </div>
                </div>

                <Card className="rounded-md shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[120px]">Date</TableHead>
                                        <TableHead>Boutique</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead className="text-right">Montant</TableHead>
                                        <TableHead className="min-w-[150px] hidden sm:table-cell">Note</TableHead>
                                        <TableHead className="text-right w-[100px]">Contact</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingSubData ? (
                                        <TableSkeleton rows={8} cols={6} />
                                    ) : paginatedSales.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune vente trouvée.</TableCell>
                                        </TableRow>
                                    ) : paginatedSales.map((sale, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-[10px] md:text-sm whitespace-nowrap">
                                                <div className="hidden md:block">
                                                    {new Date(sale.createdAt).toLocaleString('fr-FR')}
                                                </div>
                                                <div className="md:hidden">
                                                    {new Date(sale.createdAt).toLocaleString('fr-FR', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">
                                                {sale.userId?.shopName || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {sale.userId?.firstName || 'Boutique'}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-cyan-700">
                                                {formatPrice(sale.amount)} FCFA
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground truncate max-w-[200px] hidden sm:table-cell" title={sale.note}>
                                                {sale.note || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-3">
                                                    <a href={`mailto:${sale.userId?.email}`} title="Email" className="text-muted-foreground hover:text-blue-500 transition-colors">
                                                        <Mail className="h-4 w-4" />
                                                    </a>
                                                    {sale.userId?.phoneNumber && (
                                                        <a href={`https://wa.me/${sale.userId.phoneNumber.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="text-muted-foreground hover:text-green-500 transition-colors">
                                                            <MessageCircle className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {saleTotalPages > 1 && (
                    <div className="flex items-center justify-between bg-background p-4 border rounded-lg shadow-sm">
                        <div className="text-sm text-muted-foreground">
                            Page <span className="font-medium text-foreground">{adminPage}</span> sur <span className="font-medium text-foreground">{saleTotalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAdminPage(prev => Math.max(1, prev - 1))}
                                disabled={adminPage === 1}
                                className="h-9 transition-all active:scale-95"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Précédent
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAdminPage(prev => Math.min(saleTotalPages, prev + 1))}
                                disabled={adminPage === saleTotalPages}
                                className="h-9 transition-all active:scale-95"
                            >
                                Suivant
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        )
    }


    // --- VIEW: ALL SHOPS ---
    if (viewMode === 'shops') {
        const sortedShops = [...allShops]
            .filter(s => {
                if (!shopSearch) return true
                const query = shopSearch.toLowerCase()
                return (
                    s.shopName?.toLowerCase().includes(query) ||
                    s.firstName?.toLowerCase().includes(query) ||
                    s.email?.toLowerCase().includes(query)
                )
            })
            .sort((a, b) => {
                if (shopSortFilter === 'revenue-desc') return b.totalSales - a.totalSales
                if (shopSortFilter === 'sales-desc') return b.salesCount - a.salesCount
                if (shopSortFilter === 'name-asc') return (a.shopName || "").localeCompare(b.shopName || "")
                return 0
            })

        const shopTotalPages = Math.ceil(sortedShops.length / ITEMS_PER_PAGE)
        const paginatedShops = sortedShops.slice((adminPage - 1) * ITEMS_PER_PAGE, adminPage * ITEMS_PER_PAGE)

        return (
            <div className="space-y-4 md:space-y-6 p-3 md:p-6 pb-24">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setViewMode('dashboard')}
                        className="hover:bg-primary/5 hover:text-primary transition-colors text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Performance des Boutiques</h1>
                        <p className="text-sm text-muted-foreground">Classement et analyse des ventes</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <SearchBar
                        value={shopSearch}
                        onChange={setShopSearch}
                        placeholder="Rechercher une boutique, un propriétaire..."
                        className="w-full sm:max-w-xs"
                    />
                    <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 h-9 whitespace-nowrap">
                                    <Filter className="h-4 w-4" />
                                    <span>{shopSortFilter === 'revenue-desc' ? 'Par CA' :
                                        shopSortFilter === 'sales-desc' ? "Par ventes" : "Par nom"}</span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={shopSortFilter} onValueChange={(v: any) => setShopSortFilter(v)}>
                                    <DropdownMenuRadioItem value="revenue-desc">Chiffre d'Affaires</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="sales-desc">Nombre de Ventes</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="name-asc">Nom de la Boutique (A-Z)</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 hover:bg-primary !hover:text-white transition-colors"
                            onClick={() => exportToCSV(
                                sortedShops,
                                "performance_boutiques",
                                [
                                    { header: "Boutique", key: "shopName" },
                                    { header: "Propriétaire", key: "firstName" },
                                    { header: "Email", key: "email" },
                                    { header: "Téléphone", key: "phoneNumber" },
                                    { header: "Ventes", key: "salesCount" },
                                    { header: "CA Total", key: "totalSales" }
                                ]
                            )}
                        >
                            <Download className="h-4 w-4" /> CSV
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 hover:bg-primary !hover:text-white transition-colors"
                            onClick={() => exportToPDF(
                                sortedShops,
                                "performance_boutiques",
                                "Performance des Boutiques",
                                [
                                    { header: "Boutique", key: "shopName" },
                                    { header: "Propriétaire", key: "firstName" },
                                    { header: "Email", key: "email" },
                                    { header: "Téléphone", key: "phoneNumber" },
                                    { header: "Ventes", key: "salesCount" },
                                    { header: "CA Total", key: "totalSales", transform: (s) => `${formatPrice(s.totalSales)} FCFA` }
                                ]
                            )}
                        >
                            <FileText className="h-4 w-4" /> PDF
                        </Button>
                    </div>
                </div>

                <Card className="rounded-md shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px]">Rang</TableHead>
                                        <TableHead className="min-w-[120px]">Boutique</TableHead>
                                        <TableHead className="min-w-[150px]">Propriétaire</TableHead>
                                        <TableHead className="text-right">Ventes</TableHead>
                                        <TableHead className="text-right min-w-[100px]">CA Total</TableHead>
                                        <TableHead className="text-right w-[100px]">Contact</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingSubData ? (
                                        <TableSkeleton rows={10} cols={6} />
                                    ) : paginatedShops.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune boutique trouvée.</TableCell>
                                        </TableRow>
                                    ) : paginatedShops.map((shop, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-bold text-muted-foreground px-2 text-xs">#{(adminPage - 1) * ITEMS_PER_PAGE + i + 1}</TableCell>
                                            <TableCell className="px-2">
                                                <div className="font-medium text-sm sm:text-base">{shop.shopName}</div>
                                                <div className="text-[10px] text-muted-foreground md:hidden truncate max-w-[120px]">
                                                    {shop.firstName}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{shop.firstName}</div>
                                                <div className="text-xs text-muted-foreground">{shop.email}</div>
                                            </TableCell>
                                            <TableCell className="text-right px-2 text-sm">{shop.salesCount}</TableCell>
                                            <TableCell className="text-right font-bold text-amber-600 px-2 text-sm">
                                                {formatPrice(shop.totalSales)} FCFA
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-2">
                                                    <a href={`mailto:${shop.email}`} title="Email" className="text-muted-foreground hover:text-blue-500 transition-colors p-1">
                                                        <Mail className="h-3 w-3" />
                                                    </a>
                                                    {shop.phoneNumber && (
                                                        <a href={`https://wa.me/${shop.phoneNumber.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="text-muted-foreground hover:text-green-500 transition-colors p-1">
                                                            <MessageCircle className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {shopTotalPages > 1 && (
                    <div className="flex items-center justify-between bg-background p-4 border rounded-lg shadow-sm">
                        <div className="text-sm text-muted-foreground">
                            Page <span className="font-medium text-foreground">{adminPage}</span> sur <span className="font-medium text-foreground">{shopTotalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAdminPage(prev => Math.max(1, prev - 1))}
                                disabled={adminPage === 1}
                                className="h-9 transition-all active:scale-95"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Précédent
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAdminPage(prev => Math.min(shopTotalPages, prev + 1))}
                                disabled={adminPage === shopTotalPages}
                                className="h-9 transition-all active:scale-95"
                            >
                                Suivant
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (viewMode === 'subscriptions') {
        // ... (logique de filtrage)
        const filteredSubscriptions = allSubscriptions.filter(s => {
            const query = subSearch.toLowerCase()
            const matchesSearch = !subSearch || (
                s.userId?.shopName?.toLowerCase().includes(query) ||
                s.userId?.firstName?.toLowerCase().includes(query) ||
                translatePlan(s.plan)?.toLowerCase().includes(query)
            )

            if (!matchesSearch) return false
            if (subStatusFilter === 'all') return true

            const status = s.status?.toLowerCase()
            if (subStatusFilter === 'active') return status === 'active' || status === 'completed' || status === 'success'
            if (subStatusFilter === 'pending') return status === 'pending'
            if (subStatusFilter === 'expired') return status === 'expired'

            return true
        })

        const subTotalPages = Math.ceil(filteredSubscriptions.length / ITEMS_PER_PAGE)
        const paginatedSubscriptions = filteredSubscriptions.slice((adminPage - 1) * ITEMS_PER_PAGE, adminPage * ITEMS_PER_PAGE)

        return (
            <div className="space-y-4 md:space-y-6 p-3 md:p-6 pb-24">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setViewMode('dashboard')}
                        className="hover:bg-primary/5 hover:text-primary transition-colors text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Détail des Abonnements</h1>
                        <p className="text-sm text-muted-foreground">Suivi des revenus plateforme</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <SearchBar
                        value={subSearch}
                        onChange={setSubSearch}
                        placeholder="Rechercher une boutique, un propriétaire..."
                        className="w-full sm:max-w-xs"
                    />
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 h-9">
                                    <Filter className="h-4 w-4" />
                                    <span>{subStatusFilter === 'all' ? 'Tous les statuts' :
                                        subStatusFilter === 'active' ? "Payés / Actifs" :
                                            subStatusFilter === 'pending' ? "En attente" : "Expirés"}</span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={subStatusFilter} onValueChange={(v: any) => setSubStatusFilter(v)}>
                                    <DropdownMenuRadioItem value="all">Tous les abonnements</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="active">Payés / Actifs</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="pending">En attente</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="expired">Expirés</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 hover:bg-primary !hover:text-white transition-colors"
                            onClick={() => exportToCSV(
                                filteredSubscriptions,
                                "abonnements_plateforme",
                                [
                                    { header: "Date", key: "createdAt", transform: (s) => new Date(s.createdAt).toLocaleDateString() },
                                    { header: "Mis à jour", key: "updatedAt", transform: (s) => new Date(s.updatedAt).toLocaleString() },
                                    { header: "Utilisateur", key: "firstName", transform: (s) => s.userId?.firstName || '' },
                                    { header: "Boutique", key: "shopName", transform: (s) => s.userId?.shopName || '' },
                                    { header: "Plan", key: "plan" },
                                    { header: "Statut", key: "status" },
                                    { header: "Fin", key: "endDate", transform: (s) => new Date(s.endDate).toLocaleDateString() },
                                    { header: "Montant", key: "amount" }
                                ]
                            )}
                        >
                            <Download className="h-4 w-4" /> CSV
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 hover:bg-primary !hover:text-white transition-colors"
                            onClick={() => exportToPDF(
                                filteredSubscriptions,
                                "abonnements_plateforme",
                                "Historique des Abonnements - Ma Caisse",
                                [
                                    { header: "Date", key: "createdAt", transform: (s) => new Date(s.createdAt).toLocaleDateString() },
                                    { header: "Mis à jour", key: "updatedAt", transform: (s) => new Date(s.updatedAt).toLocaleString() },
                                    { header: "Utilisateur", key: "firstName", transform: (s) => s.userId?.firstName || '' },
                                    { header: "Boutique", key: "shopName", transform: (s) => s.userId?.shopName || '' },
                                    { header: "Statut", key: "status" },
                                    { header: "Fin", key: "endDate", transform: (s) => new Date(s.endDate).toLocaleDateString() },
                                    { header: "Montant", key: "amount", transform: (s) => `${formatPrice(s.amount)} FCFA` }
                                ]
                            )}
                        >
                            <FileText className="h-4 w-4" /> PDF
                        </Button>
                    </div>
                </div>

                <Card className="rounded-md shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[80px]">Date</TableHead>
                                        <TableHead>Mis à jour</TableHead>
                                        <TableHead className="min-w-[120px]">Utilisateur</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="text-right">Fin</TableHead>
                                        <TableHead className="text-right">Montant</TableHead>
                                        <TableHead className="text-right w-[100px]">Contact</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingSubData ? (
                                        <TableSkeleton rows={8} cols={8} />
                                    ) : paginatedSubscriptions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucun abonnement trouvé.</TableCell>
                                        </TableRow>
                                    ) : paginatedSubscriptions.map((sub, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-xs">{new Date(sub.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{new Date(sub.updatedAt).toLocaleTimeString()}</TableCell>
                                            <TableCell>
                                                <div className="font-medium text-sm">{sub.userId?.shopName || 'N/A'}</div>
                                                <div className="text-xs text-muted-foreground">{sub.userId?.firstName || ''}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {translatePlan(sub.plan)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const s = sub.status?.toLowerCase()
                                                    if (s === 'active' || s === 'completed' || s === 'success') {
                                                        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] sm:text-xs px-2 py-1 h-auto leading-tight whitespace-nowrap">Payé / Actif</Badge>
                                                    }
                                                    if (s === 'pending') {
                                                        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-[10px] sm:text-xs px-2 py-1 h-auto leading-tight">En attente</Badge>
                                                    }
                                                    if (s === 'expired') {
                                                        return <Badge variant="destructive" className="text-[10px] sm:text-xs px-2 py-1 h-auto leading-tight">Expiré</Badge>
                                                    }
                                                    if (s === 'cancelled') {
                                                        return <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-1 h-auto leading-tight">Annulé</Badge>
                                                    }
                                                    return <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-1 h-auto leading-tight">{sub.status}</Badge>
                                                })()}
                                            </TableCell>
                                            <TableCell className="text-right text-xs">
                                                {new Date(sub.endDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600">
                                                {formatPrice(sub.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-3">
                                                    <a href={`mailto:${sub.userId?.email}`} title="Email" className="text-muted-foreground hover:text-blue-500 transition-colors">
                                                        <Mail className="h-4 w-4" />
                                                    </a>
                                                    {sub.userId?.phoneNumber && (
                                                        <a href={`https://wa.me/${sub.userId.phoneNumber.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="text-muted-foreground hover:text-green-500 transition-colors">
                                                            <MessageCircle className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {subTotalPages > 1 && (
                    <div className="flex items-center justify-between bg-background p-4 border rounded-lg shadow-sm">
                        <div className="text-sm text-muted-foreground">
                            Page <span className="font-medium text-foreground">{adminPage}</span> sur <span className="font-medium text-foreground">{subTotalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAdminPage(prev => Math.max(1, prev - 1))}
                                disabled={adminPage === 1}
                                className="h-9 transition-all active:scale-95"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Précédent
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAdminPage(prev => Math.min(subTotalPages, prev + 1))}
                                disabled={adminPage === subTotalPages}
                                className="h-9 transition-all active:scale-95"
                            >
                                Suivant
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // --- VIEW: FEEDBACK / SUGGESTIONS ---
    if (viewMode === 'feedback') {
        const filteredFeedbacks = allFeedbacks.filter(f => {
            const query = feedbackSearch.toLowerCase()
            const matchesSearch = !feedbackSearch || (
                f.userId?.shopName?.toLowerCase().includes(query) ||
                f.userId?.firstName?.toLowerCase().includes(query) ||
                f.message?.toLowerCase().includes(query)
            )

            if (!matchesSearch) return false
            if (feedbackStatusFilter !== 'all' && f.status !== feedbackStatusFilter) return false
            if (feedbackTypeFilter !== 'all' && f.type !== feedbackTypeFilter) return false

            return true
        })

        const feedbackTotalPages = Math.ceil(filteredFeedbacks.length / ITEMS_PER_PAGE)
        const paginatedFeedbacks = filteredFeedbacks.slice((adminPage - 1) * ITEMS_PER_PAGE, adminPage * ITEMS_PER_PAGE)

        const typeLabels: any = {
            suggestion: '💡 Suggestion',
            bug: '🐛 Bug',
            question: '❓ Question',
            autre: '📝 Autre'
        }

        const getStatusBadge = (status: string) => {
            switch (status) {
                case 'nouveau': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">Nouveau</Badge>
                case 'en_cours': return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">En cours</Badge>
                case 'planifié': return <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">Planifié</Badge>
                case 'terminé': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Terminé</Badge>
                case 'rejeté': return <Badge variant="destructive">Rejeté</Badge>
                default: return <Badge variant="outline">{status}</Badge>
            }
        }

        return (
            <div className="space-y-4 md:space-y-6 p-3 md:p-6 pb-24">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setViewMode('dashboard')}
                        className="hover:bg-primary/5 hover:text-primary transition-colors text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Suggestions & Feedback</h1>
                        <p className="text-sm text-muted-foreground">Retours des utilisateurs de la plateforme</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <SearchBar
                        value={feedbackSearch}
                        onChange={setFeedbackSearch}
                        placeholder="Rechercher par message, boutique..."
                        className="w-full sm:max-w-xs"
                    />
                    <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 h-9">
                                    <Filter className="h-4 w-4" />
                                    <span>{feedbackStatusFilter === 'all' ? 'Tous les statuts' : feedbackStatusFilter}</span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Statut</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={feedbackStatusFilter} onValueChange={(v: any) => setFeedbackStatusFilter(v)}>
                                    <DropdownMenuRadioItem value="all">Tous</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="nouveau">Nouveau</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="en_cours">En cours</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="planifié">Planifié</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="terminé">Terminé</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="rejeté">Rejeté</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 h-9">
                                    <Filter className="h-4 w-4" />
                                    <span>{feedbackTypeFilter === 'all' ? 'Tous les types' : typeLabels[feedbackTypeFilter] || feedbackTypeFilter}</span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Type</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={feedbackTypeFilter} onValueChange={(v: any) => setFeedbackTypeFilter(v)}>
                                    <DropdownMenuRadioItem value="all">Tous</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="suggestion">💡 Suggestion</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="bug">🐛 Bug</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="question">❓ Question</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="autre">📝 Autre</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Card className="rounded-md shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[120px]">Date</TableHead>
                                        <TableHead>Utilisateur</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="min-w-[250px]">Message</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="text-center w-[80px]">Rép.</TableHead>
                                        <TableHead className="text-right w-[100px]">Gérer</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingSubData ? (
                                        <TableSkeleton rows={8} cols={7} />
                                    ) : paginatedFeedbacks.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun feedback trouvé.</TableCell>
                                        </TableRow>
                                    ) : paginatedFeedbacks.map((f, i) => (
                                        <TableRow key={i} className="group hover:bg-muted/30">
                                            <TableCell className="text-xs">
                                                {new Date(f.createdAt).toLocaleDateString('fr-FR', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-sm">{f.userId?.shopName || 'N/A'}</div>
                                                <div className="text-xs text-muted-foreground">{f.userId?.firstName || ''}</div>
                                            </TableCell>
                                            <TableCell className="text-xs whitespace-nowrap">
                                                {typeLabels[f.type] || f.type}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <p className="line-clamp-2" title={f.message}>{f.message}</p>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(f.status)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {f.adminResponse ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 p-1 rounded-full">
                                                        <Check className="h-3 w-3" />
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground/30">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 gap-2 px-2 hover:bg-primary/10 hover:text-primary transition-colors"
                                                    onClick={() => {
                                                        setSelectedFeedback(f)
                                                        setShowFeedbackDetails(true)
                                                    }}
                                                >
                                                    <span className="text-xs font-medium">Répondre</span>
                                                    <ChevronRight className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {feedbackTotalPages > 1 && (
                    <div className="flex items-center justify-between bg-background p-4 border rounded-lg shadow-sm">
                        <div className="text-sm text-muted-foreground">
                            Page <span className="font-medium text-foreground">{adminPage}</span> sur <span className="font-medium text-foreground">{feedbackTotalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAdminPage(prev => Math.max(1, prev - 1))}
                                disabled={adminPage === 1}
                                className="h-9 transition-all active:scale-95"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Précédent
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAdminPage(prev => Math.min(feedbackTotalPages, prev + 1))}
                                disabled={adminPage === feedbackTotalPages}
                                className="h-9 transition-all active:scale-95"
                            >
                                Suivant
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                <FeedbackDetailsDialog
                    open={showFeedbackDetails}
                    onOpenChange={(open) => {
                        setShowFeedbackDetails(open)
                        if (!open) fetchAllFeedbacks() // Rafraîchir après fermeture
                    }}
                    feedback={selectedFeedback}
                    onNext={(() => {
                        if (!selectedFeedback) return undefined
                        const idx = filteredFeedbacks.findIndex(f => f._id === selectedFeedback._id)
                        if (idx >= 0 && idx < filteredFeedbacks.length - 1) {
                            return () => setSelectedFeedback(filteredFeedbacks[idx + 1])
                        }
                        return undefined
                    })()}
                    onPrevious={(() => {
                        if (!selectedFeedback) return undefined
                        const idx = filteredFeedbacks.findIndex(f => f._id === selectedFeedback._id)
                        if (idx > 0) {
                            return () => setSelectedFeedback(filteredFeedbacks[idx - 1])
                        }
                        return undefined
                    })()}
                />
            </div>
        )
    }

    // --- VIEW: DASHBOARD (Default) ---
    return (
        <div className="space-y-4 md:space-y-6 p-3 md:p-6 pb-24">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Administration</h1>
                <p className="text-sm md:text-base text-muted-foreground">Vue d'ensemble de la plateforme</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="rounded-md shadow-sm border-l-4 border-l-blue-500 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex flex-col">
                            <CardTitle className="text-sm font-medium">Utilisateurs / Boutiques</CardTitle>
                        </div>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.activeShops || 0} boutiques actives
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-md shadow-sm border-l-4 border-l-emerald-500 relative group overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex flex-col">
                            <CardTitle className="text-sm font-medium">Revenus Plateforme</CardTitle>
                        </div>
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                            <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatPrice(stats?.platformRevenue || 0)} FCFA
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                {stats?.activeSubscriptions || 0} abonnements actifs
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] hover:text-emerald-600 hover:bg-emerald-50 p-0"
                                onClick={() => setViewMode('subscriptions')}
                            >
                                Détails <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-md shadow-sm border-l-4 border-l-violet-500 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Volume d'Affaires</CardTitle>
                        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-full">
                            <ShoppingBag className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatPrice(stats?.totalSalesVolume || 0)} FCFA
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Cumul des ventes boutiques
                        </p>
                    </CardContent>
                </Card>

                {/* Suggestions Card */}
                <Card
                    className="rounded-md shadow-sm border-l-4 border-l-rose-500 overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setViewMode('feedback')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex flex-col">
                            <CardTitle className="text-sm font-medium">Suggestions / Feedback</CardTitle>
                        </div>
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-full">
                            <MessageCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalSuggestions || 0}</div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground mt-1">Retours et idées d'amélioration</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] hover:text-rose-600 hover:bg-rose-50 p-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setViewMode('feedback');
                                }}
                            >
                                Détails <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 w-full overflow-hidden">
                {/* Top Boutiques */}
                <Card className="rounded-md shadow-sm border-l-4 border-l-amber-500 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b p-3 md:pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-amber-600">🏆</span> Top Boutiques
                        </CardTitle>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <div className="flex items-center -space-x-1 sm:space-x-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Exporter le Top 5 (CSV)"
                                    onClick={() => exportToCSV(
                                        stats?.topShops || [],
                                        "top_boutiques",
                                        [
                                            { header: "Boutique", key: "shopName" },
                                            { header: "Ventes", key: "salesCount" },
                                            { header: "CA Total", key: "totalSales" },
                                            { header: "Propriétaire", key: "firstName" },
                                            { header: "Email", key: "email" }
                                        ]
                                    )}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Exporter le Top 5 (PDF)"
                                    onClick={() => exportToPDF(
                                        stats?.topShops || [],
                                        "top_boutiques",
                                        "Top 5 Boutiques Performance",
                                        [
                                            { header: "Boutique", key: "shopName" },
                                            { header: "Ventes", key: "salesCount" },
                                            { header: "CA Total", key: "totalSales", transform: (s) => `${formatPrice(s.totalSales)} FCFA` },
                                            { header: "Propriétaire", key: "firstName" }
                                        ]
                                    )}
                                >
                                    <FileText className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 sm:px-3 gap-1 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors text-xs sm:text-sm"
                                onClick={() => setViewMode('shops')}
                            >
                                <span className="hidden sm:inline">Tout voir</span>
                                <span className="sm:hidden">Voir</span>
                                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[300px] overflow-x-auto w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[120px]">Boutique</TableHead>
                                        <TableHead className="text-right">Ventes</TableHead>
                                        <TableHead className="text-right">CA Total</TableHead>
                                        <TableHead className="text-right w-[80px]">Contact</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats?.topShops?.map((shop: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <div className="font-medium text-sm sm:text-base truncate max-w-[140px]" title={shop.shopName}>{shop.shopName}</div>
                                                <div className="text-xs text-muted-foreground leading-tight truncate max-w-[120px]" title={`${shop.firstName} • ${shop.email}`}>
                                                    {shop.firstName}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-sm">{shop.salesCount}</TableCell>
                                            <TableCell className="text-right font-bold text-sm text-amber-600 whitespace-nowrap">
                                                {formatPrice(shop.totalSales)} FCFA
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-2">
                                                    <a href={`mailto:${shop.email}`} title="Email" className="text-muted-foreground hover:text-blue-500 transition-colors p-1">
                                                        <Mail className="h-3 w-3" />
                                                    </a>
                                                    {shop.phoneNumber && (
                                                        <a href={`https://wa.me/${shop.phoneNumber.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="text-muted-foreground hover:text-green-500 transition-colors p-1">
                                                            <MessageCircle className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!stats?.topShops || stats.topShops.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                                Aucune donnée
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Dernières Ventes */}
                <Card className="rounded-md shadow-sm border-l-4 border-l-cyan-500 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b p-3 md:pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                            <span className="text-cyan-600">⚡</span> Dernières Ventes
                        </CardTitle>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <div className="flex items-center -space-x-1 sm:space-x-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Exporter les ventes récentes (CSV)"
                                    onClick={() => exportToCSV(
                                        stats?.recentSales || [],
                                        "ventes_recentes",
                                        [
                                            { header: "Date", key: "createdAt", transform: (s) => new Date(s.createdAt).toLocaleString() },
                                            { header: "Mis à jour", key: "updatedAt", transform: (s) => new Date(s.updatedAt).toLocaleString() },
                                            { header: "Boutique", key: "shopName", transform: (s) => s.userId?.shopName || '' },
                                            { header: "Montant", key: "amount" },
                                            { header: "Note", key: "note" }
                                        ]
                                    )}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Exporter les ventes récentes (PDF)"
                                    onClick={() => exportToPDF(
                                        stats?.recentSales || [],
                                        "ventes_recentes",
                                        "Dernières Transactions - Ma Caisse",
                                        [
                                            { header: "Date", key: "createdAt", transform: (s) => new Date(s.createdAt).toLocaleString() },
                                            { header: "Mis à jour", key: "updatedAt", transform: (s) => new Date(s.updatedAt).toLocaleString() },
                                            { header: "Boutique", key: "shopName", transform: (s) => s.userId?.shopName || '' },
                                            { header: "Montant", key: "amount", transform: (s) => `${formatPrice(s.amount)} FCFA` }
                                        ]
                                    )}
                                >
                                    <FileText className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 sm:px-3 gap-1 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors text-xs sm:text-sm"
                                onClick={() => setViewMode('sales')}
                            >
                                <span className="hidden sm:inline">Tout voir</span>
                                <span className="sm:hidden">Voir</span>
                                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[300px] overflow-y-auto divide-y scrollbar-thin">
                            {stats?.recentSales?.map((sale: any) => (
                                <div key={sale._id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-4">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{sale.userId?.shopName || 'Boutique inconnue'}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(sale.createdAt).toLocaleDateString('fr-FR', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                            <span className="text-muted-foreground/30">•</span>
                                            <div className="flex items-center gap-3">
                                                <a href={`mailto:${sale.userId?.email}`} title="Email" className="text-muted-foreground hover:text-blue-500 transition-colors">
                                                    <Mail className="h-4 w-4" />
                                                </a>
                                                {sale.userId?.phoneNumber && (
                                                    <a href={`https://wa.me/${sale.userId.phoneNumber.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="text-muted-foreground hover:text-green-500 transition-colors">
                                                        <MessageCircle className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-auto">
                                        <p className="font-bold text-sm text-cyan-700 dark:text-cyan-300">
                                            +{formatPrice(sale.amount)} FCFA
                                        </p>
                                        {sale.note && (
                                            <p className="text-xs text-muted-foreground max-w-[150px] truncate">
                                                {sale.note}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!stats?.recentSales || stats.recentSales.length === 0) && (
                                <div className="p-6 text-center text-muted-foreground">
                                    Aucune vente récente
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-md shadow-sm overflow-hidden border-t-4 border-t-primary/20">
                <CardHeader className="bg-muted/30 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 md:p-6">
                    <CardTitle className="text-lg">Gestion des Utilisateurs</CardTitle>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="w-full sm:w-80">
                            <SearchBar
                                value={userSearch}
                                onChange={setUserSearch}
                                placeholder="Rechercher..."
                                className="w-full"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "h-9 px-3 gap-2 border-dashed transition-all duration-300 shadow-sm",
                                            (userRoleFilter !== 'all' || userProfileFilter !== 'all')
                                                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/60 hover:text-primary"
                                                : "bg-muted/30 hover:bg-muted hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Filter className={cn("h-4 w-4 transition-colors", (userRoleFilter !== 'all' || userProfileFilter !== 'all') ? "text-primary" : "text-muted-foreground")} />
                                        <span className="font-medium">Filtres</span>
                                        {(userRoleFilter !== 'all' || userProfileFilter !== 'all') && (
                                            <Badge className="h-5 min-w-[18px] px-1 rounded-full text-[10px] bg-primary text-primary-foreground border-none animate-in zoom-in-50 duration-300">
                                                {(userRoleFilter !== 'all' && userProfileFilter !== 'all') ? '2' : '1'}
                                            </Badge>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    <DropdownMenuLabel className="text-xs">Rôle</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={userRoleFilter} onValueChange={(v: any) => setUserRoleFilter(v)}>
                                        <DropdownMenuRadioItem value="all" className="text-xs">Tous les rôles</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="admin" className="text-xs">Administrateurs</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="user" className="text-xs">Vendeurs</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-xs">Profil</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={userProfileFilter} onValueChange={(v: any) => setUserProfileFilter(v)}>
                                        <DropdownMenuRadioItem value="all" className="text-xs">Tous les profils</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="complete" className="text-xs">Profils complets</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="incomplete" className="text-xs">Profils incomplets</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                    {(userRoleFilter !== 'all' || userProfileFilter !== 'all') && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <button
                                                onClick={() => { setUserRoleFilter('all'); setUserProfileFilter('all'); }}
                                                className="w-full text-left px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-sm"
                                            >
                                                Réinitialiser
                                            </button>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex items-center gap-1 sm:ml-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Exporter les utilisateurs (CSV)"
                                    onClick={() => exportToCSV(
                                        users,
                                        "gestion_utilisateurs",
                                        [
                                            { header: "Nom", key: "firstName" },
                                            { header: "Boutique", key: "shopName" },
                                            { header: "Email", key: "email" },
                                            { header: "Rôle", key: "role" },
                                            { header: "Profil Complet", key: "_id", transform: (u) => isProfileComplete(u) ? 'OUI' : 'NON' },
                                            { header: "Mise à jour", key: "updatedAt", transform: (u) => new Date(u.updatedAt).toLocaleString() },
                                            { header: "Inscription", key: "createdAt", transform: (u) => new Date(u.createdAt).toLocaleDateString() }
                                        ]
                                    )}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Exporter les utilisateurs (PDF)"
                                    onClick={() => exportToPDF(
                                        users,
                                        "gestion_utilisateurs",
                                        "Gestion Complète des Utilisateurs",
                                        [
                                            { header: "Nom", key: "firstName" },
                                            { header: "Boutique", key: "shopName" },
                                            { header: "Email", key: "email" },
                                            { header: "Rôle", key: "role", transform: (u) => u.role === 'admin' ? 'ADMIN' : 'USER' },
                                            { header: "Complet", key: "_id", transform: (u) => isProfileComplete(u) ? 'OUI' : 'NON' },
                                            { header: "Date", key: "createdAt", transform: (u) => new Date(u.createdAt).toLocaleDateString() }
                                        ]
                                    )}
                                >
                                    <FileText className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto w-full">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="min-w-[100px]">Nom</TableHead>
                                    <TableHead>Boutique</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rôle</TableHead>
                                    <TableHead>Profil</TableHead>
                                    <TableHead className="text-right">Mise à jour</TableHead>
                                    <TableHead className="text-right w-[100px]">Contact</TableHead>
                                    <TableHead className="text-center w-[70px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.filter(u => {
                                    // Profile match (always client-side for now)
                                    const isComplete = isProfileComplete(u)
                                    const matchesProfile = userProfileFilter === 'all' ||
                                        (userProfileFilter === 'complete' && isComplete) ||
                                        (userProfileFilter === 'incomplete' && !isComplete)

                                    return matchesProfile
                                }).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé.</TableCell>
                                    </TableRow>
                                ) : users.filter(u => {
                                    // Profile match
                                    const isComplete = isProfileComplete(u)
                                    const matchesProfile = userProfileFilter === 'all' ||
                                        (userProfileFilter === 'complete' && isComplete) ||
                                        (userProfileFilter === 'incomplete' && !isComplete)

                                    return matchesProfile
                                }).map((user) => (
                                    <TableRow key={user._id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium text-sm">{user.firstName}</TableCell>
                                        <TableCell className="text-sm">{user.shopName}</TableCell>
                                        <TableCell className="text-xs">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={user.role === 'admin' ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"}>
                                                {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {isProfileComplete(user) ? (
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-100 text-[10px]">Complet</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-50 text-[10px]">Incomplet</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs whitespace-nowrap">
                                            {new Date(user.updatedAt).toLocaleDateString('fr-FR', {
                                                day: '2-digit', month: '2-digit', year: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-3">
                                                <a href={`mailto:${user.email}`} title="Email" className="text-muted-foreground hover:text-blue-500 transition-colors p-1">
                                                    <Mail className="h-4 w-4" />
                                                </a>
                                                {user.phoneNumber && (
                                                    <a href={`https://wa.me/${user.phoneNumber.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="text-muted-foreground hover:text-green-500 transition-colors p-1">
                                                        <MessageCircle className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => setUserToDelete(user._id)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors inline-block"
                                                    title="Supprimer l'utilisateur"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/10 border-t">
                        <div className="text-xs text-muted-foreground">
                            Page <span className="font-medium text-foreground">{userPage}</span> sur <span className="font-medium text-foreground">{userTotalPages}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUserPage(p => Math.max(1, p - 1))}
                                disabled={userPage === 1}
                                className="h-8 text-xs gap-1"
                            >
                                <ArrowLeft className="h-3 w-3" /> Précédent
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))}
                                disabled={userPage >= userTotalPages}
                                className="h-8 text-xs gap-1"
                            >
                                Suivant <ArrowUpRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-8 text-center text-xs text-muted-foreground">
                Ma Caisse Admin Panel v1.0.3 • Système de Gestion Centralisé
            </div>

            <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. L'utilisateur et toutes ses données (boutique, ventes) seront définitivement supprimés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
