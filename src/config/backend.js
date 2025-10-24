/**
 * Backend API Configuration
 * Reads from environment variable or uses default
 */

// Read from Vite environment variable or default to 8000
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8000'
const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || 'localhost'

export const BACKEND_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`

export default {
  baseURL: BACKEND_BASE_URL,
  port: BACKEND_PORT,
  host: BACKEND_HOST
}

