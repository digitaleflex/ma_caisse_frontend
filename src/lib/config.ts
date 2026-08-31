/**
 * Global configuration for the application
 */

// API URL configuration
// En production: appeler directement l'API backend (serve ne fait pas de proxy)
// En développement: utiliser VITE_API_URL pour pointer vers le backend local
const getApiUrl = (): string => {
    // Si une variable d'environnement est définie, l'utiliser
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // En développement local (sans VITE_API_URL), on retourne une chaîne vide
    // Cela permet au proxy de Vite (défini dans vite.config.ts) de rediriger les appels /api
    // vers le backend local (http://localhost:5002)
    if (import.meta.env.DEV) {
        return '';
    }

    // En production, appeler directement l'API backend via son domaine
    // (serve est un serveur statique qui ne fait pas de proxy)
    return 'https://api-be.eurin.tech';
};

export const API_URL = getApiUrl();

// App configuration
export const APP_NAME = 'Ma Caisse';

export const CONFIG = {
    API_URL,
    APP_NAME,
} as const;
