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
    <div className="login-container">
      <div className="login-content">
        {/* Header */}
        <div>
          <h3>Web App CAA</h3>
          <p className="text-gray-600 text-center mb-6">
            Comunicazione Aumentativa Alternativa
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username Field */}
          <div className="form-group">
            <label htmlFor="username">Nome utente</label>
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
                className={`pl-10 ${errors.username ? 'border-red-300' : ''}`}
                placeholder="Inserisci il tuo nome utente"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
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
                className={`pl-10 pr-10 ${errors.password ? 'border-red-300' : ''}`}
                placeholder="Inserisci la tua password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="modal-buttons">
            <Button
              type="submit"
              className="btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </div>
        </form>

        {/* Register Link */}
        <div className="register-link">
          <p>
            Non hai un account?{' '}
            <Link to="/register">
              Registrati qui
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-4">
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
