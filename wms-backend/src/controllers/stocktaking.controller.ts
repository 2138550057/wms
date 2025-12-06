import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取仓库布局
export const getLayout = async (req: Request, res: Response) => {
  try {
    const { floor = 1 } = req.query;

    // 获取布局元素
    const elements = await prisma.warehouseLayout.findMany({
      where: {
        floor: Number(floor),
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        location: true,
      },
    });

    // 获取每个库位的库存统计
    const locationCodes = elements
      .filter((e) => e.type === 'location' && e.locationCode)
      .map((e) => e.locationCode as string);

    const inventorySummary = await prisma.inventory.groupBy({
      by: ['locationCode'],
      where: {
        locationCode: {
          in: locationCodes,
        },
        quantity: {
          gt: 0,
        },
      },
      _sum: {
        quantity: true,
      },
      _count: {
        id: true,
      },
    });

    // 构建库存映射
    const inventoryMap = new Map(
      inventorySummary.map((item) => [
        item.locationCode,
        {
          totalQuantity: item._sum.quantity || 0,
          skuCount: item._count.id,
        },
      ])
    );

    // 组合布局和库存数据
    const elementsWithInventory = elements.map((element) => ({
      id: element.id,
      type: element.type,
      locationId: element.locationId,
      locationCode: element.locationCode,
      label: element.label || element.locationCode,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      bgColor: element.bgColor,
      borderColor: element.borderColor,
      textColor: element.textColor,
      fontSize: element.fontSize,
      zoneGroup: element.zoneGroup,
      // 库存信息
      quantity: element.locationCode
        ? inventoryMap.get(element.locationCode)?.totalQuantity || 0
        : 0,
      skuCount: element.locationCode
        ? inventoryMap.get(element.locationCode)?.skuCount || 0
        : 0,
      // 库位信息
      location: element.location,
    }));

    res.json({
      success: true,
      data: {
        floor: Number(floor),
        elements: elementsWithInventory,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 根据库位数据自动生成布局
export const generateLayout = async (req: Request, res: Response) => {
  try {
    const { floor = 1, clearExisting = false } = req.body;

    // 如果需要清空现有布局
    if (clearExisting) {
      await prisma.warehouseLayout.deleteMany({
        where: { floor: Number(floor) },
      });
    }

    // 获取所有活跃的库位
    const locations = await prisma.location.findMany({
      where: { status: 'active' },
      orderBy: [{ zone: 'asc' }, { number: 'asc' }, { level: 'asc' }],
    });

    // 按区域分组
    const zoneGroups = new Map<string, typeof locations>();
    locations.forEach((loc) => {
      const key = `${loc.bonded ? '保税' : '非保税'}${loc.zone}区`;
      if (!zoneGroups.has(key)) {
        zoneGroups.set(key, []);
      }
      zoneGroups.get(key)!.push(loc);
    });

    // 布局参数
    const blockWidth = 80;
    const blockHeight = 50;
    const blockGap = 5;
    const zoneGap = 30;
    const zonePadding = 40;
    const columnsPerZone = 10;

    let currentY = 50;
    const layoutElements: any[] = [];

    // 为每个区域生成布局
    for (const [zoneName, locs] of zoneGroups) {
      const rows = Math.ceil(locs.length / columnsPerZone);
      const zoneWidth = columnsPerZone * (blockWidth + blockGap) + zonePadding * 2;
      const zoneHeight = rows * (blockHeight + blockGap) + zonePadding * 2 + 30; // 30 for title

      // 添加区域标签
      layoutElements.push({
        type: 'zone',
        label: zoneName,
        x: 50,
        y: currentY,
        width: zoneWidth,
        height: zoneHeight,
        zoneGroup: zoneName,
        floor: Number(floor),
        bgColor: locs[0]?.bonded ? '#f0f5ff' : '#fff7e6',
        borderColor: locs[0]?.bonded ? '#1890ff' : '#fa8c16',
      });

      // 添加库位
      locs.forEach((loc, index) => {
        const col = index % columnsPerZone;
        const row = Math.floor(index / columnsPerZone);

        layoutElements.push({
          type: 'location',
          locationId: loc.id,
          locationCode: loc.code,
          label: loc.code,
          x: 50 + zonePadding + col * (blockWidth + blockGap),
          y: currentY + zonePadding + 30 + row * (blockHeight + blockGap),
          width: blockWidth,
          height: blockHeight,
          zoneGroup: zoneName,
          floor: Number(floor),
        });
      });

      currentY += zoneHeight + zoneGap;
    }

    // 批量创建布局元素
    const createdLayouts = await prisma.warehouseLayout.createMany({
      data: layoutElements,
      skipDuplicates: true,
    });

    res.json({
      success: true,
      message: `成功生成 ${createdLayouts.count} 个布局元素`,
      data: { count: createdLayouts.count },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 批量更新布局
export const updateLayoutBatch = async (req: Request, res: Response) => {
  try {
    const { elements, floor = 1 } = req.body;

    if (!Array.isArray(elements)) {
      return res.status(400).json({ success: false, message: '无效的布局数据' });
    }

    // 使用事务批量更新
    await prisma.$transaction(async (tx) => {
      for (const element of elements) {
        if (element.id) {
          // 更新现有元素
          await tx.warehouseLayout.update({
            where: { id: element.id },
            data: {
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
              rotation: element.rotation,
              bgColor: element.bgColor,
              borderColor: element.borderColor,
              textColor: element.textColor,
              fontSize: element.fontSize,
              label: element.label,
              sortOrder: element.sortOrder,
            },
          });
        } else {
          // 创建新元素
          await tx.warehouseLayout.create({
            data: {
              type: element.type || 'zone',
              label: element.label,
              x: element.x || 0,
              y: element.y || 0,
              width: element.width || 100,
              height: element.height || 60,
              rotation: element.rotation || 0,
              bgColor: element.bgColor,
              borderColor: element.borderColor,
              textColor: element.textColor,
              fontSize: element.fontSize,
              zoneGroup: element.zoneGroup,
              floor: Number(floor),
            },
          });
        }
      }
    });

    res.json({ success: true, message: '布局已保存' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 创建布局元素
export const createLayoutElement = async (req: Request, res: Response) => {
  try {
    const element = await prisma.warehouseLayout.create({
      data: {
        type: req.body.type || 'zone',
        label: req.body.label,
        locationId: req.body.locationId,
        locationCode: req.body.locationCode,
        x: req.body.x || 0,
        y: req.body.y || 0,
        width: req.body.width || 100,
        height: req.body.height || 60,
        rotation: req.body.rotation || 0,
        bgColor: req.body.bgColor,
        borderColor: req.body.borderColor,
        textColor: req.body.textColor,
        fontSize: req.body.fontSize,
        zoneGroup: req.body.zoneGroup,
        floor: req.body.floor || 1,
      },
    });

    res.json({ success: true, data: element });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 更新布局元素
export const updateLayoutElement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const element = await prisma.warehouseLayout.update({
      where: { id: Number(id) },
      data: {
        label: req.body.label,
        x: req.body.x,
        y: req.body.y,
        width: req.body.width,
        height: req.body.height,
        rotation: req.body.rotation,
        bgColor: req.body.bgColor,
        borderColor: req.body.borderColor,
        textColor: req.body.textColor,
        fontSize: req.body.fontSize,
        zoneGroup: req.body.zoneGroup,
        sortOrder: req.body.sortOrder,
      },
    });

    res.json({ success: true, data: element });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 删除布局元素
export const deleteLayoutElement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.warehouseLayout.delete({
      where: { id: Number(id) },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 获取库位汇总信息
export const getLocationSummary = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    // 获取库位基本信息
    const location = await prisma.location.findUnique({
      where: { code },
    });

    if (!location) {
      return res.status(404).json({ success: false, message: '库位不存在' });
    }

    // 获取库位下的库存
    const inventory = await prisma.inventory.findMany({
      where: {
        locationCode: code,
        quantity: { gt: 0 },
      },
      orderBy: { lastInboundDate: 'desc' },
    });

    // 计算统计
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalSku = inventory.length;

    res.json({
      success: true,
      data: {
        location,
        locationCode: code,
        totalQuantity,
        totalSku,
        inventory: inventory.map((item) => ({
          id: item.id,
          warehouseEntryNo: item.warehouseEntryNo,
          productName: item.productName,
          productModel: item.productModel,
          sku: item.sku,
          internalCode: item.internalCode,
          quantity: item.quantity,
          availableQuantity: item.availableQuantity,
          lockedQuantity: item.lockedQuantity,
          customerName: item.customerName,
          customerId: item.customerId,
          lastInboundDate: item.lastInboundDate,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 获取所有库位的汇总统计
export const getAllLocationsSummary = async (req: Request, res: Response) => {
  try {
    const { zone, bonded, hasInventory } = req.query;

    // 构建库位查询条件
    const locationWhere: any = { status: 'active' };
    if (zone) locationWhere.zone = zone;
    // 只有明确传了 'true' 或 'false' 才过滤保税状态
    if (bonded === 'true' || bonded === 'false') {
      locationWhere.bonded = bonded === 'true';
    }

    // 获取所有库位
    const locations = await prisma.location.findMany({
      where: locationWhere,
      orderBy: [{ zone: 'asc' }, { number: 'asc' }, { level: 'asc' }],
    });

    // 获取库存统计
    const inventorySummary = await prisma.inventory.groupBy({
      by: ['locationCode'],
      where: {
        quantity: { gt: 0 },
      },
      _sum: {
        quantity: true,
      },
      _count: {
        id: true,
      },
    });

    // 构建库存映射
    const inventoryMap = new Map(
      inventorySummary.map((item) => [
        item.locationCode,
        {
          totalQuantity: item._sum.quantity || 0,
          skuCount: item._count.id,
        },
      ])
    );

    // 组合数据
    let result = locations.map((loc) => ({
      id: loc.id,
      code: loc.code,
      bonded: loc.bonded,
      zone: loc.zone,
      number: loc.number,
      level: loc.level,
      category: loc.category,
      status: loc.status,
      remark: loc.remark,
      totalQuantity: inventoryMap.get(loc.code)?.totalQuantity || 0,
      skuCount: inventoryMap.get(loc.code)?.skuCount || 0,
    }));

    // 过滤有无库存
    if (hasInventory === 'true') {
      result = result.filter((loc) => loc.totalQuantity > 0);
    } else if (hasInventory === 'false') {
      result = result.filter((loc) => loc.totalQuantity === 0);
    }

    // 统计
    const stats = {
      totalLocations: result.length,
      occupiedLocations: result.filter((loc) => loc.totalQuantity > 0).length,
      emptyLocations: result.filter((loc) => loc.totalQuantity === 0).length,
      totalQuantity: result.reduce((sum, loc) => sum + loc.totalQuantity, 0),
    };

    res.json({
      success: true,
      data: result,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 更新库存的库位
export const updateInventoryLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { locationCode } = req.body;

    // 检查库存是否存在
    const inventory = await prisma.inventory.findUnique({
      where: { id: Number(id) },
    });

    if (!inventory) {
      return res.status(404).json({ success: false, message: '库存记录不存在' });
    }

    // 检查新库位是否存在
    if (locationCode) {
      const location = await prisma.location.findUnique({
        where: { code: locationCode },
      });

      if (!location) {
        return res.status(404).json({ success: false, message: '目标库位不存在' });
      }

      if (location.status !== 'active') {
        return res.status(400).json({ success: false, message: '目标库位已禁用' });
      }
    }

    // 检查是否存在同SKU同客户同库位的库存记录
    if (locationCode && locationCode !== inventory.locationCode) {
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          sku: inventory.sku,
          customerId: inventory.customerId,
          locationCode: locationCode,
          id: { not: inventory.id },
        },
      });

      if (existingInventory) {
        // 合并库存
        await prisma.$transaction([
          prisma.inventory.update({
            where: { id: existingInventory.id },
            data: {
              quantity: existingInventory.quantity + inventory.quantity,
              availableQuantity: existingInventory.availableQuantity + inventory.availableQuantity,
              lockedQuantity: existingInventory.lockedQuantity + inventory.lockedQuantity,
            },
          }),
          prisma.inventory.delete({
            where: { id: inventory.id },
          }),
        ]);

        return res.json({
          success: true,
          message: '库存已合并到目标库位的现有记录',
          data: { merged: true, targetId: existingInventory.id },
        });
      }
    }

    // 更新库位
    const updated = await prisma.inventory.update({
      where: { id: Number(id) },
      data: { locationCode: locationCode || null },
    });

    res.json({
      success: true,
      message: locationCode ? '库位更新成功' : '已清除库位',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 批量更新库存库位
export const batchUpdateInventoryLocation = async (req: Request, res: Response) => {
  try {
    const { inventoryIds, locationCode } = req.body;

    if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要移动的库存' });
    }

    // 检查目标库位
    if (locationCode) {
      const location = await prisma.location.findUnique({
        where: { code: locationCode },
      });

      if (!location) {
        return res.status(404).json({ success: false, message: '目标库位不存在' });
      }

      if (location.status !== 'active') {
        return res.status(400).json({ success: false, message: '目标库位已禁用' });
      }
    }

    // 批量更新
    const result = await prisma.inventory.updateMany({
      where: {
        id: { in: inventoryIds.map(Number) },
      },
      data: {
        locationCode: locationCode || null,
      },
    });

    res.json({
      success: true,
      message: `成功更新 ${result.count} 条库存记录的库位`,
      data: { count: result.count },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 获取未分配库位的库存
export const getUnassignedInventory = async (req: Request, res: Response) => {
  try {
    const { page = 1, size = 20, customerName, productName, sku } = req.query;

    // 获取所有有效库位编码
    const validLocations = await prisma.location.findMany({
      where: { status: 'active' },
      select: { code: true },
    });
    const validLocationCodes = validLocations.map((loc) => loc.code);

    const where: any = {
      quantity: { gt: 0 },
      OR: [
        { locationCode: null },
        { locationCode: '' },
        { locationCode: { notIn: validLocationCodes } }, // 库位不在有效列表中（如DEFAULT）
      ],
    };

    if (customerName) {
      where.customerName = { contains: customerName as string };
    }
    if (productName) {
      where.productName = { contains: productName as string };
    }
    if (sku) {
      where.sku = { contains: sku as string };
    }

    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        skip: (Number(page) - 1) * Number(size),
        take: Number(size),
        orderBy: { lastInboundDate: 'desc' },
      }),
      prisma.inventory.count({ where }),
    ]);

    res.json({
      success: true,
      data: inventory,
      total,
      page: Number(page),
      size: Number(size),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
