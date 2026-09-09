export interface AuthUser {
  account: string
  password: string
}

const USERS_KEY = 'registered_users'

export function getRegisteredUsers(): AuthUser[] {
  try {
    const raw = uni.getStorageSync(USERS_KEY)
    if (!raw) return []
    return JSON.parse(raw as string) as AuthUser[]
  } catch {
    return []
  }
}

export function findUser(account: string, password: string): AuthUser | undefined {
  return getRegisteredUsers().find(
    (u) => u.account === account && u.password === password
  )
}

export function isAccountRegistered(account: string): boolean {
  return getRegisteredUsers().some((u) => u.account === account)
}

export function registerUser(account: string, password: string): void {
  const users = getRegisteredUsers()
  users.push({ account, password })
  uni.setStorageSync(USERS_KEY, JSON.stringify(users))
}
