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
    <nav className="navigation">
      <div className="flex items-center">
        {canGoBack && (
          <button
            onClick={onBack}
            className="nav-btn"
          >
            <ArrowLeft size={20} />
            <span>Indietro</span>
          </button>
        )}
      </div>
      
      <div className="current-category">
        {currentCategory === 'home' ? 'Home' : currentCategory}
      </div>
      
      <div className="w-20"> {/* Spacer for balance */}
      </div>
    </nav>
  )
}

export default Navigation
