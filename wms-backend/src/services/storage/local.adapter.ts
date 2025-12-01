import fs from 'fs/promises';
import path from 'path';
import { StorageAdapter, UploadFileInfo, UploadResult } from './types';

export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;
  private baseUrl: string;

  constructor(uploadDir: string, baseUrl: string) {
    this.uploadDir = uploadDir;
    this.baseUrl = baseUrl;
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  private generateFileName(originalName: string, category?: string): string {
    const ext = path.extname(originalName);

    // 使用分类作为前缀，如果没有分类则使用 'file'
    const prefix = category || 'file';

    // 生成时间戳（格式：YYYYMMDDHHmmss）
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dateTime = `${year}${month}${day}${hours}${minutes}${seconds}`;

    // 生成6位随机数
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    // 组合：分类_时间_随机数.扩展名
    return `${prefix}_${dateTime}_${random}${ext}`;
  }

  async upload(file: UploadFileInfo, subPath?: string, category?: string): Promise<UploadResult> {
    // 生成唯一文件名（使用分类前缀）
    const fileName = this.generateFileName(file.originalname, category);

    // 构建完整路径
    let fullPath = this.uploadDir;
    if (subPath) {
      fullPath = path.join(this.uploadDir, subPath);
      await fs.mkdir(fullPath, { recursive: true });
    }

    const filePath = path.join(fullPath, fileName);
    const relativePath = subPath ? path.join(subPath, fileName) : fileName;

    // 写入文件
    await fs.writeFile(filePath, file.buffer);

    return {
      fileName: fileName,  // 使用生成的新文件名而不是原始文件名
      fileSize: file.size,
      mimeType: file.mimetype,
      storageType: 'local',
      storagePath: relativePath,
      storageUrl: `${this.baseUrl}/${relativePath.replace(/\\/g, '/')}`,
    };
  }

  async delete(storagePath: string): Promise<void> {
    const filePath = path.join(this.uploadDir, storagePath);
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      // 文件不存在时忽略错误
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async getUrl(storagePath: string): Promise<string> {
    return `${this.baseUrl}/${storagePath.replace(/\\/g, '/')}`;
  }
}
