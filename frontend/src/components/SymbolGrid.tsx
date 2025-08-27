import React from 'react'
import { GridItem, SizeType } from '../types'

export interface SymbolGridProps {
  items: GridItem[]
  onItemClick: (item: GridItem) => void
  onItemRightClick?: (item: GridItem, event: React.MouseEvent) => void
  editorMode?: boolean
  size?: SizeType
  className?: string
}

const SymbolGrid: React.FC<SymbolGridProps> = ({
  items,
  onItemClick,
  onItemRightClick,
  editorMode = false,
  size = 'medium',
  className = ''
}) => {
  const handleContextMenu = (item: GridItem, event: React.MouseEvent) => {
    event.preventDefault()
    if (editorMode && onItemRightClick) {
      onItemRightClick(item, event)
    }
  }

  return (
    <div className={`symbol-grid ${className}`}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`
            symbol-cell ${item.type} ${size}
            ${item.isVisible === false ? 'hidden-in-user-mode' : ''}
            ${editorMode ? 'hover:scale-105' : ''}
            ${item.type === 'category' ? 'category' : ''}
          `}
          style={{ 
            backgroundColor: item.type === 'category' ? undefined : (item.color || '#f3f4f6'),
            '--folder-bg': item.type === 'category' ? (item.color || '#A0C4FF') : undefined,
            '--folder-tab-bg': item.type === 'category' ? (item.color ? `${item.color}dd` : '#8aabde') : undefined,
          } as React.CSSProperties}
          onClick={() => onItemClick(item)}
          onContextMenu={(e) => handleContextMenu(item, e)}
        >
          {item.type === 'category' ? (
            /* Folder structure for categories */
            <div className={`ffolder ${size}`}>
              <img
                src={item.icon || '/default-folder-icon.svg'}
                alt={item.label}
                className="folder-icon"
              />
              <span>{item.label}</span>
            </div>
          ) : (
            /* Regular symbol structure */
            <div className="flex flex-col items-center justify-center h-full p-2">
              <div className="symbol-icon">
                {item.icon ? (
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 rounded flex items-center justify-center">
                    <span className="material-icons text-gray-600">
                      image
                    </span>
                  </div>
                )}
              </div>
              
              {/* Label */}
              <span className="symbol-label font-medium text-center text-gray-900 leading-tight">
                {item.label}
              </span>
            </div>
          )}

          {/* Editor mode indicators */}
          {editorMode && (
            <div className="absolute top-1 right-1">
              <div className={`w-3 h-3 rounded-full ${
                item.type === 'category' ? 'bg-blue-500' : item.type === 'symbol' ? 'bg-green-500' : 'bg-gray-500'
              }`} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default SymbolGrid
