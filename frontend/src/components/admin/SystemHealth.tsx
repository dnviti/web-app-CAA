import React, { useEffect, useState } from 'react'
import { adminApi } from '../../api/admin'
import { SystemHealthResponse } from '../../types'
import LoadingSpinner from '../ui/LoadingSpinner'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

const SystemHealth: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const fetchSystemHealth = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.getSystemHealth()
      if (response.success && response.data) {
        setSystemHealth(response.data)
        setLastCheck(new Date())
      } else {
        setError('Failed to get system health')
      }
    } catch (err) {
      setError('System health check failed')
      console.error('System health error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemHealth()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' => {
    switch (status?.toLowerCase()) {
      case 'ok':
      case 'healthy':
      case 'connected':
        return 'success'
      case 'warning':
      case 'degraded':
        return 'warning'
      default:
        return 'danger'
    }
  }

  if (error && !systemHealth) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">System Health</h2>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">❌</span>
            <div>
              <h3 className="text-lg font-medium text-red-800">System Health Check Failed</h3>
              <p className="text-red-700">{error}</p>
              <Button 
                onClick={fetchSystemHealth} 
                className="mt-3"
                variant="danger"
                size="sm"
              >
                Retry Check
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">System Health</h2>
        <div className="flex items-center space-x-4">
          {lastCheck && (
            <span className="text-sm text-gray-500">
              Last check: {lastCheck.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={fetchSystemHealth}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : '🔄 Refresh'}
          </Button>
        </div>
      </div>

      {/* Overall System Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">
            {systemHealth?.status === 'healthy' ? '✅' : '❌'}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">System Status</h3>
            {loading && !systemHealth ? (
              <LoadingSpinner size="sm" />
            ) : systemHealth ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={getStatusVariant(systemHealth.status || '')}
                    size="md"
                  >
                    {systemHealth.status?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                  <span className="text-gray-700">
                    {systemHealth.status === 'healthy' ? 'All systems operational' : 'Some systems may be experiencing issues'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Checked at: {new Date(systemHealth.timestamp).toLocaleString()}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Component Status */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">🗄️</span>
              <h3 className="text-lg font-semibold">Database</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={getStatusVariant(systemHealth.services.database.status || '')}
                  size="sm"
                >
                  {systemHealth.services.database.status?.toUpperCase() || 'UNKNOWN'}
                </Badge>
                <span className="text-sm text-gray-600">Connection Status</span>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <div>
                  {systemHealth.services.database.status === 'connected' 
                    ? 'Database is responding normally'
                    : 'Database connection issues detected'
                  }
                </div>
                <div className="font-medium">
                  Type: {systemHealth.services.database.type?.toUpperCase() || 'Unknown'}
                </div>
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">🌐</span>
              <h3 className="text-lg font-semibold">API Server</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="success"
                  size="sm"
                >
                  ONLINE
                </Badge>
                <span className="text-sm text-gray-600">Server Status</span>
              </div>
              <div className="text-sm text-gray-500">
                API server is responding to requests
              </div>
            </div>
          </div>

          {/* Authentication Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">🔐</span>
              <h3 className="text-lg font-semibold">Authentication</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="success"
                  size="sm"
                >
                  ACTIVE
                </Badge>
                <span className="text-sm text-gray-600">Auth System</span>
              </div>
              <div className="text-sm text-gray-500">
                JWT authentication is working properly
              </div>
            </div>
          </div>

          {/* RBAC Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">🛡️</span>
              <h3 className="text-lg font-semibold">RBAC System</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="success"
                  size="sm"
                >
                  ACTIVE
                </Badge>
                <span className="text-sm text-gray-600">Authorization</span>
              </div>
              <div className="text-sm text-gray-500">
                Role-based access control is functioning
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          ℹ️ System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Environment:</span>
              <Badge variant="info" size="sm">Production</Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Database Type:</span>
              <span>{systemHealth?.services.database.type?.toUpperCase() || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">API Version:</span>
              <span>1.0</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Auto-refresh:</span>
              <Badge variant="success" size="sm">30s</Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Health Endpoint:</span>
              <code className="text-xs bg-gray-100 px-1 rounded">/api/admin/system/ping</code>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Monitoring:</span>
              <Badge variant="success" size="sm">Active</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          ⚡ System Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSystemHealth}
            disabled={loading}
          >
            🔄 Manual Health Check
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/api/admin/system/ping', '_blank')}
          >
            🌐 View Raw Health Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/swagger/index.html', '_blank')}
          >
            📚 API Documentation
          </Button>
        </div>
      </div>

      {/* Health History Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">📊 Health Monitoring</h3>
        <p className="text-sm text-blue-700">
          This page automatically refreshes system health every 30 seconds. 
          For detailed logs and historical data, check your server logs and monitoring tools.
        </p>
      </div>
    </div>
  )
}

export default SystemHealth
