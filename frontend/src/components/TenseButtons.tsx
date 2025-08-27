export type TenseMode = 'passato' | 'presente' | 'futuro'

export interface TenseButtonsProps {
  currentTense: TenseMode
  onTenseChange: (tense: TenseMode) => void
  className?: string
}

import React from 'react'

const TenseButtons: React.FC<TenseButtonsProps> = ({
  currentTense,
  onTenseChange,
  className = ''
}) => {
  const tenses: { key: TenseMode; label: string }[] = [
    { key: 'passato', label: 'Passato' },
    { key: 'presente', label: 'Presente' },
    { key: 'futuro', label: 'Futuro' },
  ]

  return (
    <nav className={`flex items-center justify-center gap-1 p-4 bg-white border-b border-gray-200 ${className}`}>
      {tenses.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onTenseChange(key)}
          className={`
            px-6 py-2 rounded-full font-medium transition-all duration-200
            ${currentTense === key
              ? 'bg-purple-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}

export default TenseButtons
