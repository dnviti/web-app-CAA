import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/admin/AdminLayout'
import AdminOverview from '../components/admin/AdminOverview'
import UserManagement from '../components/admin/UserManagement'
import RoleManagement from '../components/admin/RoleManagement'
import AdminAnalytics from '../components/admin/AdminAnalytics'
import SystemHealth from '../components/admin/SystemHealth'
import { toast } from 'react-hot-toast'
import { User } from '../types'

// Helper function to safely check if user has admin role
const hasAdminAccess = (user: User | null): boolean => {
  if (!user) return false;
  
  // Check roles array (RBAC system)
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const adminRole = user.roles.some((role: any) => 
      role && (role.name === 'admin' || role.Name === 'admin')
    );
    if (adminRole) return true;
  }
  
  // Fallback to legacy role field
  return user.role === 'admin';
}

const AdminDashboard: React.FC = () => {
  const { user, isLoading, checkAuth } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const verifyAccess = async () => {
      console.log('🔐 AdminDashboard: Verifying admin access...', { 
        hasUser: !!user, 
        userRoles: user?.roles, 
        userRole: user?.role 
      });

      // Always call checkAuth to ensure fresh user data
      if (!user || !user.roles) {
        console.log('🔐 AdminDashboard: User data incomplete, calling checkAuth...');
        await checkAuth();
      }
      
      // Get fresh user data from store after checkAuth
      const { user: currentUser } = useAuthStore.getState();
      
      console.log('🔐 AdminDashboard: Fresh user data from store:', {
        hasUser: !!currentUser,
        username: currentUser?.username,
        roles: currentUser?.roles,
        role: currentUser?.role,
        rolesArray: Array.isArray(currentUser?.roles) ? currentUser.roles : 'Not an array'
      });
      
      // If no user after auth check, redirect to login
      if (!currentUser) {
        console.log('🔐 AdminDashboard: No user data, redirecting to login');
        toast.error('Please log in to access the admin dashboard');
        navigate('/login');
        return;
      }
      
      // Check if user has admin role - using helper function
      const adminAccess = hasAdminAccess(currentUser);
      
      console.log('🔐 AdminDashboard: Checking admin access:', {
        hasUser: !!currentUser,
        rolesArray: Array.isArray(currentUser?.roles),
        rolesCount: currentUser?.roles?.length || 0,
        roleNames: Array.isArray(currentUser?.roles) ? currentUser.roles.map((r: any) => r?.name || r?.Name) : 'Not an array',
        legacyRole: currentUser?.role,
        hasAdminAccess: adminAccess
      });
      
      // For development/testing: temporarily allow if user data exists but no roles loaded
      if (!adminAccess && currentUser && (!currentUser.roles || currentUser.roles.length === 0)) {
        console.warn('🔐 AdminDashboard: No roles data found - this might be a data loading issue');
        console.log('🔐 AdminDashboard: User object keys:', Object.keys(currentUser));
        // Don't auto-grant access, let the error show so we can debug
      }
      
      console.log('🔐 AdminDashboard: Final admin access check:', { hasAdminAccess: adminAccess });
      
      if (!adminAccess) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/app');
        return;
      }
      
      console.log('🔐 AdminDashboard: Admin access granted!');
    }
    
    verifyAccess()
  }, [navigate, checkAuth]) // Removed user from dependencies to avoid loops

  // Show loading while checking auth or no user data
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Final check before rendering admin content
  const adminAccess = hasAdminAccess(user);
  
  console.log('🔐 AdminDashboard: Final render check:', {
    hasUser: !!user,
    userRoles: user?.roles,
    userRole: user?.role,
    hasAdminAccess: adminAccess,
    userKeys: user ? Object.keys(user) : 'No user'
  });
    
  if (!adminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">Access denied. Admin privileges required.</p>
          <div className="text-sm text-gray-600">
            <p>Debug info:</p>
            <p>User: {user?.username || 'No user'}</p>
            <p>Roles: {user?.roles ? JSON.stringify(user.roles, null, 2) : 'No roles'}</p>
            <p>Legacy role: {user?.role || 'No legacy role'}</p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />
      case 'users':
        return <UserManagement />
      case 'roles':
        return <RoleManagement />
      case 'analytics':
        return <AdminAnalytics />
      case 'system':
        return <SystemHealth />
      default:
        return <AdminOverview />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </AdminLayout>
    </div>
  )
}

export default AdminDashboard
