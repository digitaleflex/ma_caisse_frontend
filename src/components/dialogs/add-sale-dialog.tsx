"use client"

import { useState, useEffect } from "react"
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
import { generateDigitalReceipt } from "@/lib/pdf-service"
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
import { LimitReachedDialog } from "@/components/dialogs/limit-reached-dialog"

const formSchema = z.object({
  amount: z.coerce.number().min(1, "Le montant doit être au moins 1"),
  note: z.string().trim().optional().default(""),
  productId: z.string().optional().default(""),
  quantitySold: z.preprocess((val) => (val === "" || val === null ? 1 : Number(val)), z.number().min(1, "La quantité doit être au moins 1")),
})

type FormValues = z.infer<typeof formSchema>

interface AddSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateToSubscription?: () => void
  userProfile?: {
    firstName: string
    shopName: string
    email?: string
    phoneNumber?: string
  }
}

export function AddSaleDialog({ open, onOpenChange, onNavigateToSubscription, userProfile }: AddSaleDialogProps) {
  const [touched, setTouched] = useState<{ amount: boolean; note: boolean }>({ amount: false, note: false })
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitInfo, setLimitInfo] = useState({ limit: 15 })
  const [productSearchOpen, setProductSearchOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState("")

  const queryClient = useQueryClient()

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: productsService.listProducts,
    enabled: open,
  })

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
  }).refine((data) => {
    if (data.productId) {
      const product = products.find(p => p._id === data.productId)
      if (product && data.quantitySold > product.quantity) {
        return false
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
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
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

  useEffect(() => {
    if (watchedProductId) {
      const product = products.find(p => p._id === watchedProductId)
      if (product) {
        const total = product.price * (watchedQuantity || 1)
        setValue("amount", total, { shouldValidate: true })
      }
    }
  }, [watchedProductId, watchedQuantity, products, setValue])

  const selectedProduct = products.find(p => p._id === watchedProductId)
  const unitPrice = selectedProduct?.price || 0
  const costPrice = selectedProduct?.costPrice || 0
  const profit = selectedProduct ? (unitPrice - costPrice) * (watchedQuantity || 1) : 0

  const createSaleMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiFetch("/api/sales/add-sale", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
    onSuccess: (res: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })

      const newSale = res.data
      const productName = products.find(p => p._id === variables.productId)?.name
      const unitPrice = products.find(p => p._id === variables.productId)?.price

      toast.success("Vente enregistrée", {
        description: `Vente de ${variables.amount} FCFA ajoutée avec succès`,
        action: {
          label: "Reçu PDF",
          onClick: () => handleGenerateReceipt({
            ...newSale,
            productName: productName,
            quantity: variables.quantitySold,
            unitPrice: unitPrice
          })
        }
      })

      reset()
      setTouched({ amount: false, note: false })
      setSelectedProductId("")
      onOpenChange(false)
    },
    onError: (error: any) => {
      if (error.status === 403 && error.body?.code === 'LIMIT_REACHED') {
        setLimitInfo({ limit: error.body.limit || 15 })
        onOpenChange(false)
        setShowLimitDialog(true)
        return
      }
      applyServerValidationErrors(setError, error.body)
      toast.error("Erreur", {
        description: error.body?.message || "Impossible d'ajouter la vente",
      })
    },
  })

  const onSubmit = (values: FormValues) => {
    createSaleMutation.mutate(values)
  }

  const handleGenerateReceipt = (sale: any) => {
    if (!userProfile) return
    generateDigitalReceipt(
      {
        amount: sale.amount,
        note: sale.note,
        createdAt: sale.createdAt,
        productName: sale.productName,
        quantity: sale.quantitySold || 1
      },
      {
        name: userProfile.shopName || "Mon Magasin",
        ownerName: userProfile.firstName || "Propriétaire",
        phone: userProfile.phoneNumber,
        email: userProfile.email
      }
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-3xl sm:max-w-md max-h-[80vh] flex flex-col p-0 overflow-hidden bg-card">
          <DialogHeader className="p-4 pb-2 border-b shrink-0">
            <DialogTitle className="text-xl font-bold">Ajouter une Vente</DialogTitle>
            <DialogDescription>
              Enregistrez une nouvelle transaction de vente.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto scrollbar-thin flex-1 p-4 space-y-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Produit de l'inventaire (optionnel)
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
                  >
                    <Command className="rounded-none border-none h-auto">
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
                  <label htmlFor="quantitySold" className="text-sm font-medium text-foreground">
                    Quantité vendue
                  </label>
                  {selectedProduct && (
                    <span className="text-xs text-muted-foreground">
                      Disponibilité: {selectedProduct.quantity}
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
                    <Minus className="h-6 w-6" />
                  </Button>

                  <Input
                    id="quantitySold"
                    type="number"
                    {...register("quantitySold", { valueAsNumber: true })}
                    className="h-10 rounded-full text-center text-sm font-semibold bg-secondary/30"
                    onFocus={(e) => e.target.select()}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full shrink-0 border-border"
                    onClick={() => {
                      const current = watchedQuantity || 1
                      if (!selectedProduct || current < selectedProduct.quantity) {
                        setValue("quantitySold", current + 1, { shouldValidate: true })
                      } else {
                        toast.error("Limite atteinte", {
                          description: `Seulement ${selectedProduct.quantity} unités disponibles en stock.`,
                        })
                      }
                    }}
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
                {errors.quantitySold && (
                  <p className="text-sm text-destructive">{errors.quantitySold.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="amount" className="text-sm font-medium text-foreground">
                    Montant Total (FCFA)
                  </label>
                  {profit > 0 && (
                    <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-full">
                      +{profit.toLocaleString()} bénéfice
                    </span>
                  )}
                </div>
                <Input
                  id="amount"
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
                  className="h-10 rounded-full text-sm font-bold"
                />
                {touched.amount && errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
                <AmountValidator amount={String(amountValue || "")} showValidation={touched.amount} />
              </div>

              <div className="space-y-2">
                <label htmlFor="note" className="text-sm font-medium text-foreground">
                  Note (optionnel)
                </label>
                <Input
                  id="note"
                  type="text"
                  placeholder="Ex: Vente de riz"
                  {...register("note")}
                  className="h-10 rounded-full text-sm"
                />
              </div>

              <Button type="submit" size="lg" disabled={!isValid || isSubmitting || createSaleMutation.isPending} className="h-10 w-full rounded-full text-sm font-semibold bg-primary text-white mt-2">
                {createSaleMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <LimitReachedDialog
        open={showLimitDialog}
        onOpenChange={setShowLimitDialog}
        limitType="Ventes"
        currentLimit={limitInfo.limit}
        onUpgrade={() => {
          setShowLimitDialog(false)
          onNavigateToSubscription?.()
        }}
      />
    </>
  )
}
