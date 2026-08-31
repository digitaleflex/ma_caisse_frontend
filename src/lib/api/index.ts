/**
 * API Client centralisé
 * Regroupe tous les services API
 */

export { apiFetch, refreshToken, applyServerValidationErrors } from '../api'
export type { JoiDetail, ValidationErrorResponse, MessageErrorResponse, KnownErrorResponse } from '../api'

export * from './feedback'