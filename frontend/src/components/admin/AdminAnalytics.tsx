import React, { useEffect, useState } from 'react'
import { adminApi } from '../../api/admin'
import { UserAnalytics } from '../../types'
import LoadingSpinner from '../ui/LoadingSpinner'
import Badge from '../ui/Badge'

interface AnalyticsCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  )
}

const AdminAnalytics: React.FC = () => {
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null)
  const [gridAnalytics, setGridAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        const [userResponse, gridResponse] = await Promise.all([
          adminApi.getUserAnalytics(),
          adminApi.getGridAnalytics(),
        ])

        if (userResponse.success) {
          setUserAnalytics(userResponse.data!)
        }
        
        if (gridResponse.success) {
          setGridAnalytics(gridResponse.data!)
        }
      } catch (err) {
        setError('Failed to load analytics data')
        console.error('Analytics error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

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

  // Calculate percentages for user analytics
  const activePercentage = userAnalytics ? 
    Math.round((userAnalytics.active_users / userAnalytics.total_users) * 100) : 0
  const inactivePercentage = userAnalytics ? 
    Math.round((userAnalytics.inactive_users / userAnalytics.total_users) * 100) : 0

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">System Analytics</h2>

      {/* User Analytics */}
      {userAnalytics && (
        <AnalyticsCard title="📊 User Statistics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{userAnalytics.total_users}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{userAnalytics.active_users}</div>
              <div className="text-sm text-gray-600">Active Users</div>
              <Badge variant="success" size="sm" className="mt-1">
                {activePercentage}%
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{userAnalytics.inactive_users}</div>
              <div className="text-sm text-gray-600">Inactive Users</div>
              <Badge variant="warning" size="sm" className="mt-1">
                {inactivePercentage}%
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{userAnalytics.recent_registrations}</div>
              <div className="text-sm text-gray-600">Recent Signups</div>
              <div className="text-xs text-gray-500 mt-1">(Last 30 days)</div>
            </div>
          </div>

          {/* User Status Chart */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">User Status Distribution</h4>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-green-500 h-full float-left"
                style={{ width: `${activePercentage}%` }}
                title={`Active: ${userAnalytics.active_users} users (${activePercentage}%)`}
              />
              <div 
                className="bg-yellow-500 h-full float-left"
                style={{ width: `${inactivePercentage}%` }}
                title={`Inactive: ${userAnalytics.inactive_users} users (${inactivePercentage}%)`}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Active ({activePercentage}%)</span>
              <span>Inactive ({inactivePercentage}%)</span>
            </div>
          </div>

          {/* Role Distribution */}
          <div>
            <h4 className="font-medium mb-3">Role Distribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(userAnalytics.roles_distribution || {}).map(([role, count]) => {
                const percentage = Math.round((count / userAnalytics.total_users) * 100)
                const getVariant = (roleName: string) => {
                  switch (roleName.toLowerCase()) {
                    case 'admin': return 'success'
                    case 'editor': return 'warning'
                    case 'user': return 'info'
                    default: return 'neutral'
                  }
                }
                
                return (
                  <div key={role} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium capitalize">{role}</span>
                      <Badge variant={getVariant(role)} size="sm">
                        {count} users
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-full rounded-full ${
                          getVariant(role) === 'success' ? 'bg-green-500' :
                          getVariant(role) === 'warning' ? 'bg-yellow-500' :
                          getVariant(role) === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{percentage}% of users</div>
                  </div>
                )
              })}
            </div>
          </div>
        </AnalyticsCard>
      )}

      {/* Grid Analytics */}
      {gridAnalytics && (
        <AnalyticsCard title="🎯 Grid Analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(gridAnalytics).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">
                  {typeof value === 'number' ? value : String(value)}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </AnalyticsCard>
      )}

      {/* System Metrics */}
      <AnalyticsCard title="⚡ System Metrics">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {userAnalytics ? (userAnalytics.active_users / userAnalytics.total_users * 100).toFixed(1) : '0'}%
            </div>
            <div className="text-sm text-blue-700">User Engagement Rate</div>
            <div className="text-xs text-blue-600 mt-1">
              Active vs Total Users
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {userAnalytics?.recent_registrations || 0}
            </div>
            <div className="text-sm text-green-700">Growth Rate</div>
            <div className="text-xs text-green-600 mt-1">
              New users (30 days)
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(userAnalytics?.roles_distribution || {}).length}
            </div>
            <div className="text-sm text-purple-700">Active Roles</div>
            <div className="text-xs text-purple-600 mt-1">
              Different user roles
            </div>
          </div>
        </div>
      </AnalyticsCard>

      {/* Data Insights */}
      <AnalyticsCard title="💡 Insights & Recommendations">
        <div className="space-y-4">
          {userAnalytics && (
            <>
              {userAnalytics.inactive_users > userAnalytics.active_users && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800">⚠️ High Inactive User Rate</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    You have more inactive users ({userAnalytics.inactive_users}) than active ones ({userAnalytics.active_users}). 
                    Consider implementing user engagement strategies or removing unused accounts.
                  </p>
                </div>
              )}
              
              {userAnalytics.recent_registrations === 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800">📈 No Recent Growth</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    No new users have registered in the last 30 days. Consider marketing efforts or improving onboarding.
                  </p>
                </div>
              )}
              
              {userAnalytics.recent_registrations > 10 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800">🚀 Strong Growth</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Great! You have {userAnalytics.recent_registrations} new users in the last 30 days. 
                    Make sure your infrastructure can handle the growth.
                  </p>
                </div>
              )}
              
              {(userAnalytics.roles_distribution?.admin || 0) > (userAnalytics.total_users * 0.1) && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800">🔐 Too Many Admins</h4>
                  <p className="text-sm text-red-700 mt-1">
                    You have {userAnalytics.roles_distribution?.admin} admin users, which is more than 10% of your user base. 
                    Consider reviewing admin permissions for security.
                  </p>
                </div>
              )}
            </>
          )}
          
          {(!userAnalytics || userAnalytics.total_users === 0) && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-800">📊 No Data Available</h4>
              <p className="text-sm text-gray-700 mt-1">
                Create some users and roles to see analytics and insights here.
              </p>
            </div>
          )}
        </div>
      </AnalyticsCard>
    </div>
  )
}

export default AdminAnalytics
