import { getApiBaseUrl } from '@/config/api'
import { clearSession, getToken } from '@/utils/session'
import type { ApiResponse } from '@/types/api'

export class ApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  data?: unknown
  /** 默认 true；登录/注册等接口传 false */
  auth?: boolean
  /** 401 时是否自动跳转登录，默认 true */
  redirectOn401?: boolean
}

let handlingUnauthorized = false

function redirectToLogin() {
  if (handlingUnauthorized) return
  handlingUnauthorized = true
  clearSession()
  uni.reLaunch({
    url: '/pages/login/login',
    complete: () => {
      handlingUnauthorized = false
    },
  })
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, auth = true, redirectOn401 = true } = options
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (auth) {
    const token = getToken()
    if (token) {
      header.Authorization = `Bearer ${token}`
    }
  }

  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

  const response = await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
    uni.request({
      url,
      method,
      header,
      data: method === 'GET' ? undefined : (data as Record<string, unknown> | undefined),
      success: resolve,
      fail: reject,
    })
  })

  const body = response.data as ApiResponse<T> | undefined
  if (!body || typeof body.code !== 'number') {
    throw new ApiError(response.statusCode || 0, '服务器响应格式错误')
  }

  if (body.code !== 0) {
    if (body.code === 401 && redirectOn401) {
      redirectToLogin()
    }
    throw new ApiError(body.code, body.message || '请求失败')
  }

  return body.data
}

export async function safeRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ ok: true; data: T } | { ok: false; message: string; code?: number }> {
  try {
    const data = await request<T>(path, options)
    return { ok: true, data }
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, message: error.message, code: error.code }
    }
    const message = error instanceof Error ? error.message : '网络请求失败'
    return { ok: false, message }
  }
}

export function getErrorMessage(error: unknown, fallback = '操作失败'): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}
