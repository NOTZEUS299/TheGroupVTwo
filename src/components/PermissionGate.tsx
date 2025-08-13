import { ReactNode } from 'react'
import { useAuthStore } from '../stores/authStore'
import { hasPermission } from '../utils/rbac'
import type { PermissionName } from '../utils/rbac'

interface PermissionGateProps {
  permission: PermissionName
  children: ReactNode
  fallback?: ReactNode
}

export const PermissionGate = ({ permission, children, fallback = null }: PermissionGateProps) => {
  const { user } = useAuthStore()
  
  if (hasPermission(user, permission)) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}

interface RoleGateProps {
  roles: string[]
  children: ReactNode
  fallback?: ReactNode
}

export const RoleGate = ({ roles, children, fallback = null }: RoleGateProps) => {
  const { user } = useAuthStore()
  
  if (user && roles.includes(user.role)) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}

export default PermissionGate
