import fs from 'fs';
import path from 'path';

/**
 * 清理临时文件服务
 */
export class TempFileCleanupService {
  private tempDir: string;
  private maxAge: number; // 文件最大存活时间（毫秒）
  private cleanupInterval: number; // 清理间隔（毫秒）
  private timer: NodeJS.Timeout | null = null;

  constructor(tempDir: string = 'uploads/temp', maxAgeHours: number = 24, cleanupIntervalHours: number = 6) {
    this.tempDir = path.join(process.cwd(), tempDir);
    this.maxAge = maxAgeHours * 60 * 60 * 1000;
    this.cleanupInterval = cleanupIntervalHours * 60 * 60 * 1000;

    // 确保临时目录存在
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 开始定期清理
   */
  start() {
    console.log('🧹 临时文件清理服务已启动');
    console.log(`   - 临时目录: ${this.tempDir}`);
    console.log(`   - 文件最大存活时间: ${this.maxAge / (60 * 60 * 1000)} 小时`);
    console.log(`   - 清理间隔: ${this.cleanupInterval / (60 * 60 * 1000)} 小时`);

    // 立即执行一次清理
    this.cleanup();

    // 设置定时清理
    this.timer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * 停止定期清理
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('🛑 临时文件清理服务已停止');
    }
  }

  /**
   * 执行清理
   */
  private cleanup() {
    try {
      const now = Date.now();
      let deletedCount = 0;
      let deletedSize = 0;

      if (!fs.existsSync(this.tempDir)) {
        return;
      }

      const files = fs.readdirSync(this.tempDir);

      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);

        try {
          const stats = fs.statSync(filePath);
          const fileAge = now - stats.mtimeMs;

          // 删除超过最大存活时间的文件
          if (fileAge > this.maxAge) {
            const fileSize = stats.size;
            fs.unlinkSync(filePath);
            deletedCount++;
            deletedSize += fileSize;
            console.log(`🗑️  已删除过期临时文件: ${file} (${this.formatBytes(fileSize)}, ${Math.round(fileAge / (60 * 60 * 1000))}小时前)`);
          }
        } catch (error) {
          console.error(`删除文件失败: ${file}`, error);
        }
      });

      if (deletedCount > 0) {
        console.log(`✅ 清理完成: 删除 ${deletedCount} 个文件, 释放 ${this.formatBytes(deletedSize)} 空间`);
      } else {
        console.log('✨ 临时文件清理完成: 无需清理的文件');
      }
    } catch (error) {
      console.error('临时文件清理失败:', error);
    }
  }

  /**
   * 手动触发清理
   */
  cleanupNow() {
    console.log('🧹 手动触发临时文件清理...');
    this.cleanup();
  }

  /**
   * 格式化字节大小
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取临时目录信息
   */
  getInfo() {
    try {
      if (!fs.existsSync(this.tempDir)) {
        return {
          exists: false,
          fileCount: 0,
          totalSize: 0,
        };
      }

      const files = fs.readdirSync(this.tempDir);
      let totalSize = 0;

      files.forEach(file => {
        try {
          const stats = fs.statSync(path.join(this.tempDir, file));
          totalSize += stats.size;
        } catch (error) {
          // 忽略无法访问的文件
        }
      });

      return {
        exists: true,
        fileCount: files.length,
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
      };
    } catch (error) {
      console.error('获取临时目录信息失败:', error);
      return {
        exists: false,
        fileCount: 0,
        totalSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// 创建单例实例
export const tempFileCleanup = new TempFileCleanupService();
