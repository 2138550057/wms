import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const systemSettingService = {
  /**
   * 获取所有设置（按分类）
   */
  async getAll(includePrivate: boolean = false) {
    const where = includePrivate ? {} : { isPublic: true };

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    // 按分类分组
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push({
        ...setting,
        settingValue: JSON.parse(setting.settingValue),
      });
      return acc;
    }, {} as Record<string, any[]>);

    return grouped;
  },

  /**
   * 根据键获取设置
   */
  async getByKey(settingKey: string) {
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey },
    });

    if (!setting) {
      return null;
    }

    return {
      ...setting,
      settingValue: JSON.parse(setting.settingValue),
    };
  },

  /**
   * 根据分类获取设置
   */
  async getByCategory(category: string, includePrivate: boolean = false) {
    const where: any = { category };
    if (!includePrivate) {
      where.isPublic = true;
    }

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: { settingKey: 'asc' },
    });

    return settings.map(setting => ({
      ...setting,
      settingValue: JSON.parse(setting.settingValue),
    }));
  },

  /**
   * 更新或创建设置
   */
  async upsert(
    settingKey: string,
    settingValue: any,
    category: string,
    description?: string,
    isPublic?: boolean,
    updatedBy?: number,
    updatedByName?: string
  ) {
    const valueStr = typeof settingValue === 'string'
      ? settingValue
      : JSON.stringify(settingValue);

    return await prisma.systemSetting.upsert({
      where: { settingKey },
      update: {
        settingValue: valueStr,
        description,
        isPublic,
        updatedBy,
        updatedByName,
      },
      create: {
        settingKey,
        settingValue: valueStr,
        category,
        description,
        isPublic: isPublic ?? false,
        updatedBy,
        updatedByName,
      },
    });
  },

  /**
   * 批量更新设置
   */
  async batchUpdate(
    settings: Array<{
      settingKey: string;
      settingValue: any;
      category: string;
      description?: string;
      isPublic?: boolean;
    }>,
    updatedBy?: number,
    updatedByName?: string
  ) {
    const results = await Promise.all(
      settings.map(setting =>
        this.upsert(
          setting.settingKey,
          setting.settingValue,
          setting.category,
          setting.description,
          setting.isPublic,
          updatedBy,
          updatedByName
        )
      )
    );

    return results;
  },

  /**
   * 删除设置
   */
  async delete(settingKey: string) {
    return await prisma.systemSetting.delete({
      where: { settingKey },
    });
  },
};
