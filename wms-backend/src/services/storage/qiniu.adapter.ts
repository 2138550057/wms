import qiniu from 'qiniu';
import path from 'path';
import { StorageAdapter, UploadFileInfo, UploadResult } from './types';

export class QiniuStorageAdapter implements StorageAdapter {
  private mac: qiniu.auth.digest.Mac;
  private config: qiniu.conf.Config;
  private bucket: string;
  private domain: string;

  constructor(config: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    domain: string;
    zone?: string;
  }) {
    this.mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey);
    this.bucket = config.bucket;
    this.domain = config.domain;

    // 配置zone（存储区域）
    this.config = new qiniu.conf.Config();
    if (config.zone) {
      // @ts-ignore - zone类型定义可能不完整
      this.config.zone = qiniu.zone[config.zone] || qiniu.zone.Zone_z0;
    }
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

    // 生成上传凭证
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${this.bucket}:${key}`,
    });
    const uploadToken = putPolicy.uploadToken(this.mac);

    // 上传文件
    const formUploader = new qiniu.form_up.FormUploader(this.config);
    const putExtra = new qiniu.form_up.PutExtra();

    return new Promise((resolve, reject) => {
      formUploader.put(
        uploadToken,
        key,
        file.buffer,
        putExtra,
        (respErr, respBody, respInfo) => {
          if (respErr) {
            reject(respErr);
            return;
          }

          if (respInfo.statusCode === 200) {
            const url = `https://${this.domain}/${key}`;
            resolve({
              fileName: file.originalname,
              fileSize: file.size,
              mimeType: file.mimetype,
              storageType: 'qiniu',
              storagePath: key,
              storageUrl: url,
            });
          } else {
            reject(new Error(`Upload failed with status ${respInfo.statusCode}`));
          }
        }
      );
    });
  }

  async delete(storagePath: string): Promise<void> {
    const bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);

    return new Promise((resolve, reject) => {
      bucketManager.delete(this.bucket, storagePath, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
          return;
        }

        if (respInfo.statusCode === 200 || respInfo.statusCode === 612) {
          // 612表示文件不存在，也视为成功
          resolve();
        } else {
          reject(new Error(`Delete failed with status ${respInfo.statusCode}`));
        }
      });
    });
  }

  async getUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    const bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
    const deadline = Math.floor(Date.now() / 1000) + expiresIn;

    // 生成私有空间的下载链接（如果是公开空间可以直接返回公共URL）
    const privateDownloadUrl = bucketManager.privateDownloadUrl(
      this.domain,
      storagePath,
      deadline
    );

    return privateDownloadUrl;
  }
}
