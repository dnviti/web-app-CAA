import React from 'react'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import Button from '../components/ui/Button'

const MainPage: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { mode, setMode } = useAppStore()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Web App CAA
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Benvenuto, {user?.username}
              </span>
              
              <Button
                variant={mode === 'editor' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setMode(mode === 'editor' ? 'user' : 'editor')}
              >
                {mode === 'editor' ? 'Modalità Utente' : 'Modalità Editor'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Applicazione CAA - React Frontend
          </h2>
          
          <div className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto">
            <p className="text-gray-600 mb-4">
              L'applicazione è stata convertita con successo da vanilla JavaScript a React con TypeScript.
            </p>
            
            <p className="text-gray-600 mb-6">
              Modalità corrente: <strong>{mode === 'editor' ? 'Editor' : 'Utente'}</strong>
            </p>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Funzionalità principali implementate:
              </h3>
              
              <ul className="text-left space-y-2 text-gray-700">
                <li>✅ Sistema di autenticazione con JWT</li>
                <li>✅ Store management con Zustand</li>
                <li>✅ Routing con React Router</li>
                <li>✅ Componenti UI riutilizzabili</li>
                <li>✅ API client per comunicazione backend</li>
                <li>✅ Error boundary per gestione errori</li>
                <li>✅ TypeScript per type safety</li>
                <li>🚧 Grid di simboli con drag & drop</li>
                <li>🚧 Text-to-speech</li>
                <li>🚧 Integrazione AI per correzioni</li>
                <li>🚧 Camera per simboli personalizzati</li>
                <li>🚧 Gestione tense per verbi</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default MainPage
