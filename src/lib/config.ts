/**
 * Global configuration for the application
 */

// API URL configuration
// En production: appeler directement l'API backend (serve ne fait pas de proxy)
// En développement: utiliser VITE_API_URL pour pointer vers le backend local
const getApiUrl = (): string => {
    // En dev local, retourner '' pour que le proxy Vite prenne le relais
    if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        return '';
    }

    // Partout ailleurs (prod, preview, ou dev avec URL explicite)
    return import.meta.env.VITE_API_URL || '';
};

export const API_URL = getApiUrl();

// App configuration
export const APP_NAME = 'Ma Caisse';

export const CONFIG = {
    API_URL,
    APP_NAME,
} as const;
