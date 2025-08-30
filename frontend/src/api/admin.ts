import { apiClient } from './client'
import { 
  ApiResponse, 
  AdminUser, 
  CreateUserRequest, 
  UpdateUserRequest,
  BulkOperationRequest,
  BulkOperationResult,
  UsersListResponse,
  UserAnalytics,
  SystemHealthResponse,
  UserFilters,
  Role
} from '../types'

export const adminApi = {
  // User Management
  async getUsers(filters: UserFilters = {}): Promise<ApiResponse<UsersListResponse>> {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString())
    if (filters.role) params.append('role', filters.role)
    if (filters.search) params.append('search', filters.search)
    if (filters.sort_by) params.append('sort_by', filters.sort_by)
    if (filters.sort_order) params.append('sort_order', filters.sort_order)
    
    const queryString = params.toString()
    const url = `/api/admin/users${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get(url)
    return {
      success: response.status === 200,
      data: response.data,
    }
  },

  async getUser(id: string): Promise<ApiResponse<AdminUser>> {
    const response = await apiClient.get(`/api/admin/users/${id}`)
    return {
      success: response.status === 200,
      data: response.data,
    }
  },

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<AdminUser>> {
    const response = await apiClient.post('/api/admin/users', userData)
    return {
      success: response.status === 201,
      data: response.data,
    }
  },

  async updateUser(id: string, userData: UpdateUserRequest): Promise<ApiResponse<AdminUser>> {
    const response = await apiClient.put(`/api/admin/users/${id}`, userData)
    return {
      success: response.status === 200,
      data: response.data,
    }
  },

  async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete(`/api/admin/users/${id}`)
    return {
      success: response.status === 200,
      data: response.data,
    }
  },

  async bulkUserOperation(operation: BulkOperationRequest): Promise<ApiResponse<BulkOperationResult>> {
    const response = await apiClient.post('/api/admin/users/bulk', operation)
    return {
      success: response.status === 200,
      data: response.data,
    }
  },

  // Analytics
  async getUserAnalytics(): Promise<ApiResponse<UserAnalytics>> {
    const response = await apiClient.get('/api/admin/analytics/users')
    return {
      success: response.status === 200,
      data: response.data,
    }
  },

  async getGridAnalytics(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/api/admin/analytics/grids')
    return {
      success: response.status === 200,
      data: response.data,
    }
  },

  // System
  async getSystemHealth(): Promise<ApiResponse<SystemHealthResponse>> {
    const response = await apiClient.get('/api/admin/system/ping')
    return {
      success: response.status === 200,
      data: response.data,
    }
  },

  // RBAC
  async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await apiClient.get('/api/auth/rbac/roles')
    return {
      success: response.status === 200,
      data: response.data,
    }
  },

  async createRole(roleData: { name: string; display_name: string; description?: string }): Promise<ApiResponse<Role>> {
    const response = await apiClient.post('/api/auth/rbac/roles', roleData)
    return {
      success: response.status === 201,
      data: response.data,
    }
  },

  async deleteRole(roleName: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete(`/api/auth/rbac/roles/${roleName}`)
    return {
      success: response.status === 200,
      data: response.data,
    }
  },

  async getUserRoles(userId: string): Promise<ApiResponse<Role[]>> {
    const response = await apiClient.get(`/api/auth/rbac/users/${userId}/roles`)
    return {
      success: response.status === 200,
      data: response.data,
    }
  },

  async assignUserRole(userId: string, roleName: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post(`/api/auth/rbac/users/${userId}/roles/${roleName}`)
    return {
      success: response.status === 200,
      data: response.data,
    }
  },

  async removeUserRole(userId: string, roleName: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete(`/api/auth/rbac/users/${userId}/roles/${roleName}`)
    return {
      success: response.status === 200,
      data: response.data,
    }
  },
}
