import { request, safeRequest } from '@/utils/request'
import { setCurrentUser, setToken, type SessionUser } from '@/utils/session'
import type { LoginResult } from '@/types/api'

export async function login(username: string, password: string) {
  return safeRequest<LoginResult>('/auth/login', {
    method: 'POST',
    data: { username, password },
    auth: false,
    redirectOn401: false,
  })
}

export async function register(username: string, password: string) {
  return safeRequest<LoginResult>('/auth/register', {
    method: 'POST',
    data: { username, password },
    auth: false,
    redirectOn401: false,
  })
}

export async function fetchCurrentUser() {
  return safeRequest<SessionUser>('/auth/me')
}

export function persistAuthSession(result: LoginResult) {
  setToken(result.token)
  setCurrentUser(result.user)
}

export async function restoreSessionFromToken(): Promise<SessionUser | null> {
  const result = await fetchCurrentUser()
  if (!result.ok) return null
  setCurrentUser(result.data)
  return result.data
}

export async function checkHealth() {
  return safeRequest<{ status: string }>('/health', { auth: false, redirectOn401: false })
}
