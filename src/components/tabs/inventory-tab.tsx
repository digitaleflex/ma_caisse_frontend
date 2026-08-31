"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchBar } from "@/components/ui/search-bar"
import {
    Package,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    AlertTriangle,
    Search,
    Filter,
    ChevronDown,
    Check,
    Package2,
    Download,
    FileText
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
import { productsService } from "@/services/products"
import { Product } from "@/types"
import { toast } from "sonner"
import { AddProductDialog } from "@/components/dialogs/add-product-dialog"
import { EditProductDialog } from "@/components/dialogs/edit-product-dialog"
import { ProductDetailsDialog } from "@/components/dialogs/product-details-dialog"
import { Eye } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { generateInventoryReport } from "@/lib/pdf-service"

interface InventoryTabProps {
    isPro?: boolean
    onNavigateToSubscription?: () => void
    onOpenProduct?: () => void
}

const ITEMS_PER_PAGE = 10

export function InventoryTab({ isPro, onNavigateToSubscription, onOpenProduct }: InventoryTabProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStock, setFilterStock] = useState<"all" | "low" | "out">("all")
    const [sortBy, setSortBy] = useState<"name-asc" | "quantity-desc" | "price-desc" | "price-asc">("name-asc")
    const [currentPage, setCurrentPage] = useState(1)
    const { user, updateProfile } = useAuth()
    const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
        // Priorité : Profil utilisateur > localStorage > Défaut (5)
        if (user?.lowStockThreshold) return user.lowStockThreshold
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem("lowStockThreshold")
            return saved ? parseInt(saved, 10) : 5
        }
        return 5
    })

    // Synchroniser si le profil change (ex: depuis un autre appareil ou l'onglet profil)
    useEffect(() => {
        if (user?.lowStockThreshold) {
            setLowStockThreshold(user.lowStockThreshold)
        }
    }, [user?.lowStockThreshold])

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteAlert, setShowDeleteAlert] = useState(false)
    const [showDetailsDialog, setShowDetailsDialog] = useState(false)

    const queryClient = useQueryClient()

    // Reset à la page 1 quand les filtres changent
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, filterStock, sortBy])

    // Gestion de la cohérence Filtre/Tri
    useEffect(() => {
        if (filterStock === "out" && sortBy === "quantity-desc") {
            setSortBy("name-asc")
        }
    }, [filterStock, sortBy])

    const { data: allProducts = [], isLoading } = useQuery({
        queryKey: ["products"],
        queryFn: productsService.listProducts,
    })

    const deleteProductMutation = useMutation({
        mutationFn: productsService.deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast.success("Produit supprimé")
            setShowDeleteAlert(false)
            setSelectedProduct(null)
        },
        onError: (error: any) => {
            toast.error("Erreur de suppression", {
                description: error.body?.message || "Une erreur est survenue",
            })
        },
    })

    const filteredProducts = allProducts.filter(p => {
        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            if (!p.name.toLowerCase().includes(query)) return false
        }

        // Stock Filter
        if (filterStock === "low" && (p.quantity <= 0 || p.quantity > lowStockThreshold)) return false
        if (filterStock === "out" && p.quantity > 0) return false

        return true
    })

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case "name-asc":
                return a.name.localeCompare(b.name)
            case "quantity-desc":
                return b.quantity - a.quantity
            case "price-desc":
                return b.price - a.price
            case "price-asc":
                return a.price - b.price
            default:
                return 0
        }
    })

    const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE)
    const products = sortedProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const lowStockCount = allProducts.filter(p => p.quantity > 0 && p.quantity <= lowStockThreshold).length
    const outOfStockCount = allProducts.filter(p => p.quantity === 0).length

    const handleExportPDF = () => {
        try {
            generateInventoryReport(
                allProducts.map(p => ({
                    name: p.name,
                    price: p.price,
                    quantity: p.quantity
                })),
                {
                    name: user?.shopName || "Mon Magasin",
                    ownerName: user?.firstName || "Propriétaire",
                    phone: user?.phoneNumber,
                    email: user?.email
                }
            );
            toast.success("PDF généré avec succès");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la génération du PDF");
        }
    };

    const handleExportCSV = () => {
        try {
            const headers = ["Nom", "Prix (FCFA)", "Quantité", "Valeur Totale (FCFA)"];
            const rows = allProducts.map(p => [
                p.name,
                p.price,
                p.quantity,
                p.price * p.quantity
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Inventaire_${formatDateForFile(new Date())}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("CSV exporté avec succès");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'export CSV");
        }
    };

    const formatDateForFile = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    return (
        <div className="pb-24 md:pb-0 md:flex md:flex-col md:h-full md:overflow-hidden">
            {/* Header - fixed, never scrolls on desktop */}
            <div className="flex flex-col gap-4 shrink-0 p-4 md:p-6 md:pb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Inventaire</h1>
                        <p className="text-sm text-muted-foreground">Gérez vos produits et votre stock</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex gap-1.5 rounded-md h-8 md:h-10 px-2.5 md:px-4 active:scale-90 transition-all duration-200"
                            onClick={handleExportPDF}
                            title="Exporter en PDF"
                        >
                            <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="text-[10px] md:text-sm font-bold uppercase">PDF</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex gap-1.5 rounded-md h-8 md:h-10 px-2.5 md:px-4 active:scale-90 transition-all duration-200"
                            onClick={handleExportCSV}
                            title="Exporter en CSV"
                        >
                            <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="text-[10px] md:text-sm font-bold uppercase">CSV</span>
                        </Button>
                        <Button
                            onClick={() => onOpenProduct?.()}
                            className="hidden md:flex gap-2 bg-primary text-white hover:bg-primary/90 rounded-md"
                        >
                            <Plus className="h-4 w-4" />
                            Nouveau Produit
                        </Button>
                    </div>

                </div>

                {/* Global Stock Status Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="rounded-2xl border-border bg-card p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 mt-0.5">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Stock Faible</p>
                                <p className="text-xl font-black text-orange-600 tracking-tight">{lowStockCount}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="rounded-2xl border-border bg-card p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 mt-0.5">
                                <Package2 className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rupture</p>
                                <p className="text-xl font-black text-red-600 tracking-tight">{outOfStockCount}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Search & Filter - Fixed in Header (Sibling now) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 px-4 md:px-6 pb-4">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex-1 md:w-72">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Chercher un produit..."
                            className="w-full"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className={`gap-1.5 shrink-0 h-9 px-3 rounded-md active:scale-90 data-[state=open]:scale-90 transition-all duration-200 ${filterStock !== "all" ? "border-primary text-primary bg-primary/5" : ""}`}>
                                <Filter className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-bold">
                                    {filterStock === "all" ? "Filtres" :
                                        filterStock === "low" ? "Stock faible" : "En rupture"}
                                </span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 shadow-xl border-border/50">
                            <DropdownMenuLabel>Stock</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setFilterStock("all")}>
                                <Check className={`h-4 w-4 mr-2 ${filterStock === "all" ? "opacity-100" : "opacity-0"}`} />
                                Tous les produits
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStock("low")}>
                                <Check className={`h-4 w-4 mr-2 ${filterStock === "low" ? "opacity-100" : "opacity-0"}`} />
                                Stock faible
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStock("out")}>
                                <Check className={`h-4 w-4 mr-2 ${filterStock === "out" ? "opacity-100" : "opacity-0"}`} />
                                Rupture de stock
                            </DropdownMenuItem>


                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Tri</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setSortBy("name-asc")}>
                                <Check className={`h-4 w-4 mr-2 ${sortBy === "name-asc" ? "opacity-100" : "opacity-0"}`} />
                                Nom (A-Z)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setSortBy("quantity-desc")}
                                disabled={filterStock === "out"}
                                className={filterStock === "out" ? "opacity-50 cursor-not-allowed" : ""}
                            >
                                <Check className={`h-4 w-4 mr-2 ${sortBy === "quantity-desc" ? "opacity-100" : "opacity-0"}`} />
                                Plus gros stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy("price-desc")}>
                                <Check className={`h-4 w-4 mr-2 ${sortBy === "price-desc" ? "opacity-100" : "opacity-0"}`} />
                                Prix élevé
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy("price-asc")}>
                                <Check className={`h-4 w-4 mr-2 ${sortBy === "price-asc" ? "opacity-100" : "opacity-0"}`} />
                                Prix bas
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Scrollable list area */}
            <div className="md:flex-1 md:overflow-y-auto md:px-6 px-4 space-y-6 scrollbar-thin pb-24">
                {/* List & Controls */}
                <div className="space-y-4">

                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <Card className="rounded-2xl border-border bg-card p-12 text-center shadow-sm">
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <Package className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">Aucun produit</p>
                                    <p className="text-sm text-muted-foreground mt-1">Commencez par ajouter vos articles en stock</p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {products.map((p) => (
                                <Card key={p._id} className="rounded-xl border-border bg-card p-3 shadow-sm transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => {
                                            setSelectedProduct(p)
                                            setShowDetailsDialog(true)
                                        }}>
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${p.quantity === 0 ? "bg-red-100 text-red-600" :
                                                p.quantity <= lowStockThreshold ? "bg-orange-100 text-orange-600" :
                                                    "bg-primary/10 text-primary"
                                                }`}>
                                                <Package className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-foreground text-sm leading-tight truncate">{p.name}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[11px] font-bold ${p.quantity === 0 ? "text-red-600" :
                                                        p.quantity <= lowStockThreshold ? "text-orange-600" :
                                                            "text-muted-foreground"
                                                        }`}>
                                                        Stock: {p.quantity}
                                                    </span>
                                                    <span className="text-muted-foreground/30">•</span>
                                                    <span className="text-[11px] font-bold text-primary">{p.price.toLocaleString()} FCFA</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-lg">
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedProduct(p)
                                                        setShowDetailsDialog(true)
                                                    }}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Voir détails
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedProduct(p)
                                                        setShowEditDialog(true)
                                                    }}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Modifier
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedProduct(p)
                                                            setShowDeleteAlert(true)
                                                        }}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Supprimer
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="rounded-xl"
                                    >
                                        Précédent
                                    </Button>
                                    <span className="text-sm text-muted-foreground font-medium">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="rounded-xl"
                                    >
                                        Suivant
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>


                {/* Dialogs */}
                <ProductDetailsDialog
                    open={showDetailsDialog}
                    onOpenChange={(open) => {
                        setShowDetailsDialog(open)
                        if (!open) setSelectedProduct(null)
                    }}
                    product={selectedProduct}
                />
                <EditProductDialog
                    open={showEditDialog}
                    onOpenChange={(open) => {
                        setShowEditDialog(open)
                        if (!open) setSelectedProduct(null)
                    }}
                    product={selectedProduct}
                />

                <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                    <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer <strong>{selectedProduct?.name}</strong> de votre inventaire ?
                                Cette action est irréversible.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => selectedProduct && deleteProductMutation.mutate(selectedProduct._id)}
                                className="bg-destructive text-white hover:bg-destructive/90"
                            >
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div >
    )
}
