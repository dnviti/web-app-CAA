import React, { useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { GridItem } from '../types'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'symbol' | 'category'
  onAdd: (item: Omit<GridItem, 'id'>) => void
  currentCategory: string
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  type,
  onAdd,
  currentCategory
}) => {
  const [formData, setFormData] = useState({
    label: '',
    speak: '',
    text: '',
    color: '#f3f4f6',
    icon: '',
    target: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.label.trim()) {
      alert('Il campo etichetta è obbligatorio')
      return
    }

    const newItem: Omit<GridItem, 'id'> = {
      label: formData.label,
      color: formData.color,
      icon: formData.icon || '/default-icon.png',
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
    
    // Reset form
    setFormData({
      label: '',
      speak: '',
      text: '',
      color: '#f3f4f6',
      icon: '',
      target: ''
    })
    
    onClose()
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Aggiungi ${type === 'symbol' ? 'Simbolo' : 'Categoria'}`}
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
            URL Icona
          </label>
          <input
            type="url"
            value={formData.icon}
            onChange={(e) => handleChange('icon', e.target.value)}
            placeholder="https://example.com/icon.png"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            Aggiungi
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AddItemModal
