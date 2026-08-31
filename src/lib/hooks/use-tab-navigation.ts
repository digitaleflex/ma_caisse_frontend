"use client"

import { useState, useEffect, useCallback } from "react"

export type Tab = "home" | "inventory" | "summary" | "credits" | "profile" | "admin"

export const TABS: Tab[] = ["home", "inventory", "summary", "credits", "profile", "admin"]

export const TAB_VALUES: string[] = TABS

export function isValidTab(value: string | null): value is Tab {
    return !!value && TABS.includes(value as Tab)
}

/**
 * Hook de navigation par onglets centralisé.
 * Gère :
 * - L'état de l'onglet actif
 * - La synchronisation avec l'URL (?tab=)
 * - La navigation via boutons Précédent/Suivant du navigateur
 * - Le reset au scroll top
 */
export function useTabNavigation({
    defaultTab = "home",
    role,
}: {
    defaultTab?: Tab
    role?: string
}) {
    const [activeTab, setActiveTab] = useState<Tab>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const tabParam = params.get('tab')
            if (isValidTab(tabParam)) {
                return tabParam
            }
        }
        // Redirection automatique pour admin
        if (role === 'admin') return "admin"
        return defaultTab
    })

    // Synchroniser les changements d'onglet avec l'URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('tab') !== activeTab) {
            params.set('tab', activeTab)
            const newUrl = `${window.location.pathname}?${params.toString()}`
            window.history.pushState(null, '', newUrl)
        }
        window.scrollTo(0, 0)
    }, [activeTab])

    // Gérer les boutons Précédent/Suivant du navigateur
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search)
            const tabParam = params.get('tab')
            if (isValidTab(tabParam)) {
                setActiveTab(tabParam)
            } else if (!tabParam) {
                setActiveTab("home")
            }
        }

        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [])

    return { activeTab, setActiveTab }
}

/**
 * Détermine les onglets visibles selon le rôle.
 */
export function getVisibleTabs(role?: string): { tab: Tab; label: string }[] {
    const isAdmin = role === 'admin'
    if (isAdmin) {
        return [
            { tab: "admin", label: "Dashboard" },
            { tab: "profile", label: "Profil" },
        ]
    }
    return [
        { tab: "home", label: "Accueil" },
        { tab: "inventory", label: "Stock" },
        { tab: "credits", label: "Crédits" },
        { tab: "summary", label: "Bilan" },
    ]
}