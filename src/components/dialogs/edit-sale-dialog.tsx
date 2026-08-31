"use client"

import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch, applyServerValidationErrors } from "@/lib/api"
import { AmountValidator } from "@/components/ui/amount-validator"
import { toast } from "sonner"
import { productsService } from "@/services/products"
import { Check, ChevronsUpDown, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const formSchema = z.object({
    amount: z.preprocess(
        (val) => (val === "" || val === null || val === undefined || isNaN(Number(val)) ? 0 : Number(val)),
        z.number().min(1, "Le montant doit être au moins 1")
    ),
    note: z.string().trim().optional().default(""),
    productId: z.string().optional().default(""),
    quantitySold: z.preprocess(
        (val) => (val === "" || val === null || val === undefined || isNaN(Number(val)) ? 1 : Number(val)),
        z.number().min(1, "La quantité doit être au moins 1")
    ),
})

type FormValues = z.infer<typeof formSchema>

interface EditSaleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sale: {
        id: string
        amount: number
        note?: string
        productId?: string | { _id: string; name?: string }
        quantitySold?: number
    } | null
}

export function EditSaleDialog({ open, onOpenChange, sale }: EditSaleDialogProps) {
    const [touched, setTouched] = useState<{ amount: boolean; note: boolean }>({ amount: false, note: false })
    const [productSearchOpen, setProductSearchOpen] = useState(false)
    const [selectedProductId, setSelectedProductId] = useState("")

    const queryClient = useQueryClient()

    const { data: products = [] } = useQuery({
        queryKey: ["products"],
        queryFn: productsService.listProducts,
        enabled: open,
    })

    const extendedFormSchema = formSchema.refine((data) => {
        if (data.productId && sale) {
            const product = products.find(p => p._id === data.productId)
            if (product) {
                // If same product, available stock is product.quantity + old sale quantity
                const isSameProduct = sale.productId && (typeof sale.productId === 'string' ? sale.productId === data.productId : (sale.productId as any)._id === data.productId)
                const availableStock = isSameProduct ? product.quantity + (sale.quantitySold || 1) : product.quantity
                if (data.quantitySold > availableStock) {
                    return false
                }
            }
        }
        return true
    }, {
        message: "La quantité dépasse le stock disponible",
        path: ["quantitySold"]
    })

    const {
        register,
        handleSubmit,
        reset,
        setError,
        setValue,
        control,
        formState: { errors, isValid, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(extendedFormSchema) as any,
        mode: "onChange",
        defaultValues: {
            amount: 0,
            note: "",
            productId: "",
            quantitySold: 1
        },
    })

    const watchedProductId = useWatch({ control, name: "productId" })
    const watchedQuantity = useWatch({ control, name: "quantitySold" })
    const amountValue = useWatch({ control, name: "amount" })

    // Initialize form with sale data
    useEffect(() => {
        if (sale && open) {
            const pId = typeof sale.productId === 'object' ? (sale.productId as any)._id : (sale.productId as string)
            reset({
                amount: sale.amount,
                note: sale.note || "",
                productId: pId || "",
                quantitySold: sale.quantitySold || 1
            })
            setSelectedProductId(pId || "")
            setTouched({ amount: false, note: false })
        }
    }, [sale, open, reset])

    // Sync amount when product or quantity changes (only if it matches the current price)
    useEffect(() => {
        if (watchedProductId && open) {
            const product = products.find(p => p._id === watchedProductId)
            if (product) {
                const total = product.price * (watchedQuantity || 1)
                // Only auto-update if we just selected a NEW product OR if it was already matching
                setValue("amount", total, { shouldValidate: true })
            }
        }
    }, [watchedProductId, watchedQuantity, products, setValue, open])

    const selectedProduct = products.find(p => p._id === watchedProductId)
    const unitPrice = selectedProduct?.price || 0
    const costPrice = selectedProduct?.costPrice || 0
    const profit = selectedProduct ? (unitPrice - costPrice) * (watchedQuantity || 1) : 0

    const updateSaleMutation = useMutation({
        mutationFn: async (data: FormValues) => {
            if (!sale) return
            return apiFetch(`/api/sales/update-sale/${sale.id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] })
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast.success("Vente modifiée", {
                description: "La vente a été mise à jour avec succès",
            })
            onOpenChange(false)
            reset()
        },
        onError: (error: any) => {
            applyServerValidationErrors(setError, error.body)
            toast.error("Erreur", {
                description: error.body?.message || "Impossible de modifier la vente",
            })
        },
    })

    const onSubmit = (values: FormValues) => {
        updateSaleMutation.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[92%] sm:max-w-md rounded-[2.5rem] overflow-y-auto max-h-[80vh] p-0 border-none shadow-2xl focus:outline-none scrollbar-none">
                <DialogHeader className="p-4 sm:p-6 pb-2 border-b shrink-0">
                    <DialogTitle className="text-xl font-bold">Modifier la Vente</DialogTitle>
                    <DialogDescription>
                        Ajustez les détails de cette vente.
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto scrollbar-thin flex-1 p-4 sm:p-6 space-y-3">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Produit de l'inventaire
                            </label>
                            <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen} modal={true}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between h-10 rounded-full text-sm font-normal border-border"
                                    >
                                        {selectedProductId
                                            ? products.find((p) => p._id === selectedProductId)?.name
                                            : "Sélectionner un produit..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="p-0 rounded-2xl shadow-xl overflow-hidden border-none"
                                    align="start"
                                    style={{ width: 'var(--radix-popover-trigger-width)' }}
                                >                                    <Command className="rounded-none border-none h-auto">
                                        <CommandInput placeholder="Chercher un produit..." />
                                        <CommandList className="max-h-[200px] overflow-y-auto">
                                            <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                                            <CommandGroup>
                                                {products.map((p) => (
                                                    <CommandItem
                                                        key={p._id}
                                                        value={`${p.name} ${p.price} ${p._id}`}
                                                        onSelect={() => {
                                                            setSelectedProductId(p._id)
                                                            setValue("productId", p._id)
                                                            setValue("note", `Vente de ${p.name}`)
                                                            setProductSearchOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedProductId === p._id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>{p.name}</span>
                                                            <span className="text-xs text-muted-foreground">{p.price.toLocaleString()} FCFA - Stock: {p.quantity}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {selectedProductId && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedProductId("")
                                        setValue("productId", "")
                                    }}
                                    className="text-xs h-6 px-2 text-muted-foreground"
                                >
                                    Effacer la sélection
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label htmlFor="edit-quantitySold" className="text-sm font-medium text-foreground">
                                    Quantité vendue
                                </label>
                                {selectedProduct && (
                                    <span className="text-xs text-muted-foreground">
                                        Stock actuel: {selectedProduct.quantity}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-full shrink-0 border-border"
                                    onClick={() => {
                                        const current = watchedQuantity || 1
                                        if (current > 1) setValue("quantitySold", current - 1, { shouldValidate: true })
                                    }}
                                >
                                    <Minus className="h-5 w-5" />
                                </Button>

                                <Input
                                    id="edit-quantitySold"
                                    type="number"
                                    {...register("quantitySold", { valueAsNumber: true })}
                                    className="h-10 rounded-full text-center text-base font-semibold bg-secondary/30"
                                    onFocus={(e) => e.target.select()}
                                />

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-full shrink-0 border-border"
                                    onClick={() => {
                                        const current = watchedQuantity || 1
                                        const isSameProduct = sale && sale.productId && (typeof sale.productId === 'string' ? sale.productId === watchedProductId : (sale.productId as any)._id === watchedProductId)
                                        const availableStock = selectedProduct ? (isSameProduct ? selectedProduct.quantity + (sale?.quantitySold || 1) : selectedProduct.quantity) : Infinity

                                        if (current < availableStock) {
                                            setValue("quantitySold", current + 1, { shouldValidate: true })
                                        } else {
                                            toast.error("Limite atteinte", {
                                                description: `Stock maximum disponible: ${availableStock} unités.`,
                                            })
                                        }
                                    }}
                                >
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </div>
                            {errors.quantitySold && (
                                <p className="text-sm text-destructive">{errors.quantitySold.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label htmlFor="edit-sale-amount" className="text-sm font-medium text-foreground">
                                    Montant Total (FCFA)
                                </label>
                                {profit > 0 && (
                                    <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-full">
                                        +{profit.toLocaleString()} bénéfice
                                    </span>
                                )}
                            </div>
                            <Input
                                id="edit-sale-amount"
                                type="number"
                                placeholder="0"
                                {...register("amount")}
                                onFocus={(e) => {
                                    if (e.target.value === "0") setValue("amount", "" as any)
                                }}
                                onChange={(e) => {
                                    register("amount").onChange(e)
                                    setTouched(t => ({ ...t, amount: true }))
                                }}
                                className="h-10 rounded-full text-sm"
                            />
                            {touched.amount && errors.amount && (
                                <p className="text-sm text-destructive">{errors.amount.message}</p>
                            )}
                            <AmountValidator amount={String(amountValue || "")} showValidation={touched.amount} />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="edit-sale-note" className="text-sm font-medium text-foreground">
                                Note (optionnel)
                            </label>
                            <Input
                                id="edit-sale-note"
                                type="text"
                                placeholder="Ex: Vente de riz"
                                {...register("note")}
                                className="h-10 rounded-full text-sm"
                            />
                        </div>

                        <Button type="submit" size="lg" disabled={!isValid || isSubmitting || updateSaleMutation.isPending} className="h-10 w-full rounded-full text-sm font-semibold bg-primary text-white mt-2">
                            {updateSaleMutation.isPending ? "Modification..." : "Modifier"}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
