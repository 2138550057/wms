import { useUserStore } from '@/stores/user'
import type { ApiResponse } from '@/types'

// API基础URL
const getBaseUrl = (): string => {
  // #ifdef H5
  return import.meta.env.VITE_API_BASE_URL || '/api'
  // #endif

  // #ifndef H5
  return 'https://wmsapi.fexxo.cn/api'
  // #endif
}

interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  header?: Record<string, string>
  showLoading?: boolean
  showError?: boolean
  timeout?: number
}

// 请求函数
export function request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
  const userStore = useUserStore()
  const baseUrl = getBaseUrl()

  return new Promise((resolve, reject) => {
    // 显示 loading
    if (config.showLoading !== false) {
      uni.showLoading({ title: '加载中...', mask: true })
    }

    uni.request({
      url: baseUrl + config.url,
      method: config.method || 'GET',
      data: config.data,
      timeout: config.timeout || 30000,
      header: {
        'Content-Type': 'application/json',
        'Authorization': userStore.token ? `Bearer ${userStore.token}` : '',
        ...config.header
      },
      success: (res: any) => {
        const data = res.data as ApiResponse<T>

        // 401 未授权
        if (res.statusCode === 401) {
          userStore.logout()
          uni.reLaunch({ url: '/pages/login/index' })
          reject(new Error('登录已过期，请重新登录'))
          return
        }

        // 其他错误状态码
        if (res.statusCode >= 400) {
          if (config.showError !== false) {
            uni.showToast({
              title: data.message || `请求失败(${res.statusCode})`,
              icon: 'none',
              duration: 2000
            })
          }
          reject(new Error(data.message || '请求失败'))
          return
        }

        // 业务逻辑错误
        if (!data.success) {
          if (config.showError !== false) {
            uni.showToast({
              title: data.message || '操作失败',
              icon: 'none',
              duration: 2000
            })
          }
          reject(new Error(data.message || '操作失败'))
          return
        }

        resolve(data)
      },
      fail: (err) => {
        console.error('请求失败:', err)
        if (config.showError !== false) {
          uni.showToast({
            title: '网络错误，请检查网络连接',
            icon: 'none',
            duration: 2000
          })
        }
        reject(new Error('网络错误'))
      },
      complete: () => {
        if (config.showLoading !== false) {
          uni.hideLoading()
        }
      }
    })
  })
}

// 上传文件
export function uploadFile(options: {
  url: string
  filePath: string
  name: string
  formData?: Record<string, any>
  showLoading?: boolean
}): Promise<ApiResponse> {
  const userStore = useUserStore()
  const baseUrl = getBaseUrl()

  return new Promise((resolve, reject) => {
    if (options.showLoading !== false) {
      uni.showLoading({ title: '上传中...', mask: true })
    }

    uni.uploadFile({
      url: baseUrl + options.url,
      filePath: options.filePath,
      name: options.name,
      formData: options.formData,
      header: {
        'Authorization': userStore.token ? `Bearer ${userStore.token}` : ''
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data) as ApiResponse
          if (data.success) {
            resolve(data)
          } else {
            uni.showToast({ title: data.message || '上传失败', icon: 'none' })
            reject(new Error(data.message || '上传失败'))
          }
        } catch (e) {
          reject(new Error('解析响应失败'))
        }
      },
      fail: (err) => {
        console.error('上传失败:', err)
        uni.showToast({ title: '上传失败', icon: 'none' })
        reject(err)
      },
      complete: () => {
        if (options.showLoading !== false) {
          uni.hideLoading()
        }
      }
    })
  })
}

// 快捷方法
export const http = {
  get: <T>(url: string, data?: any, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'GET', data, ...config }),

  post: <T>(url: string, data?: any, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'POST', data, ...config }),

  put: <T>(url: string, data?: any, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'PUT', data, ...config }),

  delete: <T>(url: string, data?: any, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'DELETE', data, ...config }),
}
