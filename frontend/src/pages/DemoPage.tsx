import React, { useState } from 'react'
import { Edit, User, Volume2, ArrowLeft, Plus, Folder, Settings } from 'lucide-react'

// Simple mock data for demonstration
const mockCategories = {
  home: [
    { id: '1', label: 'Animali', type: 'category', color: '#bfdbfe', icon: '', isVisible: true },
    { id: '2', label: 'Cibo', type: 'category', color: '#dcfce7', icon: '', isVisible: true },
    { id: '3', label: 'Ciao', type: 'symbol', color: '#fde68a', icon: '', isVisible: true, speak: 'ciao', text: 'ciao' },
    { id: '4', label: 'Grazie', type: 'symbol', color: '#fed7d7', icon: '', isVisible: true, speak: 'grazie', text: 'grazie' },
  ],
  animali: [
    { id: '5', label: 'Cane', type: 'symbol', color: '#fde68a', icon: '', isVisible: true, speak: 'il cane', text: 'cane' },
    { id: '6', label: 'Gatto', type: 'symbol', color: '#fed7d7', icon: '', isVisible: true, speak: 'il gatto', text: 'gatto' },
  ],
  cibo: [
    { id: '7', label: 'Pizza', type: 'symbol', color: '#fde68a', icon: '', isVisible: true, speak: 'la pizza', text: 'pizza' },
    { id: '8', label: 'Gelato', type: 'symbol', color: '#fed7d7', icon: '', isVisible: true, speak: 'il gelato', text: 'gelato' },
  ]
}

const DemoPage: React.FC = () => {
  const [currentCategory, setCurrentCategory] = useState('home')
  const [navigationStack, setNavigationStack] = useState(['home'])
  const [textContent, setTextContent] = useState<string[]>([])
  const [currentTense, setCurrentTense] = useState<'passato' | 'presente' | 'futuro'>('presente')
  const [editorMode, setEditorMode] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)

  const getCurrentItems = () => {
    return (mockCategories as any)[currentCategory] || []
  }

  const navigateToCategory = (categoryId: string) => {
    const categoryName = getCurrentItems().find((item: any) => item.id === categoryId)?.label.toLowerCase() || categoryId
    setCurrentCategory(categoryName)
    setNavigationStack([...navigationStack, categoryName])
  }

  const goBack = () => {
    if (navigationStack.length > 1) {
      const newStack = navigationStack.slice(0, -1)
      setNavigationStack(newStack)
      setCurrentCategory(newStack[newStack.length - 1])
    }
  }

  const addToTextContent = (text: string) => {
    setTextContent([...textContent, text])
  }

  const removeFromTextContent = (index: number) => {
    setTextContent(textContent.filter((_, i) => i !== index))
  }

  const clearTextContent = () => {
    setTextContent([])
  }

  const speakText = () => {
    if (textContent.length > 0 && window.speechSynthesis) {
      const text = textContent.join(' ')
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'it-IT'
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleItemClick = (item: any) => {
    if (item.type === 'category') {
      navigateToCategory(item.id)
    } else if (item.type === 'symbol') {
      addToTextContent(item.text || item.label)
    }
  }

  const currentItems = getCurrentItems()
  const canGoBack = navigationStack.length > 1

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-yellow-400 ${sessionActive ? 'bg-black' : ''}`}>
      {/* Account Info Bar */}
      <header className="flex justify-between items-center px-4 py-2 bg-black bg-opacity-20 text-white relative z-30">
        <div className="flex items-center gap-3">
          <User size={20} />
          <span className="font-medium">Demo User</span>
          <button
            onClick={() => setEditorMode(!editorMode)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              editorMode ? 'bg-blue-500 text-white' : 'bg-white bg-opacity-20 text-white'
            }`}
          >
            <Edit size={16} />
          </button>
        </div>
      </header>

      {/* Text Bar */}
      <div className="bg-white border-b border-gray-200 relative z-20">
        <div className="flex items-center min-h-16 px-4 bg-gray-50">
          <div className="flex-1 flex items-center gap-2 text-lg">
            {textContent.length === 0 ? (
              <span className="text-gray-400 italic">Seleziona simboli per costruire frasi...</span>
            ) : (
              textContent.map((word, index) => (
                <span
                  key={index}
                  className="relative bg-blue-100 text-blue-900 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-200 transition-colors"
                  onClick={() => removeFromTextContent(index)}
                >
                  {word}
                  <span className="ml-1 text-xs">✕</span>
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-white">
          <button
            onClick={speakText}
            disabled={textContent.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
          >
            <Volume2 size={20} />
            <span>Parla</span>
          </button>

          <button
            onClick={clearTextContent}
            disabled={textContent.length === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 transition-colors"
          >
            Cancella tutto
          </button>
        </div>
      </div>

      {/* Tense Buttons */}
      <nav className="flex items-center justify-center gap-1 p-4 bg-white border-b border-gray-200 relative z-20">
        {(['passato', 'presente', 'futuro'] as const).map((tense) => (
          <button
            key={tense}
            onClick={() => setCurrentTense(tense)}
            className={`px-6 py-2 rounded-full font-medium transition-all duration-200 capitalize ${
              currentTense === tense
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tense}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {/* Navigation */}
        <nav className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            {canGoBack && (
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Indietro</span>
              </button>
            )}
          </div>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {currentCategory === 'home' ? 'Home' : currentCategory}
            </h2>
          </div>
          
          <div className="w-20"></div>
        </nav>

        {/* Symbol Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {currentItems.map((item: any) => (
              <div
                key={item.id}
                className={`
                  relative aspect-square rounded-lg border-2 border-gray-200 
                  cursor-pointer transition-all duration-200
                  hover:border-blue-400 hover:shadow-md
                  ${editorMode ? 'hover:scale-105' : ''}
                `}
                style={{ backgroundColor: item.color }}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex flex-col items-center justify-center h-full p-2">
                  {item.icon ? (
                    <img
                      src={item.icon}
                      alt={item.label}
                      className="w-12 h-12 mb-2 object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 mb-2 bg-gray-300 rounded flex items-center justify-center">
                      <span className="material-icons text-gray-600 text-2xl">
                        {item.type === 'category' ? 'folder' : 'image'}
                      </span>
                    </div>
                  )}
                  
                  <span className="text-sm font-medium text-center text-gray-900 leading-tight">
                    {item.label}
                  </span>
                </div>

                {editorMode && (
                  <div className="absolute top-1 right-1">
                    <div className={`w-3 h-3 rounded-full ${
                      item.type === 'category' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Editor Panel */}
      {editorMode && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 z-40">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Editor</h3>
            <button
              onClick={() => setEditorMode(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
              {!sessionActive ? (
                <button
                  onClick={() => setSessionActive(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <span>📺</span>
                  Avvia Sessione
                </button>
              ) : (
                <button
                  onClick={() => setSessionActive(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <span>📺</span>
                  Termina Sessione
                </button>
              )}
            </div>

            <div className="flex-1 p-4 space-y-4">
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <Plus size={20} />
                  Aggiungi Simbolo
                </button>

                <button className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                  <Folder size={20} />
                  Aggiungi Categoria
                </button>

                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                  <Settings size={20} />
                  Modifica Controlli
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Dimensione Pagina</h4>
                <div className="flex gap-2">
                  {['small', 'medium', 'big'].map((size) => (
                    <button
                      key={size}
                      className="flex-1 px-3 py-2 text-sm rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      {size === 'small' ? 'Piccolo' : size === 'medium' ? 'Medio' : 'Grande'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200">
              <button className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Correction Button */}
      {textContent.length > 0 && (
        <div className="fixed bottom-4 left-4 flex gap-2">
          <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-lg">
            Correggi Testo
          </button>
        </div>
      )}
    </div>
  )
}

export default DemoPage
