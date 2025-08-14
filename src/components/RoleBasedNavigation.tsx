import { useAuthStore } from '../stores/authStore'
import { getUserPermissions, getRoleDisplayName, getRoleColor } from '../utils/rbac'

export const RoleBasedNavigation = () => {
  const { user, loading, initialized } = useAuthStore()
  
  // Don't render anything while loading or if user is not available
  if (!initialized || loading || !user) {
    return null
  }
  
  let permissions = []
  try {
    permissions = getUserPermissions(user)
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return null
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Access Level</h3>
      
      <div className="flex items-center space-x-3 mb-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
          {getRoleDisplayName(user.role)}
        </span>
        <span className="text-sm text-gray-600">• {permissions.length} permissions</span>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">You have access to:</p>
        <ul className="text-sm text-gray-700 space-y-1">
          {permissions.map((permission) => (
            <li key={permission.name} className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>{permission.name}</span>
              <span className="text-gray-500">- {permission.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default RoleBasedNavigation
