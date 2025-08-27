import React from 'react'
import { Volume2, X, RotateCcw } from 'lucide-react'

interface TextBarProps {
  textContent: string[]
  onSpeak?: () => void
  onClear?: () => void
  onRemoveWord?: (index: number) => void
  className?: string
}

const TextBar: React.FC<TextBarProps> = ({
  textContent,
  onSpeak,
  onClear,
  onRemoveWord,
  className = ''
}) => {
  return (
    <div className={`text-bar-container ${className}`}>
      {/* Text Content */}
      <div className="text-bar">
        {textContent.length === 0 ? (
          <span className="text-gray-400 italic">Seleziona simboli per costruire frasi...</span>
        ) : (
          textContent.map((word, index) => (
            <div
              key={index}
              className="text-bar-item cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => onRemoveWord?.(index)}
            >
              <span>{word}</span>
              <X size={14} className="ml-1 text-gray-600" />
            </div>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="text-bar-controls">
        {onSpeak && (
          <button
            onClick={onSpeak}
            disabled={textContent.length === 0}
            className="control-btn hover:-translate-y-0.5 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{ backgroundColor: '#4CAF50' }}
          >
            <Volume2 className="control-btn-icon" />
            <span className="control-btn-label">Parla</span>
          </button>
        )}

        {onClear && (
          <button
            onClick={onClear}
            disabled={textContent.length === 0}
            className="control-btn hover:-translate-y-0.5 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{ backgroundColor: '#f44336' }}
          >
            <RotateCcw className="control-btn-icon" />
            <span className="control-btn-label">Cancella</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default TextBar
