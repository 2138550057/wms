import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';
import { createOperationLog } from '../services/operationLog.service';

/**
 * 获取所有待办订单
 */
export async function getPendingOrders(req: AuthRequest, res: Response) {
  try {
    const { type } = req.query;

    const [inbounds, outbounds] = await Promise.all([
      type !== 'outbound'
        ? prisma.inboundOrder.findMany({
            where: { status: 'pending' },
            include: {
              customer: true,
              items: true,
              creator: { select: { id: true, realName: true, username: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],
      type !== 'inbound'
        ? prisma.outboundOrder.findMany({
            where: { status: 'pending' },
            include: {
              customer: true,
              items: true,
              creator: { select: { id: true, realName: true, username: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],
    ]);

    res.json({
      success: true,
      data: {
        inbounds,
        outbounds,
        counts: {
          inbound: inbounds.length,
          outbound: outbounds.length,
          total: inbounds.length + outbounds.length,
        },
      },
    });
  } catch (error: any) {
    console.error('获取待办列表失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取待办列表失败' });
  }
}

/**
 * 获取待办数量
 */
export async function getPendingCount(req: AuthRequest, res: Response) {
  try {
    const [inboundCount, outboundCount] = await Promise.all([
      prisma.inboundOrder.count({ where: { status: 'pending' } }),
      prisma.outboundOrder.count({ where: { status: 'pending' } }),
    ]);

    res.json({
      success: true,
      data: {
        inbound: inboundCount,
        outbound: outboundCount,
        total: inboundCount + outboundCount,
      },
    });
  } catch (error: any) {
    console.error('获取待办数量失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取待办数量失败' });
  }
}

/**
 * 获取入库单详情（移动端）
 */
export async function getInboundDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        items: true,
        creator: { select: { id: true, realName: true, username: true } },
        confirmer: { select: { id: true, realName: true, username: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '入库单不存在' });
    }

    // 获取该订单的附件数量
    const attachmentCount = await prisma.attachment.count({
      where: { entityType: 'inbound', entityId: order.id },
    });

    res.json({
      success: true,
      data: {
        ...order,
        attachmentCount,
      },
    });
  } catch (error: any) {
    console.error('获取入库单详情失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取入库单详情失败' });
  }
}

/**
 * 获取入库单详情（按订单号，移动端）
 */
export async function getInboundDetailByNo(req: AuthRequest, res: Response) {
  try {
    const { orderNo } = req.params;

    const order = await prisma.inboundOrder.findFirst({
      where: { orderNo, status: 'pending' },
      include: {
        customer: true,
        items: true,
        creator: { select: { id: true, realName: true, username: true } },
        confirmer: { select: { id: true, realName: true, username: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '入库单不存在或已完成' });
    }

    // 获取该订单的附件数量
    const attachmentCount = await prisma.attachment.count({
      where: { entityType: 'inbound', entityId: order.id },
    });

    res.json({
      success: true,
      data: {
        ...order,
        attachmentCount,
      },
    });
  } catch (error: any) {
    console.error('获取入库单详情失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取入库单详情失败' });
  }
}

/**
 * 获取出库单详情（移动端）
 */
export async function getOutboundDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const order = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        items: true,
        creator: { select: { id: true, realName: true, username: true } },
        confirmer: { select: { id: true, realName: true, username: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '出库单不存在' });
    }

    // 获取该订单的附件数量
    const attachmentCount = await prisma.attachment.count({
      where: { entityType: 'outbound', entityId: order.id },
    });

    res.json({
      success: true,
      data: {
        ...order,
        attachmentCount,
      },
    });
  } catch (error: any) {
    console.error('获取出库单详情失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取出库单详情失败' });
  }
}

/**
 * 获取出库单详情（按订单号，移动端）
 */
export async function getOutboundDetailByNo(req: AuthRequest, res: Response) {
  try {
    const { orderNo } = req.params;

    const order = await prisma.outboundOrder.findFirst({
      where: { orderNo, status: 'pending' },
      include: {
        customer: true,
        items: true,
        creator: { select: { id: true, realName: true, username: true } },
        confirmer: { select: { id: true, realName: true, username: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '出库单不存在或已完成' });
    }

    // 获取该订单的附件数量
    const attachmentCount = await prisma.attachment.count({
      where: { entityType: 'outbound', entityId: order.id },
    });

    res.json({
      success: true,
      data: {
        ...order,
        attachmentCount,
      },
    });
  } catch (error: any) {
    console.error('获取出库单详情失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取出库单详情失败' });
  }
}

/**
 * 移动端更新入库单明细
 * 仅允许更新库位和实到数量
 */
export async function updateInboundItems(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { items } = req.body;
    const userId = req.userId!;
    const userName = req.username || '未知用户';

    // 验证订单存在且状态为 pending
    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '入库单不存在' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: '只能修改待处理的订单' });
    }

    // 验证 items 数据
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: '明细数据不能为空' });
    }

    // 验证所有 item 都属于该订单
    const orderItemIds = order.items.map(item => item.id);
    for (const item of items) {
      if (!orderItemIds.includes(item.id)) {
        return res.status(400).json({ success: false, message: `明细ID ${item.id} 不属于该订单` });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({ success: false, message: '数量必须大于0' });
      }
    }

    // 使用事务更新明细
    await prisma.$transaction(async (tx) => {
      // 更新每个明细
      for (const item of items) {
        await tx.inboundOrderItem.update({
          where: { id: item.id },
          data: {
            locationCode: item.locationCode || null,
            quantity: item.quantity,
            remark: item.remark !== undefined ? item.remark : undefined,
          },
        });
      }

      // 重新计算订单汇总
      const updatedItems = await tx.inboundOrderItem.findMany({
        where: { orderId: Number(id) },
      });

      const totalQuantity = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalVolume = updatedItems.reduce((sum, item) => sum + (item.volume || 0), 0);
      const totalWeight = updatedItems.reduce((sum, item) => sum + (item.totalGrossWeight || 0), 0);

      // 更新订单汇总字段
      await tx.inboundOrder.update({
        where: { id: Number(id) },
        data: {
          totalQuantity,
          totalVolume,
          totalWeight,
        },
      });
    });

    // 记录操作日志
    await createOperationLog({
      operatorId: userId,
      operatorName: userName,
      module: 'inbound',
      action: 'update',
      targetId: Number(id),
      targetNo: order.orderNo,
      description: `移动端更新入库单明细 ${order.orderNo}，更新了 ${items.length} 条明细`,
      detail: JSON.stringify({ items }),
      source: 'mobile',
    });

    // 返回更新后的订单
    const updatedOrder = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        items: true,
        creator: { select: { id: true, realName: true, username: true } },
      },
    });

    res.json({
      success: true,
      data: updatedOrder,
      message: '明细更新成功',
    });
  } catch (error: any) {
    console.error('更新入库明细失败:', error);
    res.status(500).json({ success: false, message: error.message || '更新明细失败' });
  }
}

/**
 * 移动端确认入库
 */
export async function confirmInbound(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { source = 'mobile', attachmentIds, remark } = req.body;
    const userId = req.userId!;
    const userName = req.username || '未知用户';

    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '入库单不存在' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: '该订单已确认' });
    }

    // 使用事务确认入库
    const result = await prisma.$transaction(async (tx) => {
      // 更新入库单状态
      const updated = await tx.inboundOrder.update({
        where: { id: Number(id) },
        data: {
          status: 'completed',
          confirmedAt: new Date(),
          confirmedBy: userId,
          confirmSource: source,
          remark: remark || order.remark,
        },
      });

      // 更新库存
      for (const item of order.items) {
        const existingInventory = await tx.inventory.findUnique({
          where: {
            sku_customerId_locationCode: {
              customerId: order.customerId,
              sku: item.sku || '',
              locationCode: item.locationCode || 'DEFAULT',
            },
          },
        });

        if (existingInventory) {
          // 更新现有库存
          await tx.inventory.update({
            where: { id: existingInventory.id },
            data: {
              quantity: { increment: item.quantity },
              availableQuantity: { increment: item.quantity },
              volume: existingInventory.volume !== null ? { increment: item.volume || 0 } : item.volume || 0,
              totalGrossWeight: existingInventory.totalGrossWeight !== null ? { increment: item.totalGrossWeight || 0 } : item.totalGrossWeight || 0,
              lastInboundDate: new Date(),
              // 只在新增的item有internalCode且现有库存没有时才更新
              internalCode: existingInventory.internalCode || item.internalCode,
            },
          });
        } else {
          // 创建新库存记录
          await tx.inventory.create({
            data: {
              customerId: order.customerId,
              customerName: order.customerName,
              sku: item.sku || '',
              internalCode: item.internalCode,
              productName: item.productName,
              productModel: item.productModel,
              productCode: item.productCode,
              locationCode: item.locationCode || 'DEFAULT',
              quantity: item.quantity,
              availableQuantity: item.quantity,
              lockedQuantity: 0,
              length: item.length,
              width: item.width,
              height: item.height,
              unitGrossWeight: item.unitGrossWeight,
              totalGrossWeight: item.totalGrossWeight,
              area: item.area,
              volume: item.volume || 0,
              warehouseEntryNo: order.warehouseEntryNo || order.orderNo,
              shippingMark: item.shippingMark,
              poNumber: item.poNumber,
              packageType: item.packageType,
              remark: item.remark,
              lastInboundDate: new Date(),
            },
          });
        }
      }

      return updated;
    });

    // 记录操作日志
    await createOperationLog({
      operatorId: userId,
      operatorName: userName,
      module: 'inbound',
      action: 'confirm',
      targetId: Number(id),
      targetNo: order.orderNo,
      description: `移动端确认入库单 ${order.orderNo}，客户：${order.customerName}，件数：${order.totalQuantity}`,
      detail: JSON.stringify({ source, attachmentIds, remark }),
      source,
    });

    res.json({
      success: true,
      data: result,
      message: '入库确认成功',
    });
  } catch (error: any) {
    console.error('确认入库失败:', error);
    res.status(500).json({ success: false, message: error.message || '确认入库失败' });
  }
}

/**
 * 移动端确认出库
 */
export async function confirmOutbound(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { source = 'mobile', attachmentIds, remark } = req.body;
    const userId = req.userId!;
    const userName = req.username || '未知用户';

    const order = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '出库单不存在' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: '该订单已确认' });
    }

    // 检查库存是否充足
    for (const item of order.items) {
      const inventory = await prisma.inventory.findFirst({
        where: {
          customerId: order.customerId,
          sku: item.sku || '',
          locationCode: item.locationCode || 'DEFAULT',
        },
      });

      if (!inventory || inventory.availableQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `库存不足：${item.productName}，需要 ${item.quantity} 件，可用 ${inventory?.availableQuantity || 0} 件`,
        });
      }
    }

    // 使用事务确认出库
    const result = await prisma.$transaction(async (tx) => {
      // 更新出库单状态
      const updated = await tx.outboundOrder.update({
        where: { id: Number(id) },
        data: {
          status: 'completed',
          confirmedAt: new Date(),
          confirmedBy: userId,
          confirmSource: source,
          remark: remark || order.remark,
        },
      });

      // 扣减库存
      for (const item of order.items) {
        const inventory = await tx.inventory.findFirst({
          where: {
            customerId: order.customerId,
            sku: item.sku || '',
            locationCode: item.locationCode || 'DEFAULT',
          },
        });

        if (inventory) {
          const newQuantity = inventory.quantity - item.quantity;
          const newAvailableQuantity = inventory.availableQuantity - item.quantity;

          if (newQuantity <= 0) {
            // 库存为0，删除记录
            await tx.inventory.delete({ where: { id: inventory.id } });
          } else {
            // 更新库存
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: newQuantity,
                availableQuantity: newAvailableQuantity,
                volume: inventory.volume !== null ? { decrement: item.volume || 0 } : 0,
                totalGrossWeight: inventory.totalGrossWeight !== null ? { decrement: item.totalGrossWeight || 0 } : 0,
                lastOutboundDate: new Date(),
              },
            });
          }
        }
      }

      return updated;
    });

    // 记录操作日志
    await createOperationLog({
      operatorId: userId,
      operatorName: userName,
      module: 'outbound',
      action: 'confirm',
      targetId: Number(id),
      targetNo: order.orderNo,
      description: `移动端确认出库单 ${order.orderNo}，客户：${order.customerName}，件数：${order.totalQuantity}`,
      detail: JSON.stringify({ source, attachmentIds, remark }),
      source,
    });

    res.json({
      success: true,
      data: result,
      message: '出库确认成功',
    });
  } catch (error: any) {
    console.error('确认出库失败:', error);
    res.status(500).json({ success: false, message: error.message || '确认出库失败' });
  }
}
