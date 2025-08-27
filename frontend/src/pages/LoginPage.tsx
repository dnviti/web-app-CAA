import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../stores/authStore'
import { LoginRequest } from '../types'
import Button from '../components/ui/Button'
import { Eye, EyeOff, User, Lock } from 'lucide-react'

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuthStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>()

  const onSubmit = async (data: LoginRequest) => {
    const success = await login(data)
    if (success) {
      navigate('/app')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Web App CAA
          </h1>
          <p className="text-gray-600">
            Comunicazione Aumentativa Alternativa
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Nome utente
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                {...register('username', {
                  required: 'Nome utente richiesto',
                  minLength: {
                    value: 3,
                    message: 'Minimo 3 caratteri'
                  }
                })}
                type="text"
                id="username"
                autoComplete="username"
                className={`
                  w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  ${errors.username ? 'border-red-300' : 'border-gray-300'}
                `}
                placeholder="Inserisci il tuo nome utente"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                {...register('password', {
                  required: 'Password richiesta',
                  minLength: {
                    value: 6,
                    message: 'Minimo 6 caratteri'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                className={`
                  w-full pl-10 pr-10 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  ${errors.password ? 'border-red-300' : 'border-gray-300'}
                `}
                placeholder="Inserisci la tua password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Accesso in corso...' : 'Accedi'}
          </Button>
        </form>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Non hai un account?{' '}
            <Link 
              to="/register" 
              className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:underline"
            >
              Registrati qui
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>
            Comunicazione Aumentativa e Alternativa
          </p>
          <p className="mt-1">
            Versione 2.0 - React Frontend
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
