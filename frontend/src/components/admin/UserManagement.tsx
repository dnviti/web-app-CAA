import React, { useState, useEffect } from 'react'
import { adminApi } from '../../api/admin'
import { AdminUser, UserFilters, CreateUserRequest, UpdateUserRequest, Role } from '../../types'
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../ui/Table'
import { Input, Select } from '../ui/Form'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import LoadingSpinner from '../ui/LoadingSpinner'
import { toast } from 'react-hot-toast'

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filters
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  // Form data
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    username: '',
    email: '',
    password: '',
    name: '',
    roles: [],
    is_active: true
  })
  
  const [updateForm, setUpdateForm] = useState<UpdateUserRequest>({
    email: '',
    name: '',
    roles: [],
    is_active: true
  })

  const [bulkOperation, setBulkOperation] = useState({
    operation: 'activate' as 'delete' | 'activate' | 'deactivate' | 'assign_role' | 'remove_role',
    role_name: ''
  })

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getUsers(filters)
      if (response.success && response.data) {
        // Ensure we always set an array for users
        setUsers(Array.isArray(response.data.users) ? response.data.users : [])
        setTotalPages(response.data.total_pages)
        setCurrentPage(response.data.current_page)
        setTotalCount(response.data.total_count)
      }
    } catch (error) {
      toast.error('Failed to fetch users')
      console.error('Error fetching users:', error)
      // Set empty array on error to maintain array type
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await adminApi.getRoles()
      if (response.success && response.data) {
        // Ensure we always set an array
        setRoles(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      // Set empty array on error to maintain array type
      setRoles([])
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await adminApi.createUser(createForm)
      if (response.success) {
        toast.success('User created successfully')
        setShowCreateModal(false)
        setCreateForm({
          username: '',
          email: '',
          password: '',
          name: '',
          roles: [],
          is_active: true
        })
        fetchUsers()
      }
    } catch (error) {
      toast.error('Failed to create user')
      console.error('Error creating user:', error)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    
    try {
      const response = await adminApi.updateUser(selectedUser.id, updateForm)
      if (response.success) {
        toast.success('User updated successfully')
        setShowEditModal(false)
        setSelectedUser(null)
        fetchUsers()
      }
    } catch (error) {
      toast.error('Failed to update user')
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const response = await adminApi.deleteUser(userId)
      if (response.success) {
        toast.success('User deleted successfully')
        fetchUsers()
      }
    } catch (error) {
      toast.error('Failed to delete user')
      console.error('Error deleting user:', error)
    }
  }

  const handleBulkOperation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUsers.size === 0) return
    
    try {
      const response = await adminApi.bulkUserOperation({
        operation: bulkOperation.operation,
        user_ids: Array.from(selectedUsers),
        role_name: bulkOperation.role_name || undefined
      })
      
      if (response.success && response.data) {
        toast.success(`Bulk operation completed: ${response.data.success_count}/${response.data.processed_count} successful`)
        setShowBulkModal(false)
        setSelectedUsers(new Set())
        fetchUsers()
      }
    } catch (error) {
      toast.error('Bulk operation failed')
      console.error('Error in bulk operation:', error)
    }
  }

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user)
    setUpdateForm({
      email: user.email,
      name: user.name,
      roles: Array.isArray(user.roles) ? user.roles.map(r => r.name) : [],
      is_active: user.is_active
    })
    setShowEditModal(true)
  }

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUsers(newSelection)
  }

  const selectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(Array.isArray(users) ? users.map(u => u.id) : []))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>
        <div className="flex space-x-2">
          {selectedUsers.size > 0 && (
            <Button
              variant="secondary"
              onClick={() => setShowBulkModal(true)}
            >
              Bulk Actions ({selectedUsers.size})
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Create User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search users..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' }
            ]}
            value={filters.is_active?.toString() || ''}
            onChange={(e) => setFilters({ 
              ...filters, 
              is_active: e.target.value ? e.target.value === 'true' : undefined,
              page: 1 
            })}
          />
          <Select
            options={[
              { value: '', label: 'All Roles' },
              ...(Array.isArray(roles) ? roles.map(r => ({ value: r.name, label: r.display_name })) : [])
            ]}
            value={filters.role || ''}
            onChange={(e) => setFilters({ ...filters, role: e.target.value || undefined, page: 1 })}
          />
          <Select
            options={[
              { value: 'created_at', label: 'Created Date' },
              { value: 'username', label: 'Username' },
              { value: 'email', label: 'Email' },
              { value: 'name', label: 'Name' }
            ]}
            value={filters.sort_by || 'created_at'}
            onChange={(e) => setFilters({ ...filters, sort_by: e.target.value as any })}
          />
        </div>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onChange={selectAllUsers}
                    className="rounded border-gray-300"
                  />
                </TableCell>
                <TableCell header>Username</TableCell>
                <TableCell header>Email</TableCell>
                <TableCell header>Name</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Roles</TableCell>
                <TableCell header>Created</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(users) && users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'success' : 'warning'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(user.roles) && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role.id} variant="info" size="sm">
                            {role.display_name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {users.length} of {totalCount} users
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setFilters({ ...filters, page: currentPage - 1 })}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setFilters({ ...filters, page: currentPage + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Username"
            required
            value={createForm.username}
            onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
          />
          <Input
            label="Full Name"
            required
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            required
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles
            </label>
            {Array.isArray(roles) && roles.map((role) => (
              <label key={role.id} className="flex items-center space-x-2 mb-1">
                <input
                  type="checkbox"
                  checked={createForm.roles?.includes(role.name) || false}
                  onChange={(e) => {
                    const newRoles = createForm.roles || []
                    if (e.target.checked) {
                      setCreateForm({ 
                        ...createForm, 
                        roles: [...newRoles, role.name] 
                      })
                    } else {
                      setCreateForm({ 
                        ...createForm, 
                        roles: newRoles.filter(r => r !== role.name) 
                      })
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span>{role.display_name}</span>
              </label>
            ))}
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={createForm.is_active}
              onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span>Active</span>
          </label>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit User: ${selectedUser?.username}`}
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={updateForm.email}
            onChange={(e) => setUpdateForm({ ...updateForm, email: e.target.value })}
          />
          <Input
            label="Full Name"
            required
            value={updateForm.name}
            onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles
            </label>
            {Array.isArray(roles) && roles.map((role) => (
              <label key={role.id} className="flex items-center space-x-2 mb-1">
                <input
                  type="checkbox"
                  checked={updateForm.roles?.includes(role.name) || false}
                  onChange={(e) => {
                    const newRoles = updateForm.roles || []
                    if (e.target.checked) {
                      setUpdateForm({ 
                        ...updateForm, 
                        roles: [...newRoles, role.name] 
                      })
                    } else {
                      setUpdateForm({ 
                        ...updateForm, 
                        roles: newRoles.filter(r => r !== role.name) 
                      })
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span>{role.display_name}</span>
              </label>
            ))}
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={updateForm.is_active}
              onChange={(e) => setUpdateForm({ ...updateForm, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span>Active</span>
          </label>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Update User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Operations Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={`Bulk Operation (${selectedUsers.size} users)`}
      >
        <form onSubmit={handleBulkOperation} className="space-y-4">
          <Select
            label="Operation"
            required
            options={[
              { value: 'activate', label: 'Activate Users' },
              { value: 'deactivate', label: 'Deactivate Users' },
              { value: 'assign_role', label: 'Assign Role' },
              { value: 'remove_role', label: 'Remove Role' },
              { value: 'delete', label: 'Delete Users' }
            ]}
            value={bulkOperation.operation}
            onChange={(e) => setBulkOperation({ 
              ...bulkOperation, 
              operation: e.target.value as any 
            })}
          />
          
          {(bulkOperation.operation === 'assign_role' || bulkOperation.operation === 'remove_role') && (
            <Select
              label="Role"
              required
              options={[
                { value: '', label: 'Select Role' },
                ...(Array.isArray(roles) ? roles.map(r => ({ value: r.name, label: r.display_name })) : [])
              ]}
              value={bulkOperation.role_name}
              onChange={(e) => setBulkOperation({ 
                ...bulkOperation, 
                role_name: e.target.value 
              })}
            />
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowBulkModal(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant={bulkOperation.operation === 'delete' ? 'danger' : 'primary'}
            >
              Apply Operation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default UserManagement
