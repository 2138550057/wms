import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取仪表盘统计数据
 */
export async function getDashboardStats(req: Request, res: Response) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 获取最近7天的日期
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 并行查询所有统计数据
    const [
      todayInboundCount,
      todayOutboundCount,
      totalSkuCount,
      totalCustomerCount,
      pendingInboundCount,
      pendingOutboundCount,
      totalInventoryQuantity,
      totalInventoryVolume,
      sevenDaysInbound,
      sevenDaysOutbound,
      recentInboundOrders,
      recentOutboundOrders,
      topCustomersByVolume,
      lowStockItems,
    ] = await Promise.all([
      // 今日入库单数
      prisma.inboundOrder.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // 今日出库单数
      prisma.outboundOrder.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // 库存SKU数量
      prisma.inventory.count({
        where: {
          quantity: {
            gt: 0,
          },
        },
      }),

      // 客户总数
      prisma.customer.count(),

      // 待处理入库单
      prisma.inboundOrder.count({
        where: {
          status: 'pending',
        },
      }),

      // 待处理出库单
      prisma.outboundOrder.count({
        where: {
          status: 'pending',
        },
      }),

      // 库存总件数
      prisma.inventory.aggregate({
        _sum: {
          quantity: true,
        },
        where: {
          quantity: {
            gt: 0,
          },
        },
      }),

      // 库存总体积
      prisma.inventory.aggregate({
        _sum: {
          volume: true,
        },
        where: {
          quantity: {
            gt: 0,
          },
        },
      }),

      // 最近7天入库统计
      prisma.inboundOrder.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        _count: {
          id: true,
        },
      }),

      // 最近7天出库统计
      prisma.outboundOrder.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        _count: {
          id: true,
        },
      }),

      // 最近入库订单
      prisma.inboundOrder.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          orderNo: true,
          customerName: true,
          totalQuantity: true,
          status: true,
          createdAt: true,
        },
      }),

      // 最近出库订单
      prisma.outboundOrder.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          orderNo: true,
          customerName: true,
          totalQuantity: true,
          status: true,
          createdAt: true,
        },
      }),

      // 按客户统计库存量（前5名）
      prisma.inventory.groupBy({
        by: ['customerName'],
        where: {
          quantity: {
            gt: 0,
          },
        },
        _sum: {
          quantity: true,
          volume: true,
        },
        orderBy: {
          _sum: {
            volume: 'desc',
          },
        },
        take: 5,
      }),

      // 低库存商品（库存量 < 10）
      prisma.inventory.findMany({
        where: {
          quantity: {
            gt: 0,
            lt: 10,
          },
        },
        take: 10,
        orderBy: {
          quantity: 'asc',
        },
        select: {
          id: true,
          productName: true,
          sku: true,
          customerName: true,
          quantity: true,
          availableQuantity: true,
          locationCode: true,
        },
      }),
    ]);

    // 处理7天趋势数据（按日期分组）
    const dateMap = new Map<string, { inbound: number; outbound: number }>();

    // 初始化最近7天的数据
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, { inbound: 0, outbound: 0 });
    }

    // 填充入库数据
    sevenDaysInbound.forEach((item) => {
      const dateStr = new Date(item.createdAt).toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        const data = dateMap.get(dateStr)!;
        data.inbound += item._count.id;
      }
    });

    // 填充出库数据
    sevenDaysOutbound.forEach((item) => {
      const dateStr = new Date(item.createdAt).toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        const data = dateMap.get(dateStr)!;
        data.outbound += item._count.id;
      }
    });

    // 转换为数组
    const trendData = Array.from(dateMap.entries()).map(([date, counts]) => ({
      date,
      inbound: counts.inbound,
      outbound: counts.outbound,
    }));

    res.json({
      success: true,
      data: {
        // 基础统计
        todayInbound: todayInboundCount,
        todayOutbound: todayOutboundCount,
        totalSku: totalSkuCount,
        totalCustomer: totalCustomerCount,

        // 待处理数据
        pendingInbound: pendingInboundCount,
        pendingOutbound: pendingOutboundCount,

        // 库存汇总
        totalInventoryQuantity: totalInventoryQuantity._sum.quantity || 0,
        totalInventoryVolume: totalInventoryVolume._sum.volume || 0,

        // 趋势数据
        trendData,

        // 最近操作
        recentInbound: recentInboundOrders,
        recentOutbound: recentOutboundOrders,

        // 客户统计
        topCustomers: topCustomersByVolume.map((item) => ({
          customerName: item.customerName,
          quantity: item._sum.quantity || 0,
          volume: item._sum.volume || 0,
        })),

        // 库存预警
        lowStock: lowStockItems,
      },
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取统计数据失败',
    });
  }
}
