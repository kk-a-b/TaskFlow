<template>
  <view class="auth-page">
    <view class="float float-1" />
    <view class="float float-2" />
    <view class="float float-3" />
    <view class="float float-4" />
    <view class="float float-5" />

    <view class="glass-card">
      <text class="title">REGISTER</text>

      <view class="field">
        <view class="input-wrap" :class="{ 'input-wrap--error': accountError, 'input-wrap--focus': accountFocus }">
          <view class="input-icon">
            <view class="icon-user" />
          </view>
          <input
            v-model="account"
            class="input"
            type="text"
            name="username"
            autocomplete="username"
            :placeholder="account ? '' : 'User'"
            placeholder-class="input-placeholder"
            @focus="onAccountFocus"
            @blur="onAccountBlur"
          />
        </view>
        <text v-if="accountError" class="field-error">{{ accountError }}</text>
      </view>

      <view class="field">
        <view
          class="input-wrap password-field"
          :class="{
            'input-wrap--error': passwordError,
            'input-wrap--focus': passwordFocus,
            'password-field--hidden': !showPassword,
          }"
        >
          <view class="input-icon">
            <view class="icon-key" />
          </view>
          <input
            v-model="password"
            class="input"
            type="text"
            name="password"
            autocomplete="new-password"
            :placeholder="password ? '' : 'Password'"
            placeholder-class="input-placeholder"
            @focus="onPasswordFocus"
            @blur="onPasswordBlur"
          />
          <view class="toggle-pwd" @tap="showPassword = !showPassword">
            <text class="toggle-pwd__text">{{ showPassword ? '🙈' : '👁' }}</text>
          </view>
        </view>
        <text v-if="passwordError" class="field-error">{{ passwordError }}</text>
      </view>

      <view class="field">
        <view
          class="input-wrap password-field"
          :class="{
            'input-wrap--error': confirmPasswordError,
            'input-wrap--focus': confirmPasswordFocus,
            'password-field--hidden': !showConfirmPassword,
          }"
        >
          <view class="input-icon">
            <view class="icon-key" />
          </view>
          <input
            v-model="confirmPassword"
            class="input"
            type="text"
            name="confirm-password"
            autocomplete="new-password"
            :placeholder="confirmPassword ? '' : 'Confirm Password'"
            placeholder-class="input-placeholder"
            @focus="onConfirmPasswordFocus"
            @blur="onConfirmPasswordBlur"
          />
          <view class="toggle-pwd" @tap="showConfirmPassword = !showConfirmPassword">
            <text class="toggle-pwd__text">{{ showConfirmPassword ? '🙈' : '👁' }}</text>
          </view>
        </view>
        <text v-if="confirmPasswordError" class="field-error">{{ confirmPasswordError }}</text>
      </view>

      <button class="auth-btn register-btn" :class="{ loading: loading }" :disabled="loading" @tap="handleRegister">
        <text v-if="!loading" class="auth-btn__text">Sign up</text>
        <view v-else class="auth-btn__spinner" />
      </button>

      <view class="footer">
        <text class="footer-text">Already have an account? </text>
        <text class="footer-link" @tap="goLogin">Log in</text>
      </view>
    </view>

    <view v-if="showSuccess" class="success-overlay">
      <view class="success-icon">✓</view>
      <text class="success-title">注册成功</text>
      <text class="success-desc">欢迎加入，{{ account }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { register, persistAuthSession } from '@/utils/auth-service'

const account = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const showSuccess = ref(false)

const accountError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const accountFocus = ref(false)
const passwordFocus = ref(false)
const confirmPasswordFocus = ref(false)

const clearErrors = () => {
  accountError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
}

const onAccountFocus = () => {
  accountFocus.value = true
  accountError.value = ''
}

const onAccountBlur = () => {
  accountFocus.value = false
}

const onPasswordFocus = () => {
  passwordFocus.value = true
  passwordError.value = ''
}

const onPasswordBlur = () => {
  passwordFocus.value = false
  validatePasswordField()
  if (confirmPassword.value) validateConfirmPasswordField()
}

const onConfirmPasswordFocus = () => {
  confirmPasswordFocus.value = true
  confirmPasswordError.value = ''
}

const onConfirmPasswordBlur = () => {
  confirmPasswordFocus.value = false
  if (confirmPassword.value) validateConfirmPasswordField()
}

const validatePasswordField = () => {
  if (!password.value) {
    passwordError.value = '密码错误'
    return false
  }
  if (password.value.length < 6) {
    passwordError.value = '密码至少6位'
    return false
  }
  passwordError.value = ''
  return true
}

const validateConfirmPasswordField = () => {
  if (!confirmPassword.value) {
    confirmPasswordError.value = '确认密码错误'
    return false
  }
  if (confirmPassword.value !== password.value) {
    confirmPasswordError.value = '两次密码不一致'
    return false
  }
  confirmPasswordError.value = ''
  return true
}

const goLogin = () => {
  uni.navigateTo({ url: '/pages/login/login' })
}

const validate = () => {
  clearErrors()
  let valid = true
  const trimmedAccount = account.value.trim()

  if (!trimmedAccount) {
    accountError.value = '账号错误'
    valid = false
  } else if (trimmedAccount.length < 3) {
    accountError.value = '账号至少3个字符'
    valid = false
  }

  if (!validatePasswordField()) valid = false
  if (!validateConfirmPasswordField()) valid = false

  if (!valid) {
    uni.showToast({ title: '请检查填写信息', icon: 'none' })
  }
  return valid
}

const handleRegister = async () => {
  if (loading.value || !validate()) return

  loading.value = true
  const trimmedAccount = account.value.trim()
  const result = await register(trimmedAccount, password.value)
  loading.value = false

  if (!result.ok) {
    if (result.message.includes('账号')) {
      accountError.value = result.message
    } else if (result.message.includes('密码')) {
      passwordError.value = result.message
    }
    uni.showToast({ title: result.message, icon: 'none' })
    return
  }

  persistAuthSession(result.data)
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
    uni.reLaunch({ url: '/pages/project/list' })
  }, 1500)
}
</script>

<style lang="scss" scoped>
@import '../../styles/auth-glass.scss';

.register-btn {
  margin-top: 8rpx;
}

@media (min-width: 768px) {
  .register-btn {
    margin-top: 4px;
  }
}
</style>

<!-- #ifdef H5 -->
<style lang="scss">
@import '../../styles/auth-glass-h5.scss';
</style>
<!-- #endif -->
