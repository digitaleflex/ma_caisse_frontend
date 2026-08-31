import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function ProfileSkeleton() {
    return (
        <div className="space-y-6 pb-20">
            {/* Header Skeleton */}
            <div className="relative mb-6 px-4 pt-4 md:px-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </div>

            {/* Subscription Card Skeleton */}
            <div className="px-4 md:px-6">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Menu Items Skeleton */}
            <div className="space-y-3 px-4 md:px-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                ))}
            </div>

            {/* Logout Button Skeleton */}
            <div className="px-4 md:px-6">
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            {/* Version Skeleton */}
            <div className="flex justify-center py-4">
                <Skeleton className="h-3 w-32" />
            </div>
        </div>
    )
}
