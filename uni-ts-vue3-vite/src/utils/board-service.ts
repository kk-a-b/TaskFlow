import { request, safeRequest } from '@/utils/request'
import { ROLES, hasPermission } from '@/utils/permissions'
import type { BoardDto, BoardReorderPayload } from '@/types/api'
import type { ProjectDetail } from '@/utils/project-service'
import type { SessionUser } from '@/utils/session'

export type BoardTaskPriority = 'high' | 'medium' | 'low'

export interface BoardTaskItem {
  id: string
  name: string
  done: boolean
  priority: BoardTaskPriority
}

export interface BoardColumnItem {
  id: string
  title: string
  tasks: BoardTaskItem[]
}

const EMPTY_BOARD_COLUMNS: BoardColumnItem[] = [
  { id: 'todo', title: '待办', tasks: [] },
  { id: 'doing', title: '进行中', tasks: [] },
  { id: 'done', title: '已完成', tasks: [] },
]

const normalizePriority = (priority?: string): BoardTaskPriority => {
  if (priority === 'high' || priority === 'medium' || priority === 'low') return priority
  return 'medium'
}

const mapBoardColumns = (columns: BoardDto['columns']): BoardColumnItem[] =>
  columns.map((column) => ({
    id: column.id,
    title: column.title,
    tasks: (column.tasks || []).map((task) => ({
      id: task.id,
      name: task.name,
      done: !!task.done,
      priority: normalizePriority(task.priority),
    })),
  }))

export async function loadBoardForProject(projectId: string): Promise<BoardColumnItem[]> {
  const result = await safeRequest<BoardDto>(`/projects/${encodeURIComponent(projectId)}/board`)
  if (!result.ok || !result.data?.columns) {
    return EMPTY_BOARD_COLUMNS.map((column) => ({
      ...column,
      tasks: [],
    }))
  }
  return mapBoardColumns(result.data.columns)
}

export function canManageBoardColumns(
  user: SessionUser | null,
  project: ProjectDetail | null,
): boolean {
  if (!user || !project) return false
  if (user.role === ROLES.ADMIN) return true
  if (!hasPermission(user.role, 'MANAGE_COLUMNS')) return false
  return project.memberIds.includes(user.id)
}

export async function addBoardColumn(projectId: string, title: string) {
  const result = await safeRequest<BoardDto>(
    `/projects/${encodeURIComponent(projectId)}/board/columns`,
    {
      method: 'POST',
      data: { title },
    },
  )
  if (!result.ok) {
    return { ok: false as const, message: result.message }
  }
  return {
    ok: true as const,
    columns: mapBoardColumns(result.data.columns),
    message: '添加成功',
  }
}

export async function deleteBoardColumn(projectId: string, columnId: string) {
  const result = await safeRequest<BoardDto>(
    `/projects/${encodeURIComponent(projectId)}/board/columns/${encodeURIComponent(columnId)}`,
    { method: 'DELETE' },
  )
  if (!result.ok) {
    return { ok: false as const, message: result.message }
  }
  return {
    ok: true as const,
    columns: mapBoardColumns(result.data.columns),
    message: '删除成功',
  }
}

export async function reorderBoard(projectId: string, payload: BoardReorderPayload) {
  const result = await safeRequest<BoardDto>(
    `/projects/${encodeURIComponent(projectId)}/board/reorder`,
    {
      method: 'PUT',
      data: payload,
    },
  )
  if (!result.ok) {
    return { ok: false as const, message: result.message }
  }
  return {
    ok: true as const,
    columns: mapBoardColumns(result.data.columns),
    message: '排序已保存',
  }
}

export function buildBoardReorderPayload(
  columns: BoardColumnItem[],
  isDoneColumn: (column: BoardColumnItem) => boolean,
): BoardReorderPayload {
  return {
    columns: columns.map((column, index) => ({ id: column.id, sort: index })),
    tasks: columns.flatMap((column) =>
      column.tasks.map((task, index) => ({
        id: task.id,
        columnId: column.id,
        sort: index,
        status: column.title,
        done: isDoneColumn(column),
      })),
    ),
  }
}

/** 重命名列（API 已实现，供后续 UI 扩展） */
export async function renameBoardColumn(projectId: string, columnId: string, title: string) {
  const result = await safeRequest<BoardDto>(
    `/projects/${encodeURIComponent(projectId)}/board/columns/${encodeURIComponent(columnId)}`,
    {
      method: 'PUT',
      data: { title },
    },
  )
  if (!result.ok) {
    return { ok: false as const, message: result.message }
  }
  return {
    ok: true as const,
    columns: mapBoardColumns(result.data.columns),
    message: '保存成功',
  }
}
