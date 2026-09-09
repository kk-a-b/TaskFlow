<template>
  <view class="app-page">
    <view class="float float-1" />
    <view class="float float-2" />
    <view class="float float-3" />
    <view class="float float-4" />
    <view class="float float-5" />

    <view class="page-shell">
      <view class="nav glass-panel" @tap="goBack">
        <text class="nav__text">← 返回项目列表</text>
      </view>

      <view class="topbar glass-panel">
        <view class="topbar__left">
          <text class="topbar__folder">📁</text>
          <text class="topbar__title">{{ projectName }}</text>
        </view>
        <view class="topbar__actions">
          <view v-if="projectMembers.length" class="member-strip">
            <view class="member-strip__avatars">
              <view
                v-for="member in memberAvatarPreview"
                :key="member.id"
                class="member-strip__avatar"
              >
                <text class="member-strip__avatar-text">{{ member.avatar }}</text>
              </view>
            </view>
            <text class="member-strip__names">{{ memberNamesText }}</text>
          </view>
          <view class="action-btn" @tap="openInviteModal">
            <text class="action-btn__text">+ 邀请成员</text>
          </view>
          <view
            v-if="canEditSettings"
            class="action-btn"
            @tap="openSettingsModal"
          >
            <text class="action-btn__text">项目设置</text>
          </view>
        </view>
      </view>

      <view class="board glass-panel">
        <view v-if="canManageColumns" class="board-toolbar">
          <view class="ghost-btn" @tap="addColumn">
            <text class="ghost-btn__text">+ 添加列表</text>
          </view>
        </view>

        <!-- #ifdef H5 -->
        <div
          ref="boardScrollRef"
          class="board-scroll"
          :style="boardScrollStyle"
          @wheel="onBoardWheel"
        >
          <div class="board-columns" :style="boardColumnsStyle">
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <scroll-view
          ref="boardScrollRef"
          class="board-scroll"
          :style="boardScrollStyle"
          scroll-x
          enable-flex
          :show-scrollbar="true"
        >
          <view class="board-columns" :style="boardColumnsStyle">
        <!-- #endif -->
            <template v-for="(column, colIndex) in columns" :key="column.id">
              <view
                v-if="isColumnPlaceholderVisible(colIndex)"
                class="column-placeholder column-placeholder--active"
              />
              <view
                class="kanban-column-slot"
                :class="{ 'kanban-column-slot--dragging': isDraggingColumn(colIndex) }"
              >
                <view
                  :id="`col-${colIndex}`"
                  class="kanban-column"
                  :class="{
                    'kanban-column--dragging': isDraggingColumn(colIndex),
                    'kanban-column--task-over':
                      dragMode === 'task' &&
                      dragActive &&
                      dragOverCol === colIndex,
                  }"
                >
              <view
                v-if="canManageColumns"
                class="kanban-column__delete"
                @tap.stop="confirmDeleteColumn(colIndex)"
              >
                <text class="kanban-column__delete-icon">✕</text>
              </view>
              <view
                class="kanban-column__head"
                @touchstart.stop="onColumnDragStart(colIndex, $event)"
              >
                <text class="kanban-column__drag">⠿</text>
                <text class="kanban-column__pin">📌</text>
                <text class="kanban-column__title">{{ column.title }}</text>
              </view>
              <text class="kanban-column__count">{{ column.tasks.length }}个任务</text>

              <view class="task-list">
                <template v-for="(task, taskIndex) in column.tasks" :key="task.id">
                  <view
                    v-if="isPlaceholderVisible(colIndex, taskIndex)"
                    class="task-placeholder task-placeholder--active"
                  />
                  <view
                    class="task-card"
                    :class="{
                      'task-card--dragging': isDraggingTask(colIndex, taskIndex),
                    }"
                    @touchstart.stop="onTaskDragStart(colIndex, taskIndex, $event)"
                  >
                    <view
                      class="task-card__priority"
                      :class="`task-card__priority--${task.priority}`"
                    />
                    <text
                      class="task-card__name"
                      :class="{ 'task-card__name--done': task.done }"
                    >
                      {{ task.name }}
                    </text>
                  </view>
                </template>
                <view
                  v-if="isPlaceholderVisible(colIndex, column.tasks.length)"
                  class="task-placeholder task-placeholder--active"
                />
              </view>

              <view class="ghost-btn ghost-btn--sm" @tap.stop="openCreateTask(colIndex)">
                <text class="ghost-btn__text">+ 添加任务</text>
              </view>
            </view>
              </view>
            </template>
            <view
              v-if="isColumnPlaceholderVisible(columns.length)"
              class="column-placeholder column-placeholder--active"
            />
        <!-- #ifdef H5 -->
          </div>
        </div>
        <!-- #endif -->
        <!-- #ifndef H5 -->
          </view>
        </scroll-view>
        <!-- #endif -->
      </view>
    </view>

    <view
      v-if="dragActive"
      class="drag-overlay"
      @touchmove.stop="onOverlayTouchMove"
      @touchend.stop="onDragEnd"
      @touchcancel.stop="onDragCancel"
      @mousemove.stop.prevent="onDragMove"
      @mouseup.stop="onDragEnd"
    >
      <view
        v-if="dragMode === 'column' && columnGhost.visible"
        class="column-drag-ghost"
        :style="columnGhostStyle"
      >
        <view class="column-drag-ghost__head">
          <text class="column-drag-ghost__pin">📌</text>
          <text class="column-drag-ghost__title">{{ columnGhost.title }}</text>
        </view>
        <text class="column-drag-ghost__count">{{ columnGhost.taskCount }}个任务</text>
      </view>
      <view
        v-if="dragMode === 'task' && dragGhost.visible"
        class="drag-ghost"
        :style="dragGhostStyle"
      >
        <view
          class="drag-ghost__priority"
          :class="`drag-ghost__priority--${dragGhost.priority}`"
        />
        <text class="drag-ghost__name">{{ dragGhost.name }}</text>
      </view>
    </view>

    <view v-if="showSettingsModal" class="modal-mask" @tap="closeSettingsModal">
      <view class="modal glass-panel" @tap.stop>
        <text class="modal__title">项目设置</text>

        <view class="modal-field">
          <text class="modal-field__label">项目名称</text>
          <input
            v-model="settingsForm.name"
            class="modal-field__input"
            type="text"
            placeholder="请输入项目名称"
            placeholder-class="modal-field__placeholder"
          />
        </view>

        <view class="modal-field modal-field--top">
          <text class="modal-field__label">项目描述</text>
          <textarea
            v-model="settingsForm.description"
            class="modal-field__textarea"
            placeholder="请输入项目描述"
            placeholder-class="modal-field__placeholder"
            :maxlength="-1"
            auto-height
          />
        </view>

        <view class="modal-actions">
          <view class="ghost-btn" @tap="closeSettingsModal">
            <text class="ghost-btn__text">取消</text>
          </view>
          <view class="action-btn" @tap="submitSettings">
            <text class="action-btn__text">保存</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showInviteModal" class="modal-mask" @tap="closeInviteModal">
      <view class="modal modal--wide glass-panel" @tap.stop="closeInviteDropdown">
        <text class="modal__title">邀请成员</text>

        <view class="modal-section">
          <text class="modal-section__title">当前成员（{{ projectMembers.length }}）</text>
          <view v-if="projectMembers.length" class="member-list">
            <view
              v-for="member in projectMembers"
              :key="member.id"
              class="member-row"
            >
              <view class="member-row__avatar">
                <text class="member-row__avatar-text">{{ member.avatar }}</text>
              </view>
              <view class="member-row__info">
                <text class="member-row__name">{{ member.displayName }}</text>
                <text class="member-row__role">{{ member.isOwner ? '负责人' : member.roleLabel }}</text>
              </view>
            </view>
          </view>
          <text v-else class="modal-empty">暂无成员</text>
        </view>

        <view v-if="canInviteMembers" class="modal-section modal-section--invite">
          <text class="modal-section__title">添加成员</text>
          <view class="invite-select" @tap.stop>
            <view
              class="invite-select__field"
              :class="{ 'invite-select__field--open': showInviteDropdown }"
              @tap.stop="toggleInviteDropdown"
            >
              <text class="invite-select__label">成员</text>
              <text
                class="invite-select__value"
                :class="{ 'invite-select__value--placeholder': !selectedInviteSummary }"
              >
                {{ selectedInviteSummary || '请选择要添加的成员' }}
              </text>
              <text
                class="invite-select__arrow"
                :class="{ 'invite-select__arrow--open': showInviteDropdown }"
              >
                ▾
              </text>
            </view>

            <view v-if="showInviteDropdown" class="invite-select__panel">
              <view class="invite-select__search">
                <text class="invite-select__search-icon">🔍</text>
                <input
                  v-model="inviteSearchKeyword"
                  class="invite-select__search-input"
                  type="text"
                  placeholder="搜索联系人"
                  placeholder-class="invite-select__search-placeholder"
                  @tap.stop
                />
              </view>

              <view v-if="filteredInvitableUsers.length" class="invite-select__list">
                <view
                  v-for="user in filteredInvitableUsers"
                  :key="user.id"
                  class="invite-select__option"
                  :class="{ 'invite-select__option--selected': isInviteUserSelected(user.id) }"
                  @tap.stop="toggleInviteUser(user.id)"
                >
                  <view
                    class="invite-select__check"
                    :class="{ 'invite-select__check--checked': isInviteUserSelected(user.id) }"
                  >
                    <text
                      v-if="isInviteUserSelected(user.id)"
                      class="invite-select__check-icon"
                    >
                      ✓
                    </text>
                  </view>
                  <view class="invite-select__option-avatar">
                    <text class="invite-select__option-avatar-text">{{ user.avatar }}</text>
                  </view>
                  <view class="invite-select__option-info">
                    <text class="invite-select__option-name">{{ user.displayName }}</text>
                    <text class="invite-select__option-meta">{{ user.username }} · {{ user.roleLabel }}</text>
                  </view>
                </view>
              </view>
              <text v-else class="modal-empty">无匹配联系人</text>
            </view>
          </view>

          <view
            class="action-btn action-btn--block"
            :class="{ 'action-btn--disabled': !selectedInviteUserIds.length }"
            @tap="submitInviteMembers"
          >
            <text class="action-btn__text">
              {{ selectedInviteUserIds.length ? `添加到项目（${selectedInviteUserIds.length}）` : '添加到项目' }}
            </text>
          </view>
          <text v-if="!invitableUsers.length" class="modal-tip">暂无可邀请的用户</text>
        </view>
        <text v-else class="modal-tip">当前账号无邀请成员权限</text>

        <view class="modal-actions">
          <view class="ghost-btn" @tap="closeInviteModal">
            <text class="ghost-btn__text">关闭</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, getCurrentInstance, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { loadBoardForProject, addBoardColumn, deleteBoardColumn, reorderBoard, buildBoardReorderPayload, canManageBoardColumns, type BoardColumnItem, type BoardTaskItem } from '@/utils/board-service'
import { getCurrentUser, type SessionUser } from '@/utils/session'
import {
  getProjectDetail,
  getProjectMembers,
  getInvitableUsers,
  updateProjectSettings,
  addProjectMembers,
  canEditProjectSettings,
  canManageProject,
  type ProjectDetail,
  type ProjectMemberItem,
  type InvitableUserItem,
} from '@/utils/project-service'

interface TaskItem extends BoardTaskItem {}

interface ColumnItem extends BoardColumnItem {}

type DragMode = 'none' | 'column' | 'task'

type PendingDrag =
  | { type: 'column'; colIndex: number }
  | { type: 'task'; colIndex: number; taskIndex: number }

const projectId = ref('')
const projectName = ref('项目')
const projectDetail = ref<ProjectDetail | null>(null)
const projectMembers = ref<ProjectMemberItem[]>([])
const invitableUsers = ref<InvitableUserItem[]>([])
const currentUser = ref<SessionUser | null>(getCurrentUser())
const showSettingsModal = ref(false)
const showInviteModal = ref(false)
const showInviteDropdown = ref(false)
const selectedInviteUserIds = ref<string[]>([])
const inviteSearchKeyword = ref('')
const settingsForm = ref({ name: '', description: '' })
let listIdSeq = 3

const columns = ref<ColumnItem[]>([])

const canEditSettings = computed(() =>
  canEditProjectSettings(currentUser.value, projectDetail.value),
)

const canInviteMembers = computed(() =>
  canManageProject(currentUser.value, projectDetail.value),
)

const canManageColumns = computed(() =>
  canManageBoardColumns(currentUser.value, projectDetail.value),
)

const memberNamesText = computed(() =>
  projectMembers.value.map((member) => member.displayName).join('、'),
)

const memberAvatarPreview = computed(() => projectMembers.value.slice(0, 4))

const selectedInviteSummary = computed(() => {
  if (!selectedInviteUserIds.value.length) return ''
  return invitableUsers.value
    .filter((user) => selectedInviteUserIds.value.includes(user.id))
    .map((user) => user.displayName)
    .join(', ')
})

const filteredInvitableUsers = computed(() => {
  const keyword = inviteSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return invitableUsers.value
  return invitableUsers.value.filter((user) => {
    const haystack = `${user.displayName} ${user.username} ${user.roleLabel}`.toLowerCase()
    return haystack.includes(keyword)
  })
})

const isInviteUserSelected = (userId: string) => selectedInviteUserIds.value.includes(userId)

const closeInviteDropdown = () => {
  showInviteDropdown.value = false
  inviteSearchKeyword.value = ''
}

const toggleInviteDropdown = () => {
  if (!invitableUsers.value.length) return
  showInviteDropdown.value = !showInviteDropdown.value
  if (!showInviteDropdown.value) {
    inviteSearchKeyword.value = ''
  }
}

const toggleInviteUser = (userId: string) => {
  if (isInviteUserSelected(userId)) {
    selectedInviteUserIds.value = selectedInviteUserIds.value.filter((id) => id !== userId)
    return
  }
  selectedInviteUserIds.value = [...selectedInviteUserIds.value, userId]
}

const loadProjectMeta = async () => {
  projectDetail.value = await getProjectDetail(projectId.value)
  if (projectDetail.value) {
    projectName.value = projectDetail.value.name
  }
  projectMembers.value = await getProjectMembers(projectId.value)
  invitableUsers.value = await getInvitableUsers(projectId.value)
}

const openSettingsModal = () => {
  if (!canEditSettings.value || !projectDetail.value) {
    uni.showToast({ title: '无权限修改项目设置', icon: 'none' })
    return
  }
  settingsForm.value = {
    name: projectDetail.value.name,
    description: projectDetail.value.description,
  }
  showSettingsModal.value = true
}

const closeSettingsModal = () => {
  showSettingsModal.value = false
}

const submitSettings = async () => {
  const operator = currentUser.value
  if (!operator) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  const result = await updateProjectSettings(projectId.value, {
    name: settingsForm.value.name,
    description: settingsForm.value.description,
  })
  if (!result.ok) {
    uni.showToast({ title: result.message, icon: 'none' })
    return
  }
  projectDetail.value = result.project
  projectName.value = result.project.name
  closeSettingsModal()
  uni.showToast({ title: '保存成功', icon: 'success' })
}

const openInviteModal = () => {
  void loadProjectMeta()
  selectedInviteUserIds.value = []
  inviteSearchKeyword.value = ''
  showInviteDropdown.value = false
  showInviteModal.value = true
}

const closeInviteModal = () => {
  showInviteModal.value = false
  showInviteDropdown.value = false
  selectedInviteUserIds.value = []
  inviteSearchKeyword.value = ''
}

const submitInviteMembers = async () => {
  if (!canInviteMembers.value) {
    uni.showToast({ title: '无权限邀请成员', icon: 'none' })
    return
  }
  if (!selectedInviteUserIds.value.length) {
    uni.showToast({ title: '请选择要添加的成员', icon: 'none' })
    return
  }
  const operator = currentUser.value
  if (!operator) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  const result = await addProjectMembers(projectId.value, selectedInviteUserIds.value)
  if (!result.ok) {
    uni.showToast({ title: result.message, icon: 'none' })
    return
  }
  projectDetail.value = result.project
  projectMembers.value = await getProjectMembers(projectId.value)
  invitableUsers.value = await getInvitableUsers(projectId.value)
  selectedInviteUserIds.value = []
  inviteSearchKeyword.value = ''
  showInviteDropdown.value = false
  uni.showToast({ title: result.message, icon: 'success' })
}

const dragMode = ref<DragMode>('none')
const dragFromCol = ref<number | null>(null)
const dragFromTask = ref<number | null>(null)
const dragOverCol = ref<number | null>(null)
const dragOverColInsertIndex = ref<number | null>(null)
const dragOverTaskIndex = ref<number | null>(null)
const dragActive = ref(false)
const boardScrollRef = ref<{ $el?: HTMLElement } | null>(null)
const boardContentHeight = ref(0)
const boardHeightLocked = ref(false)

const dragGhost = ref({
  visible: false,
  x: 0,
  y: 0,
  name: '',
  priority: 'medium' as BoardTaskItem['priority'],
  width: 0,
})

const columnGhost = ref({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  taskCount: 0,
  width: 0,
  height: 0,
})

let dragStartX = 0
let dragStartY = 0
let pointerX = 0
let pointerY = 0
let pendingDrag: PendingDrag | null = null
let activePointerId: number | null = null
let autoScrollTimer: ReturnType<typeof setInterval> | null = null
const DRAG_THRESHOLD = 8
const SCROLL_INTENT_RATIO = 1.4
const AUTO_SCROLL_EDGE = 56
const AUTO_SCROLL_STEP = 10

const instance = getCurrentInstance()

const dragGhostStyle = computed(() => ({
  left: `${dragGhost.value.x}px`,
  top: `${dragGhost.value.y}px`,
  width: dragGhost.value.width ? `${dragGhost.value.width}px` : undefined,
}))

const columnGhostStyle = computed(() => ({
  left: `${columnGhost.value.x}px`,
  top: `${columnGhost.value.y}px`,
  width: columnGhost.value.width ? `${columnGhost.value.width}px` : undefined,
  minHeight: columnGhost.value.height ? `${columnGhost.value.height}px` : undefined,
}))

const boardScrollStyle = computed(() => {
  const SCROLLBAR_GUTTER = 14
  if (boardContentHeight.value <= 0) return {}
  const totalHeight = boardContentHeight.value + SCROLLBAR_GUTTER
  if (boardHeightLocked.value) {
    return {
      height: `${totalHeight}px`,
      minHeight: `${totalHeight}px`,
    }
  }
  return { minHeight: `${totalHeight}px` }
})

const boardColumnsStyle = computed(() => {
  if (!boardHeightLocked.value || boardContentHeight.value <= 0) return {}
  return {
    height: `${boardContentHeight.value}px`,
    minHeight: `${boardContentHeight.value}px`,
  }
})

const readBoardColumnsHeight = (): number => {
  // #ifdef H5
  const el = document.querySelector('.board-columns')
  if (el instanceof HTMLElement) {
    return el.getBoundingClientRect().height
  }
  // #endif
  return boardContentHeight.value
}

const measureBoardHeight = () => {
  if (boardHeightLocked.value) return
  nextTick(() => {
    uni
      .createSelectorQuery()
      .in(instance?.proxy ?? undefined)
      .select('.board-columns')
      .boundingClientRect((rect) => {
        const r = (Array.isArray(rect) ? rect[0] : rect) as UniApp.NodeInfo | undefined
        if (r?.height) {
          boardContentHeight.value = r.height
        }
      })
      .exec()
  })
}

const lockBoardHeight = () => {
  const syncHeight = readBoardColumnsHeight()
  if (syncHeight > 0) {
    boardContentHeight.value = syncHeight
    boardHeightLocked.value = true
    return
  }

  uni
    .createSelectorQuery()
    .in(instance?.proxy ?? undefined)
    .select('.board-columns')
    .boundingClientRect((rect) => {
      const r = (Array.isArray(rect) ? rect[0] : rect) as UniApp.NodeInfo | undefined
      if (r?.height) {
        boardContentHeight.value = r.height
        boardHeightLocked.value = true
      }
    })
    .exec()
}

const unlockBoardHeight = () => {
  boardHeightLocked.value = false
  measureBoardHeight()
}

watch(columns, () => measureBoardHeight(), { deep: true })

onMounted(() => {
  measureBoardHeight()
  // #ifdef H5
  setupH5MouseDrag()
  // #endif
})

onLoad((query) => {
  projectId.value = (query?.id as string) || 'p-001'
  projectName.value = query?.name
    ? decodeURIComponent(query.name as string)
    : '项目'
  currentUser.value = getCurrentUser()
  void (async () => {
    await loadProjectMeta()
    columns.value = await loadBoardForProject(projectId.value)
    listIdSeq = Math.max(columns.value.length, 3)
    nextTick(() => measureBoardHeight())
  })()
})

onShow(() => {
  if (!projectId.value) return
  void (async () => {
    columns.value = await loadBoardForProject(projectId.value)
    nextTick(() => measureBoardHeight())
  })()
})

const preventTouchScroll = (e: TouchEvent) => {
  if (e.cancelable) {
    e.preventDefault()
  }
}

const onOverlayTouchMove = (e: TouchEvent) => {
  preventTouchScroll(e)
  onDragMove(e)
}

const parseColIndexFromElement = (columnEl: Element | null): number => {
  if (!columnEl?.id) return -1
  const match = columnEl.id.match(/^col-(\d+)$/)
  return match ? Number(match[1]) : -1
}

const parseTaskIndexFromElement = (columnEl: Element | null, cardEl: Element): number => {
  if (!columnEl) return -1
  const cards = columnEl.querySelectorAll('.task-card')
  return Array.from(cards).indexOf(cardEl)
}

let removeH5MouseDrag: (() => void) | null = null
let lastTouchStartAt = 0

const setupH5MouseDrag = () => {
  if (typeof document === 'undefined') return

  const markTouchStart = () => {
    lastTouchStartAt = Date.now()
  }

  const onBoardMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return
    if (Date.now() - lastTouchStartAt < 800) return

    const sourceCapabilities = (
      e as MouseEvent & { sourceCapabilities?: { firesTouchEvents?: boolean } }
    ).sourceCapabilities
    if (sourceCapabilities?.firesTouchEvents) return

    const target = e.target as HTMLElement | null
    if (!target) return

    const head = target.closest('.kanban-column__head')
    if (head) {
      e.preventDefault()
      e.stopPropagation()
      const colIndex = parseColIndexFromElement(head.closest('.kanban-column'))
      if (colIndex >= 0) onColumnDragStart(colIndex, e)
      return
    }

    const card = target.closest('.task-card')
    if (card) {
      e.preventDefault()
      e.stopPropagation()
      const columnEl = card.closest('.kanban-column')
      const colIndex = parseColIndexFromElement(columnEl)
      const taskIndex = parseTaskIndexFromElement(columnEl, card)
      if (colIndex >= 0 && taskIndex >= 0) {
        onTaskDragStart(colIndex, taskIndex, e)
      }
    }
  }

  document.addEventListener('touchstart', markTouchStart, true)
  document.addEventListener('mousedown', onBoardMouseDown, true)

  removeH5MouseDrag = () => {
    document.removeEventListener('touchstart', markTouchStart, true)
    document.removeEventListener('mousedown', onBoardMouseDown, true)
  }
}

const goBack = () => {
  uni.navigateBack()
}

const openTaskDetail = (colIndex: number, taskIndex: number) => {
  const column = columns.value[colIndex]
  const task = column?.tasks[taskIndex]
  if (!column || !task) return

  uni.navigateTo({
    url:
      `/pages/task/detail?id=${task.id}` +
      `&name=${encodeURIComponent(task.name)}` +
      `&status=${encodeURIComponent(column.title)}` +
      `&projectId=${projectId.value}` +
      `&projectName=${encodeURIComponent(projectName.value)}`,
  })
}

const openCreateTask = (colIndex: number) => {
  const column = columns.value[colIndex]
  if (!column) return

  uni.navigateTo({
    url:
      `/pages/task/detail?mode=create` +
      `&projectId=${projectId.value}` +
      `&projectName=${encodeURIComponent(projectName.value)}` +
      `&columnId=${encodeURIComponent(column.id)}` +
      `&status=${encodeURIComponent(column.title)}`,
  })
}

const clearPendingPointerStyles = () => {
  if (typeof document !== 'undefined') {
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }
}

const finishPendingTaskTap = () => {
  pendingDrag = null
  clearPendingPointerStyles()
  removeDocumentTouchListeners()
  removeWindowMouseListeners()
  removeWindowPointerListeners()
}

const tryOpenPendingTaskTap = (): boolean => {
  if (!pendingDrag || pendingDrag.type !== 'task' || dragActive.value) return false

  const absDx = Math.abs(pointerX - dragStartX)
  const absDy = Math.abs(pointerY - dragStartY)
  if (absDx >= DRAG_THRESHOLD || absDy >= DRAG_THRESHOLD) return false

  const { colIndex, taskIndex } = pendingDrag
  openTaskDetail(colIndex, taskIndex)
  finishPendingTaskTap()
  return true
}

const addColumn = async () => {
  const operator = currentUser.value
  if (!operator) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  if (!canManageColumns.value) {
    uni.showToast({ title: '无权限添加列表', icon: 'none' })
    return
  }

  listIdSeq += 1
  const result = await addBoardColumn(projectId.value, `新列表${listIdSeq - 3}`)
  if (!result.ok) {
    uni.showToast({ title: result.message, icon: 'none' })
    return
  }
  columns.value = result.columns
  listIdSeq = Math.max(columns.value.length, 3)
  nextTick(() => measureBoardHeight())
}

const confirmDeleteColumn = (colIndex: number) => {
  const column = columns.value[colIndex]
  if (!column) return

  const operator = currentUser.value
  if (!operator) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  if (!canManageColumns.value) {
    uni.showToast({ title: '无权限删除列表', icon: 'none' })
    return
  }

  const taskHint = column.tasks.length
    ? `列表中的 ${column.tasks.length} 个任务将移动到相邻列表。`
    : ''

  uni.showModal({
    title: '删除列表',
    content: `确定删除「${column.title}」吗？${taskHint}`,
    success: (res) => {
      if (!res.confirm) return
      void (async () => {
        const result = await deleteBoardColumn(projectId.value, column.id)
        if (!result.ok) {
          uni.showToast({ title: result.message, icon: 'none' })
          return
        }
        columns.value = result.columns
        nextTick(() => measureBoardHeight())
        uni.showToast({ title: result.message, icon: 'success' })
      })()
    },
  })
}

const isDoneColumn = (column: ColumnItem) =>
  column.id === 'done' || column.title === '已完成'

const resolveTaskDone = (column: ColumnItem) => isDoneColumn(column)

const isDraggingTask = (colIndex: number, taskIndex: number) =>
  dragMode.value === 'task' &&
  dragActive.value &&
  dragFromCol.value === colIndex &&
  dragFromTask.value === taskIndex

const isDraggingColumn = (colIndex: number) =>
  dragMode.value === 'column' &&
  dragActive.value &&
  dragFromCol.value === colIndex

const isColumnPlaceholderVisible = (beforeIndex: number) => {
  if (dragMode.value !== 'column' || !dragActive.value) return false
  if (dragOverColInsertIndex.value === null) return false
  return dragOverColInsertIndex.value === beforeIndex
}

const isPlaceholderVisible = (colIndex: number, beforeIndex: number) =>
  dragMode.value === 'task' &&
  dragActive.value &&
  dragOverCol.value === colIndex &&
  dragOverTaskIndex.value === beforeIndex

const reorderColumnsToIndex = (from: number, toIndex: number) => {
  let insertAt = toIndex
  if (from < insertAt) insertAt -= 1
  if (from === insertAt) return
  const cols = columns.value
  const [moved] = cols.splice(from, 1)
  cols.splice(insertAt, 0, moved)
}

const moveTaskToPosition = (
  fromCol: number,
  fromTask: number,
  toCol: number,
  toIndex: number,
) => {
  const sourceTasks = columns.value[fromCol]?.tasks
  const targetCol = columns.value[toCol]
  if (!sourceTasks || !targetCol) return

  const [task] = sourceTasks.splice(fromTask, 1)
  if (!task) return

  let insertAt = toIndex
  if (fromCol === toCol && fromTask < insertAt) {
    insertAt -= 1
  }

  insertAt = Math.max(0, Math.min(insertAt, targetCol.tasks.length))

  targetCol.tasks.splice(insertAt, 0, {
    ...task,
    done: resolveTaskDone(targetCol),
  })
}

const getPointFromEvent = (e: TouchEvent | MouseEvent | PointerEvent | Record<string, unknown>) => {
  const anyEvent = e as TouchEvent & MouseEvent & PointerEvent & {
    detail?: { x?: number; y?: number; clientX?: number; clientY?: number }
  }
  if (anyEvent.touches?.length) {
    return { x: anyEvent.touches[0].clientX, y: anyEvent.touches[0].clientY }
  }
  if (anyEvent.changedTouches?.length) {
    return { x: anyEvent.changedTouches[0].clientX, y: anyEvent.changedTouches[0].clientY }
  }
  if (typeof anyEvent.clientX === 'number' && typeof anyEvent.clientY === 'number') {
    return { x: anyEvent.clientX, y: anyEvent.clientY }
  }
  if (typeof anyEvent.pageX === 'number' && typeof anyEvent.pageY === 'number') {
    return { x: anyEvent.pageX, y: anyEvent.pageY }
  }
  const detail = anyEvent.detail
  if (detail && typeof detail.clientX === 'number' && typeof detail.clientY === 'number') {
    return { x: detail.clientX, y: detail.clientY }
  }
  if (detail && typeof detail.x === 'number' && typeof detail.y === 'number') {
    return { x: detail.x, y: detail.y }
  }
  return null
}

const isTouchPointerEvent = (e: TouchEvent | MouseEvent | PointerEvent | Record<string, unknown>) => {
  const anyEvent = e as TouchEvent
  if (anyEvent.type === 'touchstart' || anyEvent.type === 'touchmove' || anyEvent.type === 'touchend') {
    return true
  }
  return Boolean(anyEvent.touches?.length || anyEvent.changedTouches?.length)
}

const isTouchLikePointer = (e: TouchEvent | MouseEvent | PointerEvent | Record<string, unknown>) => {
  const pointerEvent = e as PointerEvent
  if (pointerEvent.pointerType === 'touch') return true
  return isTouchPointerEvent(e)
}

const getBoardScrollElement = (): HTMLElement | null => {
  const refVal = boardScrollRef.value as HTMLElement | { $el?: HTMLElement } | null
  if (refVal instanceof HTMLElement) return refVal
  if (refVal?.$el instanceof HTMLElement) return refVal.$el
  if (typeof document !== 'undefined') {
    const scrollEl = document.querySelector('.board-scroll')
    if (scrollEl instanceof HTMLElement) return scrollEl
  }
  return null
}

const onBoardWheel = (e: WheelEvent) => {
  if (dragActive.value) return
  const el = getBoardScrollElement()
  if (!el || el.scrollWidth <= el.clientWidth) return

  let delta = 0
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    delta = e.deltaX
  } else if (e.shiftKey || e.deltaY !== 0) {
    delta = e.deltaY
  }
  if (!delta) return

  el.scrollLeft += delta
  e.preventDefault()
}

const startAutoScroll = (clientX: number) => {
  stopAutoScroll()
  const el = getBoardScrollElement()
  if (!el) return

  autoScrollTimer = setInterval(() => {
    const rect = el.getBoundingClientRect()
    if (clientX < rect.left + AUTO_SCROLL_EDGE) {
      el.scrollLeft = Math.max(0, el.scrollLeft - AUTO_SCROLL_STEP)
    } else if (clientX > rect.right - AUTO_SCROLL_EDGE) {
      el.scrollLeft = el.scrollLeft + AUTO_SCROLL_STEP
    }
  }, 16)
}

const stopAutoScroll = () => {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer)
    autoScrollTimer = null
  }
}

const isExcludedColumn = (colIndex: number, excludeCol: number | null) =>
  excludeCol === colIndex && dragActive.value && dragMode.value === 'column'

const isPointerInColumnY = (clientY: number, rect: UniApp.NodeInfo) =>
  rect.top != null && rect.bottom != null && clientY >= rect.top && clientY <= rect.bottom

/** 列表左半区 → 插到该列表前；右半区 → 插到该列表后 */
const queryColumnInsertIndex = (
  clientX: number,
  clientY: number,
  excludeCol: number | null,
): Promise<number> => {
  return new Promise((resolve) => {
    uni
      .createSelectorQuery()
      .in(instance?.proxy ?? undefined)
      .selectAll('.kanban-column-slot')
      .boundingClientRect((rects) => {
        const cols = (Array.isArray(rects) ? rects : rects ? [rects] : []) as UniApp.NodeInfo[]

        if (!cols.length) {
          resolve(0)
          return
        }

        for (let i = 0; i < cols.length; i++) {
          const rect = cols[i]
          if (
            rect.left == null ||
            rect.right == null ||
            rect.top == null ||
            rect.bottom == null
          ) {
            continue
          }

          if (isExcludedColumn(i, excludeCol)) {
            if (isPointerInColumnY(clientY, rect) && Math.abs(clientX - rect.left) <= 24) {
              resolve(excludeCol as number)
              return
            }
            continue
          }

          const inColX = clientX >= rect.left && clientX <= rect.right
          const inColYRange = isPointerInColumnY(clientY, rect)

          if (inColX && inColYRange) {
            const midX = rect.left + (rect.right - rect.left) / 2
            resolve(clientX < midX ? i : i + 1)
            return
          }
        }

        let insertIndex = cols.length
        const visibleSlots: { index: number; rect: UniApp.NodeInfo }[] = []
        for (let i = 0; i < cols.length; i++) {
          if (isExcludedColumn(i, excludeCol)) continue
          visibleSlots.push({ index: i, rect: cols[i] })
        }

        for (let v = 0; v < visibleSlots.length; v++) {
          const { index, rect } = visibleSlots[v]
          if (rect.left == null || rect.right == null) continue

          const prev = visibleSlots[v - 1]
          if (
            prev &&
            prev.rect.right != null &&
            clientX > prev.rect.right &&
            clientX < rect.left
          ) {
            const gapMid = (prev.rect.right + rect.left) / 2
            insertIndex = clientX < gapMid ? prev.index + 1 : index
            break
          }

          const midX = rect.left + (rect.right - rect.left) / 2
          if (clientX < midX) {
            insertIndex = index
            break
          }
          insertIndex = index + 1
        }

        resolve(Math.min(insertIndex, columns.value.length))
      })
      .exec()
  })
}

const queryColumnIndexAtPoint = (clientX: number, clientY: number): Promise<number | null> => {
  return new Promise((resolve) => {
    uni
      .createSelectorQuery()
      .in(instance?.proxy ?? undefined)
      .selectAll('.kanban-column')
      .boundingClientRect((rects) => {
        const list = (Array.isArray(rects) ? rects : rects ? [rects] : []) as UniApp.NodeInfo[]
        for (let i = 0; i < list.length; i++) {
          const rect = list[i]
          if (
            rect.left != null &&
            rect.right != null &&
            rect.top != null &&
            rect.bottom != null &&
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom
          ) {
            resolve(i)
            return
          }
        }
        resolve(null)
      })
      .exec()
  })
}

const isExcludedTask = (
  colIndex: number,
  taskIndex: number,
  excludeCol: number | null,
  excludeTask: number | null,
) => excludeCol === colIndex && excludeTask === taskIndex && dragActive.value

/** 左半区 → 插到卡片前；右半区 → 插到卡片后；间隙区按 Y 轴兜底 */
const queryInsertIndexInColumn = (
  colIndex: number,
  clientX: number,
  clientY: number,
  excludeCol: number | null,
  excludeTask: number | null,
): Promise<number> => {
  return new Promise((resolve) => {
    uni
      .createSelectorQuery()
      .in(instance?.proxy ?? undefined)
      .selectAll(`#col-${colIndex} .task-card`)
      .boundingClientRect((rects) => {
        const cards = (Array.isArray(rects) ? rects : rects ? [rects] : []) as UniApp.NodeInfo[]

        if (!cards.length) {
          resolve(0)
          return
        }

        for (let i = 0; i < cards.length; i++) {
          if (isExcludedTask(colIndex, i, excludeCol, excludeTask)) continue

          const rect = cards[i]
          if (
            rect.top == null ||
            rect.bottom == null ||
            rect.left == null ||
            rect.right == null
          ) {
            continue
          }

          const inCardY = clientY >= rect.top && clientY <= rect.bottom
          const inCardX = clientX >= rect.left && clientX <= rect.right

          if (inCardY && inCardX) {
            const midX = rect.left + (rect.right - rect.left) / 2
            resolve(clientX < midX ? i : i + 1)
            return
          }
        }

        let insertIndex = cards.length
        for (let i = 0; i < cards.length; i++) {
          if (isExcludedTask(colIndex, i, excludeCol, excludeTask)) continue

          const rect = cards[i]
          if (rect.top == null || rect.bottom == null) continue
          const midY = (rect.top + rect.bottom) / 2
          if (clientY < midY) {
            insertIndex = i
            break
          }
        }

        resolve(Math.min(insertIndex, columns.value[colIndex]?.tasks.length ?? insertIndex))
      })
      .exec()
  })
}

const updateDragTarget = async (x: number, y: number) => {
  if (dragMode.value === 'column') {
    const insertIndex = await queryColumnInsertIndex(x, y, dragFromCol.value)
    dragOverColInsertIndex.value = insertIndex
    return
  }

  if (dragMode.value === 'task') {
    const colIndex = await queryColumnIndexAtPoint(x, y)
    if (colIndex === null) return

    dragOverCol.value = colIndex

    const insertIndex = await queryInsertIndexInColumn(
      colIndex,
      x,
      y,
      dragFromCol.value,
      dragFromTask.value,
    )
    dragOverTaskIndex.value = insertIndex
  }
}

const resetDrag = () => {
  stopAutoScroll()
  removeWindowPointerListeners()
  removeWindowMouseListeners()
  removeDocumentTouchListeners()
  if (typeof document !== 'undefined') {
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }
  pendingDrag = null
  activePointerId = null
  const wasColumnDrag = dragMode.value === 'column'
  dragMode.value = 'none'
  dragFromCol.value = null
  dragFromTask.value = null
  dragOverCol.value = null
  dragOverColInsertIndex.value = null
  dragOverTaskIndex.value = null
  dragActive.value = false
  dragGhost.value.visible = false
  columnGhost.value.visible = false
  if (wasColumnDrag || boardHeightLocked.value) {
    unlockBoardHeight()
  }
}

const cancelPendingDrag = () => {
  pendingDrag = null
  if (boardHeightLocked.value) {
    unlockBoardHeight()
  }
}

const activatePendingDrag = () => {
  if (!pendingDrag) return

  if (pendingDrag.type === 'column') {
    dragMode.value = 'column'
    dragFromCol.value = pendingDrag.colIndex
    dragOverColInsertIndex.value = pendingDrag.colIndex
    nextTick(() => lockBoardHeight())
    columnGhost.value.visible = true
  } else {
    dragMode.value = 'task'
    dragFromCol.value = pendingDrag.colIndex
    dragFromTask.value = pendingDrag.taskIndex
    dragOverCol.value = pendingDrag.colIndex
    dragOverTaskIndex.value = pendingDrag.taskIndex
    dragGhost.value.visible = true
  }

  dragActive.value = true
  pendingDrag = null
}

const tryActivatePendingDrag = (e: TouchEvent | MouseEvent | PointerEvent) => {
  if (!pendingDrag || dragActive.value) return false

  const point = getPointFromEvent(e)
  if (!point) return false

  pointerX = point.x
  pointerY = point.y

  const absDx = Math.abs(point.x - dragStartX)
  const absDy = Math.abs(point.y - dragStartY)

  if (absDx < DRAG_THRESHOLD && absDy < DRAG_THRESHOLD) {
    return false
  }

  // 移动端任务拖拽：横向为主则视为滚动；PC 鼠标/触控笔不限制方向
  if (
    pendingDrag.type === 'task' &&
    isTouchLikePointer(e) &&
    absDx > absDy * SCROLL_INTENT_RATIO
  ) {
    cancelPendingDrag()
    removeDocumentTouchListeners()
    return false
  }

  activatePendingDrag()
  onDragMove(e)
  return true
}

const onDocumentTouchMove = (e: TouchEvent) => {
  if (pendingDrag && !dragActive.value) {
    tryActivatePendingDrag(e)
    return
  }
  if (dragActive.value) {
    preventTouchScroll(e)
    onDragMove(e)
  }
}

const onDocumentTouchEnd = (e: TouchEvent) => {
  const point = getPointFromEvent(e)
  if (point) {
    pointerX = point.x
    pointerY = point.y
  }
  if (pendingDrag && !dragActive.value) {
    if (tryOpenPendingTaskTap()) return
    cancelPendingDrag()
    removeDocumentTouchListeners()
    return
  }
  if (dragActive.value) {
    onDragEnd()
  }
  removeDocumentTouchListeners()
}

const onDocumentTouchCancel = () => {
  if (pendingDrag && !dragActive.value) {
    cancelPendingDrag()
    removeDocumentTouchListeners()
    return
  }
  if (dragActive.value) {
    onDragCancel()
  }
  removeDocumentTouchListeners()
}

const onWindowPointerMove = (e: PointerEvent) => {
  if (activePointerId !== null && activePointerId >= 0 && e.pointerId !== activePointerId) return
  if (pendingDrag && !dragActive.value) {
    if (tryActivatePendingDrag(e)) return
  }
  if (dragActive.value) {
    e.preventDefault()
    onDragMove(e)
  }
}

const onWindowPointerUp = (e: PointerEvent) => {
  if (activePointerId !== null && activePointerId >= 0 && e.pointerId !== activePointerId) return
  const point = getPointFromEvent(e)
  if (point) {
    pointerX = point.x
    pointerY = point.y
  }
  if (pendingDrag && !dragActive.value) {
    if (tryOpenPendingTaskTap()) return
    cancelPendingDrag()
    removeWindowPointerListeners()
    return
  }
  if (dragActive.value) {
    onDragEnd()
  }
  removeWindowPointerListeners()
}

const addWindowPointerListeners = (pointerId: number) => {
  if (typeof window === 'undefined') return
  activePointerId = pointerId
  window.addEventListener('pointermove', onWindowPointerMove, true)
  window.addEventListener('pointerup', onWindowPointerUp, true)
  window.addEventListener('pointercancel', onWindowPointerUp, true)
}

const removeWindowPointerListeners = () => {
  if (typeof window === 'undefined') return
  window.removeEventListener('pointermove', onWindowPointerMove, true)
  window.removeEventListener('pointerup', onWindowPointerUp, true)
  window.removeEventListener('pointercancel', onWindowPointerUp, true)
  activePointerId = null
}

const onWindowMouseMove = (e: MouseEvent) => {
  if (e.buttons !== undefined && (e.buttons & 1) === 0) return
  if (pendingDrag && !dragActive.value) {
    if (tryActivatePendingDrag(e)) return
  }
  if (dragActive.value) {
    e.preventDefault()
    onDragMove(e)
  }
}

const onWindowMouseUp = (e: MouseEvent) => {
  const point = getPointFromEvent(e)
  if (point) {
    pointerX = point.x
    pointerY = point.y
  }
  if (pendingDrag && !dragActive.value) {
    if (tryOpenPendingTaskTap()) return
    cancelPendingDrag()
    removeWindowMouseListeners()
    return
  }
  if (dragActive.value) {
    onDragEnd()
  }
  removeWindowMouseListeners()
}

const addWindowMouseListeners = () => {
  if (typeof window === 'undefined') return
  window.addEventListener('mousemove', onWindowMouseMove, true)
  window.addEventListener('mouseup', onWindowMouseUp, true)
}

const removeWindowMouseListeners = () => {
  if (typeof window === 'undefined') return
  window.removeEventListener('mousemove', onWindowMouseMove, true)
  window.removeEventListener('mouseup', onWindowMouseUp, true)
}

const addDocumentTouchListeners = () => {
  if (typeof document === 'undefined') return
  document.addEventListener('touchmove', onDocumentTouchMove, { passive: false })
  document.addEventListener('touchend', onDocumentTouchEnd)
  document.addEventListener('touchcancel', onDocumentTouchCancel)
}

const removeDocumentTouchListeners = () => {
  if (typeof document === 'undefined') return
  document.removeEventListener('touchmove', onDocumentTouchMove)
  document.removeEventListener('touchend', onDocumentTouchEnd)
  document.removeEventListener('touchcancel', onDocumentTouchCancel)
}

const bindDragListeners = (e: TouchEvent | MouseEvent | PointerEvent | Record<string, unknown>) => {
  if (isTouchPointerEvent(e)) {
    addDocumentTouchListeners()
    return
  }
  addWindowMouseListeners()
}

const onColumnDragStart = (colIndex: number, e: TouchEvent | MouseEvent | PointerEvent) => {
  if (pendingDrag || dragActive.value) return

  const point = getPointFromEvent(e)
  const column = columns.value[colIndex]
  if (!point || !column) return

  if (!isTouchPointerEvent(e) && typeof document !== 'undefined') {
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'
  }

  pendingDrag = { type: 'column', colIndex }
  dragActive.value = false
  dragMode.value = 'none'
  dragFromCol.value = colIndex
  dragOverColInsertIndex.value = null
  dragStartX = point.x
  dragStartY = point.y
  pointerX = point.x
  pointerY = point.y

  columnGhost.value = {
    visible: false,
    x: point.x,
    y: point.y,
    title: column.title,
    taskCount: column.tasks.length,
    width: 0,
    height: 0,
  }

  uni
    .createSelectorQuery()
    .in(instance?.proxy ?? undefined)
    .select(`#col-${colIndex}`)
    .boundingClientRect((rect) => {
      const r = Array.isArray(rect) ? rect[0] : rect
      if (r?.width) columnGhost.value.width = r.width
      if (r?.height) columnGhost.value.height = r.height
    })
    .exec()

  bindDragListeners(e)
}

const onTaskDragStart = (colIndex: number, taskIndex: number, e: TouchEvent | MouseEvent | PointerEvent) => {
  if (pendingDrag || dragActive.value) return

  const point = getPointFromEvent(e)
  const task = columns.value[colIndex]?.tasks[taskIndex]
  if (!point || !task) return

  if (!isTouchPointerEvent(e) && typeof document !== 'undefined') {
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'
  }

  pendingDrag = { type: 'task', colIndex, taskIndex }
  dragActive.value = false
  dragMode.value = 'none'
  dragFromCol.value = colIndex
  dragFromTask.value = taskIndex
  dragOverCol.value = colIndex
  dragOverTaskIndex.value = taskIndex
  dragStartX = point.x
  dragStartY = point.y
  pointerX = point.x
  pointerY = point.y

  dragGhost.value = {
    visible: false,
    x: point.x,
    y: point.y,
    name: task.name,
    priority: task.priority,
    width: 0,
  }

  uni
    .createSelectorQuery()
    .in(instance?.proxy ?? undefined)
    .selectAll(`#col-${colIndex} .task-card`)
    .boundingClientRect((rects) => {
      const list = (Array.isArray(rects) ? rects : rects ? [rects] : []) as UniApp.NodeInfo[]
      const r = list[taskIndex]
      if (r?.width) {
        dragGhost.value.width = r.width
      }
    })
    .exec()

  bindDragListeners(e)
}

const onDragMove = (e: TouchEvent | MouseEvent | PointerEvent) => {
  if (!dragActive.value || dragMode.value === 'none') return

  const point = getPointFromEvent(e)
  if (!point) return

  pointerX = point.x
  pointerY = point.y

  if (dragMode.value === 'column') {
    columnGhost.value.x = point.x
    columnGhost.value.y = point.y
    startAutoScroll(point.x)
  }

  if (dragMode.value === 'task') {
    dragGhost.value.x = point.x
    dragGhost.value.y = point.y
    startAutoScroll(point.x)
  }

  updateDragTarget(point.x, point.y)
}

const persistBoardOrder = async () => {
  const payload = buildBoardReorderPayload(columns.value, isDoneColumn)
  const result = await reorderBoard(projectId.value, payload)
  if (!result.ok) {
    uni.showToast({ title: result.message, icon: 'none' })
    columns.value = await loadBoardForProject(projectId.value)
  }
}

const onDragEnd = async () => {
  if (dragMode.value === 'none') return

  stopAutoScroll()

  let shouldPersist = false

  if (dragActive.value) {
    await updateDragTarget(pointerX, pointerY)

    if (
      dragMode.value === 'column' &&
      dragFromCol.value !== null &&
      dragOverColInsertIndex.value !== null
    ) {
      reorderColumnsToIndex(dragFromCol.value, dragOverColInsertIndex.value)
      shouldPersist = true
    }

    if (
      dragMode.value === 'task' &&
      dragFromCol.value !== null &&
      dragFromTask.value !== null &&
      dragOverCol.value !== null &&
      dragOverTaskIndex.value !== null
    ) {
      moveTaskToPosition(
        dragFromCol.value,
        dragFromTask.value,
        dragOverCol.value,
        dragOverTaskIndex.value,
      )
      shouldPersist = true
    }
  }

  resetDrag()

  if (shouldPersist) {
    await persistBoardOrder()
  }
}

const onDragCancel = () => {
  resetDrag()
}

onUnmounted(() => {
  resetDrag()
  // #ifdef H5
  removeH5MouseDrag?.()
  removeH5MouseDrag = null
  // #endif
})
</script>

<style lang="scss" scoped>
.app-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  background: linear-gradient(135deg, #6eb5e8 0%, #8b9fd4 45%, #b8a0d8 100%);
  padding: 32rpx 28rpx 48rpx;
}

.float {
  position: absolute;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12rpx);
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.float-1 { width: 84rpx; height: 84rpx; top: 6%; left: 4%; transform: rotate(15deg); }
.float-2 { width: 64rpx; height: 64rpx; top: 14%; right: 6%; transform: rotate(-10deg); }
.float-3 { width: 104rpx; height: 104rpx; bottom: 10%; left: 8%; transform: rotate(25deg); }
.float-4 { width: 56rpx; height: 56rpx; bottom: 18%; right: 10%; transform: rotate(-20deg); }
.float-5 { width: 76rpx; height: 76rpx; top: 42%; left: 2%; transform: rotate(8deg); opacity: 0.6; }

.page-shell {
  position: relative;
  z-index: 2;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  min-width: 0;
  width: 100%;
  max-width: min(1400px, 100%);
  overflow: hidden;
  box-sizing: border-box;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(36rpx);
  -webkit-backdrop-filter: blur(36rpx);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.08), inset 0 2rpx 0 rgba(255, 255, 255, 0.4);
  border-radius: 28rpx;
}

.nav {
  padding: 18rpx 28rpx;
}

.nav__text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  gap: 16rpx;
  flex-wrap: wrap;
}

.topbar__left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.topbar__folder {
  font-size: 36rpx;
  line-height: 1;
}

.topbar__title {
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: nowrap;
  min-width: 0;
  flex: 1;
  justify-content: flex-end;
}

.action-btn {
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.action-btn__text {
  font-size: 24rpx;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
}

.member-strip {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
  max-width: 320rpx;
  flex: 1 1 auto;
  padding: 8rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.member-strip__avatars {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.member-strip__avatar {
  width: 44rpx;
  height: 44rpx;
  margin-left: -10rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.28);
  border: 2rpx solid rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  &:first-child {
    margin-left: 0;
  }
}

.member-strip__avatar-text {
  font-size: 20rpx;
  color: #fff;
  font-weight: 600;
}

.member-strip__names {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.88);
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(6rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  box-sizing: border-box;
}

.modal {
  width: 100%;
  max-width: 640rpx;
  max-height: 80vh;
  overflow-y: auto;
  padding: 32rpx 28rpx 28rpx;
  box-sizing: border-box;
}

.modal--wide {
  max-width: 720rpx;
}

.modal__title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 28rpx;
}

.modal-section {
  margin-bottom: 28rpx;
}

.modal-section__title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  margin-bottom: 16rpx;
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.modal-field--top {
  align-items: stretch;
}

.modal-field__label {
  font-size: 26rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
}

.modal-field__input,
.modal-field__textarea,
.modal-field__picker,
.modal-field__select {
  width: 100%;
  box-sizing: border-box;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #fff;
  font-size: 26rpx;
}

.modal-field__input {
  height: 80rpx;
  padding: 0 24rpx;
  line-height: 80rpx;
}

.modal-field__textarea {
  min-height: 140rpx;
  padding: 20rpx 24rpx;
  line-height: 1.6;
}

.modal-field__picker {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12rpx;
  width: 100%;
  min-height: 80rpx;
  height: 80rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
  text-align: left;
}

.modal-field__picker-text {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  line-height: 1.4;
  color: #fff;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-field__picker-text--placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.modal-section--invite {
  overflow: visible;
}

.invite-select {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.invite-select__field {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-height: 80rpx;
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.28);
  box-sizing: border-box;
  cursor: pointer;
}

.invite-select__field--open {
  border-color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.18);
}

.invite-select__label {
  flex-shrink: 0;
  font-size: 26rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
}

.invite-select__value {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  line-height: 1.4;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invite-select__value--placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.invite-select__arrow {
  flex-shrink: 0;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.65);
  transition: transform 0.2s ease;
}

.invite-select__arrow--open {
  transform: rotate(180deg);
}

.invite-select__panel {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 12rpx;
  border-radius: 16rpx;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-sizing: border-box;
}

.invite-select__search {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-height: 72rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-sizing: border-box;
}

.invite-select__search-icon {
  flex-shrink: 0;
  font-size: 24rpx;
  line-height: 1;
}

.invite-select__search-input {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  font-size: 26rpx;
  color: #fff;
  background: transparent;
  border: none;
}

.invite-select__search-placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.invite-select__list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  max-height: 360rpx;
  overflow-y: auto;
}

.invite-select__option {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 18rpx;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid transparent;
}

.invite-select__option--selected {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.22);
}

.invite-select__check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 8rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
}

.invite-select__check--checked {
  background: rgba(96, 165, 250, 0.85);
  border-color: rgba(147, 197, 253, 0.95);
}

.invite-select__check-icon {
  font-size: 22rpx;
  color: #fff;
  font-weight: 700;
  line-height: 1;
}

.invite-select__option-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.invite-select__option-avatar-text {
  font-size: 22rpx;
  color: #fff;
  font-weight: 600;
}

.invite-select__option-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.invite-select__option-name {
  font-size: 26rpx;
  color: #fff;
  font-weight: 600;
}

.invite-select__option-meta {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.65);
}

.modal-field__picker-arrow--open {
  transform: rotate(180deg);
}

.modal-field__picker-arrow {
  flex-shrink: 0;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.65);
  transition: transform 0.2s ease;
}

.modal-field__select {
  display: block;
  width: 100%;
  min-height: 80rpx;
  height: 80rpx;
  padding: 0 48rpx 0 24rpx;
  line-height: 1.5;
  text-align: left;
  box-sizing: border-box;
  appearance: none;
  -webkit-appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, rgba(255, 255, 255, 0.65) 50%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.65) 50%, transparent 50%);
  background-position:
    calc(100% - 22rpx) calc(50% - 3rpx),
    calc(100% - 16rpx) calc(50% - 3rpx);
  background-size: 6rpx 6rpx, 6rpx 6rpx;
  background-repeat: no-repeat;
  cursor: pointer;
}

.modal-field__select option {
  color: #1e293b;
  background: #fff;
}

.modal-field__placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 8rpx;
}

.modal-empty,
.modal-tip {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
}

.modal-tip {
  margin-top: 12rpx;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  max-height: 360rpx;
  overflow-y: auto;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 18rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.member-row__avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-row__avatar-text {
  font-size: 24rpx;
  color: #fff;
  font-weight: 600;
}

.member-row__info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.member-row__name {
  font-size: 26rpx;
  color: #fff;
  font-weight: 600;
}

.member-row__role {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.65);
}

.action-btn--block {
  display: flex;
  justify-content: center;
  margin-top: 16rpx;
  width: 100%;
  box-sizing: border-box;
}

.action-btn--disabled {
  opacity: 0.45;
  pointer-events: none;
}

.board {
  padding: 28rpx 0 32rpx;
  min-height: 520rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  width: 100%;
}

.board-toolbar {
  padding: 0 28rpx 20rpx;
  flex-shrink: 0;
}

.board-scroll {
  display: block;
  width: 100%;
  max-width: 100%;
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.65) rgba(255, 255, 255, 0.18);
  min-height: 320rpx;
  padding-bottom: 14rpx;
  box-sizing: border-box;
  scrollbar-gutter: stable;

  &::-webkit-scrollbar {
    height: 10rpx;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.72);
    border-radius: 999rpx;
    min-width: 40px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.22);
    border-radius: 999rpx;
    margin: 0 28rpx;
  }
}

.board-columns {
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 20rpx;
  padding: 0 28rpx 16rpx;
  box-sizing: border-box;
  width: max-content;
  min-height: 320rpx;
  vertical-align: top;
  position: relative;
}

.kanban-column-slot {
  flex: 0 0 520rpx;
  width: 520rpx;
  min-width: 520rpx;
  max-width: 520rpx;
  align-self: stretch;
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.kanban-column-slot--dragging {
  position: absolute !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  height: 0 !important;
  overflow: hidden;
  flex: 0 0 0 !important;
  padding: 0;
  margin: 0;
  border: none;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}

.kanban-column {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  min-height: 320rpx;
  padding: 24rpx 20rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  box-sizing: border-box;
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.kanban-column__delete {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  z-index: 3;
  width: 44rpx;
  height: 44rpx;
  border-radius: 10rpx;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.kanban-column__delete-icon {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1;
  font-weight: 600;
}

.kanban-column--dragging {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100% !important;
  min-height: 100% !important;
  opacity: 0;
  overflow: hidden;
  border-color: transparent;
  pointer-events: none;
  z-index: -1;
}

.column-placeholder {
  flex-shrink: 0;
  width: 0;
  align-self: stretch;
  border-radius: 24rpx;
  border: 2rpx solid transparent;
  background: transparent;
  opacity: 0;
  overflow: hidden;
  box-sizing: border-box;
  transition:
    width 0.24s cubic-bezier(0.2, 0, 0, 1),
    opacity 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.column-placeholder--active {
  flex: 0 0 520rpx;
  width: 520rpx;
  min-width: 520rpx;
  max-width: 520rpx;
  opacity: 1;
  border-color: rgba(255, 255, 255, 0.75);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.28) 0%,
    rgba(255, 255, 255, 0.12) 100%
  );
  box-shadow:
    0 0 0 1rpx rgba(255, 255, 255, 0.25),
    0 8rpx 32rpx rgba(255, 255, 255, 0.12),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.35);
}

.kanban-column--task-over {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.42);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.2);
}

.kanban-column__head {
  display: flex;
  align-items: center;
  gap: 8rpx;
  cursor: grab;
  user-select: none;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
}

.kanban-column__drag {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1;
  flex-shrink: 0;
}

.kanban-column__pin {
  font-size: 28rpx;
  line-height: 1;
}

.kanban-column__title {
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
}

.kanban-column__count {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.65);
  margin-top: -8rpx;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  flex: 1;
  min-height: 80rpx;
}

.task-placeholder {
  flex-shrink: 0;
  height: 0;
  margin: 0;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  background: transparent;
  overflow: hidden;
  opacity: 0;
  transition:
    height 0.24s cubic-bezier(0.2, 0, 0, 1),
    margin 0.24s cubic-bezier(0.2, 0, 0, 1),
    opacity 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.task-placeholder--active {
  height: 72rpx;
  margin-bottom: 0;
  opacity: 1;
  border-color: rgba(255, 255, 255, 0.75);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.28) 0%,
    rgba(255, 255, 255, 0.14) 100%
  );
  box-shadow:
    0 0 0 1rpx rgba(255, 255, 255, 0.25),
    0 8rpx 24rpx rgba(255, 255, 255, 0.12),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.35);
}

.task-card {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 18rpx 16rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  cursor: grab;
  user-select: none;
  touch-action: none;
  transition:
    height 0.22s cubic-bezier(0.2, 0, 0, 1),
    padding 0.22s cubic-bezier(0.2, 0, 0, 1),
    margin 0.22s cubic-bezier(0.2, 0, 0, 1),
    opacity 0.18s ease,
    transform 0.18s ease,
    border-color 0.18s ease;
}

.task-card--dragging {
  height: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin: 0 !important;
  opacity: 0;
  overflow: hidden;
  border-color: transparent;
  pointer-events: none;
}

.task-card__priority {
  flex-shrink: 0;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  box-shadow: 0 0 0 2rpx rgba(255, 255, 255, 0.35);
}

.task-card__priority--high {
  background: #ff6b7a;
}

.task-card__priority--medium {
  background: #ffc857;
}

.task-card__priority--low {
  background: #6ee7a0;
}

.task-card__name {
  font-size: 26rpx;
  color: #fff;
  flex: 1;
}

.task-card__name--done {
  color: rgba(255, 255, 255, 0.65);
  text-decoration: line-through;
}

.ghost-btn {
  display: inline-flex;
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.15);
  border: 1px dashed rgba(255, 255, 255, 0.5);
}

.ghost-btn--sm {
  justify-content: center;
  margin-top: 8rpx;
}

.ghost-btn__text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.drag-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  touch-action: none;
}

.column-drag-ghost {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 24rpx 20rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(18rpx);
  -webkit-backdrop-filter: blur(18rpx);
  border: 1px solid rgba(255, 255, 255, 0.6);
  pointer-events: none;
  transform: translate(-50%, -50%) scale(0.9);
  transition: transform 0.18s cubic-bezier(0.2, 0, 0, 1), width 0.18s ease, box-shadow 0.18s ease;
  box-sizing: border-box;
  box-shadow:
    0 2rpx 8rpx rgba(0, 0, 0, 0.12),
    0 12rpx 36rpx rgba(0, 0, 0, 0.24),
    0 28rpx 64rpx rgba(0, 0, 0, 0.18),
    0 0 0 1rpx rgba(255, 255, 255, 0.2);
}

.column-drag-ghost__head {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.column-drag-ghost__pin {
  font-size: 28rpx;
  line-height: 1;
}

.column-drag-ghost__title {
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
}

.column-drag-ghost__count {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
}

.drag-ghost {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 14rpx 14rpx;
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.38);
  backdrop-filter: blur(16rpx);
  -webkit-backdrop-filter: blur(16rpx);
  border: 1px solid rgba(255, 255, 255, 0.65);
  pointer-events: none;
  transform: translate(-50%, -50%) scale(0.9);
  transition: transform 0.18s cubic-bezier(0.2, 0, 0, 1), width 0.18s ease, box-shadow 0.18s ease;
  box-sizing: border-box;
  box-shadow:
    0 2rpx 8rpx rgba(0, 0, 0, 0.12),
    0 12rpx 32rpx rgba(0, 0, 0, 0.22),
    0 24rpx 56rpx rgba(0, 0, 0, 0.16),
    0 0 0 1rpx rgba(255, 255, 255, 0.2);
}

.drag-ghost__priority {
  flex-shrink: 0;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  box-shadow: 0 0 0 2rpx rgba(255, 255, 255, 0.45);
}

.drag-ghost__priority--high {
  background: #ff6b7a;
}

.drag-ghost__priority--medium {
  background: #ffc857;
}

.drag-ghost__priority--low {
  background: #6ee7a0;
}

.drag-ghost__name {
  font-size: 24rpx;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 768px) {
  .app-page { padding: 24px 32px 40px; }
  .page-shell { gap: 12px; }
  .glass-panel { border-radius: 16px; }

  .nav { padding: 10px 20px; }
  .nav__text { font-size: 13px; cursor: pointer; }

  .topbar { padding: 14px 20px; }
  .topbar__folder { font-size: 20px; }
  .topbar__title { font-size: 18px; }
  .action-btn { padding: 6px 12px; flex-shrink: 0; }
  .action-btn__text { font-size: 12px; }
  .member-strip { max-width: 220px; padding: 4px 8px; gap: 6px; }
  .member-strip__avatar { width: 24px; height: 24px; margin-left: -6px; border-width: 1px; }
  .member-strip__avatar-text { font-size: 11px; }
  .member-strip__names { font-size: 12px; }
  .modal { max-width: 420px; padding: 20px 18px 18px; border-radius: 16px; }
  .modal--wide { max-width: 480px; }
  .modal__title { font-size: 18px; margin-bottom: 16px; }
  .modal-field__input { height: 40px; line-height: 40px; font-size: 13px; padding: 0 12px; }
  .modal-field__textarea { min-height: 88px; padding: 10px 12px; font-size: 13px; }
  .modal-field__select,
  .modal-field__picker {
    min-height: 40px;
    height: 40px;
    padding: 0 32px 0 12px;
    font-size: 13px;
  }
  .modal-field__picker-text { font-size: 13px; line-height: 1.4; }
  .member-row { padding: 10px 12px; border-radius: 10px; }
  .member-row__avatar { width: 32px; height: 32px; }
  .member-row__avatar-text { font-size: 13px; }
  .member-row__name { font-size: 14px; }
  .member-row__role { font-size: 11px; }
  .invite-select__field { min-height: 40px; padding: 8px 12px; border-radius: 10px; }
  .invite-select__label { font-size: 13px; }
  .invite-select__value { font-size: 13px; }
  .invite-select__search { min-height: 36px; padding: 0 10px; }
  .invite-select__search-input { height: 36px; font-size: 13px; }
  .invite-select__option { padding: 10px 12px; border-radius: 8px; }
  .invite-select__check { width: 18px; height: 18px; border-radius: 4px; }
  .invite-select__check-icon { font-size: 12px; }
  .invite-select__option-avatar { width: 28px; height: 28px; }
  .invite-select__option-avatar-text { font-size: 12px; }
  .invite-select__option-name { font-size: 14px; }
  .invite-select__option-meta { font-size: 11px; }

  .board { padding: 16px 0 20px; min-height: 420px; }

  .board-toolbar { padding: 0 20px 12px; }

  .board-scroll {
    min-height: 320px;
    overflow-x: scroll;
    padding-bottom: 18px;
    scrollbar-gutter: stable;
  }

  .board-scroll::-webkit-scrollbar {
    height: 12px;
    -webkit-appearance: none;
  }

  .board-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.82);
    border-radius: 999px;
    min-width: 48px;
    border: 2px solid rgba(255, 255, 255, 0.15);
  }

  .board-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.28);
    margin: 0 20px;
    border-radius: 999px;
  }

  .board-scroll::-webkit-scrollbar-button {
    width: 0;
    height: 0;
    display: none;
  }

  .board-columns {
    gap: 14px;
    padding: 0 20px 12px;
    min-height: 320px;
  }

  .kanban-column-slot {
    flex: 0 0 280px;
    width: 280px;
    min-width: 280px;
    max-width: 280px;
  }

  .kanban-column {
    padding: 14px 12px 12px;
    border-radius: 12px;
    gap: 10px;
    min-height: 320px;
  }

  .kanban-column__delete {
    top: 8px;
    right: 8px;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    cursor: pointer;
  }

  .kanban-column__delete-icon {
    font-size: 11px;
  }

  .column-placeholder--active {
    flex: 0 0 280px;
    width: 280px;
    min-width: 280px;
    max-width: 280px;
  }

  .column-drag-ghost {
    padding: 14px 12px 12px;
    border-radius: 12px;
    gap: 10px;
  }

  .column-drag-ghost__pin { font-size: 14px; }
  .column-drag-ghost__title { font-size: 15px; }
  .column-drag-ghost__count { font-size: 11px; }

  .kanban-column__drag { font-size: 14px; }
  .kanban-column__pin { font-size: 14px; }
  .kanban-column__title { font-size: 15px; }
  .kanban-column__count { font-size: 11px; }

  .task-placeholder--active {
    height: 44px;
  }

  .task-card {
    padding: 10px 12px;
    border-radius: 8px;
    gap: 8px;
  }

  .task-card__priority { width: 8px; height: 8px; }
  .task-card__name { font-size: 13px; }

  .ghost-btn { padding: 6px 12px; }
  .ghost-btn__text { font-size: 12px; }

  .drag-ghost {
    padding: 8px 10px;
    border-radius: 8px;
    gap: 8px;
  }

  .drag-ghost__priority { width: 8px; height: 8px; }
  .drag-ghost__name { font-size: 12px; }

  .float-1 { width: 70px; height: 70px; }
  .float-2 { width: 50px; height: 50px; }
  .float-3 { width: 90px; height: 90px; }
  .float-4 { width: 45px; height: 45px; }
  .float-5 { width: 60px; height: 60px; }
}
</style>
