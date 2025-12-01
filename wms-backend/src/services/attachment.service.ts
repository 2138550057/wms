import { PrismaClient } from '@prisma/client';
import { StorageFactory, UploadFileInfo, StorageType } from './storage';
import { getSystemDomain } from '../utils/getSystemDomain';

const prisma = new PrismaClient();

export interface CreateAttachmentDTO {
  file: UploadFileInfo;
  entityType: string;
  entityId: number;
  uploadedBy?: number;
  uploadedByName?: string;
  storageType?: StorageType;
  category?: string;
}

export interface AttachmentQueryDTO {
  entityType?: string;
  entityId?: number;
  page?: number;
  size?: number;
}

export const attachmentService = {
  /**
   * 上传并创建附件记录
   */
  async create(data: CreateAttachmentDTO) {
    const { file, entityType, entityId, uploadedBy, uploadedByName, storageType, category } = data;

    // 获取存储适配器
    const adapter = StorageFactory.getAdapter(storageType);
    const type = storageType || StorageFactory.getDefaultType();

    // 上传文件到存储（传递分类用于文件命名）
    const uploadResult = await adapter.upload(file, entityType, category);

    // 获取系统域名配置
    const systemDomain = await getSystemDomain();

    // 对于本地存储，使用配置的域名替换硬编码的 localhost
    let finalStorageUrl = '';
    const rawStorageUrl = uploadResult.storageUrl;
    if (rawStorageUrl) {
      finalStorageUrl = rawStorageUrl;
      // 对于本地存储，使用系统配置的域名
      if (type === 'local') {
        const parts = rawStorageUrl.split('/uploads/');
        if (parts.length > 1) {
          finalStorageUrl = `${systemDomain}/uploads/${parts[1]}`;
        }
      }
    }

    // 创建数据库记录
    const attachment = await prisma.attachment.create({
      data: {
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        storageType: type,
        storagePath: uploadResult.storagePath,
        storageUrl: finalStorageUrl,
        entityType,
        entityId,
        category: category || 'default',
        uploadedBy,
        uploadedByName,
      },
    });

    return attachment;
  },

  /**
   * 批量上传附件
   */
  async createBatch(files: UploadFileInfo[], entityType: string, entityId: number, uploadedBy?: number, uploadedByName?: string, storageType?: StorageType) {
    const results = await Promise.all(
      files.map(file =>
        this.create({
          file,
          entityType,
          entityId,
          uploadedBy,
          uploadedByName,
          storageType,
        })
      )
    );

    return results;
  },

  /**
   * 查询附件列表
   */
  async list(query: AttachmentQueryDTO) {
    const { entityType, entityId, page = 1, size = 20 } = query;

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const [data, total] = await Promise.all([
      prisma.attachment.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.attachment.count({ where }),
    ]);

    return { data, total, page, size };
  },

  /**
   * 根据ID获取附件详情
   */
  async getById(id: number) {
    return prisma.attachment.findUnique({
      where: { id },
    });
  },

  /**
   * 根据实体获取附件列表
   */
  async getByEntity(entityType: string, entityId: number) {
    return prisma.attachment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * 删除附件
   */
  async delete(id: number) {
    // 获取附件信息
    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // 从存储中删除文件
    const adapter = StorageFactory.getAdapter(attachment.storageType as StorageType);
    await adapter.delete(attachment.storagePath);

    // 删除数据库记录
    await prisma.attachment.delete({
      where: { id },
    });

    return { success: true };
  },

  /**
   * 根据实体删除所有附件
   */
  async deleteByEntity(entityType: string, entityId: number) {
    const attachments = await this.getByEntity(entityType, entityId);

    for (const attachment of attachments) {
      await this.delete(attachment.id);
    }

    return { success: true, count: attachments.length };
  },

  /**
   * 获取附件访问URL
   */
  async getAccessUrl(id: number, expiresIn?: number) {
    const attachment = await this.getById(id);
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // 如果已有URL直接返回
    if (attachment.storageUrl) {
      return attachment.storageUrl;
    }

    // 否则生成临时URL
    const adapter = StorageFactory.getAdapter(attachment.storageType as StorageType);
    return adapter.getUrl(attachment.storagePath, expiresIn);
  },

  /**
   * 生成分享链接
   */
  async generateShareLink(id: number, expiresInDays: number = 7) {
    const attachment = await this.getById(id);
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // 生成随机token
    const crypto = require('crypto');
    const shareToken = crypto.randomBytes(32).toString('hex');

    // 计算过期时间
    const shareExpireAt = new Date();
    shareExpireAt.setDate(shareExpireAt.getDate() + expiresInDays);

    // 更新数据库
    const updated = await prisma.attachment.update({
      where: { id },
      data: {
        isShared: true,
        shareToken,
        shareExpireAt,
      },
    });

    return {
      shareToken,
      shareUrl: `/api/attachments/shared/${shareToken}`,
      expiresAt: shareExpireAt,
    };
  },

  /**
   * 通过分享token获取附件
   */
  async getByShareToken(token: string) {
    const attachment = await prisma.attachment.findUnique({
      where: { shareToken: token },
    });

    if (!attachment) {
      return null;
    }

    // 检查是否过期
    if (attachment.shareExpireAt && attachment.shareExpireAt < new Date()) {
      return null;
    }

    return attachment;
  },

  /**
   * 批量删除附件
   */
  async deleteBatch(ids: number[]) {
    // 获取所有附件信息
    const attachments = await prisma.attachment.findMany({
      where: { id: { in: ids } },
    });

    // 删除存储文件
    for (const attachment of attachments) {
      try {
        const adapter = StorageFactory.getAdapter(attachment.storageType as StorageType);
        await adapter.delete(attachment.storagePath);
      } catch (error) {
        console.error(`Failed to delete file: ${attachment.storagePath}`, error);
      }
    }

    // 删除数据库记录
    await prisma.attachment.deleteMany({
      where: { id: { in: ids } },
    });

    return { success: true, count: attachments.length };
  },

  /**
   * 更新附件分类
   */
  async updateCategory(id: number, category: string) {
    return await prisma.attachment.update({
      where: { id },
      data: { category },
    });
  },

  /**
   * 创建ZIP压缩包（批量下载）
   */
  async createZipArchive(ids: number[]): Promise<string> {
    const archiver = require('archiver');
    const fs = require('fs');
    const path = require('path');

    // 创建临时目录
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const zipFileName = `attachments_${Date.now()}.zip`;
    const zipPath = path.join(tempDir, zipFileName);

    // 获取所有附件
    const attachments = await prisma.attachment.findMany({
      where: { id: { in: ids } },
    });

    // 创建ZIP文件
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        // 返回相对路径URL
        resolve(`/uploads/temp/${zipFileName}`);
      });

      archive.on('error', (err: Error) => {
        reject(err);
      });

      archive.pipe(output);

      // 添加文件到ZIP
      for (const attachment of attachments) {
        const adapter = StorageFactory.getAdapter(attachment.storageType as StorageType);

        // 对于本地存储，直接添加文件
        if (attachment.storageType === 'local') {
          const filePath = path.join(process.cwd(), attachment.storagePath);
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: attachment.fileName });
          }
        }
        // 对于云存储，需要先下载（这里简化处理，实际应异步下载）
        // TODO: 实现云存储文件下载到临时目录
      }

      archive.finalize();
    });
  },
};
