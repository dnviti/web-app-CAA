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

  return (
    <div className={`editor-panel ${isOpen ? 'active' : ''}`}>
      {/* Header */}
      <div className="editor-header">
        <h3 className="text-lg font-semibold text-gray-900">Editor</h3>
        <button onClick={onClose} className="close-editor">
          <X size={24} />
        </button>
      </div>

      <div className="editor-tools">
        {/* Session Controls Section */}
        <div className="tool-section">
          <h4>Sessione</h4>
          {!sessionActive ? (
            <button onClick={onStartSession} className="session-btn">
              <Maximize size={20} />
              Avvia Sessione
            </button>
          ) : (
            <button onClick={onEndSession} className="session-btn" id="endSessionBtn">
              <Minimize size={20} />
              Termina Sessione
            </button>
          )}
        </div>

        {/* Content Tools Section */}
        <div className="tool-section">
          <h4>Contenuti</h4>
          <button onClick={onAddSymbol} className="tool-btn">
            <Plus size={20} />
            Aggiungi Simbolo
          </button>

          <button onClick={onAddCategory} className="tool-btn">
            <Folder size={20} />
            Aggiungi Categoria
          </button>

          <button onClick={onEditSystemControls} className="tool-btn" id="editSystemControlsBtn">
            <Settings size={20} />
            Modifica Controlli
          </button>
        </div>

        {/* Size Controls Section */}
        <div className="tool-section">
          <h4>Dimensione</h4>
          <div className="size-controls">
            {sizes.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onSizeChange?.(key)}
                className={`size-btn ${currentSize === key ? 'active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Logout Section */}
        <div className="tool-section">
          <button onClick={onLogout} className="btn-secondary" id="logoutBtn">
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditorPanel
