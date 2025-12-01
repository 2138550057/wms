import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { generateOrderNo, calculateVolume, calculateTotalQuantity, calculateTotalVolume, calculateTotalWeight } from '../utils/helpers';
import { updateInventoryForInbound } from '../services/inventory.service';
import { createOperationLog } from '../services/operationLog.service';
import { InboundOrderCreateData } from '../types';
import { AuthRequest } from '../middlewares/auth';

/**
 * 创建入库单
 */
export async function createInboundOrder(req: AuthRequest, res: Response) {
  try {
    const data: InboundOrderCreateData = req.body;

    // 生成入库单号
    const orderNo = await generateOrderNo('WI');

    // 计算每个明细的体积
    const itemsWithVolume = data.items.map(item => ({
      ...item,
      volume: calculateVolume(item.length, item.width, item.height),
    }));

    // 计算总计
    const totalQuantity = calculateTotalQuantity(itemsWithVolume);
    const totalVolume = calculateTotalVolume(itemsWithVolume);
    const totalWeight = calculateTotalWeight(itemsWithVolume);

    // 创建入库单（包含明细）
    const order = await prisma.inboundOrder.create({
      data: {
        orderNo,
        customerId: data.customerId,
        customerName: data.customerName,
        warehouseEntryNo: data.warehouseEntryNo,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        actualQuantity: data.actualQuantity,
        vehicleNumber: data.vehicleNumber,
        driverName: data.driverName,
        businessType: data.businessType || 'normal',
        inboundDate: new Date(data.inboundDate),
        totalQuantity,
        totalVolume,
        totalWeight,
        remark: data.remark,
        createdBy: req.userId,
        status: 'pending',
        items: {
          create: itemsWithVolume,
        },
      },
      include: {
        items: true,
      },
    });

    // 库存更新移至确认入库时执行，创建时不更新库存

    // 记录操作日志
    await createOperationLog({
      operatorId: req.userId,
      operatorName: req.username || '未知用户',
      module: 'inbound',
      action: 'create',
      targetId: order.id,
      targetNo: order.orderNo,
      description: `新建入库单 ${order.orderNo}，客户：${order.customerName}，件数：${totalQuantity}`,
      detail: { customerId: data.customerId, customerName: data.customerName, totalQuantity },
    });

    res.json({ success: true, data: order });
  } catch (error: any) {
    console.error('创建入库单失败:', error);
    res.status(500).json({ success: false, message: error.message || '创建入库单失败' });
  }
}

/**
 * 查询入库单列表
 */
export async function getInboundOrders(req: Request, res: Response) {
  try {
    const {
      page = 1,
      size = 20,
      customerName,
      dateFrom,
      dateTo,
      orderNo,
      warehouseEntryNo,
      deliveryCompany,
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

    if (warehouseEntryNo) {
      where.warehouseEntryNo = { contains: warehouseEntryNo as string };
    }

    if (deliveryCompany) {
      where.deliveryCompany = { contains: deliveryCompany as string };
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
      where.inboundDate = {};
      if (dateFrom) where.inboundDate.gte = new Date(dateFrom as string);
      if (dateTo) where.inboundDate.lte = new Date(dateTo as string);
    }

    const [data, total] = await Promise.all([
      prisma.inboundOrder.findMany({
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
      prisma.inboundOrder.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      total,
      page: Number(page),
      size: Number(size),
    });
  } catch (error: any) {
    console.error('查询入库单列表失败:', error);
    res.status(500).json({ success: false, message: error.message || '查询入库单列表失败' });
  }
}

/**
 * 获取入库单详情
 */
export async function getInboundOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const order = await prisma.inboundOrder.findUnique({
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
      return res.status(404).json({ success: false, message: '入库单不存在' });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    console.error('获取入库单详情失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取入库单详情失败' });
  }
}

/**
 * 删除入库单
 */
export async function deleteInboundOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { force } = req.query; // 添加强制删除参数

    // 查询入库单
    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '入库单不存在' });
    }

    if (!force) {
      // 非强制删除时进行检查
      // 检查是否有出库记录引用了这个入库单的进仓编号或单号
      const relatedOutboundItems = await prisma.outboundOrderItem.findFirst({
        where: {
          OR: [
            { warehouseEntryNo: order.warehouseEntryNo || undefined },
            { warehouseEntryNo: order.orderNo },
          ],
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
          message: `无法删除：该入库单的货物已有出库记录（出库单号：${relatedOutboundItems.order.orderNo}），请先删除相关出库单或使用强制删除`,
        });
      }

      // 检查是否有库存记录引用了这个进仓编号
      const relatedInventory = await prisma.inventory.findFirst({
        where: {
          OR: [
            { warehouseEntryNo: order.warehouseEntryNo || undefined },
            { warehouseEntryNo: order.orderNo },
          ],
        },
      });

      if (relatedInventory && relatedInventory.quantity > 0) {
        return res.status(400).json({
          success: false,
          message: `无法删除：该入库单的货物还有 ${relatedInventory.quantity} 件库存，库位：${relatedInventory.locationCode || '未知'}，请先出库或使用强制删除`,
        });
      }
    }

    // 强制删除或通过检查后，删除相关库存记录（无论数量多少）
    await prisma.inventory.deleteMany({
      where: {
        OR: [
          { warehouseEntryNo: order.warehouseEntryNo || undefined },
          { warehouseEntryNo: order.orderNo },
        ],
      },
    });

    // 删除入库单（级联删除明细）
    await prisma.inboundOrder.delete({
      where: { id: Number(id) },
    });

    // 记录操作日志
    await createOperationLog({
      operatorId: req.userId,
      operatorName: req.username || '未知用户',
      module: 'inbound',
      action: 'delete',
      targetId: order.id,
      targetNo: order.orderNo,
      description: `${force ? '强制' : ''}删除入库单 ${order.orderNo}，客户：${order.customerName}`,
    });

    res.json({ success: true, message: `${force ? '强制' : ''}删除成功` });
  } catch (error: any) {
    console.error('删除入库单失败:', error);
    res.status(500).json({ success: false, message: error.message || '删除入库单失败' });
  }
}

/**
 * 反审核入库单（将状态改回pending并回退库存）
 */
export async function reverseAuditInboundOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '入库单不存在' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ success: false, message: '只有已完成的单据才能反审核' });
    }

    // 检查是否有出库记录引用了这个入库单的进仓编号
    const relatedOutboundItems = await prisma.outboundOrderItem.findFirst({
      where: {
        OR: [
          { warehouseEntryNo: order.warehouseEntryNo || undefined },
          { warehouseEntryNo: order.orderNo },
        ],
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
        message: `无法反审核：该入库单的货物已有出库记录（出库单号：${relatedOutboundItems.order.orderNo}），请先反审核相关出库单`,
      });
    }

    // 使用事务回退库存并更新订单状态
    await prisma.$transaction(async (tx) => {
      // 更新订单状态为pending
      await tx.inboundOrder.update({
        where: { id: Number(id) },
        data: { status: 'pending' },
      });

      // 回退库存
      for (const item of order.items) {
        const existingInventory = await tx.inventory.findFirst({
          where: {
            customerId: order.customerId,
            sku: item.sku || '',
            locationCode: item.locationCode || 'DEFAULT',
          },
        });

        if (existingInventory) {
          const newQuantity = existingInventory.quantity - item.quantity;
          const newAvailableQuantity = existingInventory.availableQuantity - item.quantity;

          if (newQuantity < 0 || newAvailableQuantity < 0) {
            throw new Error(
              `库存不足，无法反审核：${item.productName} (SKU: ${item.sku})，库位：${item.locationCode}，当前库存：${existingInventory.quantity}，需要回退：${item.quantity}`
            );
          }

          if (newQuantity === 0) {
            // 库存减到0，删除库存记录
            await tx.inventory.delete({
              where: { id: existingInventory.id },
            });
          } else {
            // 减少库存数量
            await tx.inventory.update({
              where: { id: existingInventory.id },
              data: {
                quantity: newQuantity,
                availableQuantity: newAvailableQuantity,
              },
            });
          }
        } else {
          throw new Error(
            `找不到对应的库存记录：${item.productName} (SKU: ${item.sku})，库位：${item.locationCode}`
          );
        }
      }
    });

    const updatedOrder = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    // 记录操作日志
    await createOperationLog({
      operatorId: req.userId,
      operatorName: req.username || '未知用户',
      module: 'inbound',
      action: 'reverse',
      targetId: order.id,
      targetNo: order.orderNo,
      description: `反入库 ${order.orderNo}，客户：${order.customerName}，件数：${order.totalQuantity}`,
    });

    res.json({ success: true, data: updatedOrder, message: '反审核成功，库存已回退' });
  } catch (error: any) {
    console.error('反审核入库单失败:', error);
    res.status(500).json({ success: false, message: error.message || '反审核入库单失败' });
  }
}

/**
 * 确认入库（将状态改为completed并更新库存）
 */
export async function confirmInboundOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { items: updatedItems, remark, source } = req.body;

    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '入库单不存在' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: '该入库单已确认' });
    }

    // 更新订单状态为completed并更新库存
    await prisma.$transaction(async (tx) => {
      // 如果移动端传入了修改后的明细，先更新明细
      if (updatedItems && Array.isArray(updatedItems) && updatedItems.length > 0) {
        // 删除旧明细
        await tx.inboundOrderItem.deleteMany({
          where: { orderId: Number(id) },
        });

        // 创建新明细
        const itemsWithVolume = updatedItems.map((item: any) => ({
          orderId: Number(id),
          productName: item.productName,
          productModel: item.productModel,
          sku: item.sku,
          internalCode: item.internalCode,
          productCode: item.productCode,
          shippingMark: item.shippingMark,
          poNumber: item.poNumber,
          quantity: Number(item.quantity) || 0,
          packageType: item.packageType,
          locationCode: item.locationCode,
          length: item.length ? Number(item.length) : null,
          width: item.width ? Number(item.width) : null,
          height: item.height ? Number(item.height) : null,
          volume: item.length && item.width && item.height
            ? (Number(item.length) * Number(item.width) * Number(item.height)) / 1000000
            : null,
          area: item.area ? Number(item.area) : null,
          unitGrossWeight: item.unitGrossWeight ? Number(item.unitGrossWeight) : null,
          totalGrossWeight: item.totalGrossWeight ? Number(item.totalGrossWeight) : null,
          remark: item.remark,
        }));

        await tx.inboundOrderItem.createMany({
          data: itemsWithVolume,
        });

        // 更新订单总计
        const totalQuantity = itemsWithVolume.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        const totalVolume = itemsWithVolume.reduce((sum: number, item: any) => sum + (item.volume || 0), 0);
        const totalWeight = itemsWithVolume.reduce((sum: number, item: any) => sum + (item.totalGrossWeight || 0), 0);

        await tx.inboundOrder.update({
          where: { id: Number(id) },
          data: {
            status: 'completed',
            totalQuantity,
            totalVolume: totalVolume || null,
            totalWeight: totalWeight || null,
            remark: remark || order.remark,
          },
        });
      } else {
        // 没有传入明细，直接更新状态
        await tx.inboundOrder.update({
          where: { id: Number(id) },
          data: {
            status: 'completed',
            remark: remark || order.remark,
          },
        });
      }

      // 重新获取更新后的订单明细（如果传入了新明细，需要用新的来更新库存）
      const finalOrder = await tx.inboundOrder.findUnique({
        where: { id: Number(id) },
        include: { items: true },
      });

      // 更新库存
      for (const item of finalOrder!.items) {
        const existingInventory = await tx.inventory.findFirst({
          where: {
            customerId: order.customerId,
            sku: item.sku || '',
            locationCode: item.locationCode || 'DEFAULT',
          },
        });

        if (existingInventory) {
          // 更新现有库存
          await tx.inventory.update({
            where: { id: existingInventory.id },
            data: {
              quantity: existingInventory.quantity + item.quantity,
              availableQuantity: existingInventory.availableQuantity + item.quantity,
              lastInboundDate: new Date(),
              internalCode: item.internalCode || existingInventory.internalCode,
              length: item.length || existingInventory.length,
              width: item.width || existingInventory.width,
              height: item.height || existingInventory.height,
              unitGrossWeight: item.unitGrossWeight || existingInventory.unitGrossWeight,
              totalGrossWeight: item.totalGrossWeight || existingInventory.totalGrossWeight,
              area: item.area || existingInventory.area,
              volume: item.volume || existingInventory.volume,
              warehouseEntryNo: order.warehouseEntryNo || existingInventory.warehouseEntryNo,
              shippingMark: item.shippingMark || existingInventory.shippingMark,
              poNumber: item.poNumber || existingInventory.poNumber,
              packageType: item.packageType || existingInventory.packageType,
              remark: item.remark || existingInventory.remark,
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
              volume: item.volume,
              warehouseEntryNo: order.warehouseEntryNo,
              shippingMark: item.shippingMark,
              poNumber: item.poNumber,
              packageType: item.packageType,
              remark: item.remark,
              lastInboundDate: new Date(),
            },
          });
        }
      }
    });

    const updatedOrder = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    // 记录操作日志
    await createOperationLog({
      operatorId: req.userId,
      operatorName: req.username || '未知用户',
      module: 'inbound',
      action: 'confirm',
      targetId: order.id,
      targetNo: order.orderNo,
      description: `确认入库 ${order.orderNo}，客户：${order.customerName}，件数：${order.totalQuantity}`,
    });

    res.json({ success: true, data: updatedOrder, message: '确认入库成功' });
  } catch (error: any) {
    console.error('确认入库失败:', error);
    res.status(500).json({ success: false, message: error.message || '确认入库失败' });
  }
}

/**
 * 更新入库单
 */
export async function updateInboundOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data: InboundOrderCreateData = req.body;

    const existingOrder = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: '入库单不存在' });
    }

    // 检查订单状态,如果已完成则不允许修改
    if (existingOrder.status === 'completed') {
      return res.status(400).json({ success: false, message: '已入库无法更新' });
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
    await prisma.inboundOrderItem.deleteMany({
      where: { orderId: Number(id) },
    });

    // 更新入库单（包含新的明细）
    const order = await prisma.inboundOrder.update({
      where: { id: Number(id) },
      data: {
        customerId: data.customerId,
        customerName: data.customerName,
        warehouseEntryNo: data.warehouseEntryNo,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        actualQuantity: data.actualQuantity,
        vehicleNumber: data.vehicleNumber,
        driverName: data.driverName,
        businessType: data.businessType || 'normal',
        inboundDate: new Date(data.inboundDate),
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
      module: 'inbound',
      action: 'update',
      targetId: order.id,
      targetNo: order.orderNo,
      description: `编辑入库单 ${order.orderNo}，客户：${order.customerName}，件数：${totalQuantity}`,
    });

    res.json({ success: true, data: order, message: '更新成功' });
  } catch (error: any) {
    console.error('更新入库单失败:', error);
    res.status(500).json({ success: false, message: error.message || '更新入库单失败' });
  }
}
