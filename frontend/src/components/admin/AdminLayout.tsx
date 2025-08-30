import React, { useState } from 'react'
import { clsx } from 'clsx'

interface AdminLayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'roles', label: 'Role Management', icon: '🔐' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'system', label: 'System Health', icon: '⚡' },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={clsx(
        'bg-white shadow-lg transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className={clsx(
              'font-bold text-lg text-gray-800',
              !sidebarOpen && 'hidden'
            )}>
              Admin Panel
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-xl">{sidebarOpen ? '◀️' : '▶️'}</span>
            </button>
          </div>
        </div>

        <nav className="p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'w-full flex items-center p-3 rounded-lg transition-colors mb-1',
                'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
                activeTab === tab.id 
                  ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' 
                  : 'text-gray-700'
              )}
              title={!sidebarOpen ? tab.label : undefined}
            >
              <span className="text-xl mr-3">{tab.icon}</span>
              {sidebarOpen && (
                <span className="font-medium">{tab.label}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {tabs.find(tab => tab.id === activeTab)?.label || 'Admin Dashboard'}
          </h2>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
