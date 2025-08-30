import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import Button from './ui/Button'
import Badge from './ui/Badge'

interface TopNavigationBarProps {
  onEditorToggle?: () => void
  editorMode?: boolean
}

const TopNavigationBar: React.FC<TopNavigationBarProps> = ({ 
  onEditorToggle, 
  editorMode 
}) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout()
      navigate('/login')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  // Check if user has admin role
  const isAdmin = user?.roles?.some?.((role: any) => role?.name === 'admin') || 
    user?.role === 'admin'

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 relative z-30">
      <div className="flex justify-between items-center">
        {/* Left side - User info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={16} className="text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {user?.username || 'Loading...'}
              </span>
              {(user?.role || (user?.roles && user.roles.length > 0)) && (
                <Badge 
                  variant={
                    (user?.roles?.some(r => r.name === 'admin') || user?.role === 'admin') ? 'success' : 
                    (user?.roles?.some(r => r.name === 'editor') || user?.role === 'editor') ? 'warning' : 'info'
                  }
                  size="sm"
                >
                  {user?.role || user?.roles?.[0]?.name || 'user'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Editor Toggle */}
          {onEditorToggle && (
            <Button
              variant={editorMode ? 'primary' : 'outline'}
              size="sm"
              onClick={onEditorToggle}
              className="flex items-center space-x-1"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">
                {editorMode ? 'Exit Editor' : 'Editor Mode'}
              </span>
            </Button>
          )}

          {/* Admin Dashboard */}
          {isAdmin && (
            <Link to="/admin">
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center space-x-1 bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300"
              >
                <span className="text-sm">🛡️</span>
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
          )}

          {/* User Profile */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-1"
            >
              <User size={16} />
              <span className="hidden sm:inline">Profile</span>
            </Button>
            
            {/* Dropdown menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                  </div>
                  
                  {isAdmin && (
                    <Link 
                      to="/admin"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="mr-2">🛡️</span>
                      Admin Dashboard
                    </Link>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      handleLogout()
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} className="mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopNavigationBar
