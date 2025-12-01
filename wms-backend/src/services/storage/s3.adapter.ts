import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { StorageAdapter, UploadFileInfo, UploadResult } from './types';

export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;
  private region: string;

  constructor(config: {
    endpoint?: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle?: boolean;
  }) {
    this.bucket = config.bucket;
    this.region = config.region;

    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? false,
    });
  }

  private generateKey(originalName: string, subPath?: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}_${random}${ext}`;

    return subPath ? `${subPath}/${fileName}` : fileName;
  }

  async upload(file: UploadFileInfo, subPath?: string): Promise<UploadResult> {
    const key = this.generateKey(file.originalname, subPath);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.client.send(command);

    // 生成公共访问URL（如果bucket是公开的）
    const url = await this.getUrl(key);

    return {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storageType: 's3',
      storagePath: key,
      storageUrl: url,
    };
  }

  async delete(storagePath: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    });

    await this.client.send(command);
  }

  async getUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    });

    // 生成预签名URL
    return getSignedUrl(this.client, command, { expiresIn });
  }
}
