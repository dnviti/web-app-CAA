import { apiRequest } from './client'
import { ApiResponse, ArasaacIcon, ArasaacSearchResponse } from '../types'

export type { ArasaacIcon, ArasaacSearchResponse } from '../types'

// Enhanced search response with preloading info
export interface EnhancedArasaacSearchResponse extends ArasaacSearchResponse {
  preloaded?: boolean
  total?: number
}

export const arasaacApi = {
  /**
   * Search ARASAAC icons by query with optional preloading
   */
  searchIcons: async (
    query: string, 
    options?: { preload?: boolean; limit?: number }
  ): Promise<ApiResponse<EnhancedArasaacSearchResponse>> => {
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: { icons: [], preloaded: false, total: 0 }
      }
    }

    const params = new URLSearchParams({ query })
    if (options?.preload) {
      params.append('preload', 'true')
    }
    if (options?.limit && options.limit > 0 && options.limit <= 20) {
      params.append('limit', options.limit.toString())
    }

    return apiRequest<EnhancedArasaacSearchResponse>(
      'GET', 
      `/api/arasaac/search?${params.toString()}`
    )
  },

  /**
   * Get ARASAAC icon URL by ID (using cached server endpoint)
   */
  getIconUrl: (iconId: number): string => {
    // Use the new cached server endpoint instead of direct ARASAAC API
    return `/api/arasaac/icon/${iconId}`
  },

  /**
   * Get ARASAAC icon data directly from cached server endpoint
   */
  getIconData: async (iconId: number): Promise<ApiResponse<Blob>> => {
    try {
      const response = await fetch(`/api/arasaac/icon/${iconId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token') || ''}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      return {
        success: true,
        data: blob
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch icon data'
      }
    }
  },

  /**
   * Search ARASAAC icons directly (fallback)
   */
  searchIconsDirect: async (query: string): Promise<ArasaacIcon[]> => {
    if (!query || query.trim().length === 0) {
      return []
    }

    try {
      // Direct ARASAAC API call as fallback
      const response = await fetch(`https://api.arasaac.org/api/pictograms/search/${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const icons = await response.json()
      return Array.isArray(icons) ? icons : []
    } catch (error) {
      console.error('Failed to search ARASAAC API directly:', error)
      return []
    }
  }
}
