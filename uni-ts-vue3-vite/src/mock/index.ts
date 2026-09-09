// @ts-nocheck
/** 保留 Mock 导出供本地调试；业务代码请使用 utils 下的 service 层 */
export {
  ROLES,
  ROLE_LABELS,
  PERMISSIONS,
  hasPermission,
  PRIORITY,
  PRIORITY_LABELS,
} from '@/utils/permissions'

export {
  mockUsers,
  mockProjects,
  mockLogin,
  mockGetUsersByRole,
  mockGetProjectsForUser,
  mockGetProjectManagers,
  mockCreateProject,
  mockGetBoard,
  mockGetProject,
  mockGetProjectMembers,
  mockGetInvitableUsers,
  mockUpdateProject,
  mockAddProjectMember,
  mockAddProjectMembers,
  mockGetTask,
  mockCanEditTask,
  mockUpdateTask,
  mockCreateTask,
  mockDeleteTask,
  mockAddBoardColumn,
  mockDeleteBoardColumn,
} from '../../testNumber.js'
