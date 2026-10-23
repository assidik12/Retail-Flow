import axios from 'axios'

// Response wrapper standar dari Spring Boot backend
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// Instance Axios dengan baseURL '/api/v1' (didukung Vite proxy ke http://localhost:8080)
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Otomatis sisipkan Bearer token jika ada di localStorage
apiClient.interceptors.request.use(
  (config) => {
    const sessionStr = localStorage.getItem('retail-flow-session')
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr)
        if (session.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`
        }
      } catch {
        // Abaikan parse error
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response Interceptor: Tangani error 401 dan format message
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired atau invalid, redirect atau trigger logout jika perlu
      console.warn('Unauthorized request. Token mungkin sudah kedaluwarsa.')
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      'Terjadi kesalahan saat berkomunikasi dengan server.'
    return Promise.reject(new Error(message))
  },
)

export default apiClient
