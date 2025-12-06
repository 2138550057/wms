import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { InventoryQueryParams } from '../types';
import * as XLSX from 'xlsx';
import fs from 'fs';

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
 * 更新库存记录
 */
export async function updateInventory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const inventory = await prisma.inventory.findUnique({
      where: { id: Number(id) },
    });

    if (!inventory) {
      return res.status(404).json({ success: false, message: '库存记录不存在' });
    }

    // 更新允许的字段
    const allowedFields = [
      'productName', 'productModel', 'sku', 'internalCode', 'productCode',
      'locationCode', 'warehouseEntryNo', 'shippingMark', 'poNumber',
      'packageType', 'quantity', 'availableQuantity', 'lockedQuantity',
      'length', 'width', 'height', 'unitGrossWeight', 'totalGrossWeight',
      'area', 'volume', 'remark'
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field];
      }
    }

    // 如果更新了数量相关字段，需要验证
    if (data.quantity !== undefined || data.availableQuantity !== undefined || data.lockedQuantity !== undefined) {
      const newQuantity = data.quantity ?? inventory.quantity;
      const newAvailable = data.availableQuantity ?? inventory.availableQuantity;
      const newLocked = data.lockedQuantity ?? inventory.lockedQuantity;

      if (newQuantity < 0 || newAvailable < 0 || newLocked < 0) {
        return res.status(400).json({ success: false, message: '数量不能为负数' });
      }
    }

    const updated = await prisma.inventory.update({
      where: { id: Number(id) },
      data,
    });

    res.json({ success: true, data: updated, message: '更新成功' });
  } catch (error: any) {
    console.error('更新库存失败:', error);
    res.status(500).json({ success: false, message: error.message || '更新库存失败' });
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

/**
 * 解析库位导入Excel文件
 */
const parseLocationExcel = (filePath: string) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  if (rawData.length < 2) {
    throw new Error('文件为空或格式不正确');
  }

  // 获取表头
  const headers = rawData[0] as string[];
  const entryNoIndex = headers.findIndex(h => String(h).includes('进仓编号') || String(h).includes('CMD'));
  const locationIndex = headers.findIndex(h => String(h).includes('库位'));

  if (entryNoIndex === -1) {
    throw new Error('缺少必需列：进仓编号');
  }
  if (locationIndex === -1) {
    throw new Error('缺少必需列：库位');
  }

  // 解析数据
  const records: { warehouseEntryNo: string; locationCode: string; _rowIndex: number }[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;

    const warehouseEntryNo = row[entryNoIndex];
    const locationCode = row[locationIndex];

    if (!warehouseEntryNo) {
      // 跳过空行
      continue;
    }

    records.push({
      warehouseEntryNo: String(warehouseEntryNo).trim(),
      locationCode: locationCode ? String(locationCode).trim() : '',
      _rowIndex: i + 1,
    });
  }

  return { records, errors };
};

/**
 * 预览库位批量导入
 */
export async function previewLocationImport(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传文件' });
    }

    const filePath = req.file.path;

    try {
      const { records, errors } = parseLocationExcel(filePath);

      if (records.length === 0) {
        return res.status(400).json({ success: false, message: '没有有效数据' });
      }

      // 查询数据库中已存在的进仓编号
      const entryNos = records.map(r => r.warehouseEntryNo);
      const existingInventories = await prisma.inventory.findMany({
        where: {
          warehouseEntryNo: { in: entryNos },
        },
        select: {
          id: true,
          warehouseEntryNo: true,
          locationCode: true,
          productName: true,
          customerName: true,
          quantity: true,
        },
      });

      // 建立进仓编号到库存记录的映射
      const inventoryMap = new Map<string, typeof existingInventories[0][]>();
      existingInventories.forEach(inv => {
        if (inv.warehouseEntryNo) {
          if (!inventoryMap.has(inv.warehouseEntryNo)) {
            inventoryMap.set(inv.warehouseEntryNo, []);
          }
          inventoryMap.get(inv.warehouseEntryNo)!.push(inv);
        }
      });

      // 检测重复和不存在的进仓编号
      const duplicates: { warehouseEntryNo: string; count: number }[] = [];
      const notFound: string[] = [];
      const entryNoCount = new Map<string, number>();

      records.forEach(r => {
        entryNoCount.set(r.warehouseEntryNo, (entryNoCount.get(r.warehouseEntryNo) || 0) + 1);
      });

      entryNoCount.forEach((count, entryNo) => {
        if (count > 1) {
          duplicates.push({ warehouseEntryNo: entryNo, count });
        }
      });

      // 为每条记录添加匹配状态
      const previewRecords = records.map(r => {
        const matched = inventoryMap.get(r.warehouseEntryNo);
        const matchCount = matched ? matched.length : 0;

        if (matchCount === 0 && !notFound.includes(r.warehouseEntryNo)) {
          notFound.push(r.warehouseEntryNo);
        }

        return {
          ...r,
          matchCount,
          currentLocation: matched && matched.length > 0 ? matched[0].locationCode : null,
          productName: matched && matched.length > 0 ? matched[0].productName : null,
          customerName: matched && matched.length > 0 ? matched[0].customerName : null,
        };
      });

      res.json({
        success: true,
        data: {
          records: previewRecords.slice(0, 100),
          totalCount: records.length,
          matchedCount: records.filter(r => inventoryMap.has(r.warehouseEntryNo)).length,
          notFoundCount: notFound.length,
          notFound: notFound.slice(0, 20),
          duplicates,
          hasMore: records.length > 100,
        },
        message: `解析成功，共 ${records.length} 条记录`,
      });
    } finally {
      fs.unlinkSync(filePath);
    }
  } catch (error: any) {
    console.error('Preview location import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 确认库位批量导入
 */
export async function confirmLocationImport(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传文件' });
    }

    const filePath = req.file.path;

    try {
      const { records } = parseLocationExcel(filePath);

      if (records.length === 0) {
        return res.status(400).json({ success: false, message: '没有有效数据' });
      }

      let updatedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      // 逐条更新库存的库位
      for (const record of records) {
        try {
          // 查找匹配的库存记录
          const inventories = await prisma.inventory.findMany({
            where: { warehouseEntryNo: record.warehouseEntryNo },
          });

          if (inventories.length === 0) {
            skippedCount++;
            continue;
          }

          // 更新所有匹配记录的库位
          await prisma.inventory.updateMany({
            where: { warehouseEntryNo: record.warehouseEntryNo },
            data: { locationCode: record.locationCode },
          });

          updatedCount += inventories.length;
        } catch (err: any) {
          errors.push(`进仓编号 ${record.warehouseEntryNo}: ${err.message}`);
        }
      }

      res.json({
        success: true,
        message: `成功更新 ${updatedCount} 条库存记录的库位，跳过 ${skippedCount} 条未匹配记录`,
        data: {
          updatedCount,
          skippedCount,
          errors: errors.slice(0, 10),
        },
      });
    } finally {
      fs.unlinkSync(filePath);
    }
  } catch (error: any) {
    console.error('Confirm location import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 下载库位导入模板
 */
export async function downloadLocationTemplate(req: Request, res: Response) {
  try {
    const templateData = [
      { '进仓编号': 'CMD25100437', '库位': '3D15-1' },
      { '进仓编号': 'CMD25090457', '库位': '3D15-2' },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '库位导入模板');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=location_import_template.xlsx');
    res.send(buffer);
  } catch (error: any) {
    console.error('Download template error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
