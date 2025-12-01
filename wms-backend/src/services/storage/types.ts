// 存储类型
export type StorageType = 'local' | 's3' | 'qiniu' | 'aliyun' | 'tencent';

// 上传文件信息
export interface UploadFileInfo {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// 上传结果
export interface UploadResult {
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageType: StorageType;
  storagePath: string;
  storageUrl?: string;
}

// 存储适配器接口
export interface StorageAdapter {
  /**
   * 上传文件
   * @param file 文件信息
   * @param path 存储路径（可选，用于指定子目录）
   * @param category 文件分类（可选，用于生成文件名前缀）
   * @returns 上传结果
   */
  upload(file: UploadFileInfo, path?: string, category?: string): Promise<UploadResult>;

  /**
   * 删除文件
   * @param storagePath 存储路径
   */
  delete(storagePath: string): Promise<void>;

  /**
   * 获取文件访问URL
   * @param storagePath 存储路径
   * @param expiresIn 过期时间（秒），用于生成临时访问链接
   * @returns 访问URL
   */
  getUrl(storagePath: string, expiresIn?: number): Promise<string>;
}

// 存储配置
export interface StorageConfig {
  // 本地存储配置
  local?: {
    uploadDir: string;  // 上传目录
    baseUrl: string;    // 访问基础URL
  };

  // S3配置（兼容AWS S3, MinIO等）
  s3?: {
    endpoint?: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle?: boolean;  // MinIO需要设置为true
  };

  // 七牛云配置
  qiniu?: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    domain: string;  // CDN域名
    zone?: string;   // 存储区域
  };

  // 阿里云OSS配置
  aliyun?: {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    endpoint?: string;
  };

  // 腾讯云COS配置
  tencent?: {
    secretId: string;
    secretKey: string;
    region: string;
    bucket: string;
  };
}
