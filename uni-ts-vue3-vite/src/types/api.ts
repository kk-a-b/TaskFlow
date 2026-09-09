import type { SessionUser } from '@/utils/session'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface LoginResult {
  user: SessionUser
  token: string
}

export interface ProjectListItemDto {
  id: string
  name: string
  description: string
  ownerId: string
  ownerName: string
  statusSummary: string
  updatedAt: string
}

export interface ProjectDto {
  id: string
  name: string
  description: string
  ownerId: string
  ownerName: string
  memberIds: string[]
  statusSummary: string
  updatedAt: string
  updatedAtLabel: string
  createdAt: string
}

export interface ProjectMemberDto {
  id: string
  username: string
  displayName: string
  avatar: string
  role: string
  roleLabel: string
  isOwner: boolean
}

export interface InvitableUserDto {
  id: string
  username: string
  displayName: string
  avatar: string
  role: string
  roleLabel: string
}

export interface BoardTaskDto {
  id: string
  name: string
  done: boolean
  priority?: string
  assigneeId?: string | null
  assigneeName?: string
  deadline?: string
  status?: string
  sort?: number
  createdAt?: string
  updatedAt?: string
}

export interface BoardColumnDto {
  id: string
  title: string
  sort: number
  tasks: BoardTaskDto[]
}

export interface BoardDto {
  projectId: string
  columns: BoardColumnDto[]
}

export interface TaskDetailDto {
  id: string
  name: string
  description: string
  done: boolean
  assigneeId: string | null
  assigneeName: string
  priority: string
  deadline: string
  status: string
  sort?: number
  columnId: string
  columnTitle: string
  projectId: string
  createdAt?: string
  updatedAt?: string
}

export interface TaskMutationResult {
  task: TaskDetailDto
  project: { id: string; name: string }
}

export interface BoardReorderPayload {
  columns?: Array<{ id: string; sort: number }>
  tasks?: Array<{
    id: string
    columnId: string
    sort: number
    status?: string
    done?: boolean
  }>
}

export interface AddMembersResult {
  members: ProjectMemberDto[]
  project: ProjectDto
}
