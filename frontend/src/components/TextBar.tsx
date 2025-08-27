import React from 'react'
import { Volume2, X } from 'lucide-react'

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
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      {/* Text Content */}
      <div className="flex items-center min-h-16 px-4 bg-gray-50">
        <div className="flex-1 flex items-center gap-2 text-lg">
          {textContent.length === 0 ? (
            <span className="text-gray-400 italic">Seleziona simboli per costruire frasi...</span>
          ) : (
            textContent.map((word, index) => (
              <span
                key={index}
                className="relative bg-blue-100 text-blue-900 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => onRemoveWord?.(index)}
              >
                {word}
                <X size={14} className="inline ml-1" />
              </span>
            ))
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-white">
        <div className="flex items-center gap-3">
          {onSpeak && (
            <button
              onClick={onSpeak}
              disabled={textContent.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Volume2 size={20} />
              <span>Parla</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onClear && (
            <button
              onClick={onClear}
              disabled={textContent.length === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Cancella tutto
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TextBar
