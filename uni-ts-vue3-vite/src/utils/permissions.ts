/** 角色枚举 */
export const ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  TASK_EDITOR: 'task_editor',
} as const

export const ROLE_LABELS: Record<string, string> = {
  [ROLES.ADMIN]: '管理员',
  [ROLES.PROJECT_MANAGER]: '项目负责人',
  [ROLES.TASK_EDITOR]: '任务修改人',
}

export const PERMISSIONS = {
  MANAGE_USERS: [ROLES.ADMIN],
  VIEW_ALL_PROJECTS: [ROLES.ADMIN],
  CREATE_PROJECT: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  DELETE_PROJECT: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  EDIT_PROJECT_SETTINGS: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  MANAGE_PROJECT_MEMBERS: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  MANAGE_COLUMNS: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  CREATE_TASK: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.TASK_EDITOR],
  EDIT_ANY_TASK: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  EDIT_ASSIGNED_TASK: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.TASK_EDITOR],
  DELETE_TASK: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  DRAG_REORDER: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.TASK_EDITOR],
} as const

export type PermissionKey = keyof typeof PERMISSIONS

export function hasPermission(role: string, permissionKey: PermissionKey): boolean {
  const allowed = PERMISSIONS[permissionKey]
  return Array.isArray(allowed) && (allowed as readonly string[]).includes(role)
}

export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const

export const PRIORITY_LABELS: Record<string, string> = {
  [PRIORITY.HIGH]: '高',
  [PRIORITY.MEDIUM]: '中',
  [PRIORITY.LOW]: '低',
}
