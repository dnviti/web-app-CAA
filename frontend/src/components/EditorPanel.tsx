import React from 'react'
import { X, Plus, Folder, Settings, Maximize, Minimize } from 'lucide-react'

interface EditorPanelProps {
  isOpen: boolean
  onClose: () => void
  onAddSymbol: () => void
  onAddCategory: () => void
  onEditSystemControls: () => void
  sessionActive?: boolean
  onStartSession?: () => void
  onEndSession?: () => void
  onLogout?: () => void
  onSizeChange?: (size: 'small' | 'medium' | 'big') => void
  currentSize?: 'small' | 'medium' | 'big'
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  isOpen,
  onClose,
  onAddSymbol,
  onAddCategory,
  onEditSystemControls,
  sessionActive = false,
  onStartSession,
  onEndSession,
  onLogout,
  onSizeChange,
  currentSize = 'medium'
}) => {
  const sizes = [
    { key: 'small' as const, label: 'Piccolo' },
    { key: 'medium' as const, label: 'Medio' },
    { key: 'big' as const, label: 'Grande' },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Editor</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex flex-col h-full">
        {/* Session Controls */}
        <div className="p-4 border-b border-gray-200">
          {!sessionActive ? (
            <button
              onClick={onStartSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Maximize size={20} />
              Avvia Sessione
            </button>
          ) : (
            <button
              onClick={onEndSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Minimize size={20} />
              Termina Sessione
            </button>
          )}
        </div>

        {/* Tools */}
        <div className="flex-1 p-4 space-y-4">
          <div className="space-y-3">
            <button
              onClick={onAddSymbol}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus size={20} />
              Aggiungi Simbolo
            </button>

            <button
              onClick={onAddCategory}
              className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Folder size={20} />
              Aggiungi Categoria
            </button>

            <button
              onClick={onEditSystemControls}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings size={20} />
              Modifica Controlli
            </button>
          </div>

          {/* Size Controls */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Dimensione Pagina</h4>
            <div className="flex gap-2">
              {sizes.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => onSizeChange?.(key)}
                  className={`
                    flex-1 px-3 py-2 text-sm rounded-lg transition-colors
                    ${currentSize === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditorPanel
