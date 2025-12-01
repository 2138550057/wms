import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { InventoryQueryParams } from '../types';

/**
 * 查询库存列表
 */
export async function getInventoryList(req: Request, res: Response) {
  try {
    const {
      page = 1,
      size = 20,
      customerId,
      customerName,
      sku,
      productName,
      locationCode,
      warehouseEntryNo,
      productModel,
      internalCode,
      productCode,
      shippingMark,
      poNumber,
      dateFrom,
      dateTo,
    } = req.query as any;

    const where: any = {};

    if (customerId) {
      where.customerId = Number(customerId);
    }

    if (customerName) {
      where.customerName = { contains: customerName };
    }

    if (sku) {
      where.sku = { contains: sku };
    }

    if (productName) {
      where.productName = { contains: productName };
    }

    if (locationCode) {
      where.locationCode = { contains: locationCode };
    }

    if (warehouseEntryNo) {
      where.warehouseEntryNo = { contains: warehouseEntryNo };
    }

    if (productModel) {
      where.productModel = { contains: productModel };
    }

    if (internalCode) {
      where.internalCode = { contains: internalCode };
    }

    if (productCode) {
      where.productCode = { contains: productCode };
    }

    if (shippingMark) {
      where.shippingMark = { contains: shippingMark };
    }

    if (poNumber) {
      where.poNumber = { contains: poNumber };
    }

    if (dateFrom || dateTo) {
      where.lastInboundDate = {};
      if (dateFrom) {
        where.lastInboundDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.lastInboundDate.lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
      }
    }

    const [data, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        skip: (Number(page) - 1) * Number(size),
        take: Number(size),
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: true,
        },
      }),
      prisma.inventory.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      total,
      page: Number(page),
      size: Number(size),
    });
  } catch (error: any) {
    console.error('查询库存列表失败:', error);
    res.status(500).json({ success: false, message: error.message || '查询库存列表失败' });
  }
}

/**
 * 获取库存详情
 */
export async function getInventoryById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
      },
    });

    if (!inventory) {
      return res.status(404).json({ success: false, message: '库存不存在' });
    }

    res.json({ success: true, data: inventory });
  } catch (error: any) {
    console.error('获取库存详情失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取库存详情失败' });
  }
}

/**
 * 库存调整（盘盈盘亏）
 */
export async function adjustInventory(req: Request, res: Response) {
  try {
    const { id, adjustQuantity, remark } = req.body;

    const inventory = await prisma.inventory.findUnique({
      where: { id: Number(id) },
    });

    if (!inventory) {
      return res.status(404).json({ success: false, message: '库存不存在' });
    }

    const newQuantity = inventory.quantity + adjustQuantity;
    const newAvailableQuantity = inventory.availableQuantity + adjustQuantity;

    if (newQuantity < 0 || newAvailableQuantity < 0) {
      return res.status(400).json({ success: false, message: '调整后库存不能为负数' });
    }

    const updated = await prisma.inventory.update({
      where: { id: Number(id) },
      data: {
        quantity: newQuantity,
        availableQuantity: newAvailableQuantity,
      },
    });

    res.json({ success: true, data: updated, message: '库存调整成功' });
  } catch (error: any) {
    console.error('库存调整失败:', error);
    res.status(500).json({ success: false, message: error.message || '库存调整失败' });
  }
}

/**
 * 冻结库存
 */
export async function lockInventory(req: Request, res: Response) {
  try {
    const { id, lockQuantity } = req.body;

    const inventory = await prisma.inventory.findUnique({
      where: { id: Number(id) },
    });

    if (!inventory) {
      return res.status(404).json({ success: false, message: '库存不存在' });
    }

    if (inventory.availableQuantity < lockQuantity) {
      return res.status(400).json({ success: false, message: '可用库存不足' });
    }

    const updated = await prisma.inventory.update({
      where: { id: Number(id) },
      data: {
        availableQuantity: inventory.availableQuantity - lockQuantity,
        lockedQuantity: inventory.lockedQuantity + lockQuantity,
      },
    });

    res.json({ success: true, data: updated, message: '库存冻结成功' });
  } catch (error: any) {
    console.error('冻结库存失败:', error);
    res.status(500).json({ success: false, message: error.message || '冻结库存失败' });
  }
}

/**
 * 解冻库存
 */
export async function unlockInventory(req: Request, res: Response) {
  try {
    const { id, unlockQuantity } = req.body;

    const inventory = await prisma.inventory.findUnique({
      where: { id: Number(id) },
    });

    if (!inventory) {
      return res.status(404).json({ success: false, message: '库存不存在' });
    }

    if (inventory.lockedQuantity < unlockQuantity) {
      return res.status(400).json({ success: false, message: '锁定库存不足' });
    }

    const updated = await prisma.inventory.update({
      where: { id: Number(id) },
      data: {
        availableQuantity: inventory.availableQuantity + unlockQuantity,
        lockedQuantity: inventory.lockedQuantity - unlockQuantity,
      },
    });

    res.json({ success: true, data: updated, message: '库存解冻成功' });
  } catch (error: any) {
    console.error('解冻库存失败:', error);
    res.status(500).json({ success: false, message: error.message || '解冻库存失败' });
  }
}

/**
 * 获取客户库存汇总
 */
export async function getInventorySummaryByCustomer(req: Request, res: Response) {
  try {
    const { customerId } = req.params;

    const inventories = await prisma.inventory.findMany({
      where: { customerId: Number(customerId) },
    });

    const summary = {
      totalSKUs: inventories.length,
      totalQuantity: inventories.reduce((sum, inv) => sum + inv.quantity, 0),
      totalAvailable: inventories.reduce((sum, inv) => sum + inv.availableQuantity, 0),
      totalLocked: inventories.reduce((sum, inv) => sum + inv.lockedQuantity, 0),
    };

    res.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('获取库存汇总失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取库存汇总失败' });
  }
}

/**
 * 删除库存记录
 */
export async function deleteInventory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { id: Number(id) },
    });

    if (!inventory) {
      return res.status(404).json({ success: false, message: '库存记录不存在' });
    }

    // 检查是否有出库记录引用了这个库存
    const relatedOutboundItems = await prisma.outboundOrderItem.findFirst({
      where: {
        warehouseEntryNo: inventory.warehouseEntryNo || undefined,
      },
      include: {
        order: {
          select: {
            orderNo: true,
          },
        },
      },
    });

    if (relatedOutboundItems) {
      return res.status(400).json({
        success: false,
        message: `无法删除：该库存已有出库记录（出库单号：${relatedOutboundItems.order.orderNo}），请先删除相关出库单`,
      });
    }

    // 删除库存记录
    await prisma.inventory.delete({
      where: { id: Number(id) },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    console.error('删除库存失败:', error);
    res.status(500).json({ success: false, message: error.message || '删除库存失败' });
  }
}

/**
 * 批量删除库存记录
 */
export async function batchDeleteInventory(req: Request, res: Response) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要删除的库存记录' });
    }

    // 查询所有要删除的库存记录
    const inventories = await prisma.inventory.findMany({
      where: { id: { in: ids.map(id => Number(id)) } },
    });

    // 检查是否有出库记录引用了这些库存
    const warehouseEntryNos = inventories
      .map(inv => inv.warehouseEntryNo)
      .filter(no => no != null);

    if (warehouseEntryNos.length > 0) {
      const relatedOutboundItems = await prisma.outboundOrderItem.findFirst({
        where: {
          warehouseEntryNo: { in: warehouseEntryNos },
        },
        include: {
          order: {
            select: {
              orderNo: true,
            },
          },
        },
      });

      if (relatedOutboundItems) {
        return res.status(400).json({
          success: false,
          message: `无法删除：部分库存已有出库记录（出库单号：${relatedOutboundItems.order.orderNo}），请先删除相关出库单`,
        });
      }
    }

    // 批量删除
    const result = await prisma.inventory.deleteMany({
      where: { id: { in: ids.map(id => Number(id)) } },
    });

    res.json({
      success: true,
      message: `成功删除 ${result.count} 条库存记录`,
      count: result.count
    });
  } catch (error: any) {
    console.error('批量删除库存失败:', error);
    res.status(500).json({ success: false, message: error.message || '批量删除库存失败' });
  }
}
