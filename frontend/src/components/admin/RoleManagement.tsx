import React, { useState, useEffect } from 'react'
import { adminApi } from '../../api/admin'
import { Role } from '../../types'
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../ui/Table'
import { Input } from '../ui/Form'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import LoadingSpinner from '../ui/LoadingSpinner'
import { toast } from 'react-hot-toast'

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Form data
  const [createForm, setCreateForm] = useState({
    name: '',
    display_name: '',
    description: ''
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getRoles()
      if (response.success && response.data) {
        // Ensure we always set an array
        setRoles(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      toast.error('Failed to fetch roles')
      console.error('Error fetching roles:', error)
      // Set empty array on error to maintain array type
      setRoles([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await adminApi.createRole(createForm)
      if (response.success) {
        toast.success('Role created successfully')
        setShowCreateModal(false)
        setCreateForm({
          name: '',
          display_name: '',
          description: ''
        })
        fetchRoles()
      }
    } catch (error) {
      toast.error('Failed to create role')
      console.error('Error creating role:', error)
    }
  }

  const handleDeleteRole = async (roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) return
    
    try {
      const response = await adminApi.deleteRole(roleName)
      if (response.success) {
        toast.success('Role deleted successfully')
        fetchRoles()
      }
    } catch (error) {
      toast.error('Failed to delete role')
      console.error('Error deleting role:', error)
    }
  }

  const getColorForRole = (roleName: string): 'success' | 'warning' | 'info' | 'neutral' => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'success'
      case 'editor':
        return 'warning'
      case 'user':
        return 'info'
      default:
        return 'neutral'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Role Management</h2>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Role
        </Button>
      </div>

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">ℹ️ Role Management</h3>
        <p className="text-sm text-blue-700">
          Roles define what actions users can perform in the system. The system comes with three built-in roles:
        </p>
        <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
          <li><strong>Admin:</strong> Full system access including user management</li>
          <li><strong>Editor:</strong> Can edit content but not manage users</li>
          <li><strong>User:</strong> Basic access to use the application</li>
        </ul>
      </div>

      {/* Roles table */}
      {loading ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Role Name</TableCell>
                <TableCell header>Display Name</TableCell>
                <TableCell header>Description</TableCell>
                <TableCell header>Type</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(roles) && roles.map((role) => {
                const isBuiltIn = ['admin', 'editor', 'user'].includes(role.name.toLowerCase())
                
                return (
                  <TableRow key={role.id}>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {role.name}
                      </code>
                    </TableCell>
                    <TableCell>{role.display_name}</TableCell>
                    <TableCell>
                      {role.description || (
                        <span className="text-gray-400 italic">No description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={isBuiltIn ? getColorForRole(role.name) : 'neutral'}
                        size="sm"
                      >
                        {isBuiltIn ? 'Built-in' : 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!isBuiltIn ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteRole(role.name)}
                        >
                          Delete
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Protected</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {roles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No roles found
            </div>
          )}
        </div>
      )}

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Role"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <Input
            label="Role Name"
            required
            placeholder="e.g., moderator"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            helper="Lowercase, no spaces. Used internally by the system."
          />
          <Input
            label="Display Name"
            required
            placeholder="e.g., Moderator"
            value={createForm.display_name}
            onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
            helper="Human-readable name shown in the interface."
          />
          <Input
            label="Description"
            placeholder="Brief description of this role's purpose"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
          />
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Note:</strong> After creating a role, you'll need to define permissions 
              for it in your application's policy configuration.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Role Permissions Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">🔐 Current Role Permissions</h3>
        <div className="space-y-3">
          {Array.isArray(roles) && roles.filter(role => ['admin', 'editor', 'user'].includes(role.name.toLowerCase())).map((role) => (
            <div key={role.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
              <Badge variant={getColorForRole(role.name)} size="sm">
                {role.display_name}
              </Badge>
              <div className="flex-1">
                <div className="text-sm text-gray-600">
                  {role.name === 'admin' && (
                    <>
                      • Full system access • User management • Role management • System configuration • Analytics
                    </>
                  )}
                  {role.name === 'editor' && (
                    <>
                      • Content editing • Grid management • AI features • Limited analytics
                    </>
                  )}
                  {role.name === 'user' && (
                    <>
                      • Basic application usage • Personal profile management • Grid usage
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-sm text-gray-500 italic">
          Permissions are configured in the backend policy files. Contact your system administrator to modify role permissions.
        </div>
      </div>
    </div>
  )
}

export default RoleManagement
