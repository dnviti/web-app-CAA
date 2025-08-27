import { apiRequest } from './client'
import { ConjugationRequest, CorrectionRequest, CorrectionResponse, TenseType, ApiResponse } from '../types'

export const aiApi = {
  /**
   * Correct a sentence using AI
   */
  correctSentence: async (sentence: string): Promise<ApiResponse<CorrectionResponse>> => {
    const request: CorrectionRequest = { sentence }
    return apiRequest<CorrectionResponse>('POST', '/api/correct', request)
  },

  /**
   * Conjugate verbs based on context
   */
  conjugateVerbs: async (
    sentence: string, 
    baseForms: string[], 
    tense: TenseType
  ): Promise<ApiResponse<Record<string, string>>> => {
    const request: ConjugationRequest = {
      sentence,
      base_forms: baseForms,
      tense
    }
    return apiRequest<Record<string, string>>('POST', '/api/conjugate', request)
  }
}

export const arasaacApi = {
  /**
   * Search ARASAAC pictograms
   */
  searchIcons: async (query: string): Promise<any[]> => {
    try {
      const response = await fetch(
        `https://api.arasaac.org/api/pictograms/it/search/${encodeURIComponent(query)}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('ARASAAC API error:', error)
      return []
    }
  },

  /**
   * Get pictogram URL from ARASAAC
   */
  getPictogramUrl: (iconId: number): string => {
    return `https://api.arasaac.org/api/pictograms/${iconId}`
  }
}
