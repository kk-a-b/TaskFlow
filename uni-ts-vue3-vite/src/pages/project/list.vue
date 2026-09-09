<template>
  <view class="app-page">
    <view class="float float-1" />
    <view class="float float-2" />
    <view class="float float-3" />
    <view class="float float-4" />
    <view class="float float-5" />

    <view class="page-shell">
      <view class="topbar glass-panel">
        <view class="topbar__left">
          <view class="topbar__icon">📋</view>
          <text class="topbar__title">我的看板</text>
        </view>
        <view class="topbar__right">
          <view class="avatar">
            <text class="avatar__text">{{ currentUser?.avatar || 'U' }}</text>
          </view>
          <text class="logout-btn" @tap="handleLogout">退出</text>
        </view>
      </view>

      <view class="main glass-panel">
        <view v-if="isAdmin" class="toolbar">
          <view class="create-btn" @tap="openCreateModal">
            <text class="create-btn__icon">+</text>
            <text class="create-btn__text">新建项目</text>
          </view>
        </view>

        <view class="project-grid">
          <view
            v-for="item in projects"
            :key="item.id"
            class="project-card"
            @tap="openProject(item)"
          >
            <view class="project-card__head">
              <text class="project-card__folder">📁</text>
              <text class="project-card__name">{{ item.name }}</text>
            </view>
            <text v-if="item.description" class="project-card__desc">{{ item.description }}</text>
            <text class="project-card__status">{{ item.status }}</text>
            <text class="project-card__meta">负责人：{{ item.ownerName }}</text>
            <text class="project-card__time">最后更新：{{ item.updatedAt }}</text>
          </view>
        </view>

        <view v-if="!projects.length" class="empty-tip">
          <text class="empty-tip__text">暂无项目</text>
        </view>
      </view>
    </view>

    <view v-if="showCreateModal" class="modal-mask" @tap="closeCreateModal">
      <view class="modal glass-panel" @tap.stop>
        <text class="modal__title">新建项目</text>

        <view class="modal-field">
          <text class="modal-field__label">项目名称</text>
          <input
            v-model="createForm.name"
            class="modal-field__input"
            type="text"
            placeholder="请输入项目名称"
            placeholder-class="modal-field__placeholder"
          />
        </view>

        <view class="modal-field modal-field--top">
          <text class="modal-field__label">项目描述</text>
          <textarea
            v-model="createForm.description"
            class="modal-field__textarea"
            placeholder="请输入项目描述"
            placeholder-class="modal-field__placeholder"
            :maxlength="-1"
            auto-height
          />
        </view>

        <view class="modal-field">
          <text class="modal-field__label">项目负责人</text>
          <!-- #ifdef H5 -->
          <select
            v-model="createForm.ownerId"
            class="modal-field__select"
          >
            <option disabled value="">请选择负责人</option>
            <option
              v-for="manager in managers"
              :key="manager.id"
              :value="manager.id"
            >
              {{ formatManagerLabel(manager) }}
            </option>
          </select>
          <!-- #endif -->
          <!-- #ifndef H5 -->
          <picker
            mode="selector"
            :range="managerOptions"
            range-key="label"
            :value="ownerPickerIndex"
            @change="onOwnerChange"
          >
            <view class="modal-field__picker">
              <text
                class="modal-field__picker-text"
                :class="{ 'modal-field__picker-text--placeholder': !selectedManager }"
              >
                {{ selectedManager ? formatManagerLabel(selectedManager) : '请选择负责人' }}
              </text>
              <text class="modal-field__picker-arrow">▾</text>
            </view>
          </picker>
          <!-- #endif -->
        </view>

        <view class="modal-actions">
          <view class="ghost-btn" @tap="closeCreateModal">
            <text class="ghost-btn__text">取消</text>
          </view>
          <view class="action-btn" @tap="submitCreateProject">
            <text class="action-btn__text">创建</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, clearSession, type SessionUser } from '@/utils/session'
import {
  loadProjectsForCurrentUser,
  getProjectManagers,
  canAdminCreateProject,
  createProject,
  type ProjectListItem,
} from '@/utils/project-service'

const currentUser = ref<SessionUser | null>(null)
const projects = ref<ProjectListItem[]>([])
const showCreateModal = ref(false)
const managers = ref<Awaited<ReturnType<typeof getProjectManagers>>>([])

const createForm = ref({
  name: '',
  description: '',
  ownerId: '',
})

const isAdmin = computed(() => canAdminCreateProject(currentUser.value))

const formatManagerLabel = (manager: { displayName: string; username?: string }) =>
  manager.username ? `${manager.displayName}（${manager.username}）` : manager.displayName

const managerOptions = computed(() =>
  managers.value.map((m) => ({
    id: m.id,
    label: formatManagerLabel(m),
  })),
)

const selectedManager = computed(() =>
  managers.value.find((m) => m.id === createForm.value.ownerId) || null,
)

const ownerPickerIndex = computed(() => {
  if (!createForm.value.ownerId) return 0
  const idx = managerOptions.value.findIndex((m) => m.id === createForm.value.ownerId)
  return idx >= 0 ? idx : 0
})

const refreshPage = async () => {
  currentUser.value = getCurrentUser()
  if (!currentUser.value) return

  try {
    projects.value = await loadProjectsForCurrentUser()
    if (canAdminCreateProject(currentUser.value)) {
      managers.value = await getProjectManagers()
    }
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '加载项目失败',
      icon: 'none',
    })
  }
}

onShow(() => {
  const user = getCurrentUser()
  if (!user) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  void refreshPage()
})

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    description: '',
    ownerId: '',
  }
}

const openCreateModal = () => {
  if (!isAdmin.value) return
  resetCreateForm()
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const onOwnerChange = (e: { detail: { value: string } }) => {
  const index = Number(e.detail.value)
  const option = managerOptions.value[index]
  createForm.value.ownerId = option?.id || ''
}

const submitCreateProject = async () => {
  if (!createForm.value.ownerId) {
    uni.showToast({ title: '请选择项目负责人', icon: 'none' })
    return
  }

  const owner = managers.value.find((m) => m.id === createForm.value.ownerId)
  if (!owner) {
    uni.showToast({ title: '请选择项目负责人', icon: 'none' })
    return
  }

  const result = await createProject({
    name: createForm.value.name,
    description: createForm.value.description,
    ownerId: owner.id,
  })

  if (!result.ok) {
    uni.showToast({ title: result.message, icon: 'none' })
    return
  }

  await refreshPage()
  closeCreateModal()
  uni.showToast({ title: '项目创建成功', icon: 'success' })
}

const handleLogout = () => {
  clearSession()
  uni.reLaunch({ url: '/pages/login/login' })
}

const openProject = (item: ProjectListItem) => {
  uni.navigateTo({
    url: `/pages/project/board?id=${item.id}&name=${encodeURIComponent(item.name)}`,
  })
}
</script>

<style lang="scss" scoped>
.app-page {
  position: relative;
  min-height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
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
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(36rpx);
  -webkit-backdrop-filter: blur(36rpx);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.08), inset 0 2rpx 0 rgba(255, 255, 255, 0.4);
  border-radius: 28rpx;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
}

.topbar__left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.topbar__icon {
  font-size: 36rpx;
  line-height: 1;
}

.topbar__title {
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 2rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  border: 2rpx solid rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar__text {
  font-size: 26rpx;
  font-weight: 700;
  color: #fff;
}

.logout-btn {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  padding: 8rpx 0;
}

.main {
  padding: 32rpx 28rpx 40rpx;
  min-height: 480rpx;
}

.toolbar {
  margin-bottom: 28rpx;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 16rpx 28rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.22);
  border: 1px dashed rgba(255, 255, 255, 0.55);
}

.create-btn__icon {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.create-btn__text {
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
}

.project-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24rpx;
}

.project-card {
  padding: 28rpx 28rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  transition: transform 0.2s, box-shadow 0.2s;
}

.project-card__head {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.project-card__folder {
  font-size: 32rpx;
  line-height: 1;
}

.project-card__name {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
}

.project-card__desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-card__status {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.5;
}

.project-card__meta {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.68);
}

.project-card__time {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
}

.empty-tip {
  padding: 80rpx 0;
  display: flex;
  justify-content: center;
}

.empty-tip__text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.65);
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
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
  padding: 32rpx 28rpx 28rpx;
  box-sizing: border-box;
}

.modal__title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 28rpx;
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
  height: 80rpx;
  padding: 0 24rpx;
  text-align: left;
}

.modal-field__picker-text {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  color: #fff;
  text-align: left;
}

.modal-field__picker-text--placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.modal-field__picker-arrow {
  flex-shrink: 0;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.65);
}

.modal-field__select {
  display: block;
  height: 80rpx;
  padding: 0 24rpx;
  line-height: 80rpx;
  text-align: left;
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
  margin-top: 12rpx;
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.15);
  border: 1px dashed rgba(255, 255, 255, 0.5);
}

.ghost-btn__text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.action-btn__text {
  font-size: 24rpx;
  color: #fff;
  font-weight: 500;
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

  .topbar {
    padding: 14px 24px;
  }

  .topbar__icon { font-size: 20px; }
  .topbar__title { font-size: 18px; }

  .avatar {
    width: 36px;
    height: 36px;
  }

  .avatar__text { font-size: 14px; }
  .logout-btn { font-size: 13px; cursor: pointer; }

  .main {
    padding: 20px 24px 28px;
    min-height: 360px;
  }

  .toolbar { margin-bottom: 18px; }

  .create-btn {
    padding: 8px 16px;
    gap: 6px;
    cursor: pointer;
  }

  .create-btn__icon { font-size: 16px; }
  .create-btn__text { font-size: 14px; }

  .project-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .project-card {
    padding: 18px 18px 16px;
    border-radius: 14px;
    gap: 6px;
    cursor: pointer;
  }

  .project-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .project-card__folder { font-size: 18px; }
  .project-card__name { font-size: 16px; }
  .project-card__desc { font-size: 12px; }
  .project-card__status { font-size: 13px; }
  .project-card__meta { font-size: 11px; }
  .project-card__time { font-size: 11px; }

  .modal-mask {
    padding: 24px;
  }

  .modal {
    max-width: 480px;
    padding: 20px 24px 24px;
  }

  .modal__title {
    font-size: 18px;
    margin-bottom: 18px;
  }

  .modal-field {
    margin-bottom: 16px;
    gap: 8px;
  }

  .modal-field__label {
    font-size: 13px;
  }

  .modal-field__input {
    height: 40px;
    padding: 0 14px;
    line-height: 40px;
    font-size: 13px;
    border-radius: 8px;
  }

  .modal-field__select {
    height: 40px;
    padding: 0 14px;
    line-height: 40px;
    font-size: 13px;
    border-radius: 8px;
    background-position:
      calc(100% - 14px) calc(50% - 2px),
      calc(100% - 10px) calc(50% - 2px);
    background-size: 4px 4px, 4px 4px;
  }

  .modal-field__textarea {
    min-height: 88px;
    padding: 10px 14px;
    font-size: 13px;
    border-radius: 8px;
  }

  .modal-field__picker {
    height: 40px;
    padding: 0 14px;
    border-radius: 8px;
  }

  .modal-field__picker-text { font-size: 13px; }

  .ghost-btn,
  .action-btn {
    padding: 6px 16px;
    cursor: pointer;
  }

  .ghost-btn__text,
  .action-btn__text {
    font-size: 12px;
  }

  .float-1 { width: 70px; height: 70px; }
  .float-2 { width: 50px; height: 50px; }
  .float-3 { width: 90px; height: 90px; }
  .float-4 { width: 45px; height: 45px; }
  .float-5 { width: 60px; height: 60px; }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .project-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
