import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { generateOrderNo, calculateVolume, calculateTotalQuantity, calculateTotalVolume, calculateTotalWeight } from '../utils/helpers';
import { updateInventoryForOutbound, checkInventoryAvailable } from '../services/inventory.service';
import { createOperationLog } from '../services/operationLog.service';
import { OutboundOrderCreateData } from '../types';
import { AuthRequest } from '../middlewares/auth';

/**
 * 检查库存
 */
export async function checkStock(req: Request, res: Response) {
  try {
    const { customerId, items } = req.body;

    const results = [];

    for (const item of items) {
      const sku = item.sku || item.productName;
      const check = await checkInventoryAvailable(
        customerId,
        sku,
        item.locationCode,
        item.quantity
      );

      results.push({
        productName: item.productName,
        sku,
        requestedQuantity: item.quantity,
        availableQuantity: check.available,
        sufficient: check.sufficient,
      });
    }

    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('检查库存失败:', error);
    res.status(500).json({ success: false, message: error.message || '检查库存失败' });
  }
}

/**
 * 创建出库单（状态为pending，不扣减库存）
 */
export async function createOutboundOrder(req: AuthRequest, res: Response) {
  try {
    const data: OutboundOrderCreateData = req.body;

    // 检查库存是否充足（只检查，不扣减）
    for (const item of data.items) {
      const sku = item.sku || item.productName;
      const check = await checkInventoryAvailable(
        data.customerId,
        sku,
        item.locationCode,
        item.quantity
      );

      if (!check.sufficient) {
        return res.status(400).json({
          success: false,
          message: `商品 ${item.productName} 库存不足，当前可用: ${check.available}`,
        });
      }
    }

    // 生成出库单号
    const orderNo = await generateOrderNo('WO');

    // 计算每个明细的体积
    const itemsWithVolume = data.items.map(item => ({
      ...item,
      volume: calculateVolume(item.length, item.width, item.height),
    }));

    // 计算总计
    const totalQuantity = calculateTotalQuantity(itemsWithVolume);
    const totalVolume = calculateTotalVolume(itemsWithVolume);
    const totalWeight = calculateTotalWeight(itemsWithVolume);

    // 创建出库单（状态为pending，不扣减库存）
    const order = await prisma.outboundOrder.create({
      data: {
        orderNo,
        customerId: data.customerId,
        customerName: data.customerName,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        receivingCompany: data.receivingCompany,
        receivingAddress: data.receivingAddress,
        vehicleNumber: data.vehicleNumber,
        driverName: data.driverName,
        businessType: data.businessType || 'sales',
        outboundDate: new Date(data.outboundDate),
        totalQuantity,
        totalVolume,
        totalWeight,
        remark: data.remark,
        createdBy: req.userId,
        status: 'pending',  // 改为pending状态
        items: {
          create: itemsWithVolume,
        },
      },
      include: {
        items: true,
      },
    });

    // 库存扣减移至确认出库时执行

    // 记录操作日志
    await createOperationLog({
      operatorId: req.userId,
      operatorName: req.username || '未知用户',
      module: 'outbound',
      action: 'create',
      targetId: order.id,
      targetNo: order.orderNo,
      description: `新建出库单 ${order.orderNo}，客户：${order.customerName}，件数：${totalQuantity}`,
    });

    res.json({ success: true, data: order });
  } catch (error: any) {
    console.error('创建出库单失败:', error);
    res.status(500).json({ success: false, message: error.message || '创建出库单失败' });
  }
}

/**
 * 查询出库单列表
 */
export async function getOutboundOrders(req: Request, res: Response) {
  try {
    const {
      page = 1,
      size = 20,
      customerName,
      dateFrom,
      dateTo,
      orderNo,
      receivingCompany,
      receivingAddress,
      vehicleNumber,
      businessType,
      status
    } = req.query;

    const where: any = {};

    if (customerName) {
      where.customerName = { contains: customerName as string };
    }

    if (orderNo) {
      where.orderNo = { contains: orderNo as string };
    }

    if (receivingCompany) {
      where.receivingCompany = { contains: receivingCompany as string };
    }

    if (receivingAddress) {
      where.receivingAddress = { contains: receivingAddress as string };
    }

    if (vehicleNumber) {
      where.vehicleNumber = { contains: vehicleNumber as string };
    }

    if (businessType) {
      where.businessType = businessType as string;
    }

    if (status) {
      where.status = status as string;
    }

    if (dateFrom || dateTo) {
      where.outboundDate = {};
      if (dateFrom) where.outboundDate.gte = new Date(dateFrom as string);
      if (dateTo) where.outboundDate.lte = new Date(dateTo as string);
    }

    const [data, total] = await Promise.all([
      prisma.outboundOrder.findMany({
        where,
        skip: (Number(page) - 1) * Number(size),
        take: Number(size),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          creator: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
          },
        },
      }),
      prisma.outboundOrder.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      total,
      page: Number(page),
      size: Number(size),
    });
  } catch (error: any) {
    console.error('查询出库单列表失败:', error);
    res.status(500).json({ success: false, message: error.message || '查询出库单列表失败' });
  }
}

/**
 * 获取出库单详情
 */
export async function getOutboundOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const order = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: {
        items: true,
        customer: true,
        creator: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '出库单不存在' });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    console.error('获取出库单详情失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取出库单详情失败' });
  }
}

/**
 * 删除出库单
 */
export async function deleteOutboundOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { force } = req.query; // 添加强制删除参数

    const order = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '出库单不存在' });
    }

    if (!force) {
      // 如果订单已完成，不允许直接删除，需要先反审核或使用强制删除
      if (order.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: '已确认的出库单不能直接删除，请先反审核或使用强制删除',
        });
      }
    }

    // 强制删除已完成的出库单时，需要恢复库存
    if (force && order.status === 'completed') {
      await prisma.$transaction(async (tx) => {
        // 恢复库存
        for (const item of order.items) {
          const inventory = await tx.inventory.findFirst({
            where: {
              customerId: order.customerId,
              sku: item.sku || '',
              locationCode: item.locationCode || 'DEFAULT',
            },
          });

          if (inventory) {
            // 库存存在，增加数量
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: { increment: item.quantity },
                availableQuantity: { increment: item.quantity },
                volume: inventory.volume !== null ? { increment: item.volume || 0 } : item.volume || 0,
                totalGrossWeight: inventory.totalGrossWeight !== null ? { increment: item.totalGrossWeight || 0 } : item.totalGrossWeight || 0,
              },
            });
          } else {
            // 库存不存在，重新创建（可能之前被删除了）
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
                warehouseEntryNo: item.warehouseEntryNo,
                shippingMark: item.shippingMark,
                poNumber: item.poNumber,
                packageType: item.packageType,
                remark: item.remark,
                lastInboundDate: new Date(),
              },
            });
          }
        }

        // 删除出库单
        await tx.outboundOrder.delete({
          where: { id: Number(id) },
        });
      });
    } else {
      // pending 状态的订单可以直接删除（因为没有扣减库存）
      await prisma.outboundOrder.delete({
        where: { id: Number(id) },
      });
    }

    // 记录操作日志
    await createOperationLog({
      operatorId: req.userId,
      operatorName: req.username || '未知用户',
      module: 'outbound',
      action: 'delete',
      targetId: order.id,
      targetNo: order.orderNo,
      description: `${force ? '强制' : ''}删除出库单 ${order.orderNo}，客户：${order.customerName}`,
    });

    res.json({ success: true, message: `${force ? '强制' : ''}删除成功` });
  } catch (error: any) {
    console.error('删除出库单失败:', error);
    res.status(500).json({ success: false, message: error.message || '删除出库单失败' });
  }
}

/**
 * 确认出库（将状态改为completed并扣减库存）
 */
export async function confirmOutboundOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const order = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '出库单不存在' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: '该出库单已确认' });
    }

    // 再次检查库存是否充足
    for (const item of order.items) {
      const sku = item.sku || item.productName;
      const check = await checkInventoryAvailable(
        order.customerId,
        sku,
        item.locationCode || undefined,
        item.quantity
      );

      if (!check.sufficient) {
        return res.status(400).json({
          success: false,
          message: `商品 ${item.productName} 库存不足，当前可用: ${check.available}，需要: ${item.quantity}`,
        });
      }
    }

    // 使用事务更新订单状态并扣减库存
    await prisma.$transaction(async (tx) => {
      // 更新订单状态为completed
      await tx.outboundOrder.update({
        where: { id: Number(id) },
        data: { status: 'completed' },
      });

      // 扣减库存
      for (const item of order.items) {
        // 根据进仓编号或SKU查找库存
        const inventory = await tx.inventory.findFirst({
          where: {
            customerId: order.customerId,
            OR: [
              { warehouseEntryNo: item.warehouseEntryNo || undefined },
              {
                AND: [
                  { sku: item.sku || '' },
                  { locationCode: item.locationCode || 'DEFAULT' },
                ],
              },
            ],
          },
        });

        if (!inventory) {
          throw new Error(
            `找不到库存记录：${item.productName} (SKU: ${item.sku})，库位：${item.locationCode}`
          );
        }

        if (inventory.availableQuantity < item.quantity) {
          throw new Error(
            `库存不足：${item.productName} (SKU: ${item.sku})，可用库存：${inventory.availableQuantity}，需要：${item.quantity}`
          );
        }

        // 扣减库存
        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: inventory.quantity - item.quantity,
            availableQuantity: inventory.availableQuantity - item.quantity,
            lastOutboundDate: new Date(),
          },
        });
      }
    });

    const updatedOrder = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    // 记录操作日志
    await createOperationLog({
      operatorId: req.userId,
      operatorName: req.username || '未知用户',
      module: 'outbound',
      action: 'confirm',
      targetId: order.id,
      targetNo: order.orderNo,
      description: `确认出库 ${order.orderNo}，客户：${order.customerName}，件数：${order.totalQuantity}`,
    });

    res.json({ success: true, data: updatedOrder, message: '确认出库成功' });
  } catch (error: any) {
    console.error('确认出库失败:', error);
    res.status(500).json({ success: false, message: error.message || '确认出库失败' });
  }
}

/**
 * 反审核出库单（将状态改回pending并恢复库存）
 */
export async function reverseAuditOutboundOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const order = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '出库单不存在' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ success: false, message: '只有已完成的单据才能反审核' });
    }

    // 使用事务恢复库存并更新订单状态
    await prisma.$transaction(async (tx) => {
      // 恢复库存
      for (const item of order.items) {
        // 根据进仓编号或SKU查找库存
        const inventory = await tx.inventory.findFirst({
          where: {
            customerId: order.customerId,
            OR: [
              { warehouseEntryNo: item.warehouseEntryNo || undefined },
              {
                AND: [
                  { sku: item.sku || '' },
                  { locationCode: item.locationCode || 'DEFAULT' },
                ],
              },
            ],
          },
        });

        if (inventory) {
          // 增加库存（恢复出库的数量）
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: inventory.quantity + item.quantity,
              availableQuantity: inventory.availableQuantity + item.quantity,
            },
          });
        } else {
          // 如果找不到库存记录，需要重新创建
          await tx.inventory.create({
            data: {
              customerId: order.customerId,
              customerName: order.customerName,
              sku: item.sku || '',
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
              volume: item.volume,
              warehouseEntryNo: item.warehouseEntryNo,
              shippingMark: item.shippingMark,
              poNumber: item.poNumber,
              packageType: item.packageType,
              remark: item.remark,
              lastInboundDate: new Date(),
            },
          });
        }
      }

      // 更新订单状态为pending
      await tx.outboundOrder.update({
        where: { id: Number(id) },
        data: { status: 'pending' },
      });
    });

    const updatedOrder = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    // 记录操作日志
    await createOperationLog({
      operatorId: req.userId,
      operatorName: req.username || '未知用户',
      module: 'outbound',
      action: 'reverse',
      targetId: order.id,
      targetNo: order.orderNo,
      description: `反出库 ${order.orderNo}，客户：${order.customerName}，件数：${order.totalQuantity}`,
    });

    res.json({ success: true, data: updatedOrder, message: '反审核成功，库存已恢复' });
  } catch (error: any) {
    console.error('反审核出库单失败:', error);
    res.status(500).json({ success: false, message: error.message || '反审核出库单失败' });
  }
}

/**
 * 更新出库单（只能更新pending状态的订单）
 */
export async function updateOutboundOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data: OutboundOrderCreateData = req.body;

    const existingOrder = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: '出库单不存在' });
    }

    // 检查订单状态，如果已完成则不允许修改
    if (existingOrder.status === 'completed') {
      return res.status(400).json({ success: false, message: '已出库无法更新，请先反审核' });
    }

    // 检查库存是否充足
    for (const item of data.items) {
      const sku = item.sku || item.productName;
      const check = await checkInventoryAvailable(
        data.customerId,
        sku,
        item.locationCode,
        item.quantity
      );

      if (!check.sufficient) {
        return res.status(400).json({
          success: false,
          message: `商品 ${item.productName} 库存不足，当前可用: ${check.available}`,
        });
      }
    }

    // 计算每个明细的体积
    const itemsWithVolume = data.items.map(item => ({
      ...item,
      volume: calculateVolume(item.length, item.width, item.height),
    }));

    // 计算总计
    const totalQuantity = calculateTotalQuantity(itemsWithVolume);
    const totalVolume = calculateTotalVolume(itemsWithVolume);
    const totalWeight = calculateTotalWeight(itemsWithVolume);

    // 删除旧的明细
    await prisma.outboundOrderItem.deleteMany({
      where: { orderId: Number(id) },
    });

    // 更新出库单（包含新的明细）
    const order = await prisma.outboundOrder.update({
      where: { id: Number(id) },
      data: {
        customerId: data.customerId,
        customerName: data.customerName,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        receivingCompany: data.receivingCompany,
        receivingAddress: data.receivingAddress,
        vehicleNumber: data.vehicleNumber,
        driverName: data.driverName,
        businessType: data.businessType || 'sales',
        outboundDate: new Date(data.outboundDate),
        totalQuantity,
        totalVolume,
        totalWeight,
        remark: data.remark,
        items: {
          create: itemsWithVolume,
        },
      },
      include: {
        items: true,
      },
    });

    // 记录操作日志
    await createOperationLog({
      operatorId: req.userId,
      operatorName: req.username || '未知用户',
      module: 'outbound',
      action: 'update',
      targetId: order.id,
      targetNo: order.orderNo,
      description: `编辑出库单 ${order.orderNo}，客户：${order.customerName}，件数：${totalQuantity}`,
    });

    res.json({ success: true, data: order, message: '更新成功' });
  } catch (error: any) {
    console.error('更新出库单失败:', error);
    res.status(500).json({ success: false, message: error.message || '更新出库单失败' });
  }
}
