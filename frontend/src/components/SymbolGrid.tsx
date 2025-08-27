import React from 'react'
import { GridItem } from '../types'

export interface SymbolGridProps {
  items: GridItem[]
  onItemClick: (item: GridItem) => void
  onItemRightClick?: (item: GridItem, event: React.MouseEvent) => void
  editorMode?: boolean
  className?: string
}

const SymbolGrid: React.FC<SymbolGridProps> = ({
  items,
  onItemClick,
  onItemRightClick,
  editorMode = false,
  className = ''
}) => {
  const handleContextMenu = (item: GridItem, event: React.MouseEvent) => {
    event.preventDefault()
    if (editorMode && onItemRightClick) {
      onItemRightClick(item, event)
    }
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 ${className}`}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`
            relative aspect-square rounded-lg border-2 border-gray-200 
            cursor-pointer transition-all duration-200
            hover:border-blue-400 hover:shadow-md
            ${item.isVisible === false ? 'opacity-50' : ''}
            ${editorMode ? 'hover:scale-105' : ''}
          `}
          style={{ backgroundColor: item.color || '#f3f4f6' }}
          onClick={() => onItemClick(item)}
          onContextMenu={(e) => handleContextMenu(item, e)}
        >
          {/* Icon */}
          <div className="flex flex-col items-center justify-center h-full p-2">
            {item.icon ? (
              <img
                src={item.icon}
                alt={item.label}
                className="w-12 h-12 mb-2 object-contain"
              />
            ) : (
              <div className="w-12 h-12 mb-2 bg-gray-300 rounded flex items-center justify-center">
                <span className="material-icons text-gray-600">
                  {item.type === 'category' ? 'folder' : 'image'}
                </span>
              </div>
            )}
            
            {/* Label */}
            <span className="text-sm font-medium text-center text-gray-900 leading-tight">
              {item.label}
            </span>
          </div>

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
