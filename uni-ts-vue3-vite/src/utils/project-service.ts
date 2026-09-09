import { request, safeRequest } from '@/utils/request'
import { ROLES, hasPermission } from '@/utils/permissions'
import { getCurrentUser, type SessionUser } from '@/utils/session'
import type {
  AddMembersResult,
  InvitableUserDto,
  ProjectDto,
  ProjectListItemDto,
  ProjectMemberDto,
} from '@/types/api'

export interface ProjectListItem {
  id: string
  name: string
  description: string
  ownerId: string
  ownerName: string
  status: string
  updatedAt: string
}

export interface ProjectDetail {
  id: string
  name: string
  description: string
  ownerId: string
  ownerName: string
  memberIds: string[]
  statusSummary: string
  updatedAtLabel: string
}

export interface ProjectMemberItem {
  id: string
  username: string
  displayName: string
  avatar: string
  role: string
  roleLabel: string
  isOwner: boolean
}

export interface InvitableUserItem {
  id: string
  username: string
  displayName: string
  avatar: string
  role: string
  roleLabel: string
}

export interface ProjectManagerOption {
  id: string
  displayName: string
  avatar: string
  username: string
}

const projectDtoToListItem = (project: ProjectDto): ProjectListItem => ({
  id: project.id,
  name: project.name,
  description: project.description || '',
  ownerId: project.ownerId,
  ownerName: project.ownerName,
  status: project.statusSummary || '暂无任务',
  updatedAt: project.updatedAtLabel || '刚刚',
})

const toListItem = (project: ProjectListItemDto): ProjectListItem => ({
  id: project.id,
  name: project.name,
  description: project.description || '',
  ownerId: project.ownerId,
  ownerName: project.ownerName,
  status: project.statusSummary || '暂无任务',
  updatedAt: project.updatedAt || '刚刚',
})

const toProjectDetail = (project: ProjectDto): ProjectDetail => ({
  id: project.id,
  name: project.name,
  description: project.description || '',
  ownerId: project.ownerId,
  ownerName: project.ownerName,
  memberIds: [...(project.memberIds || [])],
  statusSummary: project.statusSummary || '暂无任务',
  updatedAtLabel: project.updatedAtLabel || '刚刚',
})

export async function loadProjectsForCurrentUser(): Promise<ProjectListItem[]> {
  const projects = await request<ProjectListItemDto[]>('/projects')
  return projects.map(toListItem)
}

export async function getProjectManagers(): Promise<ProjectManagerOption[]> {
  const managers = await request<ProjectManagerOption[]>('/users/project-managers')
  return managers.map((user) => ({
    id: user.id,
    displayName: user.displayName,
    avatar: user.avatar,
    username: user.username,
  }))
}

export async function getProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  const result = await safeRequest<ProjectDto>(`/projects/${encodeURIComponent(projectId)}`, {
    redirectOn401: true,
  })
  if (!result.ok) return null
  return toProjectDetail(result.data)
}

export async function getProjectMembers(projectId: string): Promise<ProjectMemberItem[]> {
  const result = await safeRequest<ProjectMemberDto[]>(
    `/projects/${encodeURIComponent(projectId)}/members`,
  )
  if (!result.ok) return []
  return result.data as ProjectMemberItem[]
}

export async function getInvitableUsers(projectId: string): Promise<InvitableUserItem[]> {
  const result = await safeRequest<InvitableUserDto[]>(
    `/projects/${encodeURIComponent(projectId)}/invitable-users`,
  )
  if (!result.ok) return []
  return result.data as InvitableUserItem[]
}

export function canManageProject(user: SessionUser | null, project: ProjectDetail | null): boolean {
  if (!user || !project) return false
  if (user.role === ROLES.ADMIN) return true
  if (user.role === ROLES.PROJECT_MANAGER && project.memberIds.includes(user.id)) return true
  return false
}

export function canEditProjectSettings(
  user: SessionUser | null,
  project: ProjectDetail | null,
): boolean {
  if (!user || !project) return false
  if (user.role === ROLES.ADMIN) return true
  if (user.role === ROLES.PROJECT_MANAGER && project.ownerId === user.id) return true
  return false
}

export function canAdminCreateProject(user: SessionUser | null): boolean {
  return user?.role === ROLES.ADMIN
}

export async function createProject(payload: {
  name: string
  description: string
  ownerId: string
}) {
  const result = await safeRequest<ProjectDto>('/projects', {
    method: 'POST',
    data: payload,
  })
  if (!result.ok) {
    return { ok: false as const, message: result.message }
  }
  return { ok: true as const, project: projectDtoToListItem(result.data) }
}

export async function updateProjectSettings(
  projectId: string,
  payload: { name: string; description: string },
) {
  const result = await safeRequest<ProjectDto>(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    data: payload,
  })
  if (!result.ok) {
    return { ok: false as const, message: result.message }
  }
  return { ok: true as const, project: toProjectDetail(result.data) }
}

export async function addProjectMembers(projectId: string, userIds: string[]) {
  const result = await safeRequest<AddMembersResult>(
    `/projects/${encodeURIComponent(projectId)}/members`,
    {
      method: 'POST',
      data: { userIds },
    },
  )
  if (!result.ok) {
    return { ok: false as const, message: result.message }
  }
  return {
    ok: true as const,
    members: result.data.members as ProjectMemberItem[],
    project: toProjectDetail(result.data.project),
    message: `成功添加 ${result.data.members.length} 人`,
  }
}

export async function canCreateTaskInProject(userId: string, projectId: string): Promise<boolean> {
  const user = getCurrentUser()
  if (!user || user.id !== userId) return false
  if (!hasPermission(user.role, 'CREATE_TASK')) return false
  if (user.role === ROLES.ADMIN) return true

  const project = await getProjectDetail(projectId)
  if (!project) return false
  return project.memberIds.includes(userId)
}
