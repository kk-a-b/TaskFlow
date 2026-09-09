export const SESSION_KEY = 'current_user'
export const TOKEN_KEY = 'token'

export interface SessionUser {
  id: string
  username: string
  displayName: string
  avatar: string
  role: string
  email?: string
  createdAt?: string
}

export function getToken(): string | null {
  try {
    const token = uni.getStorageSync(TOKEN_KEY)
    return token ? String(token) : null
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  if (!token) {
    uni.removeStorageSync(TOKEN_KEY)
    return
  }
  uni.setStorageSync(TOKEN_KEY, token)
}

export function getCurrentUser(): SessionUser | null {
  try {
    const raw = uni.getStorageSync(SESSION_KEY)
    if (!raw) return null
    return typeof raw === 'string' ? (JSON.parse(raw) as SessionUser) : (raw as SessionUser)
  } catch {
    return null
  }
}

export function setCurrentUser(user: SessionUser | null) {
  if (!user) {
    uni.removeStorageSync(SESSION_KEY)
    return
  }
  uni.setStorageSync(SESSION_KEY, JSON.stringify(user))
}

export function clearSession() {
  uni.removeStorageSync(SESSION_KEY)
  uni.removeStorageSync(TOKEN_KEY)
}
