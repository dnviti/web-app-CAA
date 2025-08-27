import { apiRequest } from './client'
import { ApiResponse, ArasaacIcon, ArasaacSearchResponse } from '../types'

export type { ArasaacIcon, ArasaacSearchResponse } from '../types'

export const arasaacApi = {
  /**
   * Search ARASAAC icons by query
   */
  searchIcons: async (query: string): Promise<ApiResponse<ArasaacSearchResponse>> => {
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: { icons: [] }
      }
    }

    return apiRequest<ArasaacSearchResponse>('GET', `/api/ai/search-arasaac?query=${encodeURIComponent(query)}`)
  },

  /**
   * Get ARASAAC icon URL by ID
   */
  getIconUrl: (iconId: number): string => {
    return `https://api.arasaac.org/api/pictograms/${iconId}`
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
