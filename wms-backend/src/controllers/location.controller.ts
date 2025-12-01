import { Request, Response } from 'express';
import prisma from '../utils/prisma';

/**
 * 创建库位
 */
export async function createLocation(req: Request, res: Response) {
  try {
    const { code, name, warehouse, zone, aisle, shelf, layer, position, status, remark } = req.body;

    // 检查库位编码是否已存在
    const existing = await prisma.location.findUnique({
      where: { code },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: '库位编码已存在' });
    }

    const location = await prisma.location.create({
      data: {
        code,
        name,
        warehouse,
        zone,
        aisle,
        shelf,
        layer,
        position,
        status: status || 'active',
        remark,
      },
    });

    res.json({ success: true, data: location });
  } catch (error: any) {
    console.error('创建库位失败:', error);
    res.status(500).json({ success: false, message: error.message || '创建库位失败' });
  }
}

/**
 * 获取库位列表
 */
export async function getLocations(req: Request, res: Response) {
  try {
    const { page = 1, size = 100, keyword, status } = req.query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { code: { contains: keyword as string } },
        { name: { contains: keyword as string } },
        { warehouse: { contains: keyword as string } },
      ];
    }

    if (status) {
      where.status = status as string;
    }

    const [data, total] = await Promise.all([
      prisma.location.findMany({
        where,
        skip: (Number(page) - 1) * Number(size),
        take: Number(size),
        orderBy: { code: 'asc' },
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
    const { code, name, warehouse, zone, aisle, shelf, layer, position, status, remark } = req.body;

    const existing = await prisma.location.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: '库位不存在' });
    }

    // 如果修改了编码，检查新编码是否已存在
    if (code && code !== existing.code) {
      const codeExists = await prisma.location.findUnique({
        where: { code },
      });

      if (codeExists) {
        return res.status(400).json({ success: false, message: '库位编码已存在' });
      }
    }

    const location = await prisma.location.update({
      where: { id: Number(id) },
      data: {
        code,
        name,
        warehouse,
        zone,
        aisle,
        shelf,
        layer,
        position,
        status,
        remark,
      },
    });

    res.json({ success: true, data: location });
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
 * 获取可用库位列表（用于下拉选择）
 */
export async function getActiveLocations(req: Request, res: Response) {
  try {
    const locations = await prisma.location.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        code: true,
        name: true,
        warehouse: true,
      },
      orderBy: { code: 'asc' },
    });

    res.json({ success: true, data: locations });
  } catch (error: any) {
    console.error('获取可用库位失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取可用库位失败' });
  }
}
