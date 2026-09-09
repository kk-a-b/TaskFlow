<template>
  <view class="auth-page">
    <view class="float float-1" />
    <view class="float float-2" />
    <view class="float float-3" />
    <view class="float float-4" />
    <view class="float float-5" />

    <view class="glass-card">
      <text class="title">LOGIN</text>

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
            autocomplete="current-password"
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

      <view class="options">
        <view class="remember-wrap" @tap="toggleRemember">
          <view class="remember-circle" :class="{ 'remember-circle--checked': remember }">
            <view v-if="remember" class="remember-circle__dot" />
          </view>
          <text class="remember-label">Remember</text>
        </view>
      </view>

      <button class="auth-btn" :class="{ loading: loading }" :disabled="loading" @tap="handleLogin">
        <text v-if="!loading" class="auth-btn__text">Log in</text>
        <view v-else class="auth-btn__spinner" />
      </button>

      <view class="footer">
        <text class="footer-text">Forgot password? </text>
        <text class="footer-link" @tap="handleForgot">Click Here</text>
      </view>
      <view class="footer footer--secondary">
        <text class="footer-text">Don't have an account? </text>
        <text class="footer-link" @tap="goRegister">Sign up</text>
      </view>
    </view>

    <view v-if="showSuccess" class="success-overlay">
      <view class="success-icon">✓</view>
      <text class="success-title">登录成功</text>
      <text class="success-desc">欢迎回来，{{ account }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { login, persistAuthSession } from '@/utils/auth-service'

const REMEMBER_KEY = 'login_remember'
const ACCOUNT_KEY = 'login_account'

const account = ref('')
const password = ref('')
const remember = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const showSuccess = ref(false)

const accountError = ref('')
const passwordError = ref('')
const accountFocus = ref(false)
const passwordFocus = ref(false)

let autofillTimers: ReturnType<typeof setTimeout>[] = []

/** 浏览器自动填充不会触发 v-model，需从 DOM 同步并隐藏 placeholder */
const syncAutofillFromDom = () => {
  // #ifdef H5
  const inputs = document.querySelectorAll('.auth-page .uni-input-input')
  const accountInput = inputs[0] as HTMLInputElement | undefined
  const passwordInput = inputs[1] as HTMLInputElement | undefined
  if (accountInput?.value) account.value = accountInput.value
  if (passwordInput?.value) password.value = passwordInput.value
  // #endif
}

const onAutofillAnimation = (e: Event) => {
  const ae = e as AnimationEvent
  if (ae.animationName === 'onAutoFillStart') syncAutofillFromDom()
}

const bindAutofillListeners = () => {
  // #ifdef H5
  document.querySelectorAll('.auth-page .uni-input-input').forEach((el) => {
    el.addEventListener('animationstart', onAutofillAnimation)
  })
  // #endif
}

const unbindAutofillListeners = () => {
  // #ifdef H5
  document.querySelectorAll('.auth-page .uni-input-input').forEach((el) => {
    el.removeEventListener('animationstart', onAutofillAnimation)
  })
  // #endif
}

onMounted(() => {
  // #ifdef H5
  nextTick(() => {
    syncAutofillFromDom()
    autofillTimers = [100, 300, 600, 1000].map((ms) =>
      setTimeout(syncAutofillFromDom, ms)
    )
    bindAutofillListeners()
  })
  // #endif
})

onBeforeUnmount(() => {
  autofillTimers.forEach(clearTimeout)
  unbindAutofillListeners()
})

const loadRemember = () => {
  const savedRemember = uni.getStorageSync(REMEMBER_KEY)
  remember.value = savedRemember === true || savedRemember === 'true'
  if (remember.value) {
    const savedAccount = uni.getStorageSync(ACCOUNT_KEY)
    if (savedAccount) account.value = savedAccount
  }
}

loadRemember()

const clearErrors = () => {
  accountError.value = ''
  passwordError.value = ''
}

const onAccountFocus = () => {
  accountFocus.value = true
  accountError.value = ''
}

const onAccountBlur = () => {
  accountFocus.value = false
  syncAutofillFromDom()
}

const onPasswordFocus = () => {
  passwordFocus.value = true
  passwordError.value = ''
}

const onPasswordBlur = () => {
  passwordFocus.value = false
  syncAutofillFromDom()
}

const toggleRemember = () => {
  remember.value = !remember.value
}

const handleForgot = () => {
  uni.showToast({ title: '请联系管理员重置密码', icon: 'none' })
}

const goRegister = () => {
  uni.navigateTo({ url: '/pages/register/register' })
}

const validate = () => {
  clearErrors()
  let valid = true
  if (!account.value.trim()) {
    accountError.value = '账号错误'
    valid = false
  }
  if (!password.value) {
    passwordError.value = '密码错误'
    valid = false
  }
  if (!valid) {
    uni.showToast({
      title: !account.value.trim() && !password.value ? '请填写账号和密码' : !account.value.trim() ? '账号错误' : '密码错误',
      icon: 'none',
    })
  }
  return valid
}

const handleLogin = async () => {
  syncAutofillFromDom()
  if (loading.value || !validate()) return

  loading.value = true
  const trimmed = account.value.trim()
  const result = await login(trimmed, password.value)
  loading.value = false

  if (result.ok) {
    persistAuthSession(result.data)
    if (remember.value) {
      uni.setStorageSync(REMEMBER_KEY, true)
      uni.setStorageSync(ACCOUNT_KEY, account.value.trim())
    } else {
      uni.setStorageSync(REMEMBER_KEY, false)
      uni.removeStorageSync(ACCOUNT_KEY)
    }

    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
      uni.reLaunch({ url: '/pages/project/list' })
    }, 1500)
    return
  }

  accountError.value = ''
  passwordError.value = ''

  if (result.code === 401) {
    passwordError.value = '密码错误'
  } else if (result.message.includes('账号')) {
    accountError.value = result.message
  } else {
    passwordError.value = result.message
  }

  uni.showToast({ title: result.message, icon: 'none' })
}
</script>

<style lang="scss" scoped>
@import '../../styles/auth-glass.scss';

.footer--secondary {
  margin-top: 16rpx;
}

@media (min-width: 768px) {
  .footer--secondary {
    margin-top: 8px;
  }
}
</style>

<!-- #ifdef H5 -->
<style lang="scss">
@import '../../styles/auth-glass-h5.scss';
</style>
<!-- #endif -->
