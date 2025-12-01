import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取系统域名配置
 * @returns 系统域名 URL
 */
export async function getSystemDomain(): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'system.domain' },
    });

    if (setting && setting.settingValue) {
      const value = typeof setting.settingValue === 'string'
        ? JSON.parse(setting.settingValue)
        : setting.settingValue;
      return value.value || `http://localhost:${process.env.PORT || 3001}`;
    }
  } catch (error) {
    console.error('Failed to get system domain:', error);
  }

  // 默认返回 localhost
  return `http://localhost:${process.env.PORT || 3001}`;
}

/**
 * 获取系统域名（同步版本，用于非异步上下文）
 * 注意：这会返回环境变量或默认值，不会从数据库读取
 */
export function getSystemDomainSync(): string {
  return process.env.SYSTEM_DOMAIN || `http://localhost:${process.env.PORT || 3001}`;
}
