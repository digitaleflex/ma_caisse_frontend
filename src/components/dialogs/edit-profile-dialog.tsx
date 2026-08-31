"use client"

import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { applyServerValidationErrors } from "@/lib/api"
import { FieldValidator } from "@/components/ui/field-validator"

interface EditProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentFirstName: string
    currentShopName: string
    currentPhoneNumber?: string
}

export function EditProfileDialog({ open, onOpenChange, currentFirstName, currentShopName, currentPhoneNumber }: EditProfileDialogProps) {
    const { updateProfile } = useAuth()

    const schema = z.object({
        firstName: z.string().trim().min(1, "Le prénom est requis"),
        shopName: z.string().trim().min(1, "Le nom de la boutique est requis"),
        phoneNumber: z.string()
            .trim()
            .min(9, "Numéro de téléphone requis (ex: +229...)")
            .regex(/^\+/, "L'indicatif international est requis (commence par +)"),
    })

    type FormValues = z.infer<typeof schema>

    const { register, handleSubmit, formState: { errors, isSubmitting }, setError, reset, control } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: {
            firstName: currentFirstName,
            shopName: currentShopName,
            phoneNumber: currentPhoneNumber || "",
        },
    })

    // Watch fields for real-time validation
    const firstName = useWatch({ control, name: "firstName", defaultValue: currentFirstName })
    const shopName = useWatch({ control, name: "shopName", defaultValue: currentShopName })
    const phoneNumberValue = useWatch({ control, name: "phoneNumber", defaultValue: currentPhoneNumber || "" })

    const onSubmit = async (values: FormValues) => {
        try {
            await updateProfile(values.firstName, values.shopName, values.phoneNumber)
            toast.success('Profil mis à jour', { description: 'Vos informations ont été modifiées avec succès.' })
            onOpenChange(false)
        } catch (e: any) {
            applyServerValidationErrors(setError, e?.body)
            toast.error('Erreur', { description: e?.body?.message || 'Impossible de mettre à jour le profil.' })
        }
    }

    // Reset form when dialog opens
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            reset({ firstName: currentFirstName, shopName: currentShopName, phoneNumber: currentPhoneNumber || "" })
        }
        onOpenChange(newOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md rounded-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-black uppercase tracking-tight">Modifier le profil</DialogTitle>
                    <DialogDescription className="text-xs">
                        Modifiez votre nom et le nom de votre boutique.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <div className="space-y-3">
                        <label htmlFor="firstName" className="text-sm font-medium">
                            Prénom
                        </label>
                        <Input
                            id="firstName"
                            type="text"
                            autoComplete="given-name"
                            {...register("firstName")}
                            className="h-10"
                        />
                        {errors.firstName && (
                            <p className="text-sm text-destructive">{errors.firstName.message}</p>
                        )}
                        <FieldValidator value={firstName} label="Prénom" />
                    </div>
                    <div className="space-y-3">
                        <label htmlFor="shopName" className="text-sm font-medium">
                            Nom de la boutique
                        </label>
                        <Input
                            id="shopName"
                            type="text"
                            autoComplete="organization"
                            {...register("shopName")}
                            className="h-10"
                        />
                        {errors.shopName && (
                            <p className="text-sm text-destructive">{errors.shopName.message}</p>
                        )}
                        <FieldValidator value={shopName} label="Nom de la boutique" />
                    </div>
                    <div className="space-y-3">
                        <label htmlFor="phoneNumber" className="text-sm font-medium">
                            Numéro de téléphone (WhatsApp)
                        </label>
                        <Input
                            id="phoneNumber"
                            type="tel"
                            placeholder="+229 97 00 00 00"
                            {...register("phoneNumber")}
                            className="h-10"
                        />
                        {errors.phoneNumber && (
                            <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Important : Incluez l'indicatif international (ex: +229)
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Ce numéro sera utilisé pour vous contacter en cas de besoin technique ou administratif.
                        </p>
                        <FieldValidator value={phoneNumberValue} label="Téléphone" />
                    </div>
                    {errors.root?.message && (
                        <p className="text-sm text-destructive">{errors.root.message}</p>
                    )}
                    <DialogFooter className="flex-row gap-2 mt-4 pt-2 border-t border-border/40">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wide">
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wide">
                            {isSubmitting ? '...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
