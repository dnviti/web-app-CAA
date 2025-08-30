import React, { useEffect, useState } from 'react'
import { adminApi } from '../../api/admin'
import { UserAnalytics, SystemHealthResponse } from '../../types'
import LoadingSpinner from '../ui/LoadingSpinner'
import Badge from '../ui/Badge'

interface StatCardProps {
  title: string
  value: string | number
  icon: string
  color: 'blue' | 'green' | 'yellow' | 'red'
  loading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, loading }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  }

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-center">
        <div className="text-3xl mr-4">{icon}</div>
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}

const AdminOverview: React.FC = () => {
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealthResponse | null>(null)
  const [gridAnalytics, setGridAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [userResponse, healthResponse, gridResponse] = await Promise.all([
          adminApi.getUserAnalytics(),
          adminApi.getSystemHealth(),
          adminApi.getGridAnalytics(),
        ])

        if (userResponse.success) {
          setUserAnalytics(userResponse.data!)
        }
        
        if (healthResponse.success) {
          setSystemHealth(healthResponse.data!)
        }
        
        if (gridResponse.success) {
          setGridAnalytics(gridResponse.data!)
        }
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error('Dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">❌ {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          ⚡ System Status
        </h3>
        {systemHealth ? (
          <div className="flex items-center space-x-4">
            <Badge 
              variant={systemHealth.status === 'ok' ? 'success' : 'danger'}
              size="md"
            >
              {systemHealth.status.toUpperCase()}
            </Badge>
            <span className="text-gray-600">{systemHealth.message}</span>
            <Badge variant="info" size="sm">
              DB: {systemHealth.database_status}
            </Badge>
            <span className="text-sm text-gray-500">
              Last checked: {new Date(systemHealth.timestamp).toLocaleString()}
            </span>
          </div>
        ) : (
          <LoadingSpinner size="sm" />
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={userAnalytics?.total_users || 0}
          icon="👥"
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Active Users"
          value={userAnalytics?.active_users || 0}
          icon="✅"
          color="green"
          loading={loading}
        />
        <StatCard
          title="Inactive Users"
          value={userAnalytics?.inactive_users || 0}
          icon="⏸️"
          color="yellow"
          loading={loading}
        />
        <StatCard
          title="Recent Signups"
          value={userAnalytics?.recent_registrations || 0}
          icon="📈"
          color="blue"
          loading={loading}
        />
      </div>

      {/* Role Distribution */}
      {userAnalytics?.roles_distribution && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            🔐 Role Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(userAnalytics.roles_distribution).map(([role, count]) => (
              <div key={role} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium capitalize">{role}</span>
                <Badge variant="neutral" size="sm">
                  {count} users
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid Analytics */}
      {gridAnalytics && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            📊 Grid Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(gridAnalytics).map(([key, value]) => (
              <div key={key} className="text-center p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}
                </p>
                <p className="text-xl font-bold text-gray-800">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOverview
