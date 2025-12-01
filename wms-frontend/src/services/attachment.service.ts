import api from './api';
import { Attachment, AttachmentQueryParams, PaginatedResponse } from '../types';

export const attachmentAPI = {
  /**
   * 上传单个文件
   */
  async uploadSingle(
    file: File,
    entityType: string,
    entityId: number,
    storageType?: string,
    category?: string
  ): Promise<{ success: boolean; data: Attachment; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId.toString());
    if (storageType) {
      formData.append('storageType', storageType);
    }
    if (category) {
      formData.append('category', category);
    }

    return api.post<{ success: boolean; data: Attachment; message: string }>(
      '/attachments/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    ) as any;
  },

  /**
   * 上传多个文件
   */
  async uploadMultiple(
    files: File[],
    entityType: string,
    entityId: number,
    storageType?: string,
    category?: string
  ): Promise<{ success: boolean; data: Attachment[]; message: string }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('entityType', entityType);
    formData.append('entityId', entityId.toString());
    if (storageType) {
      formData.append('storageType', storageType);
    }
    if (category) {
      formData.append('category', category);
    }

    return api.post<{ success: boolean; data: Attachment[]; message: string }>(
      '/attachments/upload-multiple',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    ) as any;
  },

  /**
   * 获取附件列表
   */
  async list(params: AttachmentQueryParams): Promise<PaginatedResponse<Attachment>> {
    return api.get<PaginatedResponse<Attachment>>('/attachments', { params }) as any;
  },

  /**
   * 根据实体获取附件列表
   */
  async getByEntity(
    entityType: string,
    entityId: number
  ): Promise<{ success: boolean; data: Attachment[]; message: string }> {
    return api.get<{ success: boolean; data: Attachment[]; message: string }>(
      `/attachments/entity/${entityType}/${entityId}`
    ) as any;
  },

  /**
   * 获取附件详情
   */
  async getById(id: number): Promise<{ success: boolean; data: Attachment; message: string }> {
    return api.get<{ success: boolean; data: Attachment; message: string }>(
      `/attachments/${id}`
    ) as any;
  },

  /**
   * 删除附件
   */
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(`/attachments/${id}`) as any;
  },

  /**
   * 获取附件访问URL
   */
  async getUrl(
    id: number,
    expiresIn?: number
  ): Promise<{ success: boolean; data: { url: string }; message: string }> {
    const params = expiresIn ? { expiresIn } : undefined;
    return api.get<{ success: boolean; data: { url: string }; message: string }>(
      `/attachments/${id}/url`,
      { params }
    ) as any;
  },

  /**
   * 生成分享链接
   */
  async generateShareLink(
    id: number,
    expiresInDays?: number
  ): Promise<{ success: boolean; data: { shareToken: string; shareUrl: string; expiresAt: string }; message: string }> {
    return api.post<{ success: boolean; data: { shareToken: string; shareUrl: string; expiresAt: string }; message: string }>(
      `/attachments/${id}/share`,
      { expiresInDays }
    ) as any;
  },

  /**
   * 通过分享令牌获取附件（公开访问）
   */
  async getSharedAttachment(
    token: string
  ): Promise<{ success: boolean; data: { attachment: Attachment; url: string }; message: string }> {
    return api.get<{ success: boolean; data: { attachment: Attachment; url: string }; message: string }>(
      `/attachments/shared/${token}`
    ) as any;
  },

  /**
   * 更新附件分类
   */
  async updateCategory(
    id: number,
    category: string
  ): Promise<{ success: boolean; data: Attachment; message: string }> {
    return api.patch<{ success: boolean; data: Attachment; message: string }>(
      `/attachments/${id}/category`,
      { category }
    ) as any;
  },

  /**
   * 批量删除附件
   */
  async deleteBatch(ids: number[]): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>(
      `/attachments/batch-delete`,
      { ids }
    ) as any;
  },

  /**
   * 下载附件（支持批量下载,自动打包成ZIP）
   */
  async download(ids: number[]): Promise<void> {
    const idsParam = ids.join(',');
    const response: any = await api.get<{ success: boolean; data: { url: string; fileName: string }; message: string }>(
      `/attachments/download?ids=${idsParam}`
    );

    if (response.success) {
      const { url, fileName } = response.data;
      // 创建隐藏链接并触发下载
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },
};

export default attachmentAPI;
