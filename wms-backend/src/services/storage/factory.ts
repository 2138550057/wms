import { StorageAdapter, StorageType, StorageConfig } from './types';
import { LocalStorageAdapter } from './local.adapter';
import { S3StorageAdapter } from './s3.adapter';
import { QiniuStorageAdapter } from './qiniu.adapter';

export class StorageFactory {
  private static adapters: Map<StorageType, StorageAdapter> = new Map();
  private static config: StorageConfig = {};
  private static defaultType: StorageType = 'local';

  /**
   * 初始化存储配置
   * @param config 存储配置
   * @param defaultType 默认存储类型
   */
  static init(config: StorageConfig, defaultType: StorageType = 'local') {
    this.config = config;
    this.defaultType = defaultType;
    this.adapters.clear();
  }

  /**
   * 获取存储适配器
   * @param type 存储类型，不传则使用默认类型
   * @returns 存储适配器
   */
  static getAdapter(type?: StorageType): StorageAdapter {
    const storageType = type || this.defaultType;

    // 检查缓存
    if (this.adapters.has(storageType)) {
      return this.adapters.get(storageType)!;
    }

    // 创建新的适配器
    let adapter: StorageAdapter;

    switch (storageType) {
      case 'local':
        if (!this.config.local) {
          throw new Error('Local storage config not found');
        }
        adapter = new LocalStorageAdapter(
          this.config.local.uploadDir,
          this.config.local.baseUrl
        );
        break;

      case 's3':
        if (!this.config.s3) {
          throw new Error('S3 storage config not found');
        }
        adapter = new S3StorageAdapter(this.config.s3);
        break;

      case 'qiniu':
        if (!this.config.qiniu) {
          throw new Error('Qiniu storage config not found');
        }
        adapter = new QiniuStorageAdapter(this.config.qiniu);
        break;

      // 可以继续添加阿里云、腾讯云等适配器
      case 'aliyun':
        throw new Error('Aliyun storage adapter not implemented yet');

      case 'tencent':
        throw new Error('Tencent storage adapter not implemented yet');

      default:
        throw new Error(`Unsupported storage type: ${storageType}`);
    }

    // 缓存适配器
    this.adapters.set(storageType, adapter);
    return adapter;
  }

  /**
   * 获取默认存储类型
   */
  static getDefaultType(): StorageType {
    return this.defaultType;
  }
}
