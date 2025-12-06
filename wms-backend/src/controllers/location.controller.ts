import { Request, Response } from 'express';
import prisma from '../utils/prisma';

/**
 * 生成库位编码
 * 格式: [保税标识][地区][分号]-[层数]
 * 例如: 3F16-1 (保税F区16号1层)
 */
function generateLocationCode(bonded: boolean, zone: string, number: string, level: number): string {
  const bondedPrefix = bonded ? '3' : '1';
  return `${bondedPrefix}${zone}${number}-${level}`;
}

/**
 * 创建库位
 */
export async function createLocation(req: Request, res: Response) {
  try {
    const { bonded, zone, number, level, category, status, remark } = req.body;

    // 验证必填字段
    if (!zone || !number) {
      return res.status(400).json({ success: false, message: '地区和分号为必填项' });
    }

    // 验证地区格式 (A-Z)
    if (!/^[A-Z]$/.test(zone)) {
      return res.status(400).json({ success: false, message: '地区必须是A-Z的单个字母' });
    }

    // 验证分号格式 (01-99)
    if (!/^[0-9]{1,2}$/.test(number)) {
      return res.status(400).json({ success: false, message: '分号必须是1-99的数字' });
    }

    // 格式化分号为两位数
    const formattedNumber = number.padStart(2, '0');

    // 生成库位编码
    const code = generateLocationCode(bonded === true, zone, formattedNumber, level || 1);

    // 检查库位编码是否已存在
    const existing = await prisma.location.findUnique({
      where: { code },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: `库位编码 ${code} 已存在` });
    }

    const location = await prisma.location.create({
      data: {
        code,
        bonded: bonded === true,
        zone,
        number: formattedNumber,
        level: level || 1,
        category: category || 'shelf',
        status: status || 'active',
        remark,
      },
    });

    res.json({ success: true, data: location, message: '创建成功' });
  } catch (error: any) {
    console.error('创建库位失败:', error);
    res.status(500).json({ success: false, message: error.message || '创建库位失败' });
  }
}

/**
 * 批量创建库位
 */
export async function batchCreateLocations(req: Request, res: Response) {
  try {
    const { bonded, zone, numberStart, numberEnd, levelStart, levelEnd, category } = req.body;

    // 验证必填字段
    if (!zone || numberStart === undefined || numberEnd === undefined) {
      return res.status(400).json({ success: false, message: '地区、起始分号和结束分号为必填项' });
    }

    // 验证地区格式 (A-Z)
    if (!/^[A-Z]$/.test(zone)) {
      return res.status(400).json({ success: false, message: '地区必须是A-Z的单个字母' });
    }

    const start = Number(numberStart);
    const end = Number(numberEnd);
    const lStart = Number(levelStart) || 1;
    const lEnd = Number(levelEnd) || 1;

    if (start > end || start < 1 || end > 99) {
      return res.status(400).json({ success: false, message: '分号范围无效，应在1-99之间' });
    }

    if (lStart > lEnd || lStart < 1 || lEnd > 10) {
      return res.status(400).json({ success: false, message: '层数范围无效，应在1-10之间' });
    }

    const locationsToCreate: any[] = [];
    const existingCodes: string[] = [];

    for (let num = start; num <= end; num++) {
      for (let lvl = lStart; lvl <= lEnd; lvl++) {
        const formattedNumber = num.toString().padStart(2, '0');
        const code = generateLocationCode(bonded === true, zone, formattedNumber, lvl);

        // 检查是否已存在
        const existing = await prisma.location.findUnique({
          where: { code },
        });

        if (existing) {
          existingCodes.push(code);
        } else {
          locationsToCreate.push({
            code,
            bonded: bonded === true,
            zone,
            number: formattedNumber,
            level: lvl,
            category: category || 'shelf',
            status: 'active',
          });
        }
      }
    }

    if (locationsToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message: '所有库位都已存在',
        existingCodes,
      });
    }

    // 批量创建
    await prisma.location.createMany({
      data: locationsToCreate,
    });

    res.json({
      success: true,
      message: `成功创建 ${locationsToCreate.length} 个库位${existingCodes.length > 0 ? `，跳过 ${existingCodes.length} 个已存在的库位` : ''}`,
      created: locationsToCreate.length,
      skipped: existingCodes.length,
      existingCodes: existingCodes.length > 0 ? existingCodes : undefined,
    });
  } catch (error: any) {
    console.error('批量创建库位失败:', error);
    res.status(500).json({ success: false, message: error.message || '批量创建库位失败' });
  }
}

/**
 * 获取库位列表
 */
export async function getLocations(req: Request, res: Response) {
  try {
    const { page = 1, size = 100, keyword, status, bonded, zone, category } = req.query;

    const where: any = {};

    if (keyword) {
      where.code = { contains: keyword as string };
    }

    if (status) {
      where.status = status as string;
    }

    if (bonded !== undefined && bonded !== '') {
      where.bonded = bonded === 'true';
    }

    if (zone) {
      where.zone = zone as string;
    }

    if (category) {
      where.category = category as string;
    }

    const [data, total] = await Promise.all([
      prisma.location.findMany({
        where,
        skip: (Number(page) - 1) * Number(size),
        take: Number(size),
        orderBy: [{ zone: 'asc' }, { number: 'asc' }, { level: 'asc' }],
      }),
      prisma.location.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      total,
      page: Number(page),
      size: Number(size),
    });
  } catch (error: any) {
    console.error('获取库位列表失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取库位列表失败' });
  }
}

/**
 * 获取库位详情
 */
export async function getLocationById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id: Number(id) },
    });

    if (!location) {
      return res.status(404).json({ success: false, message: '库位不存在' });
    }

    res.json({ success: true, data: location });
  } catch (error: any) {
    console.error('获取库位详情失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取库位详情失败' });
  }
}

/**
 * 更新库位
 */
export async function updateLocation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { bonded, zone, number, level, category, status, remark } = req.body;

    const existing = await prisma.location.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: '库位不存在' });
    }

    // 如果修改了关键字段，需要重新生成编码
    const newBonded = bonded !== undefined ? bonded === true : existing.bonded;
    const newZone = zone || existing.zone;
    const newNumber = number ? number.padStart(2, '0') : existing.number;
    const newLevel = level || existing.level;

    const newCode = generateLocationCode(newBonded, newZone, newNumber, newLevel);

    // 如果编码变化了，检查新编码是否已存在
    if (newCode !== existing.code) {
      const codeExists = await prisma.location.findUnique({
        where: { code: newCode },
      });

      if (codeExists) {
        return res.status(400).json({ success: false, message: `库位编码 ${newCode} 已存在` });
      }
    }

    const location = await prisma.location.update({
      where: { id: Number(id) },
      data: {
        code: newCode,
        bonded: newBonded,
        zone: newZone,
        number: newNumber,
        level: newLevel,
        category: category || existing.category,
        status: status || existing.status,
        remark,
      },
    });

    res.json({ success: true, data: location, message: '更新成功' });
  } catch (error: any) {
    console.error('更新库位失败:', error);
    res.status(500).json({ success: false, message: error.message || '更新库位失败' });
  }
}

/**
 * 删除库位
 */
export async function deleteLocation(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.location.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: '库位不存在' });
    }

    // 检查是否有库存在使用此库位
    const inventoryCount = await prisma.inventory.count({
      where: { locationCode: existing.code },
    });

    if (inventoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: `该库位下有${inventoryCount}条库存记录，无法删除`
      });
    }

    await prisma.location.delete({
      where: { id: Number(id) },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    console.error('删除库位失败:', error);
    res.status(500).json({ success: false, message: error.message || '删除库位失败' });
  }
}

/**
 * 批量删除库位
 */
export async function batchDeleteLocations(req: Request, res: Response) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要删除的库位' });
    }

    // 查询所有要删除的库位
    const locations = await prisma.location.findMany({
      where: { id: { in: ids.map((id: any) => Number(id)) } },
    });

    // 检查是否有库存在使用这些库位
    const codes = locations.map(loc => loc.code);
    const inventoryCount = await prisma.inventory.count({
      where: { locationCode: { in: codes } },
    });

    if (inventoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: `所选库位下有${inventoryCount}条库存记录，无法删除`
      });
    }

    const result = await prisma.location.deleteMany({
      where: { id: { in: ids.map((id: any) => Number(id)) } },
    });

    res.json({
      success: true,
      message: `成功删除 ${result.count} 个库位`,
      count: result.count
    });
  } catch (error: any) {
    console.error('批量删除库位失败:', error);
    res.status(500).json({ success: false, message: error.message || '批量删除库位失败' });
  }
}

/**
 * 获取可用库位列表（用于下拉选择）
 * 支持分级筛选
 */
export async function getActiveLocations(req: Request, res: Response) {
  try {
    const { bonded, zone, category, keyword } = req.query;

    const where: any = { status: 'active' };

    if (bonded !== undefined && bonded !== '') {
      where.bonded = bonded === 'true';
    }

    if (zone) {
      where.zone = zone as string;
    }

    if (category) {
      where.category = category as string;
    }

    if (keyword) {
      where.code = { contains: keyword as string };
    }

    const locations = await prisma.location.findMany({
      where,
      select: {
        id: true,
        code: true,
        bonded: true,
        zone: true,
        number: true,
        level: true,
        category: true,
      },
      orderBy: [{ zone: 'asc' }, { number: 'asc' }, { level: 'asc' }],
    });

    res.json({ success: true, data: locations });
  } catch (error: any) {
    console.error('获取可用库位失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取可用库位失败' });
  }
}

/**
 * 获取库位筛选选项
 * 返回所有可用的地区、分类等选项
 */
export async function getLocationFilterOptions(req: Request, res: Response) {
  try {
    // 获取所有不同的地区
    const zones = await prisma.location.groupBy({
      by: ['zone'],
      where: { status: 'active' },
      orderBy: { zone: 'asc' },
    });

    // 获取所有不同的分类
    const categories = await prisma.location.groupBy({
      by: ['category'],
      where: { status: 'active' },
    });

    res.json({
      success: true,
      data: {
        zones: zones.map(z => z.zone),
        categories: categories.map(c => c.category),
        bondedOptions: [
          { value: 'true', label: '保税' },
          { value: 'false', label: '非保税' },
        ],
        categoryOptions: [
          { value: 'shelf', label: '货架' },
          { value: 'floor', label: '地面' },
          { value: 'large', label: '大件' },
          { value: 'small', label: '小件' },
        ],
      },
    });
  } catch (error: any) {
    console.error('获取库位筛选选项失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取库位筛选选项失败' });
  }
}
