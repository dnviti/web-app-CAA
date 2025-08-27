import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SetupPage from './pages/SetupPage'
import MainPage from './pages/MainPage'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const { token, user, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    // Check authentication status on app start
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={!token ? <LoginPage /> : <Navigate to="/app" replace />} 
          />
          <Route 
            path="/register" 
            element={!token ? <RegisterPage /> : <Navigate to="/app" replace />} 
          />
          
          {/* Protected routes */}
          <Route 
            path="/setup" 
            element={token ? <SetupPage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/app" 
            element={token ? <MainPage /> : <Navigate to="/login" replace />} 
          />
          
          {/* Default redirect */}
          <Route 
            path="/" 
            element={<Navigate to={token ? "/app" : "/login"} replace />} 
          />
          
          {/* Catch all */}
          <Route 
            path="*" 
            element={<Navigate to={token ? "/app" : "/login"} replace />} 
          />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App
