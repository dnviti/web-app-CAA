import React, { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import ArasaacIconPicker from './ArasaacIconPicker'
import { GridItem } from '../types'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'symbol' | 'category'
  onAdd: (item: Omit<GridItem, 'id'>) => void
  currentCategory: string
  editingItem?: GridItem | null
  onEdit?: (itemId: string, updates: Partial<GridItem>) => void
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  type,
  onAdd,
  currentCategory,
  editingItem = null,
  onEdit
}) => {
  const [formData, setFormData] = useState({
    label: '',
    speak: '',
    text: '',
    color: '#f3f4f6',
    icon: '',
    target: ''
  })
  const [iconSource, setIconSource] = useState<'url' | 'arasaac'>('arasaac')
  const [selectedArasaacUrl, setSelectedArasaacUrl] = useState<string | null>(null)

  const isEditing = Boolean(editingItem)

  // Populate form data when editing
  useEffect(() => {
    if (editingItem) {
      setFormData({
        label: editingItem.label,
        speak: (editingItem as any).speak || editingItem.label,
        text: (editingItem as any).text || editingItem.label,
        color: editingItem.color || '#f3f4f6',
        icon: editingItem.icon || '',
        target: (editingItem as any).target || currentCategory
      })
      
      // Set icon source based on whether it looks like an ARASAAC URL
      if (editingItem.icon?.includes('arasaac')) {
        setIconSource('arasaac')
        setSelectedArasaacUrl(editingItem.icon)
      } else {
        setIconSource('url')
        setSelectedArasaacUrl(null)
      }
    } else {
      // Reset form for new item
      setFormData({
        label: '',
        speak: '',
        text: '',
        color: '#f3f4f6',
        icon: '',
        target: ''
      })
      setSelectedArasaacUrl(null)
      setIconSource('arasaac')
    }
  }, [editingItem, currentCategory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.label.trim()) {
      alert('Il campo etichetta è obbligatorio')
      return
    }

    if (isEditing && editingItem && onEdit) {
      // Edit existing item
      const updates: Partial<GridItem> = {
        label: formData.label,
        color: formData.color,
        icon: selectedArasaacUrl || formData.icon || '/default-icon.png',
        ...(type === 'symbol' 
          ? {
              speak: formData.speak || formData.label,
              text: formData.text || formData.label,
            }
          : {
              target: formData.target || currentCategory
            }
        )
      }

      onEdit(editingItem.id, updates)
    } else {
      // Add new item
      const newItem: Omit<GridItem, 'id'> = {
        label: formData.label,
        color: formData.color,
        icon: selectedArasaacUrl || formData.icon || '/default-icon.png',
        type: type,
        isVisible: true,
        isHideable: true,
        ...(type === 'symbol' 
          ? {
              speak: formData.speak || formData.label,
              text: formData.text || formData.label,
              symbol_type: 'altro' as const
            }
          : {
              target: formData.target || currentCategory
            }
        )
      }

      onAdd(newItem)
    }
    
    // Reset form
    setFormData({
      label: '',
      speak: '',
      text: '',
      color: '#f3f4f6',
      icon: '',
      target: ''
    })
    setSelectedArasaacUrl(null)
    
    onClose()
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEditing ? 'Modifica' : 'Aggiungi'} ${type === 'symbol' ? 'Simbolo' : 'Categoria'}`}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === 'symbol' ? 'Etichetta simbolo' : 'Nome categoria'} *
          </label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder={type === 'symbol' ? 'es. Cane' : 'es. Animali'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {type === 'symbol' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Testo da pronunciare
              </label>
              <input
                type="text"
                value={formData.speak}
                onChange={(e) => handleChange('speak', e.target.value)}
                placeholder="es. il cane"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Testo per frasi
              </label>
              <input
                type="text"
                value={formData.text}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="es. cane"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {type === 'category' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria target
            </label>
            <input
              type="text"
              value={formData.target}
              onChange={(e) => handleChange('target', e.target.value)}
              placeholder={currentCategory}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Colore
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
              className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
              placeholder="#f3f4f6"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Icona
          </label>
          
          {/* Icon source selector */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setIconSource('arasaac')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                iconSource === 'arasaac' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ARASAAC
            </button>
            <button
              type="button"
              onClick={() => setIconSource('url')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                iconSource === 'url' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              URL
            </button>
          </div>

          {iconSource === 'arasaac' ? (
            <ArasaacIconPicker
              onIconSelect={(iconUrl) => setSelectedArasaacUrl(iconUrl)}
              selectedIconUrl={selectedArasaacUrl}
              placeholder={`Cerca icona per ${type === 'symbol' ? 'simbolo' : 'categoria'}...`}
              className="border border-gray-300 rounded-lg p-3"
            />
          ) : (
            <input
              type="url"
              value={formData.icon}
              onChange={(e) => {
                handleChange('icon', e.target.value)
                setSelectedArasaacUrl(null) // Clear ARASAAC selection when typing URL
              }}
              placeholder="https://example.com/icon.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {/* Preview selected icon */}
          {(selectedArasaacUrl || formData.icon) && (
            <div className="mt-3 p-2 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Anteprima:</p>
              <img 
                src={selectedArasaacUrl || formData.icon} 
                alt="Anteprima icona" 
                className="w-16 h-16 object-contain border border-gray-200 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-icon.png'
                }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button
            type="submit"
            className="flex-1"
          >
            {isEditing ? 'Salva Modifiche' : 'Aggiungi'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AddItemModal
