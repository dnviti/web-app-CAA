import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GridItem, Categories, TenseType, SizeType } from '../types'
import { gridApi } from '../api/grid'
import { aiApi } from '../api/ai'

export interface TextItem {
  text: string
  speak: string
  icon?: string
}

interface GridState {
  // Grid data
  categories: Categories
  loading: boolean
  error: string | null
  
  // Navigation
  navigationStack: string[]
  
  // Text bar
  textContent: TextItem[]
  
  // Current mode and settings
  currentTense: TenseType
  currentSize: SizeType
  editorMode: boolean
  sessionActive: boolean
  
  // Actions
  loadGrid: () => Promise<void>
  saveGrid: () => Promise<void>
  
  // Navigation actions
  navigateToCategory: (categoryId: string) => void
  goBack: () => void
  getCurrentCategory: () => string
  getCurrentItems: () => GridItem[]
  
  // Text bar actions
  addToTextContent: (item: TextItem) => void
  removeFromTextContent: (index: number) => void
  clearTextContent: () => void
  speakText: () => void
  
  // Grid item actions
  addGridItem: (item: Omit<GridItem, 'id'>, parentCategory: string) => Promise<void>
  updateGridItem: (itemId: string, updates: Partial<GridItem>) => Promise<void>
  deleteGridItem: (itemId: string, categoryTarget?: string) => Promise<void>
  
  // Settings actions
  setTense: (tense: TenseType) => void
  setSize: (size: SizeType) => void
  setEditorMode: (enabled: boolean) => void
  setSessionActive: (active: boolean) => void
  
  // AI actions
  correctText: () => Promise<void>
  conjugateText: (tense: TenseType) => Promise<void>
}

export const useGridStore = create<GridState>()(
  persist(
    (set, get) => ({
      // Initial state
      categories: {},
      loading: false,
      error: null,
      navigationStack: ['home'],
      textContent: [],
      currentTense: 'presente',
      currentSize: 'medium',
      editorMode: false,
      sessionActive: false,

      // Load grid from server
      loadGrid: async () => {
        const { loading } = get()
        
        // Prevent concurrent requests
        if (loading) {
          console.log('📊 GridStore: loadGrid already in progress, skipping')
          return
        }
        
        // Check if we have a token before making the request
        const token = localStorage.getItem('jwt_token')
        if (!token) {
          console.log('📊 GridStore: No JWT token found, skipping grid load')
          set({ error: 'No authentication token available', loading: false })
          return
        }
        
        set({ loading: true, error: null })
        console.log('📊 GridStore: loadGrid starting')
        console.log('📊 GridStore: localStorage token:', !!token)
        
        try {
          const response = await gridApi.getGrid()
          console.log('📊 GridStore: getGrid response:', response)
          if (response.success && response.data) {
            console.log('📊 GridStore: Grid loaded successfully')
            set({ categories: response.data, loading: false })
          } else {
            console.error('📊 GridStore: Failed to load grid:', response.error)
            set({ error: 'Failed to load grid data', loading: false })
          }
        } catch (error) {
          console.error('📊 GridStore: Network error loading grid:', error)
          set({ error: 'Network error loading grid', loading: false })
        }
      },

      // Save grid to server
      saveGrid: async () => {
        const { categories } = get()
        try {
          const response = await gridApi.saveGrid(categories)
          if (!response.success) {
            set({ error: 'Failed to save grid data' })
          }
        } catch (error) {
          set({ error: 'Network error saving grid' })
        }
      },

      // Navigation
      navigateToCategory: (categoryId: string) => {
        const { navigationStack } = get()
        set({ navigationStack: [...navigationStack, categoryId] })
      },

      goBack: () => {
        const { navigationStack } = get()
        if (navigationStack.length > 1) {
          set({ navigationStack: navigationStack.slice(0, -1) })
        }
      },

      getCurrentCategory: () => {
        const { navigationStack } = get()
        return navigationStack[navigationStack.length - 1]
      },

      getCurrentItems: () => {
        const { categories, navigationStack } = get()
        const currentCategory = navigationStack[navigationStack.length - 1]
        return categories[currentCategory] || []
      },

      // Text bar actions
      addToTextContent: (item: TextItem) => {
        const { textContent } = get()
        set({ textContent: [...textContent, item] })
      },

      removeFromTextContent: (index: number) => {
        const { textContent } = get()
        const newContent = textContent.filter((_, i) => i !== index)
        set({ textContent: newContent })
      },

      clearTextContent: () => {
        set({ textContent: [] })
      },

      speakText: () => {
        const { textContent } = get()
        if (textContent.length === 0 || !window.speechSynthesis) return

        const text = textContent.map(item => item.speak || item.text).join(' ')
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'it-IT'
        window.speechSynthesis.speak(utterance)
      },

      // Grid item management
      addGridItem: async (item: Omit<GridItem, 'id'>, parentCategory: string) => {
        try {
          const response = await gridApi.addItem(item as GridItem, parentCategory)
          if (response.success) {
            // Reload grid to get updated data
            await get().loadGrid()
          } else {
            // Check for specific authentication/authorization errors
            if (response.error && response.error.includes('401')) {
              set({ error: 'Authentication required. Please login again.' })
            } else if (response.error && response.error.includes('403')) {
              set({ error: 'Permission denied. You need admin or editor role to add items.' })
            } else if (response.error && response.error.includes('Authorization token required')) {
              set({ error: 'Please login to add items.' })
            } else if (response.error && response.error.includes('Insufficient permissions')) {
              set({ error: 'You don\'t have permission to add items. Contact an administrator.' })
            } else {
              set({ error: response.error || 'Failed to add item' })
            }
            console.error('Add grid item failed:', response.error)
          }
        } catch (error) {
          console.error('Network error adding item:', error)
          set({ error: 'Network error adding item. Please check your connection.' })
        }
      },

      updateGridItem: async (itemId: string, updates: Partial<GridItem>) => {
        try {
          const response = await gridApi.updateItem(itemId, updates)
          if (response.success) {
            // Reload grid to get updated data
            await get().loadGrid()
          } else {
            // Check for specific authentication/authorization errors
            if (response.error && response.error.includes('401')) {
              set({ error: 'Authentication required. Please login again.' })
            } else if (response.error && response.error.includes('403')) {
              set({ error: 'Permission denied. You need admin or editor role to update items.' })
            } else {
              set({ error: response.error || 'Failed to update item' })
            }
            console.error('Update grid item failed:', response.error)
          }
        } catch (error) {
          console.error('Network error updating item:', error)
          set({ error: 'Network error updating item. Please check your connection.' })
        }
      },

      deleteGridItem: async (itemId: string, categoryTarget?: string) => {
        try {
          const response = await gridApi.deleteItem(itemId, categoryTarget)
          if (response.success) {
            // Reload grid to get updated data
            await get().loadGrid()
          } else {
            // Check for specific authentication/authorization errors
            if (response.error && response.error.includes('401')) {
              set({ error: 'Authentication required. Please login again.' })
            } else if (response.error && response.error.includes('403')) {
              set({ error: 'Permission denied. You need admin or editor role to delete items.' })
            } else {
              set({ error: response.error || 'Failed to delete item' })
            }
            console.error('Delete grid item failed:', response.error)
          }
        } catch (error) {
          console.error('Network error deleting item:', error)
          set({ error: 'Network error deleting item. Please check your connection.' })
        }
      },

      // Settings
      setTense: (tense: TenseType) => {
        set({ currentTense: tense })
      },

      setSize: (size: SizeType) => {
        set({ currentSize: size })
        // Apply size to HTML element
        document.documentElement.className = document.documentElement.className.replace(/size-\w+/, '') + ` size-${size}`
      },

      setEditorMode: (enabled: boolean) => {
        set({ editorMode: enabled })
      },

      setSessionActive: (active: boolean) => {
        set({ sessionActive: active })
      },

      // AI actions
      correctText: async () => {
        const { textContent } = get()
        if (textContent.length === 0) return

        try {
          const sentence = textContent.map(item => item.text).join(' ')
          const response = await aiApi.correctSentence(sentence)
          
          if (response.success && response.data) {
            // Replace text content with corrected version
            const correctedText = response.data.corrected_sentence
            set({
              textContent: [{
                text: correctedText,
                speak: correctedText
              }]
            })
          }
        } catch (error) {
          set({ error: 'Failed to correct text' })
        }
      },

      conjugateText: async (tense: TenseType) => {
        const { textContent } = get()
        if (textContent.length === 0) return

        try {
          const sentence = textContent.map(item => item.text).join(' ')
          const baseForms = textContent.map(item => item.text)
          
          const response = await aiApi.conjugateVerbs(sentence, baseForms, tense)
          
          if (response.success && response.data) {
            // Update text content with conjugated verbs
            const conjugations = response.data
            const newTextContent = textContent.map(item => ({
              ...item,
              text: conjugations[item.text] || item.text,
              speak: conjugations[item.text] || item.speak
            }))
            
            set({ textContent: newTextContent, currentTense: tense })
          }
        } catch (error) {
          set({ error: 'Failed to conjugate text' })
        }
      },
    }),
    {
      name: 'grid-storage',
      partialize: (state) => ({
        currentTense: state.currentTense,
        currentSize: state.currentSize,
        editorMode: state.editorMode,
      }),
    }
  )
)
