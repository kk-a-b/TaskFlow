/**
 * 虚拟后端 Mock 数据
 * 用于前后端联调前的本地传参、接口模拟
 *
 * 角色权限（依次递减）：
 *   admin            管理员 — 全站权限
 *   project_manager  项目负责人 — 所属项目及任务管理
 *   task_editor      任务修改人 — 仅可修改被指派的任务
 */

/** 角色枚举 */
export const ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  TASK_EDITOR: 'task_editor',
}

/** 角色中文名 */
export const ROLE_LABELS = {
  [ROLES.ADMIN]: '管理员',
  [ROLES.PROJECT_MANAGER]: '项目负责人',
  [ROLES.TASK_EDITOR]: '任务修改人',
}

/**
 * 权限点定义
 * 数组内为拥有该权限的角色，顺序不代表优先级
 */
export const PERMISSIONS = {
  /** 用户管理 */
  MANAGE_USERS: [ROLES.ADMIN],
  /** 查看所有项目 */
  VIEW_ALL_PROJECTS: [ROLES.ADMIN],
  /** 创建项目 */
  CREATE_PROJECT: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  /** 删除项目 */
  DELETE_PROJECT: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  /** 编辑项目设置 */
  EDIT_PROJECT_SETTINGS: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  /** 邀请 / 管理项目成员 */
  MANAGE_PROJECT_MEMBERS: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  /** 管理看板列表（增删改列） */
  MANAGE_COLUMNS: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  /** 创建任务 */
  CREATE_TASK: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.TASK_EDITOR],
  /** 编辑任意任务 */
  EDIT_ANY_TASK: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  /** 编辑自己被指派的任务 */
  EDIT_ASSIGNED_TASK: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.TASK_EDITOR],
  /** 删除任务 */
  DELETE_TASK: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  /** 拖拽排序（列表 / 任务） */
  DRAG_REORDER: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.TASK_EDITOR],
}

/** 判断角色是否拥有某权限 */
export function hasPermission(role, permissionKey) {
  const allowed = PERMISSIONS[permissionKey]
  return Array.isArray(allowed) && allowed.includes(role)
}

// ─── 用户数据 ───────────────────────────────────────────────

export const mockUsers = [
  {
    id: 'u-001',
    username: 'admin',
    password: '123456',
    displayName: '系统管理员',
    avatar: 'A',
    role: ROLES.ADMIN,
    email: 'admin@example.com',
    createdAt: '2026-01-01T08:00:00+08:00',
  },
  {
    id: 'u-002',
    username: 'zhangpm',
    password: '123456',
    displayName: '张经理',
    avatar: '张',
    role: ROLES.PROJECT_MANAGER,
    email: 'zhangpm@example.com',
    createdAt: '2026-02-10T09:00:00+08:00',
  },
  {
    id: 'u-003',
    username: 'lisi',
    password: '123456',
    displayName: '李四',
    avatar: '李',
    role: ROLES.PROJECT_MANAGER,
    email: 'lisi@example.com',
    createdAt: '2026-02-15T10:00:00+08:00',
  },
  {
    id: 'u-004',
    username: 'wangwu',
    password: '123456',
    displayName: '王五',
    avatar: '王',
    role: ROLES.TASK_EDITOR,
    email: 'wangwu@example.com',
    createdAt: '2026-03-01T11:00:00+08:00',
  },
  {
    id: 'u-005',
    username: 'zhaoliu',
    password: '123456',
    displayName: '赵六',
    avatar: '赵',
    role: ROLES.TASK_EDITOR,
    email: 'zhaoliu@example.com',
    createdAt: '2026-03-05T14:00:00+08:00',
  },
  {
    id: 'u-006',
    username: 'sunqi',
    password: '123456',
    displayName: '孙七',
    avatar: '孙',
    role: ROLES.TASK_EDITOR,
    email: 'sunqi@example.com',
    createdAt: '2026-03-08T16:00:00+08:00',
  },
]

// ─── 项目数据 ───────────────────────────────────────────────

export const mockProjects = [
  {
    id: 'p-001',
    name: '项目A',
    description: '核心产品迭代看板，包含需求开发与缺陷修复。',
    ownerId: 'u-002',
    memberIds: ['u-002', 'u-004', 'u-005'],
    statusSummary: '3个任务进行中',
    updatedAt: '2026-09-07T10:30:00+08:00',
    updatedAtLabel: '今天',
    createdAt: '2026-06-01T09:00:00+08:00',
  },
  {
    id: 'p-002',
    name: '项目B',
    description: '运营活动专项，短期冲刺交付。',
    ownerId: 'u-003',
    memberIds: ['u-003', 'u-005', 'u-006'],
    statusSummary: '已完成 5个',
    updatedAt: '2026-09-06T18:00:00+08:00',
    updatedAtLabel: '昨天',
    createdAt: '2026-07-12T14:00:00+08:00',
  },
  {
    id: 'p-003',
    name: '项目C',
    description: '技术债务清理与性能优化跟踪。',
    ownerId: 'u-002',
    memberIds: ['u-002', 'u-004', 'u-006'],
    statusSummary: '待办 8个',
    updatedAt: '2026-09-05T12:00:00+08:00',
    updatedAtLabel: '前天',
    createdAt: '2026-08-01T10:00:00+08:00',
  },
]

// ─── 任务数据 ───────────────────────────────────────────────

/** 优先级 */
export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

export const PRIORITY_LABELS = {
  [PRIORITY.HIGH]: '高',
  [PRIORITY.MEDIUM]: '中',
  [PRIORITY.LOW]: '低',
}

/**
 * 看板列 + 任务（与 board.vue 结构对齐）
 * column.id: todo | doing | done
 */
export const mockBoardByProject = {
  'p-001': {
    projectId: 'p-001',
    columns: [
      {
        id: 'todo',
        title: '待办',
        sort: 0,
        tasks: [
          {
            id: 't-001',
            name: '任务1',
            description: '梳理登录模块交互细节，补充异常态提示文案。',
            done: false,
            assigneeId: 'u-004',
            assigneeName: '王五',
            priority: PRIORITY.HIGH,
            deadline: '2026-09-10',
            status: '待办',
            sort: 0,
            createdAt: '2026-09-01T09:00:00+08:00',
            updatedAt: '2026-09-05T11:20:00+08:00',
          },
          {
            id: 't-002',
            name: '任务2',
            description: '看板页拖拽交互优化，兼容 PC 与移动端。',
            done: false,
            assigneeId: 'u-005',
            assigneeName: '赵六',
            priority: PRIORITY.MEDIUM,
            deadline: '2026-09-15',
            status: '待办',
            sort: 1,
            createdAt: '2026-09-02T10:00:00+08:00',
            updatedAt: '2026-09-06T15:40:00+08:00',
          },
          {
            id: 't-003',
            name: '任务3',
            description: '编写任务详情页 UI 规范说明文档。',
            done: false,
            assigneeId: 'u-004',
            assigneeName: '王五',
            priority: PRIORITY.LOW,
            deadline: '2026-09-20',
            status: '待办',
            sort: 2,
            createdAt: '2026-09-03T14:00:00+08:00',
            updatedAt: '2026-09-03T14:00:00+08:00',
          },
        ],
      },
      {
        id: 'doing',
        title: '进行中',
        sort: 1,
        tasks: [
          {
            id: 't-004',
            name: '任务4',
            description: '对接虚拟 Mock 数据层，预留 REST 接口字段。',
            done: false,
            assigneeId: 'u-005',
            assigneeName: '赵六',
            priority: PRIORITY.HIGH,
            deadline: '2026-09-12',
            status: '进行中',
            sort: 0,
            createdAt: '2026-08-28T09:30:00+08:00',
            updatedAt: '2026-09-07T09:10:00+08:00',
          },
          {
            id: 't-005',
            name: '任务5',
            description: '项目列表页响应式布局微调。',
            done: false,
            assigneeId: 'u-004',
            assigneeName: '王五',
            priority: PRIORITY.MEDIUM,
            deadline: '2026-09-18',
            status: '进行中',
            sort: 1,
            createdAt: '2026-08-30T16:00:00+08:00',
            updatedAt: '2026-09-06T20:00:00+08:00',
          },
        ],
      },
      {
        id: 'done',
        title: '已完成',
        sort: 2,
        tasks: [
          {
            id: 't-006',
            name: '任务6',
            description: '完成玻璃拟态登录页与注册页静态 UI。',
            done: true,
            assigneeId: 'u-004',
            assigneeName: '王五',
            priority: PRIORITY.MEDIUM,
            deadline: '2026-08-25',
            status: '已完成',
            sort: 0,
            createdAt: '2026-08-10T08:00:00+08:00',
            updatedAt: '2026-08-25T17:30:00+08:00',
          },
          {
            id: 't-007',
            name: '任务7',
            description: '搭建 uni-app + Vue3 工程骨架。',
            done: true,
            assigneeId: 'u-002',
            assigneeName: '张经理',
            priority: PRIORITY.HIGH,
            deadline: '2026-08-20',
            status: '已完成',
            sort: 1,
            createdAt: '2026-08-01T09:00:00+08:00',
            updatedAt: '2026-08-20T12:00:00+08:00',
          },
          {
            id: 't-008',
            name: '任务8',
            description: '确定看板三列默认命名与任务字段模型。',
            done: true,
            assigneeId: 'u-005',
            assigneeName: '赵六',
            priority: PRIORITY.LOW,
            deadline: '2026-08-22',
            status: '已完成',
            sort: 2,
            createdAt: '2026-08-05T11:00:00+08:00',
            updatedAt: '2026-08-22T10:00:00+08:00',
          },
        ],
      },
    ],
  },
  'p-002': {
    projectId: 'p-002',
    columns: [
      {
        id: 'todo',
        title: '待办',
        sort: 0,
        tasks: [
          {
            id: 't-101',
            name: '设计活动主视觉',
            description: '输出 Banner 与落地页首屏稿。',
            done: false,
            assigneeId: 'u-006',
            assigneeName: '孙七',
            priority: PRIORITY.HIGH,
            deadline: '2026-09-08',
            status: '待办',
            sort: 0,
            createdAt: '2026-09-04T09:00:00+08:00',
            updatedAt: '2026-09-04T09:00:00+08:00',
          },
        ],
      },
      {
        id: 'doing',
        title: '进行中',
        sort: 1,
        tasks: [],
      },
      {
        id: 'done',
        title: '已完成',
        sort: 2,
        tasks: [
          {
            id: 't-102',
            name: '活动规则文案',
            description: '法务审核已通过。',
            done: true,
            assigneeId: 'u-003',
            assigneeName: '李四',
            priority: PRIORITY.MEDIUM,
            deadline: '2026-09-01',
            status: '已完成',
            sort: 0,
            createdAt: '2026-08-20T10:00:00+08:00',
            updatedAt: '2026-09-01T16:00:00+08:00',
          },
        ],
      },
    ],
  },
  'p-003': {
    projectId: 'p-003',
    columns: [
      {
        id: 'todo',
        title: '待办',
        sort: 0,
        tasks: [
          {
            id: 't-201',
            name: '首页首屏加载优化',
            description: '目标 LCP < 2.5s。',
            done: false,
            assigneeId: 'u-006',
            assigneeName: '孙七',
            priority: PRIORITY.HIGH,
            deadline: '2026-09-25',
            status: '待办',
            sort: 0,
            createdAt: '2026-09-01T08:00:00+08:00',
            updatedAt: '2026-09-01T08:00:00+08:00',
          },
          {
            id: 't-202',
            name: '清理未使用依赖',
            description: 'package.json 瘦身。',
            done: false,
            assigneeId: 'u-004',
            assigneeName: '王五',
            priority: PRIORITY.LOW,
            deadline: '2026-10-01',
            status: '待办',
            sort: 1,
            createdAt: '2026-09-02T13:00:00+08:00',
            updatedAt: '2026-09-02T13:00:00+08:00',
          },
        ],
      },
      {
        id: 'doing',
        title: '进行中',
        sort: 1,
        tasks: [],
      },
      {
        id: 'done',
        title: '已完成',
        sort: 2,
        tasks: [],
      },
    ],
  },
}

/** 扁平任务列表（便于按 id 查询详情） */
export const mockTasks = Object.values(mockBoardByProject).flatMap((board) =>
  board.columns.flatMap((col) =>
    col.tasks.map((task) => ({
      ...task,
      projectId: board.projectId,
      columnId: col.id,
      columnTitle: col.title,
    })),
  ),
)

const STATUS_COLUMN_MAP = {
  待办: 'todo',
  进行中: 'doing',
  已完成: 'done',
}

const COLUMN_STATUS_MAP = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
}

function resolveColumnByStatus(board, status) {
  const normalizedStatus = String(status || '').trim()
  if (!normalizedStatus || !board?.columns?.length) return null

  const mappedColumnId = STATUS_COLUMN_MAP[normalizedStatus]
  if (mappedColumnId) {
    const mappedColumn = board.columns.find((col) => col.id === mappedColumnId)
    if (mappedColumn) return mappedColumn
  }

  return board.columns.find((col) => col.title === normalizedStatus) || null
}

function resolveTaskTargetColumn(board, payload) {
  if (payload?.status) {
    const columnByStatus = resolveColumnByStatus(board, payload.status)
    if (columnByStatus) return columnByStatus
  }

  if (payload?.columnId) {
    const columnById = board.columns.find((col) => col.id === payload.columnId)
    if (columnById) return columnById
  }

  return board.columns[0] || null
}

function isDoneColumn(column) {
  return column?.id === 'done' || column?.title === '已完成'
}

/** 按任务状态把错列的任务移回对应列表 */
function syncBoardTasksByStatus(board) {
  if (!board?.columns?.length) return

  const relocations = []
  board.columns.forEach((column) => {
    column.tasks.forEach((task, taskIndex) => {
      const expectedStatus = String(task.status || COLUMN_STATUS_MAP[column.id] || column.title).trim()
      const expectedColumn = resolveColumnByStatus(board, expectedStatus)
      if (expectedColumn && expectedColumn.id !== column.id) {
        relocations.push({ task, fromColumn: column, taskIndex, toColumn: expectedColumn })
      }
    })
  })

  relocations
    .sort((a, b) => b.taskIndex - a.taskIndex)
    .forEach(({ task, fromColumn, taskIndex, toColumn }) => {
      fromColumn.tasks.splice(taskIndex, 1)
      task.status = String(task.status || COLUMN_STATUS_MAP[toColumn.id] || toColumn.title).trim()
      task.done = isDoneColumn(toColumn)
      task.sort = toColumn.tasks.length
      toColumn.tasks.push(task)
    })
}

/** 在看板数据中定位任务 */
function findTaskLocation(taskId) {
  for (const projectId of Object.keys(mockBoardByProject)) {
    const board = mockBoardByProject[projectId]
    for (let colIndex = 0; colIndex < board.columns.length; colIndex += 1) {
      const column = board.columns[colIndex]
      const taskIndex = column.tasks.findIndex((task) => task.id === taskId)
      if (taskIndex >= 0) {
        return {
          projectId,
          board,
          column,
          colIndex,
          taskIndex,
          task: column.tasks[taskIndex],
        }
      }
    }
  }
  return null
}

function findProject(projectId) {
  if (!projectId) return null
  return mockProjects.find((p) => p.id === projectId) || null
}

function createDefaultBoard(projectId) {
  mockBoardByProject[projectId] = {
    projectId,
    columns: [
      { id: 'todo', title: '待办', sort: 0, tasks: [] },
      { id: 'doing', title: '进行中', sort: 1, tasks: [] },
      { id: 'done', title: '已完成', sort: 2, tasks: [] },
    ],
  }
  return mockBoardByProject[projectId]
}

/** 项目存在但看板缺失时自动补全（兼容新建项目） */
function ensureProjectBoard(projectId) {
  const project = findProject(projectId)
  if (!project) return null
  if (!mockBoardByProject[projectId]) {
    createDefaultBoard(projectId)
  }
  return mockBoardByProject[projectId]
}

/** 生成不重复的项目 ID */
function generateProjectId() {
  const maxSeq = mockProjects.reduce((max, project) => {
    const match = String(project.id).match(/^p-(\d+)$/)
    if (!match) return max
    return Math.max(max, Number(match[1]))
  }, 0)
  return `p-${String(maxSeq + 1).padStart(3, '0')}`
}

function buildTaskDetail(task, projectId, column) {
  return {
    ...task,
    projectId,
    columnId: column.id,
    columnTitle: column.title,
    status: task.status || COLUMN_STATUS_MAP[column.id] || column.title,
  }
}

// ─── 查询辅助（模拟后端接口） ───────────────────────────────

/** 登录：返回用户信息（不含密码） */
export function mockLogin(username, password) {
  const user = mockUsers.find((u) => u.username === username && u.password === password)
  if (!user) return { code: 401, message: '账号或密码错误', data: null }
  const { password: _, ...safeUser } = user
  return { code: 0, message: 'ok', data: { user: safeUser, token: `mock-token-${user.id}` } }
}

/** 按角色获取用户列表 */
export function mockGetUsersByRole(role) {
  return mockUsers.filter((u) => u.role === role).map(({ password: _, ...rest }) => rest)
}

/** 获取用户可见项目（管理员看全部，负责人看自己的，任务修改人看参与的） */
export function mockGetProjectsForUser(userId) {
  const user = mockUsers.find((u) => u.id === userId)
  if (!user) return []
  if (user.role === ROLES.ADMIN) return [...mockProjects]
  if (user.role === ROLES.PROJECT_MANAGER) {
    return mockProjects.filter((p) => p.ownerId === userId || p.memberIds.includes(userId))
  }
  return mockProjects.filter((p) => p.memberIds.includes(userId))
}

/** 获取项目看板 */
export function mockGetBoard(projectId) {
  const board = ensureProjectBoard(projectId)
  if (!board) return { code: 404, message: '项目不存在', data: null }
  syncBoardTasksByStatus(board)
  return { code: 0, message: 'ok', data: board }
}

/** 获取任务详情 */
export function mockGetTask(taskId) {
  const location = findTaskLocation(taskId)
  if (!location) return { code: 404, message: '任务不存在', data: null }
  const project = mockProjects.find((p) => p.id === location.projectId)
  return {
    code: 0,
    message: 'ok',
    data: {
      task: buildTaskDetail(location.task, location.projectId, location.column),
      project: project ? { id: project.id, name: project.name } : null,
    },
  }
}

/** 判断用户是否可编辑某任务 */
export function mockCanEditTask(userId, taskId) {
  const user = mockUsers.find((u) => u.id === userId)
  const location = findTaskLocation(taskId)
  if (!user || !location) return false
  const { task } = location
  if (hasPermission(user.role, 'EDIT_ANY_TASK')) return true
  if (hasPermission(user.role, 'EDIT_ASSIGNED_TASK') && task.assigneeId === userId) return true
  return false
}

/** 更新任务（状态变更时移动到对应列） */
export function mockUpdateTask(taskId, payload, operatorId) {
  const location = findTaskLocation(taskId)
  if (!location) return { code: 404, message: '任务不存在', data: null }
  if (!mockCanEditTask(operatorId, taskId)) {
    return { code: 403, message: '无权限编辑该任务', data: null }
  }

  const { task, column, board, taskIndex, projectId } = location
  const trimmedName = String(payload.name ?? task.name).trim()
  if (!trimmedName) {
    return { code: 400, message: '请输入任务标题', data: null }
  }

  const project = mockProjects.find((p) => p.id === projectId)
  if (!project) return { code: 404, message: '项目不存在', data: null }

  let assigneeId =
    payload.assigneeId !== undefined ? payload.assigneeId || null : task.assigneeId || null
  let assigneeName = '未指派'
  if (assigneeId) {
    const assignee = mockUsers.find((u) => u.id === assigneeId)
    if (!assignee) return { code: 400, message: '指派人不存在', data: null }
    if (!project.memberIds.includes(assigneeId)) {
      return { code: 400, message: '只能指派给项目成员', data: null }
    }
    assigneeName = assignee.displayName
  }

  const status = String(payload.status ?? task.status ?? COLUMN_STATUS_MAP[column.id]).trim()
  const targetColumn = resolveColumnByStatus(board, status)
  if (!targetColumn) {
    return { code: 400, message: '无效状态', data: null }
  }

  const now = new Date().toISOString()
  const updatedTask = {
    ...task,
    name: trimmedName,
    description: String(payload.description ?? task.description ?? '').trim(),
    assigneeId,
    assigneeName,
    priority: payload.priority ?? task.priority ?? PRIORITY.MEDIUM,
    deadline: payload.deadline ?? task.deadline ?? '',
    status,
    done: isDoneColumn(targetColumn),
    updatedAt: now,
  }

  column.tasks.splice(taskIndex, 1)
  updatedTask.sort = targetColumn.tasks.length
  targetColumn.tasks.push(updatedTask)

  project.updatedAt = now
  project.updatedAtLabel = '刚刚'

  return {
    code: 0,
    message: '保存成功',
    data: {
      task: buildTaskDetail(updatedTask, projectId, targetColumn),
      project: { id: project.id, name: project.name },
    },
  }
}

/** 创建任务 */
export function mockCreateTask(projectId, payload, operatorId) {
  const normalizedProjectId = String(projectId || '').trim()
  if (!normalizedProjectId) {
    return { code: 400, message: '缺少项目信息', data: null }
  }

  const board = ensureProjectBoard(normalizedProjectId)
  if (!board) return { code: 404, message: '项目不存在', data: null }

  const operator = mockUsers.find((u) => u.id === operatorId)
  if (!operator) return { code: 401, message: '请先登录', data: null }
  if (!hasPermission(operator.role, 'CREATE_TASK')) {
    return { code: 403, message: '无权限创建任务', data: null }
  }

  const project = findProject(normalizedProjectId)
  if (!project) return { code: 404, message: '项目不存在', data: null }
  if (operator.role !== ROLES.ADMIN && !project.memberIds.includes(operatorId)) {
    return { code: 403, message: '无权限在该项目创建任务', data: null }
  }

  const trimmedName = String(payload.name || '').trim()
  if (!trimmedName) {
    return { code: 400, message: '请输入任务标题', data: null }
  }

  let column = resolveTaskTargetColumn(board, payload)
  if (!column) return { code: 400, message: '看板列表不存在', data: null }

  let assigneeId = payload.assigneeId || null
  let assigneeName = '未指派'
  if (assigneeId) {
    const assignee = mockUsers.find((u) => u.id === assigneeId)
    if (!assignee) return { code: 400, message: '指派人不存在', data: null }
    if (!project.memberIds.includes(assigneeId)) {
      return { code: 400, message: '只能指派给项目成员', data: null }
    }
    assigneeName = assignee.displayName
  }

  const status = String(payload.status || COLUMN_STATUS_MAP[column.id] || column.title).trim()
  const now = new Date().toISOString()
  const task = {
    id: `t-${Date.now()}`,
    name: trimmedName,
    description: String(payload.description || '').trim(),
    done: isDoneColumn(column),
    assigneeId,
    assigneeName,
    priority: payload.priority || PRIORITY.MEDIUM,
    deadline: payload.deadline || '',
    status,
    sort: column.tasks.length,
    createdAt: now,
    updatedAt: now,
  }

  column.tasks.push(task)
  project.updatedAt = now
  project.updatedAtLabel = '刚刚'

  return {
    code: 0,
    message: '创建成功',
    data: {
      task: buildTaskDetail(task, normalizedProjectId, column),
      project: { id: project.id, name: project.name },
    },
  }
}

/** 删除任务 */
export function mockDeleteTask(taskId, operatorId) {
  const location = findTaskLocation(taskId)
  if (!location) return { code: 404, message: '任务不存在', data: null }

  const operator = mockUsers.find((u) => u.id === operatorId)
  if (!operator) return { code: 401, message: '请先登录', data: null }
  if (!hasPermission(operator.role, 'DELETE_TASK')) {
    return { code: 403, message: '无权限删除任务', data: null }
  }

  location.column.tasks.splice(location.taskIndex, 1)
  return { code: 0, message: '删除成功', data: { taskId } }
}

function canManageBoardColumns(operator, projectId) {
  if (!operator) return false
  if (operator.role === ROLES.ADMIN) return true
  if (!hasPermission(operator.role, 'MANAGE_COLUMNS')) return false
  const project = mockProjects.find((p) => p.id === projectId)
  return !!project?.memberIds.includes(operator.id)
}

/** 添加看板列表 */
export function mockAddBoardColumn(projectId, { title }, operatorId) {
  const board = ensureProjectBoard(String(projectId || '').trim())
  if (!board) return { code: 404, message: '项目不存在', data: null }

  const operator = mockUsers.find((u) => u.id === operatorId)
  if (!operator) return { code: 401, message: '请先登录', data: null }
  if (!canManageBoardColumns(operator, projectId)) {
    return { code: 403, message: '无权限添加列表', data: null }
  }

  const trimmedTitle = String(title || '').trim() || '新列表'
  const id = `list-${Date.now()}`
  board.columns.push({
    id,
    title: trimmedTitle,
    sort: board.columns.length,
    tasks: [],
  })

  return { code: 0, message: '添加成功', data: board }
}

/** 删除看板列表 */
export function mockDeleteBoardColumn(projectId, columnId, operatorId) {
  const normalizedProjectId = String(projectId || '').trim()
  const board = ensureProjectBoard(normalizedProjectId)
  if (!board) return { code: 404, message: '项目不存在', data: null }

  const operator = mockUsers.find((u) => u.id === operatorId)
  if (!operator) return { code: 401, message: '请先登录', data: null }
  if (!canManageBoardColumns(operator, projectId)) {
    return { code: 403, message: '无权限删除列表', data: null }
  }

  if (board.columns.length <= 1) {
    return { code: 400, message: '至少保留一个列表', data: null }
  }

  const colIndex = board.columns.findIndex((col) => col.id === columnId)
  if (colIndex < 0) return { code: 404, message: '列表不存在', data: null }

  const [removed] = board.columns.splice(colIndex, 1)
  const fallbackColumn = board.columns[Math.min(colIndex, board.columns.length - 1)]
  if (removed.tasks.length && fallbackColumn) {
    fallbackColumn.tasks.push(...removed.tasks)
  }

  board.columns.forEach((col, index) => {
    col.sort = index
  })

  return { code: 0, message: '删除成功', data: board }
}

/** 获取可选项目负责人列表 */
export function mockGetProjectManagers() {
  return mockUsers
    .filter((u) => u.role === ROLES.PROJECT_MANAGER)
    .map(({ password: _, ...rest }) => rest)
}

/** 创建项目（管理员分配负责人） */
export function mockCreateProject({ name, description, ownerId }) {
  const trimmedName = String(name || '').trim()
  const trimmedDesc = String(description || '').trim()
  if (!trimmedName) {
    return { code: 400, message: '请输入项目名称', data: null }
  }
  if (!ownerId) {
    return { code: 400, message: '请选择项目负责人', data: null }
  }

  const owner = mockUsers.find((u) => u.id === ownerId)
  if (!owner) {
    return { code: 400, message: '负责人不存在', data: null }
  }
  if (owner.role !== ROLES.PROJECT_MANAGER && owner.role !== ROLES.ADMIN) {
    return { code: 400, message: '负责人必须是项目负责人', data: null }
  }

  const id = generateProjectId()
  const now = new Date().toISOString()

  const project = {
    id,
    name: trimmedName,
    description: trimmedDesc,
    ownerId,
    ownerName: owner.displayName,
    memberIds: [ownerId],
    statusSummary: '暂无任务',
    updatedAt: now,
    updatedAtLabel: '刚刚',
    createdAt: now,
  }

  mockProjects.unshift(project)

  mockBoardByProject[id] = {
    projectId: id,
    columns: [
      { id: 'todo', title: '待办', sort: 0, tasks: [] },
      { id: 'doing', title: '进行中', sort: 1, tasks: [] },
      { id: 'done', title: '已完成', sort: 2, tasks: [] },
    ],
  }

  return { code: 0, message: '创建成功', data: project }
}

/** 获取项目详情 */
export function mockGetProject(projectId) {
  const project = findProject(String(projectId || '').trim())
  if (!project) return { code: 404, message: '项目不存在', data: null }
  return { code: 0, message: 'ok', data: { ...project } }
}

/** 获取项目成员列表 */
export function mockGetProjectMembers(projectId) {
  const normalizedProjectId = String(projectId || '').trim()
  const project = findProject(normalizedProjectId)
  if (!project) return { code: 404, message: '项目不存在', data: null }

  const members = project.memberIds
    .map((id) => mockUsers.find((u) => u.id === id))
    .filter(Boolean)
    .map(({ password: _, ...rest }) => ({
      ...rest,
      roleLabel: ROLE_LABELS[rest.role] || rest.role,
      isOwner: rest.id === project.ownerId,
    }))

  return { code: 0, message: 'ok', data: members }
}

/** 获取可邀请的用户（不在项目中的用户） */
export function mockGetInvitableUsers(projectId) {
  const project = mockProjects.find((p) => p.id === projectId)
  if (!project) return { code: 404, message: '项目不存在', data: null }

  const users = mockUsers
    .filter((u) => !project.memberIds.includes(u.id))
    .map(({ password: _, ...rest }) => ({
      ...rest,
      roleLabel: ROLE_LABELS[rest.role] || rest.role,
    }))

  return { code: 0, message: 'ok', data: users }
}

function canManageProjectSettings(operator, project) {
  if (!operator || !project) return false
  if (operator.role === ROLES.ADMIN) return true
  if (operator.role === ROLES.PROJECT_MANAGER && project.ownerId === operator.id) return true
  return false
}

function canManageProjectMembers(operator, project) {
  if (!operator || !project) return false
  if (operator.role === ROLES.ADMIN) return true
  if (
    hasPermission(operator.role, 'MANAGE_PROJECT_MEMBERS') &&
    project.memberIds.includes(operator.id)
  ) {
    return true
  }
  return false
}

/** 更新项目名称与描述 */
export function mockUpdateProject(projectId, { name, description }, operatorId) {
  const project = mockProjects.find((p) => p.id === projectId)
  if (!project) return { code: 404, message: '项目不存在', data: null }

  const operator = mockUsers.find((u) => u.id === operatorId)
  if (!operator) return { code: 401, message: '请先登录', data: null }
  if (!canManageProjectSettings(operator, project)) {
    return { code: 403, message: '无权限修改项目设置', data: null }
  }

  const trimmedName = String(name || '').trim()
  if (!trimmedName) {
    return { code: 400, message: '请输入项目名称', data: null }
  }

  project.name = trimmedName
  project.description = String(description || '').trim()
  project.updatedAt = new Date().toISOString()
  project.updatedAtLabel = '刚刚'

  return { code: 0, message: '保存成功', data: { ...project } }
}

/** 添加项目成员 */
export function mockAddProjectMember(projectId, userId, operatorId) {
  const project = mockProjects.find((p) => p.id === projectId)
  if (!project) return { code: 404, message: '项目不存在', data: null }

  const operator = mockUsers.find((u) => u.id === operatorId)
  if (!operator) return { code: 401, message: '请先登录', data: null }
  if (!canManageProjectMembers(operator, project)) {
    return { code: 403, message: '无权限邀请成员', data: null }
  }

  const user = mockUsers.find((u) => u.id === userId)
  if (!user) return { code: 404, message: '用户不存在', data: null }
  if (project.memberIds.includes(userId)) {
    return { code: 400, message: '该成员已在项目中', data: null }
  }

  project.memberIds.push(userId)
  project.updatedAt = new Date().toISOString()
  project.updatedAtLabel = '刚刚'

  const { password: _, ...safeUser } = user
  return {
    code: 0,
    message: '添加成功',
    data: {
      member: {
        ...safeUser,
        roleLabel: ROLE_LABELS[user.role] || user.role,
        isOwner: false,
      },
      project: { ...project },
    },
  }
}

/** 批量添加项目成员 */
export function mockAddProjectMembers(projectId, userIds, operatorId) {
  const ids = Array.isArray(userIds) ? [...new Set(userIds.filter(Boolean))] : []
  if (!ids.length) {
    return { code: 400, message: '请选择要添加的成员', data: null }
  }

  const project = mockProjects.find((p) => p.id === projectId)
  if (!project) return { code: 404, message: '项目不存在', data: null }

  const operator = mockUsers.find((u) => u.id === operatorId)
  if (!operator) return { code: 401, message: '请先登录', data: null }
  if (!canManageProjectMembers(operator, project)) {
    return { code: 403, message: '无权限邀请成员', data: null }
  }

  const added = []
  for (const userId of ids) {
    if (project.memberIds.includes(userId)) continue
    const user = mockUsers.find((u) => u.id === userId)
    if (!user) continue
    project.memberIds.push(userId)
    const { password: _, ...safeUser } = user
    added.push({
      ...safeUser,
      roleLabel: ROLE_LABELS[user.role] || user.role,
      isOwner: false,
    })
  }

  if (!added.length) {
    return { code: 400, message: '所选成员已在项目中或不存在', data: null }
  }

  project.updatedAt = new Date().toISOString()
  project.updatedAtLabel = '刚刚'

  return {
    code: 0,
    message: `成功添加 ${added.length} 人`,
    data: {
      members: added,
      project: { ...project },
    },
  }
}

export default {
  ROLES,
  ROLE_LABELS,
  PERMISSIONS,
  PRIORITY,
  PRIORITY_LABELS,
  mockUsers,
  mockProjects,
  mockBoardByProject,
  mockTasks,
  hasPermission,
  mockLogin,
  mockGetUsersByRole,
  mockGetProjectsForUser,
  mockGetBoard,
  mockGetTask,
  mockCanEditTask,
  mockUpdateTask,
  mockCreateTask,
  mockDeleteTask,
  mockGetProjectManagers,
  mockCreateProject,
  mockGetProject,
  mockGetProjectMembers,
  mockGetInvitableUsers,
  mockUpdateProject,
  mockAddProjectMember,
  mockAddProjectMembers,
  mockAddBoardColumn,
  mockDeleteBoardColumn,
}
