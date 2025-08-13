import type { User } from '../lib/supabase'

// Basic types
export type Role = 'core_member' | 'agency_member'

export interface Permission {
  name: string
  description: string
  roles: Role[]
}

// Simplified permissions object
export const PERMISSIONS = {
  VIEW_DASHBOARD: {
    name: 'View Dashboard',
    description: 'Access to main dashboard',
    roles: ['core_member', 'agency_member'] as Role[]
  },
  VIEW_NOTICES: {
    name: 'View Notices',
    description: 'View announcements and notices',
    roles: ['core_member', 'agency_member'] as Role[]
  },
  VIEW_TODOS: {
    name: 'View Todos',
    description: 'View and manage tasks',
    roles: ['core_member', 'agency_member'] as Role[]
  },
  VIEW_GROUP_CHAT: {
    name: 'View Group Chat',
    description: 'Participate in group discussions',
    roles: ['core_member', 'agency_member'] as Role[]
  },
  VIEW_JOURNAL: {
    name: 'View Journal',
    description: 'Access to journal entries',
    roles: ['core_member'] as Role[]
  },
  VIEW_LOG_BOOK: {
    name: 'View Log Book',
    description: 'Access to system logs',
    roles: ['core_member'] as Role[]
  },
  VIEW_GROUP_ACCOUNTING: {
    name: 'View Group Accounting',
    description: 'Manage group finances',
    roles: ['core_member'] as Role[]
  },
  VIEW_AGENCY_CHAT: {
    name: 'View Agency Chat',
    description: 'Participate in agency discussions',
    roles: ['core_member', 'agency_member'] as Role[]
  },
  VIEW_AGENCY_ACCOUNTING: {
    name: 'View Agency Accounting',
    description: 'Manage agency finances',
    roles: ['core_member', 'agency_member'] as Role[]
  },
  EDIT_PROFILE: {
    name: 'Edit Profile',
    description: 'Update personal information',
    roles: ['core_member', 'agency_member'] as Role[]
  }
} as const

// Export the permission name type
export type PermissionName = keyof typeof PERMISSIONS

// Core functions
export function hasPermission(user: User | null, permission: PermissionName): boolean {
  if (!user) return false
  const permissionConfig = PERMISSIONS[permission]
  return permissionConfig.roles.includes(user.role)
}

export function hasAnyPermission(user: User | null, permissions: PermissionName[]): boolean {
  return permissions.some(permission => hasPermission(user, permission))
}

export function hasAllPermissions(user: User | null, permissions: PermissionName[]): boolean {
  return permissions.every(permission => hasPermission(user, permission))
}

export function getPermissionsForRole(role: Role): Permission[] {
  return Object.values(PERMISSIONS).filter(permission => 
    permission.roles.includes(role)
  )
}

export function getUserPermissions(user: User | null): Permission[] {
  if (!user) return []
  return getPermissionsForRole(user.role)
}

export function canAccessRoute(user: User | null, route: string): boolean {
  if (!user) return false

  if (['dashboard', 'profile', 'notices', 'todos', 'group-chat'].includes(route)) {
    return true
  }

  if (['journal', 'log-book', 'group-accounting'].includes(route)) {
    return user.role === 'core_member'
  }

  if (['agency-chat', 'agency-accounting'].includes(route)) {
    return true
  }

  return false
}

export function getRoleDisplayName(role: Role): string {
  switch (role) {
    case 'core_member':
      return 'Core Member'
    case 'agency_member':
      return 'Agency Member'
    default:
      return role
  }
}

export function getRoleDescription(role: Role): string {
  switch (role) {
    case 'core_member':
      return 'Full access to all features including journal, log book, and accounting'
    case 'agency_member':
      return 'Access to agency-specific features and basic group features'
    default:
      return 'Limited access to basic features'
  }
}

export function getRoleColor(role: Role): string {
  switch (role) {
    case 'core_member':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'agency_member':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}
