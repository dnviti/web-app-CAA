import { apiRequest } from './client'
import { Categories, GridItem, ApiResponse } from '../types'

export const gridApi = {
  /**
   * Get user's grid data
   */
  getGrid: async (): Promise<ApiResponse<Categories>> => {
    return apiRequest<Categories>('GET', '/api/grid')
  },

  /**
   * Save complete grid data
   */
  saveGrid: async (categories: Categories): Promise<ApiResponse<void>> => {
    return apiRequest<void>('POST', '/api/grid', categories)
  },

  /**
   * Add a new item to the grid
   */
  addItem: async (item: GridItem, parentCategory: string): Promise<ApiResponse<{ icon?: string }>> => {
    return apiRequest<{ icon?: string }>('POST', '/api/grid/item', { item, parentCategory })
  },

  /**
   * Update an existing item
   */
  updateItem: async (itemId: string, updates: Partial<GridItem>): Promise<ApiResponse<{ updatedIcon?: string }>> => {
    return apiRequest<{ updatedIcon?: string }>('PUT', `/api/grid/item/${itemId}`, updates)
  },

  /**
   * Delete an item
   */
  deleteItem: async (itemId: string, categoryTarget?: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>('DELETE', `/api/grid/item/${itemId}`, { categoryTarget })
  },
}
