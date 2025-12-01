import { get, del } from './request'
import { BASE_URL } from './request'
import type { Attachment } from '@/types'

/**
 * 附件相关 API
 */
export const attachmentAPI = {
  /**
   * 获取附件列表
   */
  list(entityType: string, entityId: number) {
    return get<Attachment[]>('/attachments', { entityType, entityId }, { showLoading: false })
  },

  /**
   * 上传附件
   */
  upload(
    filePath: string,
    entityType: string,
    entityId: number,
    category: string = 'image'
  ): Promise<Attachment> {
    return new Promise((resolve, reject) => {
      const token = uni.getStorageSync('token')

      uni.uploadFile({
        url: `${BASE_URL}/attachments/upload`,
        filePath,
        name: 'file',
        formData: {
          entityType,
          entityId: String(entityId),
          category
        },
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            try {
              const data = JSON.parse(res.data)
              if (data.success) {
                resolve(data.data)
              } else {
                reject(new Error(data.message || '上传失败'))
              }
            } catch {
              reject(new Error('解析响应失败'))
            }
          } else if (res.statusCode === 401) {
            uni.removeStorageSync('token')
            uni.reLaunch({ url: '/pages/login/index' })
            reject(new Error('登录已过期，请重新登录'))
          } else {
            reject(new Error(`上传失败: ${res.statusCode}`))
          }
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '网络错误'))
        }
      })
    })
  },

  /**
   * 删除附件
   */
  remove(id: number) {
    return del(`/attachments/${id}`)
  },

  /**
   * 获取上传URL
   */
  getUploadUrl() {
    return `${BASE_URL}/attachments/upload`
  }
}
