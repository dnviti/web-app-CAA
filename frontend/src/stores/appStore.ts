import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { 
  AppState, 
  Categories, 
  GridItem, 
  Symbol,
  TenseType, 
  SizeType, 
  ContextMenuAction 
} from '../types'
import { gridApi } from '../api/grid'
import { toast } from 'react-hot-toast'

interface AppActions {
  // Mode management
  setMode: (mode: 'user' | 'editor') => void
  
  // Navigation
  navigateToCategory: (categoryName: string) => void
  goBack: () => void
  getCurrentCategory: () => string
  
  // Text content management
  addSymbolToText: (symbol: { text: string; speak: string; icon: string }) => void
  deleteLastWord: () => void
  deleteAllText: () => void
  
  // Tense management
  setTense: (tense: TenseType) => void
  
  // Size management  
  setPageSize: (size: SizeType) => void
  
  // Categories and items
  loadCategories: () => Promise<void>
  saveCategories: () => Promise<void>
  addItem: (item: GridItem, parentKey: string) => Promise<boolean>
  updateItem: (itemId: string, updates: Partial<GridItem>) => Promise<boolean>
  deleteItem: (itemId: string) => Promise<boolean>
  toggleItemVisibility: (itemId: string) => Promise<boolean>
  findItemById: (id: string) => { item: GridItem; parentKey: string; index: number } | null
  
  // Drag and drop
  setDraggedItemId: (id: string | null) => void
  moveItem: (draggedId: string, targetId: string) => void
  
  // Context menu
  setContextMenuState: (symbolId: string | null, action: ContextMenuAction | null) => void
  
  // Editing
  setEditingItemId: (id: string | null) => void
  
  // Original symbol forms (for tense management)
  storeOriginalSymbolForm: (id: string, form: Partial<Symbol>) => void
  getOriginalSymbolForm: (id: string) => Partial<Symbol> | undefined
  
  // Utility
  generateUniqueId: () => string
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'user',
      currentTense: 'presente',
      currentPageSize: 'medium',
      navigationStack: ['home'],
      textContent: [],
      draggedItemId: null,
      editingItemId: null,
      contextMenuSymbolId: null,
      contextMenuAction: null,
      categories: {},
      originalSymbolForms: {},

      // Actions
      setMode: (mode) => {
        set({ mode })
      },

      navigateToCategory: (categoryName) => {
        const { navigationStack } = get()
        set({ 
          navigationStack: [...navigationStack, categoryName]
        })
      },

      goBack: () => {
        const { navigationStack } = get()
        if (navigationStack.length > 1) {
          set({ 
            navigationStack: navigationStack.slice(0, -1)
          })
        }
      },

      getCurrentCategory: () => {
        const { navigationStack } = get()
        return navigationStack[navigationStack.length - 1]
      },

      addSymbolToText: (symbol) => {
        const { textContent } = get()
        set({ 
          textContent: [...textContent, symbol]
        })
        
        // Update grid for context if it's a noun or other specific types
        // This would trigger verb conjugation - TODO: implement if needed
      },

      deleteLastWord: () => {
        const { textContent } = get()
        if (textContent.length > 0) {
          set({ 
            textContent: textContent.slice(0, -1)
          })
          // Update grid for context - TODO: implement if needed
        }
      },

      deleteAllText: () => {
        set({ textContent: [] })
        // Update grid for context - TODO: implement if needed
      },

      setTense: (tense) => {
        set({ currentTense: tense })
        // Update grid for context - TODO: implement if needed
      },

      setPageSize: (size) => {
        set({ currentPageSize: size })
      },

      loadCategories: async () => {
        try {
          const response = await gridApi.getGrid()
          
          if (response.success && response.data) {
            const categories = response.data as Categories
            
            // Store original forms for verbs
            const originalForms: Record<string, Partial<Symbol>> = {}
            
            for (const key in categories) {
              if (Array.isArray(categories[key])) {
                categories[key].forEach(item => {
                  if (item.type === 'symbol' && 'symbol_type' in item && item.symbol_type === 'verbo') {
                    originalForms[item.id] = {
                      id: item.id,
                      label: item.label,
                      text: (item as any).text,
                      speak: (item as any).speak,
                      symbol_type: (item as any).symbol_type,
                    } as Partial<Symbol>
                  }
                })
              }
            }
            
            set({ 
              categories,
              originalSymbolForms: originalForms
            })
          } else {
            toast.error('Errore nel caricamento dei dati')
          }
        } catch (error) {
          toast.error('Errore di connessione')
          console.error('Failed to load categories:', error)
        }
      },

      saveCategories: async () => {
        const { categories } = get()
        
        try {
          const response = await gridApi.saveGrid(categories)
          
          if (response.success) {
            console.log('Categories saved successfully')
          } else {
            toast.error('Errore nel salvataggio')
          }
        } catch (error) {
          toast.error('Errore di salvataggio')
          console.error('Failed to save categories:', error)
        }
      },

      addItem: async (item, parentKey) => {
        const { categories } = get()
        
        // Optimistically update UI
        const newCategories = { ...categories }
        if (!newCategories[parentKey]) {
          newCategories[parentKey] = []
        }
        newCategories[parentKey].push(item)
        
        // If it's a category, create its target array
        if (item.type === 'category' && 'target' in item) {
          newCategories[item.target] = []
        }
        
        set({ categories: newCategories })
        
        try {
          const response = await gridApi.addItem(item, parentKey)
          
          if (response.success) {
            toast.success('Elemento aggiunto')
            return true
          } else {
            // Revert on failure
            set({ categories })
            toast.error('Errore nell\'aggiunta dell\'elemento')
            return false
          }
        } catch (error) {
          // Revert on failure
          set({ categories })
          toast.error('Errore di connessione')
          return false
        }
      },

      updateItem: async (itemId, updates) => {
        const { categories } = get()
        const itemInfo = get().findItemById(itemId)
        
        if (!itemInfo) return false
        
        const { item, parentKey, index } = itemInfo
        const originalItem = { ...item }
        
        // Optimistically update UI
        const newCategories = { ...categories }
        newCategories[parentKey][index] = { ...item, ...updates } as GridItem
        set({ categories: newCategories })
        
        try {
          const response = await gridApi.updateItem(itemId, updates)
          
          if (response.success) {
            toast.success('Elemento aggiornato')
            return true
          } else {
            // Revert on failure
            newCategories[parentKey][index] = originalItem
            set({ categories: newCategories })
            toast.error('Errore nell\'aggiornamento')
            return false
          }
        } catch (error) {
          // Revert on failure
          newCategories[parentKey][index] = originalItem
          set({ categories: newCategories })
          toast.error('Errore di connessione')
          return false
        }
      },

      deleteItem: async (itemId) => {
        const { categories } = get()
        const itemInfo = get().findItemById(itemId)
        
        if (!itemInfo) return false
        
        const { item, parentKey } = itemInfo
        const originalCategories = { ...categories }
        
        // Optimistically update UI
        const newCategories = { ...categories }
        newCategories[parentKey] = newCategories[parentKey].filter(i => i.id !== itemId)
        
        // If it's a category, also delete its children
        if (item.type === 'category' && 'target' in item) {
          delete newCategories[item.target]
        }
        
        set({ categories: newCategories })
        
        try {
          const categoryTarget = item.type === 'category' && 'target' in item ? item.target : undefined
          const response = await gridApi.deleteItem(itemId, categoryTarget)
          
          if (response.success) {
            toast.success('Elemento eliminato')
            return true
          } else {
            // Revert on failure
            set({ categories: originalCategories })
            toast.error('Errore nell\'eliminazione')
            return false
          }
        } catch (error) {
          // Revert on failure
          set({ categories: originalCategories })
          toast.error('Errore di connessione')
          return false
        }
      },

      toggleItemVisibility: async (itemId) => {
        const { categories } = get()
        const itemInfo = get().findItemById(itemId)
        
        if (!itemInfo) return false
        
        const { item, parentKey, index } = itemInfo
        const originalVisibility = item.isVisible
        
        // Optimistically update UI
        const newCategories = { ...categories }
        newCategories[parentKey][index].isVisible = !originalVisibility
        set({ categories: newCategories })
        
        try {
          const response = await gridApi.updateItem(itemId, { isVisible: !originalVisibility })
          
          if (response.success) {
            return true
          } else {
            // Revert on failure
            newCategories[parentKey][index].isVisible = originalVisibility
            set({ categories: newCategories })
            toast.error('Errore nell\'aggiornamento')
            return false
          }
        } catch (error) {
          // Revert on failure
          newCategories[parentKey][index].isVisible = originalVisibility
          set({ categories: newCategories })
          toast.error('Errore di connessione')
          return false
        }
      },

      findItemById: (id) => {
        const { categories } = get()
        
        for (const key in categories) {
          const itemIndex = categories[key].findIndex(item => item.id === id)
          if (itemIndex > -1) {
            return {
              item: categories[key][itemIndex],
              parentKey: key,
              index: itemIndex
            }
          }
        }
        return null
      },

      setDraggedItemId: (id) => {
        set({ draggedItemId: id })
      },

      moveItem: (draggedId, targetId) => {
        const { categories, getCurrentCategory } = get()
        const currentCategory = getCurrentCategory()
        
        const arr = categories[currentCategory]
        if (!arr) return
        
        const dragIdx = arr.findIndex(i => i.id === draggedId)
        const dropIdx = arr.findIndex(i => i.id === targetId)
        
        if (dragIdx === -1 || dropIdx === -1) return
        
        const newArr = [...arr]
        const [draggedItem] = newArr.splice(dragIdx, 1)
        newArr.splice(dropIdx, 0, draggedItem)
        
        set({
          categories: {
            ...categories,
            [currentCategory]: newArr
          }
        })
        
        // Save to backend
        get().saveCategories()
      },

      setContextMenuState: (symbolId, action) => {
        set({
          contextMenuSymbolId: symbolId,
          contextMenuAction: action
        })
      },

      setEditingItemId: (id) => {
        set({ editingItemId: id })
      },

      storeOriginalSymbolForm: (id, form) => {
        const { originalSymbolForms } = get()
        set({
          originalSymbolForms: {
            ...originalSymbolForms,
            [id]: form
          }
        })
      },

      getOriginalSymbolForm: (id) => {
        const { originalSymbolForms } = get()
        return originalSymbolForms[id]
      },

      generateUniqueId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2)
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTense: state.currentTense,
        currentPageSize: state.currentPageSize,
        categories: state.categories,
        originalSymbolForms: state.originalSymbolForms,
      }),
    }
  )
)
