import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../utils/prisma';

const moduleNameMap: Record<string, string> = {
  inbound: '入库管理',
  outbound: '出库管理',
  inventory: '库存管理',
  customer: '客户管理',
  location: '库位管理',
  user: '用户管理',
};

const actionNameMap: Record<string, string> = {
  create: '新建',
  update: '编辑',
  delete: '删除',
  confirm: '确认',
  reverse: '反审核',
  import: '导入',
  export: '导出',
};

/**
 * 获取操作日志列表
 */
export async function getOperationLogs(req: AuthRequest, res: Response) {
  try {
    const {
      page = 1,
      size = 20,
      module,
      action,
      operatorName,
      dateFrom,
      dateTo,
    } = req.query;

    const pageNum = Number(page);
    const pageSize = Number(size);

    const where: any = {};

    if (module) {
      where.module = String(module);
    }

    if (action) {
      where.action = String(action);
    }

    if (operatorName) {
      where.operatorName = {
        contains: String(operatorName),
      };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(String(dateFrom));
      }
      if (dateTo) {
        where.createdAt.lte = new Date(new Date(String(dateTo)).setHours(23, 59, 59, 999));
      }
    }

    const [logs, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.operationLog.count({ where }),
    ]);

    const formattedLogs = logs.map(log => ({
      ...log,
      moduleName: moduleNameMap[log.module] || log.module,
      actionName: actionNameMap[log.action] || log.action,
    }));

    res.json({
      success: true,
      data: formattedLogs,
      total,
      page: pageNum,
      size: pageSize,
    });
  } catch (error: any) {
    console.error('获取操作日志失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取操作日志失败' });
  }
}

/**
 * 获取入库日志列表（基于入库单明细）
 */
export async function getInboundLogs(req: AuthRequest, res: Response) {
  try {
    const {
      page = 1,
      size = 20,
      customerName,
      orderNo,
      warehouseEntryNo,
      dateFrom,
      dateTo,
    } = req.query;

    const pageNum = Number(page);
    const pageSize = Number(size);

    // 构建查询条件
    const where: any = {};

    if (customerName) {
      where.order = {
        customerName: {
          contains: String(customerName),
        },
      };
    }

    if (orderNo) {
      where.order = {
        ...where.order,
        orderNo: {
          contains: String(orderNo),
        },
      };
    }

    if (warehouseEntryNo) {
      where.OR = [
        {
          order: {
            warehouseEntryNo: { contains: String(warehouseEntryNo) },
          },
        },
        {
          order: {
            orderNo: { contains: String(warehouseEntryNo) },
          },
        },
      ];
    }

    if (dateFrom || dateTo) {
      where.order = {
        ...where.order,
        createdAt: {},
      };
      if (dateFrom) {
        where.order.createdAt.gte = new Date(String(dateFrom));
      }
      if (dateTo) {
        where.order.createdAt.lte = new Date(new Date(String(dateTo)).setHours(23, 59, 59, 999));
      }
    }

    // 查询入库明细
    const [items, total] = await Promise.all([
      prisma.inboundOrderItem.findMany({
        where,
        include: {
          order: {
            select: {
              orderNo: true,
              warehouseEntryNo: true,
              customerName: true,
              customerId: true,
              inboundDate: true,
              status: true,
              createdAt: true,
              businessType: true,
              remark: true,
            },
          },
        },
        orderBy: {
          order: {
            createdAt: 'desc',
          },
        },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.inboundOrderItem.count({ where }),
    ]);

    // 格式化返回数据
    const logs = items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      orderNo: item.order.orderNo,
      customerName: item.order.customerName,
      customerId: item.order.customerId,
      inboundDate: item.order.inboundDate,
      businessType: item.order.businessType,
      status: item.order.status,
      warehouseEntryNo: item.order.warehouseEntryNo || item.order.orderNo,
      productName: item.productName,
      productModel: item.productModel,
      sku: item.sku,
      productCode: item.productCode,
      shippingMark: item.shippingMark,
      poNumber: item.poNumber,
      locationCode: item.locationCode,
      packageType: item.packageType,
      quantity: item.quantity,
      length: item.length,
      width: item.width,
      height: item.height,
      volume: item.volume,
      weight: item.totalGrossWeight,
      remark: item.remark || item.order.remark,
      createdAt: item.order.createdAt,
    }));

    res.json({
      success: true,
      data: logs,
      total,
      page: pageNum,
      size: pageSize,
    });
  } catch (error: any) {
    console.error('获取入库日志失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取入库日志失败' });
  }
}

/**
 * 获取出库日志列表（基于出库单明细）
 */
export async function getOutboundLogs(req: AuthRequest, res: Response) {
  try {
    const {
      page = 1,
      size = 20,
      customerName,
      orderNo,
      warehouseEntryNo,
      dateFrom,
      dateTo,
    } = req.query;

    const pageNum = Number(page);
    const pageSize = Number(size);

    // 构建查询条件
    const where: any = {};

    if (customerName) {
      where.order = {
        customerName: {
          contains: String(customerName),
        },
      };
    }

    if (orderNo) {
      where.order = {
        ...where.order,
        orderNo: {
          contains: String(orderNo),
        },
      };
    }

    if (warehouseEntryNo) {
      where.warehouseEntryNo = {
        contains: String(warehouseEntryNo),
      };
    }

    if (dateFrom || dateTo) {
      where.order = {
        ...where.order,
        createdAt: {},
      };
      if (dateFrom) {
        where.order.createdAt.gte = new Date(String(dateFrom));
      }
      if (dateTo) {
        where.order.createdAt.lte = new Date(new Date(String(dateTo)).setHours(23, 59, 59, 999));
      }
    }

    // 查询出库明细
    const [items, total] = await Promise.all([
      prisma.outboundOrderItem.findMany({
        where,
        include: {
          order: {
            select: {
              orderNo: true,
              customerName: true,
              customerId: true,
              outboundDate: true,
              status: true,
              createdAt: true,
              businessType: true,
              receivingCompany: true,
              receivingAddress: true,
              vehicleNumber: true,
              driverName: true,
              contactPerson: true,
              contactPhone: true,
              remark: true,
            },
          },
        },
        orderBy: {
          order: {
            createdAt: 'desc',
          },
        },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.outboundOrderItem.count({ where }),
    ]);

    // 格式化返回数据
    const logs = items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      orderNo: item.order.orderNo,
      customerName: item.order.customerName,
      customerId: item.order.customerId,
      outboundDate: item.order.outboundDate,
      businessType: item.order.businessType,
      status: item.order.status,
      receivingCompany: item.order.receivingCompany,
      receivingAddress: item.order.receivingAddress,
      vehicleNumber: item.order.vehicleNumber,
      driverName: item.order.driverName,
      contactPerson: item.order.contactPerson,
      contactPhone: item.order.contactPhone,
      warehouseEntryNo: item.warehouseEntryNo,
      productName: item.productName,
      productModel: item.productModel,
      sku: item.sku,
      productCode: item.productCode,
      shippingMark: item.shippingMark,
      poNumber: item.poNumber,
      locationCode: item.locationCode,
      packageType: item.packageType,
      quantity: item.quantity,
      length: item.length,
      width: item.width,
      height: item.height,
      volume: item.volume,
      weight: item.totalGrossWeight,
      remark: item.remark || item.order.remark,
      createdAt: item.order.createdAt,
    }));

    res.json({
      success: true,
      data: logs,
      total,
      page: pageNum,
      size: pageSize,
    });
  } catch (error: any) {
    console.error('获取出库日志失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取出库日志失败' });
  }
}

/**
 * 获取库存管理日志（综合入库和出库记录）
 */
export async function getInventoryLogs(req: AuthRequest, res: Response) {
  try {
    const {
      page = 1,
      size = 20,
      customerName,
      orderNo,
      warehouseEntryNo,
      dateFrom,
      dateTo,
      operationType, // 'inbound' | 'outbound' | 'all'
    } = req.query;

    const pageNum = Number(page);
    const pageSize = Number(size);

    // 构建日期筛选
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(String(dateFrom));
    }
    if (dateTo) {
      dateFilter.lte = new Date(new Date(String(dateTo)).setHours(23, 59, 59, 999));
    }

    const logs: any[] = [];

    // 查询入库记录
    if (!operationType || operationType === 'all' || operationType === 'inbound') {
      const inboundWhere: any = {};

      if (customerName) {
        inboundWhere.order = {
          customerName: { contains: String(customerName) },
        };
      }

      if (orderNo) {
        inboundWhere.order = {
          ...inboundWhere.order,
          orderNo: { contains: String(orderNo) },
        };
      }

      if (warehouseEntryNo) {
        inboundWhere.OR = [
          {
            order: {
              warehouseEntryNo: { contains: String(warehouseEntryNo) },
            },
          },
          {
            order: {
              orderNo: { contains: String(warehouseEntryNo) },
            },
          },
        ];
      }

      if (Object.keys(dateFilter).length > 0) {
        inboundWhere.order = {
          ...inboundWhere.order,
          createdAt: dateFilter,
        };
      }

      const inboundItems = await prisma.inboundOrderItem.findMany({
        where: inboundWhere,
        include: {
          order: {
            select: {
              orderNo: true,
              warehouseEntryNo: true,
              customerName: true,
              customerId: true,
              status: true,
              createdAt: true,
              businessType: true,
            },
          },
        },
        orderBy: {
          order: {
            createdAt: 'desc',
          },
        },
      });

      logs.push(
        ...inboundItems.map((item) => ({
          id: `in-${item.id}`,
          operationType: 'inbound',
          operationTypeName: '入库',
          orderNo: item.order.orderNo,
          customerName: item.order.customerName,
          customerId: item.order.customerId,
          status: item.order.status,
          statusName: item.order.status === 'completed' ? '已完成' : '待处理',
          businessType: item.order.businessType,
          businessTypeName:
            item.order.businessType === 'normal'
              ? '正常入库'
              : item.order.businessType === 'return'
              ? '退货入库'
              : '调拨入库',
          warehouseEntryNo: item.order.warehouseEntryNo || item.order.orderNo,
          productName: item.productName,
          productModel: item.productModel,
          sku: item.sku,
          productCode: item.productCode,
          locationCode: item.locationCode,
          quantity: item.quantity,
          quantityChange: `+${item.quantity}`,
          volume: item.volume,
          weight: item.totalGrossWeight,
          createdAt: item.order.createdAt,
        }))
      );
    }

    // 查询出库记录
    if (!operationType || operationType === 'all' || operationType === 'outbound') {
      const outboundWhere: any = {};

      if (customerName) {
        outboundWhere.order = {
          customerName: { contains: String(customerName) },
        };
      }

      if (orderNo) {
        outboundWhere.order = {
          ...outboundWhere.order,
          orderNo: { contains: String(orderNo) },
        };
      }

      if (warehouseEntryNo) {
        outboundWhere.warehouseEntryNo = {
          contains: String(warehouseEntryNo),
        };
      }

      if (Object.keys(dateFilter).length > 0) {
        outboundWhere.order = {
          ...outboundWhere.order,
          createdAt: dateFilter,
        };
      }

      const outboundItems = await prisma.outboundOrderItem.findMany({
        where: outboundWhere,
        include: {
          order: {
            select: {
              orderNo: true,
              customerName: true,
              customerId: true,
              status: true,
              createdAt: true,
              businessType: true,
            },
          },
        },
        orderBy: {
          order: {
            createdAt: 'desc',
          },
        },
      });

      logs.push(
        ...outboundItems.map((item) => ({
          id: `out-${item.id}`,
          operationType: 'outbound',
          operationTypeName: '出库',
          orderNo: item.order.orderNo,
          customerName: item.order.customerName,
          customerId: item.order.customerId,
          status: item.order.status,
          statusName: item.order.status === 'completed' ? '已完成' : '待处理',
          businessType: item.order.businessType,
          businessTypeName:
            item.order.businessType === 'sales'
              ? '销售出库'
              : item.order.businessType === 'return'
              ? '退货出库'
              : '调拨出库',
          warehouseEntryNo: item.warehouseEntryNo,
          productName: item.productName,
          productModel: item.productModel,
          sku: item.sku,
          productCode: item.productCode,
          locationCode: item.locationCode,
          quantity: item.quantity,
          quantityChange: `-${item.quantity}`,
          volume: item.volume,
          weight: item.totalGrossWeight,
          createdAt: item.order.createdAt,
        }))
      );
    }

    // 按时间排序
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 分页
    const total = logs.length;
    const paginatedLogs = logs.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    res.json({
      success: true,
      data: paginatedLogs,
      total,
      page: pageNum,
      size: pageSize,
    });
  } catch (error: any) {
    console.error('获取库存日志失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取库存日志失败' });
  }
}
