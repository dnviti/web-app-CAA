import React from 'react'
import { ArrowLeft } from 'lucide-react'

interface NavigationProps {
  currentCategory: string
  onBack: () => void
  canGoBack: boolean
}

const Navigation: React.FC<NavigationProps> = ({
  currentCategory,
  onBack,
  canGoBack
}) => {
  return (
    <nav className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="flex items-center">
        {canGoBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Indietro</span>
          </button>
        )}
      </div>
      
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 capitalize">
          {currentCategory === 'home' ? 'Home' : currentCategory}
        </h2>
      </div>
      
      <div className="w-20"> {/* Spacer for balance */}
      </div>
    </nav>
  )
}

export default Navigation
