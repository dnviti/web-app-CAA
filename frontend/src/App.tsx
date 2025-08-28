import { useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SetupPage from './pages/SetupPage'
import MainPage from './pages/MainPage'
import DemoPage from './pages/DemoPage'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const { token, isLoading, isInitialized, checkAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Check authentication status on app start, but only once
    if (!hasInitialized.current && !isInitialized) {
      hasInitialized.current = true
      checkAuth()
    }
  }, [checkAuth, isInitialized])

  // Handle navigation based on auth state changes
  useEffect(() => {
    if (isInitialized) {
      // If we have a token and are on login/register pages, redirect to app
      if (token && (location.pathname === '/login' || location.pathname === '/register')) {
        navigate('/app', { replace: true })
      }
      // If we don't have a token and are trying to access protected routes, redirect to login
      else if (!token && (location.pathname === '/app' || location.pathname === '/setup')) {
        navigate('/login', { replace: true })
      }
    }
  }, [token, isInitialized, location.pathname, navigate])

  // Debug logging
  console.log('App render:', { token: !!token, isLoading, isInitialized, pathname: location.pathname })

  // Show loading spinner while checking authentication or if not initialized
  if (isLoading || !isInitialized) {
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
          {/* Demo route */}
          <Route path="/demo" element={<DemoPage />} />
          
          {/* Public routes - only redirect if we have a token */}
          <Route 
            path="/login" 
            element={token ? <Navigate to="/app" replace /> : <LoginPage />} 
          />
          <Route 
            path="/register" 
            element={token ? <Navigate to="/app" replace /> : <RegisterPage />} 
          />
          
          {/* Protected routes - only redirect if we don't have a token */}
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
