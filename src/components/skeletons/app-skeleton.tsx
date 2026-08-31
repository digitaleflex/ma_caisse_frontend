import { Skeleton } from "@/components/ui/skeleton"

// Composant squelette affiché pendant le chargement initial de l'application
// Imite la structure de MainApp pour une transition visuelle fluide
export function AppSkeleton() {
    return (
        <div className="flex min-h-screen flex-col bg-background pb-16 md:pb-20">
            {/* Zone de contenu principale */}
            <div className="flex-1 p-4 space-y-6">
                {/* En-tête simulé avec titre et avatar */}
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>

                {/* Cartes de contenu simulées (tableau de bord ou liste) */}
                <div className="grid gap-4">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                </div>
            </div>

            {/* Barre de navigation inférieure simulée (4 onglets) */}
            <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card">
                <div className="flex items-center justify-around px-3 py-2 md:px-4 md:py-3 h-[60px]">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <Skeleton className="h-6 w-6 rounded-md" />
                            <Skeleton className="h-3 w-10 rounded-full" />
                        </div>
                    ))}
                </div>
            </nav>
        </div>
    )
}
