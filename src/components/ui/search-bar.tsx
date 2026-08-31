"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchBarProps extends Omit<React.ComponentProps<"div">, "onChange"> {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = "Rechercher...", className, ...props }: SearchBarProps) {
    return (
        <div className={cn("relative w-full", className)} {...props}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-9 h-9 bg-card border-border/50 rounded-full text-sm"
                placeholder={placeholder}
            />
        </div>
    )
}
