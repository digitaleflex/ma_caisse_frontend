"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Product } from "@/types"
import { Card } from "@/components/ui/card"
import { Package, Tag, BarChart3, Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product: Product | null
}

export function ProductDetailsDialog({ open, onOpenChange, product }: ProductDetailsDialogProps) {
    if (!product) return null

    const profit = product.costPrice ? product.price - product.costPrice : null
    const margin = product.costPrice && product.price > 0
        ? ((profit! / product.price) * 100).toFixed(1)
        : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-md max-h-[80vh] overflow-y-auto border-border">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        Détails du Produit
                    </DialogTitle>
                    <DialogDescription>
                        Fiche complète des informations de votre produit en stock.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-2xl">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${product.quantity === 0 ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
                            }`}>
                            <Package className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-bold truncate">{product.name}</h2>
                            <p className={`text-xs font-medium ${product.quantity === 0 ? "text-red-600" : "text-muted-foreground"
                                }`}>
                                Stock: {product.quantity} unités {product.quantity === 0 && "(Rupture)"}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Card className="p-3 rounded-2xl border-border bg-card shadow-sm">
                            <div className="flex flex-col gap-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                    <Tag className="h-3 w-3" /> Prix Vente
                                </p>
                                <p className="text-base font-bold text-primary">{product.price.toLocaleString()} FCFA</p>
                            </div>
                        </Card>

                        <Card className="p-3 rounded-2xl border-border bg-card shadow-sm">
                            <div className="flex flex-col gap-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                    <BarChart3 className="h-3 w-3" /> Prix Achat
                                </p>
                                <p className="text-base font-bold text-foreground">
                                    {product.costPrice ? `${product.costPrice.toLocaleString()} FCFA` : "Non spécifié"}
                                </p>
                            </div>
                        </Card>
                    </div>

                    {product.costPrice ? (
                        <div className={`p-3 rounded-2xl border flex flex-col gap-2 ${profit! > 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                            }`}>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Profit estimé par unité</span>
                                <span className={`text-base font-black ${profit! > 0 ? "text-green-600" : "text-red-600"}`}>
                                    {profit! > 0 ? "+" : ""}{profit?.toLocaleString()} FCFA
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Marge bénéficiaire</span>
                                <span className={`text-sm font-bold ${profit! > 0 ? "text-green-600" : "text-red-600"}`}>
                                    {margin}%
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex gap-3 items-start">
                            <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-orange-800">
                                Spécifiez un prix d'achat pour calculer automatiquement votre bénéfice et votre marge.
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-4 pt-0">
                    <Button onClick={() => onOpenChange(false)} className="w-full h-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/10">
                        Fermer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
