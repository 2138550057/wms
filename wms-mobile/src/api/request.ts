import type { ApiResponse } from '@/types'

// API 基础地址
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wmsapi.fexxo.cn/api'

// 导出基础URL供其他模块使用
export { BASE_URL }

/**
 * 请求配置
 */
interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  showLoading?: boolean
  showError?: boolean
  timeout?: number
}

/**
 * 统一请求封装
 */
export async function request<T = any>(options: RequestOptions): Promise<T> {
  // 显示加载中
  if (options.showLoading !== false) {
    uni.showLoading({ title: '加载中...', mask: true })
  }

  // 构建请求头
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.header
  }

  // 获取 token
  const token = uni.getStorageSync('token')
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
      uni.request({
        url: `${BASE_URL}${options.url}`,
        method: options.method || 'GET',
        data: options.data,
        header,
        timeout: options.timeout || 30000,
        success: resolve,
        fail: reject
      })
    })

    // 隐藏加载中
    if (options.showLoading !== false) {
      uni.hideLoading()
    }

    const res = response.data as ApiResponse<T>

    // 处理 401 未授权
    if (response.statusCode === 401) {
      uni.removeStorageSync('token')
      uni.reLaunch({ url: '/pages/login/index' })
      throw new Error('登录已过期，请重新登录')
    }

    // 处理其他 HTTP 错误
    if (response.statusCode >= 400) {
      throw new Error(res.message || `请求失败 (${response.statusCode})`)
    }

    // 处理业务错误
    if (!res.success) {
      throw new Error(res.message || res.error?.message || '请求失败')
    }

    // 如果响应包含 total 字段，说明是分页响应，返回完整对象
    if ('total' in res) {
      return {
        data: res.data,
        total: res.total,
        page: res.page,
        size: res.size
      } as T
    }

    return res.data as T
  } catch (error: any) {
    // 隐藏加载中
    if (options.showLoading !== false) {
      uni.hideLoading()
    }

    // 显示错误提示
    if (options.showError !== false) {
      uni.showToast({
        title: error.message || '网络错误',
        icon: 'none',
        duration: 2500
      })
    }

    throw error
  }
}

/**
 * GET 请求
 */
export function get<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<T> {
  return request<T>({ url, method: 'GET', data, ...options })
}

/**
 * POST 请求
 */
export function post<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<T> {
  return request<T>({ url, method: 'POST', data, ...options })
}

/**
 * PUT 请求
 */
export function put<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<T> {
  return request<T>({ url, method: 'PUT', data, ...options })
}

/**
 * DELETE 请求
 */
export function del<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<T> {
  return request<T>({ url, method: 'DELETE', data, ...options })
}
