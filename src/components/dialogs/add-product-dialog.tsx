"use client"

import { z } from "zod"
import { Input } from "@/components/ui/input"
import { productsService } from "@/services/products"
import { FormDialog } from "./form-dialog"
import { useWatch } from "react-hook-form"
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react"

const formSchema = z.object({
    name: z.string().min(1, "Le nom est requis").trim(),
    price: z.preprocess(
        (val) => (val === "" || val === null || val === undefined || isNaN(Number(val)) ? 0 : Number(val)),
        z.number({ message: "Nombre requis" }).min(0, "Le prix ne peut pas être négatif")
    ),
    costPrice: z.preprocess(
        (val) => (val === "" || val === null || val === undefined || isNaN(Number(val)) ? 0 : Number(val)),
        z.number({ message: "Nombre requis" }).min(0, "Le prix d'achat ne peut pas être négatif")
    ),
    quantity: z.preprocess(
        (val) => (val === "" || val === null || val === undefined || isNaN(Number(val)) ? 0 : Number(val)),
        z.number({ message: "Nombre requis" }).min(0, "La quantité ne peut pas être négative")
    ),
}).refine(data => {
    return !(data.costPrice && data.price < data.costPrice)
}, {
    message: "Le prix de vente doit être supérieur au prix d'achat",
    path: ["price"]
})

type FormValues = z.infer<typeof formSchema>

interface AddProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AddProductDialog({ open, onOpenChange }: AddProductDialogProps) {
    return (
        <FormDialog<FormValues>
            open={open}
            onOpenChange={onOpenChange}
            title="Nouveau Produit"
            description="Ajoutez un nouveau produit à votre inventaire."
            schema={formSchema}
            defaultValues={{ name: "", price: 0, costPrice: 0, quantity: 0 }}
            mutationFn={(values) => productsService.createProduct(values as any)}
            invalidateKeys={["products"]}
            successMessage="Produit ajouté"
            successDescription="Le produit a été ajouté avec succès à l'inventaire"
            errorMessage="Impossible d'ajouter le produit"
            submitLabel="Ajouter au stock"
            submittingLabel="Ajout..."
            onSuccess={() => onOpenChange(false)}
        >
            {({ form, touched, handleFieldTouch }) => (
                <ProductFormFields form={form} touched={touched} handleFieldTouch={handleFieldTouch} />
            )}
        </FormDialog>
    )
}

// Champs partagés entre Add et Edit product
export function ProductFormFields({ form, touched, handleFieldTouch }: {
    form: any
    touched: Record<string, boolean>
    handleFieldTouch: (field: string) => void
}) {
    const { register, control, formState: { errors, isValid } } = form
    const price = useWatch({ control, name: "price" })
    const costPrice = useWatch({ control, name: "costPrice" })

    const profit = (price || 0) - (costPrice || 0)
    const isLoss = profit < 0 && (price || 0) > 0 && (costPrice || 0) > 0

    return (
        <>
            <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Nom du produit
                </label>
                <Input
                    id="name"
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
                    <label htmlFor="costPrice" className="text-sm font-medium text-foreground">
                        Prix d'achat (FCFA)
                    </label>
                    <Input
                        id="costPrice"
                        type="number"
                        placeholder="0"
                        {...register("costPrice", { valueAsNumber: true })}
                        onBlur={() => handleFieldTouch("costPrice")}
                        className="h-10 rounded-full text-sm"
                    />
                    {touched.costPrice && errors.costPrice && (
                        <p className="text-xs text-destructive">{errors.costPrice.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label htmlFor="price" className="text-sm font-medium text-foreground">
                        Prix de vente (FCFA)
                    </label>
                    <Input
                        id="price"
                        type="number"
                        placeholder="0"
                        {...register("price", { valueAsNumber: true })}
                        onBlur={() => handleFieldTouch("price")}
                        className={`h-10 rounded-full text-sm ${isLoss ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {touched.price && errors.price && (
                        <p className="text-xs text-destructive">{errors.price.message}</p>
                    )}
                </div>
            </div>

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
                <label htmlFor="quantity" className="text-sm font-medium text-foreground">
                    Quantité en stock
                </label>
                <Input
                    id="quantity"
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

            {!isValid && touched.price && touched.costPrice && isLoss && (
                <div className="flex gap-2 text-destructive items-center bg-destructive/5 p-3 rounded-xl">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="text-xs">Le prix de vente doit être supérieur au prix d'achat pour valider.</p>
                </div>
            )}
        </>
    )
}