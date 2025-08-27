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
    <div className={`mode-toggle ${className}`}>
      {tenses.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onTenseChange(key)}
          className={`mode-btn ${currentTense === key ? 'active' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default TenseButtons
