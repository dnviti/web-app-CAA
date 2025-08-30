import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useGridStore } from '../stores/gridStore'
import SymbolGrid from '../components/SymbolGrid'
import TextBar from '../components/TextBar'
import TenseButtons from '../components/TenseButtons'
import Navigation from '../components/Navigation'
import EditorPanel from '../components/EditorPanel'
import AddItemModal from '../components/AddItemModal'
import AuthStatus from '../components/AuthStatus'
import TopNavigationBar from '../components/TopNavigationBar'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { GridItem, Symbol, Category } from '../types'

const MainPage: React.FC = () => {
  const { user, logout, token } = useAuthStore()
  const {
    categories,
    loading,
    error,
    navigationStack,
    textContent,
    currentTense,
    currentSize,
    editorMode,
    sessionActive,
    loadGrid,
    navigateToCategory,
    goBack,
    getCurrentItems,
    addToTextContent,
    removeFromTextContent,
    clearTextContent,
    speakText,
    setTense,
    setSize,
    setEditorMode,
    setSessionActive,
    correctText,
    conjugateText,
    addGridItem,
    updateGridItem,
    deleteGridItem,
  } = useGridStore()

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showAddSymbolModal, setShowAddSymbolModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showSystemControlsModal, setShowSystemControlsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<GridItem | null>(null)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    item: GridItem
  } | null>(null)

  useEffect(() => {
    console.log('MainPage useEffect', { user: !!user, token: !!token })
    console.log('🏠 MainPage: localStorage tokens:', {
      hasJwtToken: !!localStorage.getItem('jwt_token'),
      hasRefreshToken: !!localStorage.getItem('refresh_token')
    })
    
    // Only load grid data if user is authenticated and we have a valid token
    if (user && token) {
      console.log('🏠 MainPage: loading grid data')
      loadGrid()
    } else {
      console.log('🏠 MainPage: no user or token, skipping grid load', { user: !!user, token: !!token })
    }
    
    // Apply size class to HTML element
    document.documentElement.className = document.documentElement.className.replace(/size-\w+/, '') + ` size-${currentSize}`

    // Close context menu on click outside
    const handleClickOutside = () => setContextMenu(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [currentSize, user, token]) // Removed loadGrid from dependencies to prevent infinite loop

  // Don't render the main page if there's no authenticated user
  if (!user) {
    console.log('MainPage: no user, returning null')
    return null
  }

  const handleSymbolClick = (item: GridItem) => {
    if (item.type === 'category') {
      const category = item as Category
      navigateToCategory(category.target || item.id)
    } else if (item.type === 'symbol') {
      const symbol = item as Symbol
      addToTextContent({
        text: symbol.text || symbol.label,
        speak: symbol.speak || symbol.label,
        icon: symbol.icon
      })
    }
  }

  const handleSymbolRightClick = (item: GridItem, event: React.MouseEvent) => {
    if (!editorMode) return
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      item
    })
  }

  // Context menu handlers
  const handleEdit = () => {
    if (contextMenu) {
      setEditingItem(contextMenu.item)
      setShowEditModal(true)
      setContextMenu(null)
    }
  }

  const handleCopy = async () => {
    if (contextMenu) {
      try {
        const itemToCopy = contextMenu.item
        const copiedItem: Omit<GridItem, 'id'> = {
          ...itemToCopy,
          label: `${itemToCopy.label} (Copia)`
        }
        delete (copiedItem as any).id // Remove id to let backend assign a new one
        await addGridItem(copiedItem, currentCategory)
        setContextMenu(null)
      } catch (error) {
        console.error('Error copying item:', error)
        alert('Errore durante la copia dell\'elemento')
      }
    }
  }

  const handleDelete = async () => {
    if (contextMenu && confirm('Sei sicuro di voler eliminare questo elemento?')) {
      try {
        await deleteGridItem(contextMenu.item.id, currentCategory)
        setContextMenu(null)
      } catch (error) {
        console.error('Error deleting item:', error)
        alert('Errore durante l\'eliminazione dell\'elemento')
      }
    }
  }

  const handleToggleVisibility = async () => {
    if (contextMenu) {
      try {
        const item = contextMenu.item
        await updateGridItem(item.id, { 
          isVisible: item.isVisible === false ? true : false 
        })
        setContextMenu(null)
      } catch (error) {
        console.error('Error updating visibility:', error)
        alert('Errore durante l\'aggiornamento della visibilità')
      }
    }
  }

  const handleMove = () => {
    if (contextMenu) {
      // For now, just close the menu - move functionality would require a category selector
      alert('Funzionalità "Sposta" non ancora implementata')
      setContextMenu(null)
    }
  }

  const handleEditorToggle = () => {
    if (editorMode) {
      setEditorMode(false)
    } else {
      // In a real app, you might want to show password modal here
      setEditorMode(true)
    }
  }

  const handleTenseChange = async (tense: typeof currentTense) => {
    if (textContent.length > 0) {
      await conjugateText(tense)
    } else {
      setTense(tense)
    }
  }

  const currentCategory = navigationStack[navigationStack.length - 1]
  const currentItems = getCurrentItems()
  const canGoBack = navigationStack.length > 1

  if (loading && Object.keys(categories).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-yellow-400">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-yellow-400 ${sessionActive ? 'session-active' : ''}`}>
      {/* Auth Status Component (for development) */}
      <AuthStatus />
      
      {/* Top Navigation Bar */}
      <TopNavigationBar 
        onEditorToggle={handleEditorToggle}
        editorMode={editorMode}
      />

      {/* Text Bar */}
      <TextBar
        textContent={textContent.map(item => item.text)}
        onSpeak={speakText}
        onClear={clearTextContent}
        onRemoveWord={removeFromTextContent}
        className="relative z-20"
      />

      {/* Tense Buttons */}
      <TenseButtons
        currentTense={currentTense}
        onTenseChange={handleTenseChange}
        className="relative z-20"
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Navigation */}
        <Navigation
          currentCategory={currentCategory}
          onBack={goBack}
          canGoBack={canGoBack}
        />

        {/* Symbol Grid */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <SymbolGrid
            items={currentItems}
            onItemClick={handleSymbolClick}
            onItemRightClick={handleSymbolRightClick}
            editorMode={editorMode}
            size={currentSize}
          />
        </div>
      </main>

      {/* Editor Panel */}
      <EditorPanel
        isOpen={editorMode}
        onClose={() => setEditorMode(false)}
        onAddSymbol={() => setShowAddSymbolModal(true)}
        onAddCategory={() => setShowAddCategoryModal(true)}
        onEditSystemControls={() => setShowSystemControlsModal(true)}
        sessionActive={sessionActive}
        onStartSession={() => setSessionActive(true)}
        onEndSession={() => setSessionActive(false)}
        onLogout={logout}
        onSizeChange={setSize}
        currentSize={currentSize}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button 
            className="w-full px-4 py-2 text-left hover:bg-gray-100"
            onClick={handleEdit}
          >
            Modifica
          </button>
          <button 
            className="w-full px-4 py-2 text-left hover:bg-gray-100"
            onClick={handleCopy}
          >
            Copia
          </button>
          <button 
            className="w-full px-4 py-2 text-left hover:bg-gray-100"
            onClick={handleMove}
          >
            Sposta
          </button>
          <button 
            className="w-full px-4 py-2 text-left hover:bg-gray-100"
            onClick={handleToggleVisibility}
          >
            {contextMenu.item.isVisible === false ? 'Mostra' : 'Nascondi'}
          </button>
          <hr className="my-1" />
          <button 
            className="w-full px-4 py-2 text-left hover:bg-red-100 text-red-600"
            onClick={handleDelete}
          >
            Elimina
          </button>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Inserisci Password Editor"
      >
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              onClick={() => {
                setShowPasswordModal(false)
                setEditorMode(true)
              }}
              className="flex-1"
            >
              Conferma
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Item Modals */}
      <AddItemModal
        isOpen={showAddSymbolModal}
        onClose={() => setShowAddSymbolModal(false)}
        type="symbol"
        currentCategory={currentCategory}
        onAdd={async (item) => {
          await addGridItem(item, currentCategory)
        }}
      />

      <AddItemModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        type="category"
        currentCategory={currentCategory}
        onAdd={async (item) => {
          await addGridItem(item, currentCategory)
        }}
      />

      {/* Edit Modal */}
      <AddItemModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingItem(null)
        }}
        type={editingItem?.type === 'category' ? 'category' : 'symbol'}
        currentCategory={currentCategory}
        editingItem={editingItem}
        onAdd={async () => {}} // Not used in edit mode
        onEdit={async (itemId: string, updates: Partial<GridItem>) => {
          await updateGridItem(itemId, updates)
          setShowEditModal(false)
          setEditingItem(null)
        }}
      />

      <Modal
        isOpen={showSystemControlsModal}
        onClose={() => setShowSystemControlsModal(false)}
        title="Modifica Controlli Sistema"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Qui puoi modificare i controlli sistema come "Cancella", "Parla", ecc.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSystemControlsModal(false)}
              className="flex-1"
            >
              Chiudi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Additional Features Buttons (for AI corrections, etc.) */}
      {textContent.length > 0 && (
        <div className="fixed bottom-4 left-4 flex gap-2">
          <Button
            onClick={correctText}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Correggi Testo
          </Button>
        </div>
      )}
    </div>
  )
}

export default MainPage
