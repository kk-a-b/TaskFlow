import { safeRequest } from '@/utils/request'
import { PRIORITY, PRIORITY_LABELS, ROLES, hasPermission } from '@/utils/permissions'
import { getCurrentUser } from '@/utils/session'
import { canCreateTaskInProject, getProjectMembers } from '@/utils/project-service'
import type { TaskDetailDto, TaskMutationResult } from '@/types/api'

export type TaskPriority = typeof PRIORITY.HIGH | typeof PRIORITY.MEDIUM | typeof PRIORITY.LOW

export interface TaskDetail {
  id: string
  name: string
  description: string
  done: boolean
  assigneeId: string | null
  assigneeName: string
  priority: TaskPriority
  deadline: string
  status: string
  columnId: string
  columnTitle: string
  projectId: string
}

export interface TaskAssigneeOption {
  id: string
  label: string
}

export const TASK_STATUS_OPTIONS = ['待办', '进行中', '已完成'] as const

export const TASK_PRIORITY_OPTIONS = [
  { value: PRIORITY.HIGH as TaskPriority, label: PRIORITY_LABELS[PRIORITY.HIGH] },
  { value: PRIORITY.MEDIUM as TaskPriority, label: PRIORITY_LABELS[PRIORITY.MEDIUM] },
  { value: PRIORITY.LOW as TaskPriority, label: PRIORITY_LABELS[PRIORITY.LOW] },
]

const normalizePriority = (priority?: string): TaskPriority => {
  if (priority === PRIORITY.HIGH || priority === PRIORITY.MEDIUM || priority === PRIORITY.LOW) {
    return priority
  }
  return PRIORITY.MEDIUM
}

const toTaskDetail = (task: TaskDetailDto): TaskDetail => ({
  id: task.id,
  name: task.name,
  description: task.description || '',
  done: !!task.done,
  assigneeId: task.assigneeId ?? null,
  assigneeName: task.assigneeName || '未指派',
  priority: normalizePriority(task.priority),
  deadline: task.deadline || '',
  status: task.status || '待办',
  columnId: task.columnId,
  columnTitle: task.columnTitle,
  projectId: task.projectId,
})

export async function getTaskDetail(taskId: string): Promise<{
  task: TaskDetail
  projectName: string
} | null> {
  const result = await safeRequest<TaskMutationResult>(`/tasks/${encodeURIComponent(taskId)}`)
  if (!result.ok || !result.data?.task) return null
  return {
    task: toTaskDetail(result.data.task),
    projectName: result.data.project?.name || '项目',
  }
}

export async function getTaskAssigneeOptions(projectId: string): Promise<TaskAssigneeOption[]> {
  const normalizedProjectId = String(projectId || '').trim()
  if (!normalizedProjectId) {
    return [{ id: '', label: '未指派' }]
  }

  const members = await getProjectMembers(normalizedProjectId)
  if (!members.length) {
    return [{ id: '', label: '未指派' }]
  }
  return [
    { id: '', label: '未指派' },
    ...members.map((member) => ({
      id: member.id,
      label: member.displayName,
    })),
  ]
}

export async function canEditTask(_userId: string, taskId: string): Promise<boolean> {
  const result = await safeRequest<{ editable: boolean }>(
    `/tasks/${encodeURIComponent(taskId)}/editable`,
  )
  if (!result.ok) return false
  return !!result.data.editable
}

export async function canCreateTask(userId: string, projectId: string): Promise<boolean> {
  return canCreateTaskInProject(userId, projectId)
}

export async function updateTask(
  taskId: string,
  payload: {
    name: string
    description: string
    assigneeId: string | null
    priority: TaskPriority
    deadline: string
    status: string
  },
) {
  const result = await safeRequest<TaskMutationResult>(`/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PUT',
    data: {
      name: payload.name,
      description: payload.description,
      assigneeId: payload.assigneeId,
      priority: payload.priority,
      deadline: payload.deadline,
      status: payload.status,
    },
  })
  if (!result.ok) {
    return { ok: false as const, message: result.message }
  }
  return {
    ok: true as const,
    task: toTaskDetail(result.data.task),
    message: '保存成功',
  }
}

export async function createTask(
  projectId: string,
  payload: {
    name: string
    description: string
    assigneeId: string | null
    priority: TaskPriority
    deadline: string
    status: string
    columnId?: string
  },
) {
  const normalizedProjectId = String(projectId || '').trim()
  if (!normalizedProjectId) {
    return { ok: false as const, message: '缺少项目信息' }
  }

  const result = await safeRequest<TaskMutationResult>(
    `/projects/${encodeURIComponent(normalizedProjectId)}/tasks`,
    {
      method: 'POST',
      data: {
        name: payload.name,
        description: payload.description,
        assigneeId: payload.assigneeId,
        priority: payload.priority,
        deadline: payload.deadline,
        status: payload.status,
        columnId: payload.columnId,
      },
    },
  )
  if (!result.ok) {
    return { ok: false as const, message: result.message }
  }
  return {
    ok: true as const,
    task: toTaskDetail(result.data.task),
    message: '创建成功',
  }
}

export async function deleteTask(taskId: string) {
  const result = await safeRequest<{ taskId: string }>(`/tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
  })
  if (!result.ok) {
    return { ok: false as const, message: result.message }
  }
  return { ok: true as const, message: '删除成功' }
}

export function canDeleteTask(user: { role: string } | null): boolean {
  if (!user) return false
  return hasPermission(user.role, 'DELETE_TASK')
}

export { PRIORITY, PRIORITY_LABELS, ROLES, hasPermission }
