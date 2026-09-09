/** 后端 API 基础地址，可通过 .env 中 VITE_API_BASE_URL 覆盖 */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return '/api/v1'
  }
  return 'http://127.0.0.1:8000/api/v1'
}
