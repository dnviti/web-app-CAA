import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { arasaacApi } from '../api/arasaac'
import { ArasaacIcon } from '../types'

interface ArasaacIconPickerProps {
  onIconSelect: (iconUrl: string, iconId: number) => void
  selectedIconUrl?: string | null
  placeholder?: string
  className?: string
}

const ArasaacIconPicker: React.FC<ArasaacIconPickerProps> = ({
  onIconSelect,
  selectedIconUrl,
  placeholder = "Cerca icona ARASAAC...",
  className = ""
}) => {
  const [query, setQuery] = useState('')
  const [icons, setIcons] = useState<ArasaacIcon[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceTimer = useRef<number | null>(null)

  // Search function
  const searchIcons = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setIcons([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Try backend API first
      const response = await arasaacApi.searchIcons(searchQuery)
      
      if (response.success && response.data) {
        setIcons(response.data.icons || [])
      } else {
        // Fallback to direct API call
        const directIcons = await arasaacApi.searchIconsDirect(searchQuery)
        setIcons(directIcons)
      }
    } catch (err) {
      console.error('Error searching ARASAAC icons:', err)
      setError('Errore durante la ricerca delle icone')
      
      // Try direct API as last resort
      try {
        const directIcons = await arasaacApi.searchIconsDirect(searchQuery)
        setIcons(directIcons)
        setError(null)
      } catch (directErr) {
        console.error('Direct ARASAAC search also failed:', directErr)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search with proper cleanup
  const handleSearch = useCallback((searchQuery: string) => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    // Set new timer
    debounceTimer.current = window.setTimeout(() => {
      searchIcons(searchQuery)
    }, 300)
  }, [searchIcons])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    
    // Clear icons immediately if query is empty
    if (!value.trim()) {
      setIcons([])
      setLoading(false)
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value
    if (value.trim()) {
      handleSearch(value.trim())
    }
  }

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const handleIconClick = (icon: ArasaacIcon) => {
    const iconUrl = arasaacApi.getIconUrl(icon._id)
    onIconSelect(iconUrl, icon._id)
  }

  const getIconKeywords = (icon: ArasaacIcon): string => {
    if (icon.keywords && Array.isArray(icon.keywords)) {
      return icon.keywords
        .map((keywordObj: any) => keywordObj.keyword || Object.values(keywordObj)[0])
        .filter(Boolean)
        .join(', ')
    }
    return 'Icona ARASAAC'
  }

  return (
    <div className={`arasaac-icon-picker ${className}`}>
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyUp={handleKeyUp}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Icons Grid */}
      {icons.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-2">
          {icons.map((icon) => {
            const iconUrl = arasaacApi.getIconUrl(icon._id)
            const isSelected = selectedIconUrl === iconUrl
            
            return (
              <button
                key={icon._id}
                onClick={() => handleIconClick(icon)}
                className={`
                  relative aspect-square border-2 rounded-md p-1 transition-all duration-200
                  hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                title={getIconKeywords(icon)}
              >
                <img
                  src={iconUrl}
                  alt={getIconKeywords(icon)}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    // Hide broken images
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* No Results */}
      {query.trim() && !loading && icons.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Search className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <p>Nessuna icona trovata per "{query}"</p>
          <p className="text-sm">Prova con parole chiave diverse</p>
        </div>
      )}

      {/* Instructions */}
      {!query.trim() && (
        <div className="text-center py-8 text-gray-500">
          <Search className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <p>Cerca icone ARASAAC</p>
          <p className="text-sm">Inserisci una parola chiave per iniziare</p>
        </div>
      )}
    </div>
  )
}

export default ArasaacIconPicker
