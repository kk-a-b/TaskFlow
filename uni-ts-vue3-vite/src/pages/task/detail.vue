<template>
  <view class="app-page">
    <view class="float float-1" />
    <view class="float float-2" />
    <view class="float float-3" />
    <view class="float float-4" />
    <view class="float float-5" />

    <view class="page-shell">
      <view class="nav glass-panel" @tap="goBack">
        <text class="nav__text">← 返回项目</text>
      </view>

      <view class="topbar glass-panel">
        <view class="topbar__left">
          <text class="topbar__icon">📝</text>
          <text class="topbar__title">{{ pageTitle }}</text>
        </view>
        <view class="topbar__right">
          <text class="topbar__project">{{ projectName }}</text>
        </view>
      </view>

      <view class="main glass-panel">
        <view class="form">
          <view class="form-row">
            <text class="form-label">任务标题</text>
            <view class="form-control">
              <input
                v-model="form.title"
                class="form-input"
                type="text"
                placeholder="请输入任务标题"
                placeholder-class="form-placeholder"
                :disabled="!canEdit"
              />
            </view>
          </view>

          <view class="form-row form-row--top">
            <text class="form-label">任务描述</text>
            <view class="form-control">
              <textarea
                v-model="form.description"
                class="form-textarea"
                placeholder="请输入任务描述"
                placeholder-class="form-placeholder"
                :maxlength="-1"
                auto-height
                :disabled="!canEdit"
              />
            </view>
          </view>

          <view class="form-row">
            <text class="form-label">指派人</text>
            <view class="form-control">
              <view class="assignee-select" @tap.stop="toggleAssigneeDropdown">
                <view class="form-picker assignee-select__trigger">
                  <text
                    class="form-picker__text"
                    :class="{ 'form-picker__text--placeholder': !selectedAssigneeLabel }"
                  >
                    {{ selectedAssigneeLabel || '请选择指派人' }}
                  </text>
                  <text
                    class="form-picker__arrow"
                    :class="{ 'form-picker__arrow--open': showAssigneeDropdown }"
                  >
                    ▾
                  </text>
                </view>
                <view v-if="showAssigneeDropdown && canEdit" class="assignee-select__panel">
                  <view
                    v-for="option in assigneeOptions"
                    :key="option.id || 'none'"
                    class="assignee-select__option"
                    :class="{ 'assignee-select__option--active': form.assigneeId === option.id }"
                    @tap.stop="selectAssignee(option.id)"
                  >
                    <text class="assignee-select__option-text">{{ option.label }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view class="form-row form-row--top">
            <text class="form-label">优先级</text>
            <view class="form-control">
              <view class="priority-group">
                <view
                  v-for="item in priorityOptions"
                  :key="item.value"
                  class="priority-chip"
                  :class="{
                    'priority-chip--active': form.priority === item.value,
                    'priority-chip--disabled': !canEdit,
                  }"
                  @tap="setPriority(item.value)"
                >
                  <text class="priority-chip__dot" :class="`priority-chip__dot--${item.value}`">●</text>
                  <text class="priority-chip__text">{{ item.label }}</text>
                </view>
              </view>
            </view>
          </view>

          <view class="form-row">
            <text class="form-label">截止日期</text>
            <view class="form-control">
              <picker
                mode="date"
                :value="form.deadline"
                :disabled="!canEdit"
                @change="onDeadlineChange"
              >
                <view class="form-picker">
                  <text
                    class="form-picker__text"
                    :class="{ 'form-picker__text--placeholder': !form.deadline }"
                  >
                    {{ form.deadline || '请选择日期' }}
                  </text>
                  <text class="form-picker__arrow">▾</text>
                </view>
              </picker>
            </view>
          </view>

          <view class="form-row">
            <text class="form-label">当前状态</text>
            <view class="form-control">
              <view class="assignee-select" @tap.stop="toggleStatusDropdown">
                <view class="form-picker assignee-select__trigger">
                  <text class="form-picker__text">{{ form.status }}</text>
                  <text
                    class="form-picker__arrow"
                    :class="{ 'form-picker__arrow--open': showStatusDropdown }"
                  >
                    ▾
                  </text>
                </view>
                <view v-if="showStatusDropdown && canEdit" class="assignee-select__panel">
                  <view
                    v-for="status in statusOptions"
                    :key="status"
                    class="assignee-select__option"
                    :class="{ 'assignee-select__option--active': form.status === status }"
                    @tap.stop="selectStatus(status)"
                  >
                    <text class="assignee-select__option-text">{{ status }}</text>
                  </view>
                </view>
              </view>
              <text class="form-hint">修改状态后，任务将移动到对应列表</text>
            </view>
          </view>
        </view>

        <view class="detail-actions">
          <view
            v-if="canDelete && !isCreateMode"
            class="ghost-btn"
            @tap="handleDelete"
          >
            <text class="ghost-btn__text">删除任务</text>
          </view>
          <view
            class="action-btn"
            :class="{ 'action-btn--disabled': !canEdit }"
            @tap="handleSave"
          >
            <text class="action-btn__text">{{ isCreateMode ? '创建任务' : '保存修改' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getCurrentUser } from '@/utils/session'
import {
  getTaskDetail,
  getTaskAssigneeOptions,
  updateTask,
  createTask,
  deleteTask,
  canEditTask,
  canCreateTask,
  canDeleteTask,
  TASK_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  type TaskPriority,
} from '@/utils/task-service'

const taskId = ref('')
const projectId = ref('')
const columnId = ref('')
const projectName = ref('项目')
const isCreateMode = ref(false)
const canEdit = ref(true)
const canDelete = ref(false)
const showAssigneeDropdown = ref(false)
const showStatusDropdown = ref(false)
const assigneeOptions = ref<{ id: string; label: string }[]>([{ id: '', label: '未指派' }])

const form = ref({
  title: '',
  description: '',
  assigneeId: '' as string,
  priority: 'medium' as TaskPriority,
  deadline: '',
  status: '待办',
})

const statusOptions = [...TASK_STATUS_OPTIONS]
const priorityOptions = TASK_PRIORITY_OPTIONS

const pageTitle = computed(() => {
  if (isCreateMode.value) return form.value.title || '新建任务'
  return form.value.title || '任务详情'
})

const selectedAssigneeLabel = computed(() => {
  const option = assigneeOptions.value.find((item) => item.id === form.value.assigneeId)
  return option?.label || ''
})

const loadTask = async () => {
  if (!taskId.value) return
  const detail = await getTaskDetail(taskId.value)
  if (!detail) {
    uni.showToast({ title: '任务不存在', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 800)
    return
  }

  const { task } = detail
  projectId.value = task.projectId
  projectName.value = detail.projectName
  assigneeOptions.value = await getTaskAssigneeOptions(task.projectId)

  form.value = {
    title: task.name,
    description: task.description || '',
    assigneeId: task.assigneeId || '',
    priority: task.priority || 'medium',
    deadline: task.deadline || '',
    status: task.status || '待办',
  }

  const user = getCurrentUser()
  canEdit.value = user ? await canEditTask(user.id, task.id) : false
  canDelete.value = user ? canDeleteTask(user) : false
}

const readQueryValue = (value: unknown): string => {
  if (Array.isArray(value)) return decodeURIComponent(String(value[0] || ''))
  if (value === undefined || value === null) return ''
  return decodeURIComponent(String(value))
}

const initCreateForm = async (query: Record<string, string | undefined>) => {
  if (!projectId.value) {
    uni.showToast({ title: '缺少项目信息', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 800)
    return
  }

  columnId.value = readQueryValue(query.columnId)
  const statusFromQuery = readQueryValue(query.status) || '待办'

  assigneeOptions.value = await getTaskAssigneeOptions(projectId.value)
  form.value = {
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium',
    deadline: '',
    status: statusFromQuery,
  }

  const user = getCurrentUser()
  canEdit.value = user ? await canCreateTask(user.id, projectId.value) : false
  canDelete.value = false
}

onLoad((query) => {
  taskId.value = readQueryValue(query?.id)
  projectId.value = readQueryValue(query?.projectId)
  isCreateMode.value = query?.mode === 'create'
  if (query?.projectName) {
    projectName.value = readQueryValue(query.projectName)
  }
  if (isCreateMode.value) {
    void initCreateForm(query as Record<string, string | undefined>)
    return
  }
  if (!taskId.value) {
    uni.showToast({ title: '任务不存在', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 800)
    return
  }
  void loadTask()
})

const closeDropdowns = () => {
  showAssigneeDropdown.value = false
  showStatusDropdown.value = false
}

const toggleAssigneeDropdown = () => {
  if (!canEdit.value) return
  showAssigneeDropdown.value = !showAssigneeDropdown.value
  if (showAssigneeDropdown.value) showStatusDropdown.value = false
}

const toggleStatusDropdown = () => {
  if (!canEdit.value) return
  showStatusDropdown.value = !showStatusDropdown.value
  if (showStatusDropdown.value) showAssigneeDropdown.value = false
}

const selectAssignee = (assigneeId: string) => {
  form.value.assigneeId = assigneeId
  showAssigneeDropdown.value = false
}

const selectStatus = (status: string) => {
  form.value.status = status
  showStatusDropdown.value = false
}

const setPriority = (priority: TaskPriority) => {
  if (!canEdit.value) return
  form.value.priority = priority
}

const onDeadlineChange = (event: { detail: { value: string } }) => {
  form.value.deadline = event.detail.value
}

const handleSave = async () => {
  if (!canEdit.value) {
    uni.showToast({
      title: isCreateMode.value ? '无权限创建任务' : '无权限编辑该任务',
      icon: 'none',
    })
    return
  }
  const user = getCurrentUser()
  if (!user) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  const payload = {
    name: form.value.title.trim(),
    description: form.value.description,
    assigneeId: form.value.assigneeId || null,
    priority: form.value.priority,
    deadline: form.value.deadline,
    status: form.value.status,
  }

  if (!payload.name) {
    uni.showToast({ title: '请输入任务标题', icon: 'none' })
    return
  }

  if (isCreateMode.value && !projectId.value) {
    uni.showToast({ title: '缺少项目信息', icon: 'none' })
    return
  }

  const result = isCreateMode.value
    ? await createTask(projectId.value, { ...payload, columnId: columnId.value })
    : await updateTask(taskId.value, payload)

  if (!result.ok) {
    uni.showToast({ title: result.message, icon: 'none' })
    return
  }

  uni.showToast({ title: result.message, icon: 'success' })
  setTimeout(() => uni.navigateBack(), 500)
}

const handleDelete = () => {
  if (!canDelete.value) {
    uni.showToast({ title: '无权限删除任务', icon: 'none' })
    return
  }
  const user = getCurrentUser()
  if (!user) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  uni.showModal({
    title: '删除任务',
    content: '确定要删除这个任务吗？',
    success: (res) => {
      if (!res.confirm) return
      void (async () => {
        const result = await deleteTask(taskId.value)
        if (!result.ok) {
          uni.showToast({ title: result.message, icon: 'none' })
          return
        }
        uni.showToast({ title: result.message, icon: 'success' })
        setTimeout(() => uni.navigateBack(), 500)
      })()
    },
  })
}

const goBack = () => {
  closeDropdowns()
  uni.navigateBack()
}
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
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
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
  min-width: 0;
  flex: 1;
}

.topbar__icon {
  font-size: 36rpx;
  line-height: 1;
  flex-shrink: 0;
}

.topbar__title {
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar__right {
  flex-shrink: 0;
}

.topbar__project {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
  white-space: nowrap;
}

.main {
  padding: 28rpx 28rpx 32rpx;
  min-height: 480rpx;
  box-sizing: border-box;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.form-row--top {
  align-items: stretch;
}

.form-label {
  flex-shrink: 0;
  font-size: 26rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.4;
}

.form-control {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.form-input,
.form-textarea,
.form-picker {
  width: 100%;
  box-sizing: border-box;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #fff;
  font-size: 26rpx;
}

.form-input {
  height: 80rpx;
  padding: 0 24rpx;
  line-height: 80rpx;
}

.form-textarea {
  min-height: 160rpx;
  padding: 20rpx 24rpx;
  line-height: 1.6;
}

.form-placeholder {
  color: rgba(255, 255, 255, 0.45);
  font-size: 26rpx;
}

.form-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80rpx;
  height: 80rpx;
  padding: 0 24rpx;
}

.form-picker__text {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  line-height: 1.4;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-picker__text--placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.form-picker__arrow {
  flex-shrink: 0;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1;
  transition: transform 0.2s ease;
}

.form-picker__arrow--open {
  transform: rotate(180deg);
}

.form-hint {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.5;
}

.assignee-select {
  position: relative;
}

.assignee-select__trigger {
  cursor: pointer;
}

.assignee-select__panel {
  margin-top: 10rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 8rpx;
  border-radius: 16rpx;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-sizing: border-box;
}

.assignee-select__option {
  padding: 18rpx 20rpx;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.08);
}

.assignee-select__option--active {
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.28);
}

.assignee-select__option-text {
  font-size: 26rpx;
  color: #fff;
}

.priority-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.priority-chip {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.22);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.priority-chip--active {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.55);
}

.priority-chip--disabled {
  opacity: 0.55;
  pointer-events: none;
}

.priority-chip__dot {
  font-size: 20rpx;
  line-height: 1;
}

.priority-chip__dot--high { color: #ff6b7a; }
.priority-chip__dot--medium { color: #ffc857; }
.priority-chip__dot--low { color: #6ee7a0; }

.priority-chip__text {
  font-size: 26rpx;
  color: #fff;
  font-weight: 500;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16rpx;
  margin-top: 36rpx;
  padding-top: 28rpx;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-sizing: border-box;
}

.action-btn--disabled {
  opacity: 0.45;
  pointer-events: none;
}

.action-btn__text {
  font-size: 24rpx;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.15);
  border: 1px dashed rgba(255, 255, 255, 0.5);
  box-sizing: border-box;
}

.ghost-btn__text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .app-page {
    padding: 24px 32px 40px;
  }

  .page-shell {
    gap: 12px;
  }

  .glass-panel {
    border-radius: 16px;
  }

  .nav {
    padding: 10px 20px;
  }

  .nav__text {
    font-size: 13px;
    cursor: pointer;
  }

  .topbar {
    padding: 14px 20px;
  }

  .topbar__icon {
    font-size: 20px;
  }

  .topbar__title {
    font-size: 18px;
  }

  .topbar__project {
    font-size: 12px;
  }

  .main {
    padding: 20px 24px 28px;
    min-height: 360px;
  }

  .form {
    gap: 18px;
    max-width: 960px;
  }

  .form-row {
    flex-direction: row;
    align-items: flex-start;
    gap: 20px;
  }

  .form-row--top {
    align-items: flex-start;
  }

  .form-label {
    width: 96px;
    padding-top: 10px;
    font-size: 13px;
    text-align: right;
    flex-shrink: 0;
  }

  .form-control {
    flex: 1;
    min-width: 0;
  }

  .form-input {
    height: 40px;
    padding: 0 14px;
    line-height: 40px;
    font-size: 13px;
    border-radius: 8px;
  }

  .form-textarea {
    min-height: 96px;
    padding: 10px 14px;
    font-size: 13px;
    border-radius: 8px;
  }

  .form-placeholder {
    font-size: 13px;
  }

  .form-picker {
    min-height: 40px;
    height: 40px;
    padding: 0 14px;
    border-radius: 8px;
  }

  .form-picker__text {
    font-size: 13px;
  }

  .form-picker__arrow {
    font-size: 11px;
  }

  .form-hint {
    font-size: 11px;
  }

  .assignee-select__option {
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
  }

  .assignee-select__option-text {
    font-size: 13px;
  }

  .priority-chip {
    padding: 7px 14px;
    cursor: pointer;
  }

  .priority-chip--disabled {
    cursor: not-allowed;
  }

  .priority-chip__dot {
    font-size: 10px;
  }

  .priority-chip__text {
    font-size: 13px;
  }

  .detail-actions {
    margin-top: 24px;
    padding-top: 20px;
    gap: 12px;
    max-width: 960px;
    margin-left: 116px;
    padding-left: 0;
    padding-right: 0;
  }

  .action-btn {
    padding: 6px 16px;
    cursor: pointer;
  }

  .action-btn__text {
    font-size: 12px;
  }

  .ghost-btn {
    padding: 6px 16px;
    cursor: pointer;
  }

  .ghost-btn__text {
    font-size: 12px;
  }

  .float-1 { width: 70px; height: 70px; }
  .float-2 { width: 50px; height: 50px; }
  .float-3 { width: 90px; height: 90px; }
  .float-4 { width: 45px; height: 45px; }
  .float-5 { width: 60px; height: 60px; }
}

@media (min-width: 1200px) {
  .form {
    max-width: 1080px;
  }

  .detail-actions {
    max-width: 1080px;
  }
}
</style>
