import axios, { AxiosResponse } from 'axios'
import { ApiResponse } from '../types'

// Get base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('jwt_token')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// Generic API request wrapper
export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
  options?: any
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.request({
      method,
      url,
      data,
      ...options,
    })
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error: any) {
    console.error(`API Error [${method} ${url}]:`, error)
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Errore di connessione'
    
    return {
      success: false,
      error: errorMessage,
      data: error.response?.data,
    }
  }
}

export { API_BASE_URL }
