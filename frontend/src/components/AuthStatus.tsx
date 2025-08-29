import React, { useState } from 'react'
import { useAuthStore } from '../stores/authStore'

const AuthStatus: React.FC = () => {
  const { user, token, isLoading, error, login, logout, debugAuthState } = useAuthStore()
  const [showDebug, setShowDebug] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleQuickLogin = async (username: string, password: string) => {
    setIsLoggingIn(true)
    await login({ username, password })
    setIsLoggingIn(false)
  }

  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        Loading authentication...
      </div>
    )
  }

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 shadow-lg rounded-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-800">Auth Status</h3>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs bg-gray-100 px-2 py-1 rounded"
        >
          Debug
        </button>
      </div>
      
      {error && (
        <div className="mb-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {user ? (
        <div className="space-y-2">
          <div className="text-sm">
            <strong>Logged in as:</strong> {user.username}
          </div>
          {user.role && (
            <div className="text-sm">
              <strong>Role:</strong> {user.role}
            </div>
          )}
          <button
            onClick={logout}
            className="w-full bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-red-600 mb-2">
            Not authenticated. To add/edit grid items, you need admin or editor role.
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={() => handleQuickLogin('admin', 'admin123')}
              disabled={isLoggingIn}
              className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50"
            >
              Login as Admin
            </button>
            <button
              onClick={() => handleQuickLogin('editor', 'editor123')}
              disabled={isLoggingIn}
              className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
            >
              Login as Editor
            </button>
          </div>
          
          <button
            onClick={() => handleQuickLogin('user', 'user123')}
            disabled={isLoggingIn}
            className="w-full bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 disabled:opacity-50"
          >
            Login as User (read-only)
          </button>
        </div>
      )}

      {showDebug && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => {
              const debug = debugAuthState()
              console.log('Auth Debug Info:', debug)
            }}
            className="w-full bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-200"
          >
            Log Debug Info to Console
          </button>
          
          <div className="mt-2 text-xs text-gray-600">
            <div>Token: {token ? 'Present' : 'Missing'}</div>
            <div>LocalStorage JWT: {localStorage.getItem('jwt_token') ? 'Present' : 'Missing'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthStatus
