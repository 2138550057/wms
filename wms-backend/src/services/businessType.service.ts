import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const businessTypeService = {
  /**
   * 获取所有业务类型
   */
  async getAll(category?: string, activeOnly: boolean = false) {
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (activeOnly) {
      where.isActive = true;
    }

    return await prisma.businessType.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
  },

  /**
   * 根据分类获取业务类型
   */
  async getByCategory(category: string, activeOnly: boolean = true) {
    const where: any = { category };
    if (activeOnly) {
      where.isActive = true;
    }

    return await prisma.businessType.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  },

  /**
   * 根据ID获取业务类型
   */
  async getById(id: number) {
    return await prisma.businessType.findUnique({
      where: { id },
    });
  },

  /**
   * 根据代码获取业务类型
   */
  async getByCode(code: string) {
    return await prisma.businessType.findUnique({
      where: { code },
    });
  },

  /**
   * 创建业务类型
   */
  async create(data: {
    code: string;
    name: string;
    category: string;
    description?: string;
    color?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return await prisma.businessType.create({
      data: {
        code: data.code,
        name: data.name,
        category: data.category,
        description: data.description,
        color: data.color,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  },

  /**
   * 更新业务类型
   */
  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      color?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    return await prisma.businessType.update({
      where: { id },
      data,
    });
  },

  /**
   * 删除业务类型
   */
  async delete(id: number) {
    return await prisma.businessType.delete({
      where: { id },
    });
  },

  /**
   * 启用/禁用业务类型
   */
  async toggleActive(id: number, isActive: boolean) {
    return await prisma.businessType.update({
      where: { id },
      data: { isActive },
    });
  },
};
