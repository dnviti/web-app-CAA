import React, { useEffect, useState } from 'react'
import { Edit, User } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useGridStore } from '../stores/gridStore'
import SymbolGrid from '../components/SymbolGrid'
import TextBar from '../components/TextBar'
import TenseButtons from '../components/TenseButtons'
import Navigation from '../components/Navigation'
import EditorPanel from '../components/EditorPanel'
import AddItemModal from '../components/AddItemModal'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import { GridItem, Symbol, Category } from '../types'

const MainPage: React.FC = () => {
  const { user, logout } = useAuthStore()
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
  } = useGridStore()

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showAddSymbolModal, setShowAddSymbolModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showSystemControlsModal, setShowSystemControlsModal] = useState(false)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    item: GridItem
  } | null>(null)

  useEffect(() => {
    // Load grid data on component mount
    loadGrid()
    
    // Apply size class to HTML element
    document.documentElement.className = document.documentElement.className.replace(/size-\w+/, '') + ` size-${currentSize}`

    // Close context menu on click outside
    const handleClickOutside = () => setContextMenu(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [loadGrid, currentSize])

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
      {/* Account Info Bar */}
      <header className="flex justify-between items-center px-4 py-2 bg-black bg-opacity-20 text-white relative z-30">
        <div className="flex items-center gap-3">
          <User size={20} />
          <span className="font-medium">{user?.username || 'Caricamento...'}</span>
          <IconButton
            icon={<Edit size={18} />}
            onClick={handleEditorToggle}
            className={`${editorMode ? 'bg-blue-500 text-white' : 'bg-white bg-opacity-20 text-white border-white border-opacity-30'}`}
            aria-label={editorMode ? 'Disattiva Editor' : 'Attiva Editor'}
            size="sm"
          />
        </div>
      </header>

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
          <button className="w-full px-4 py-2 text-left hover:bg-gray-100">
            Modifica
          </button>
          <button className="w-full px-4 py-2 text-left hover:bg-gray-100">
            Copia
          </button>
          <button className="w-full px-4 py-2 text-left hover:bg-gray-100">
            Sposta
          </button>
          <button className="w-full px-4 py-2 text-left hover:bg-gray-100">
            Nascondi/Mostra
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
