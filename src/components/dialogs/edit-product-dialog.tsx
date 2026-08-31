"use client"

import { z } from "zod"
import { productsService } from "@/services/products"
import { Product } from "@/types"
import { FormDialog } from "./form-dialog"
import { ProductFormFields } from "./add-product-dialog"

const formSchema = z.object({
    name: z.string().min(1, "Le nom est requis").trim(),
    price: z.number({ message: "Nombre requis" }).min(0, "Le prix ne peut pas être négatif"),
    costPrice: z.number({ message: "Nombre requis" }).min(0, "Le prix d'achat ne peut pas être négatif"),
    quantity: z.number({ message: "Nombre requis" }).min(0, "La quantité ne peut pas être négative"),
}).refine(data => {
    return !(data.costPrice && data.price < data.costPrice)
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
    return (
        <FormDialog<FormValues>
            open={open}
            onOpenChange={onOpenChange}
            title="Modifier le Produit"
            description="Mettez à jour les informations du produit sélectionné."
            schema={formSchema}
            editValues={
                product
                    ? {
                        name: product.name,
                        price: product.price,
                        costPrice: product.costPrice || 0,
                        quantity: product.quantity,
                    }
                    : null
            }
            key={product?._id || "no-product"}
            mutationFn={(values) => productsService.updateProduct(product?._id || "", values as any)}
            invalidateKeys={["products"]}
            successMessage="Produit mis à jour"
            successDescription="Les modifications ont été enregistrées avec succès"
            errorMessage="Impossible de modifier le produit"
            submitLabel="Enregistrer"
            submittingLabel="Mise à jour..."
            onSuccess={() => onOpenChange(false)}
        >
            {({ form, touched, handleFieldTouch }) => (
                <ProductFormFields form={form} touched={touched} handleFieldTouch={handleFieldTouch} />
            )}
        </FormDialog>
    )
}