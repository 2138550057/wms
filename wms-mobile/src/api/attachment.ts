import { http, uploadFile } from './request'
import type { Attachment } from '@/types'

export const attachmentApi = {
  // 获取实体附件列表
  getByEntity(entityType: string, entityId: number) {
    return http.get<Attachment[]>(`/attachments/entity/${entityType}/${entityId}`)
  },

  // 上传单个文件
  upload(options: {
    filePath: string
    entityType: string
    entityId: number
    category?: string
  }) {
    return uploadFile({
      url: '/attachments/upload',
      filePath: options.filePath,
      name: 'file',
      formData: {
        entityType: options.entityType,
        entityId: String(options.entityId),
        category: options.category || 'image'
      }
    })
  },

  // 删除附件
  delete(id: number) {
    return http.delete(`/attachments/${id}`)
  },

  // 生成分享链接
  share(id: number, expireDays = 7) {
    return http.post<{ shareUrl: string; expireAt: string }>(`/attachments/${id}/share`, { expireDays })
  }
}
