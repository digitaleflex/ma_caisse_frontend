/**
 * API Client centralisé
 * Regroupe tous les services API
 */

export { apiFetch, applyServerValidationErrors } from '../api'
export type { JoiDetail, ValidationErrorResponse, MessageErrorResponse, KnownErrorResponse } from '../api'

export * from './feedback'