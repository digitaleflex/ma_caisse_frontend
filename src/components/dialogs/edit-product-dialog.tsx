"use client"

import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { productsService } from "@/services/products"
import { Product } from "@/types"
import { applyServerValidationErrors } from "@/lib/api"
import { toast } from "sonner"
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react"

const formSchema = z.object({
    name: z.string().min(1, "Le nom est requis").trim(),
    price: z.number({ message: "Nombre requis" }).min(0, "Le prix ne peut pas être négatif"),
    costPrice: z.number({ message: "Nombre requis" }).min(0, "Le prix d'achat ne peut pas être négatif"),
    quantity: z.number({ message: "Nombre requis" }).min(0, "La quantité ne peut pas être négative"),
}).refine(data => {
    if (data.costPrice && data.price < data.costPrice) {
        return false
    }
    return true
}, {
    message: "Le prix de vente doit être supérieur au prix d'achat",
    path: ["price"]
})

type FormValues = z.infer<typeof formSchema>

interface EditProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product: Product | null
}

export function EditProductDialog({ open, onOpenChange, product }: EditProductDialogProps) {
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        reset,
        setError,
        control,
        formState: { errors, isValid, isSubmitting },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
    })

    const price = useWatch({ control, name: "price" })
    const costPrice = useWatch({ control, name: "costPrice" })

    const profit = (price || 0) - (costPrice || 0)
    const isLoss = profit < 0 && (price || 0) > 0 && (costPrice || 0) > 0

    useEffect(() => {
        if (product) {
            reset({
                name: product.name,
                price: product.price,
                costPrice: product.costPrice || 0,
                quantity: product.quantity,
            })
            setTouched({})
        }
    }, [product, reset])

    const updateProductMutation = useMutation({
        mutationFn: (data: Partial<FormValues>) => productsService.updateProduct(product!._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast.success("Produit mis à jour", {
                description: "Les modifications ont été enregistrées avec succès",
            })
            onOpenChange(false)
        },
        onError: (error: any) => {
            applyServerValidationErrors(setError, error.body)
            toast.error("Erreur", {
                description: error.body?.message || "Impossible de modifier le produit",
            })
        },
    })

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        updateProductMutation.mutate(values)
    }

    const handleFieldTouch = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-md max-h-[80vh] overflow-y-auto border-border">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Modifier le Produit</DialogTitle>
                    <DialogDescription>
                        Mettez à jour les informations du produit sélectionné.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <div className="space-y-2">
                        <label htmlFor="edit-name" className="text-sm font-medium text-foreground">
                            Nom du produit
                        </label>
                        <Input
                            id="edit-name"
                            placeholder="Ex: Riz 50kg"
                            {...register("name")}
                            onBlur={() => handleFieldTouch("name")}
                            className="h-10 rounded-full text-sm"
                        />
                        {touched.name && errors.name && (
                            <p className="text-xs text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="space-y-2">
                            <label htmlFor="edit-costPrice" className="text-sm font-medium text-foreground">
                                Prix d'achat (FCFA)
                            </label>
                            <Input
                                id="edit-costPrice"
                                type="number"
                                placeholder="0"
                                {...register("costPrice", { valueAsNumber: true })}
                                onBlur={() => handleFieldTouch("costPrice")}
                                className="h-10 rounded-full text-sm"
                            />
                            {touched.costPrice && errors.costPrice && (
                                <p className="text-xs text-destructive absolute mt-1">{errors.costPrice.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="edit-price" className="text-sm font-medium text-foreground">
                                Prix de vente (FCFA)
                            </label>
                            <Input
                                id="edit-price"
                                type="number"
                                placeholder="0"
                                {...register("price", { valueAsNumber: true })}
                                onBlur={() => handleFieldTouch("price")}
                                className={`h-10 rounded-full text-sm ${isLoss ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            />
                            {touched.price && errors.price && (
                                <p className="text-xs text-destructive absolute mt-1">{errors.price.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="h-2"></div> {/* Spacer for absolute error messages */}

                    {(price || 0) > 0 && (costPrice || 0) > 0 && (
                        <div className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${isLoss ? "bg-red-50 border-red-100 text-red-700" : "bg-green-50 border-green-100 text-green-700"
                            }`}>
                            {isLoss ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                            <div className="flex-1 text-sm">
                                <p className="font-bold">
                                    {isLoss ? "Attention : Vente à perte" : "Bénéfice estimé"}
                                </p>
                                <p className="opacity-80">
                                    {profit.toLocaleString()} FCFA par unité ({(((price || 0) > 0 ? profit / (price || 1) : 0) * 100).toFixed(1)}%)
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="edit-quantity" className="text-sm font-medium text-foreground">
                            Quantité en stock
                        </label>
                        <Input
                            id="edit-quantity"
                            type="number"
                            placeholder="0"
                            {...register("quantity", { valueAsNumber: true })}
                            onBlur={() => handleFieldTouch("quantity")}
                            className="h-10 rounded-full text-sm"
                        />
                        {touched.quantity && errors.quantity && (
                            <p className="text-xs text-destructive">{errors.quantity.message}</p>
                        )}
                    </div>

                    <div className="pt-2">
                        {!isValid && touched.price && touched.costPrice && isLoss && (
                            <div className="flex gap-2 text-destructive items-center mb-4 bg-destructive/5 p-3 rounded-xl">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p className="text-xs">Le prix de vente doit être supérieur au prix d'achat pour valider.</p>
                            </div>
                        )}
                        <Button
                            type="submit"
                            size="lg"
                            disabled={!isValid || isSubmitting || updateProductMutation.isPending}
                            className="h-10 w-full rounded-full font-bold transition-all shadow-lg text-white text-xs uppercase tracking-wide"
                        >
                            {updateProductMutation.isPending ? "Mise à jour..." : "Enregistrer"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
