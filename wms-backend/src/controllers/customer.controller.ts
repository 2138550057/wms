import { Request, Response } from 'express';
import prisma from '../utils/prisma';

/**
 * 创建客户
 */
export async function createCustomer(req: Request, res: Response) {
  try {
    const { code, name, contact, phone, address } = req.body;

    // 检查客户编号是否已存在
    const existing = await prisma.customer.findUnique({
      where: { code },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: '客户编号已存在' });
    }

    const customer = await prisma.customer.create({
      data: {
        code,
        name,
        contact,
        phone,
        address,
      },
    });

    res.json({ success: true, data: customer });
  } catch (error: any) {
    console.error('创建客户失败:', error);
    res.status(500).json({ success: false, message: error.message || '创建客户失败' });
  }
}

/**
 * 获取客户列表
 */
export async function getCustomers(req: Request, res: Response) {
  try {
    const { page = 1, size = 20, name, code } = req.query;

    const where: any = {};

    if (name) {
      where.name = { contains: name as string };
    }

    if (code) {
      where.code = { contains: code as string };
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (Number(page) - 1) * Number(size),
        take: Number(size),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      total,
      page: Number(page),
      size: Number(size),
    });
  } catch (error: any) {
    console.error('获取客户列表失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取客户列表失败' });
  }
}

/**
 * 获取客户详情
 */
export async function getCustomerById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    res.json({ success: true, data: customer });
  } catch (error: any) {
    console.error('获取客户详情失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取客户详情失败' });
  }
}

/**
 * 更新客户
 */
export async function updateCustomer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, contact, phone, address } = req.body;

    const customer = await prisma.customer.update({
      where: { id: Number(id) },
      data: {
        name,
        contact,
        phone,
        address,
      },
    });

    res.json({ success: true, data: customer });
  } catch (error: any) {
    console.error('更新客户失败:', error);
    res.status(500).json({ success: false, message: error.message || '更新客户失败' });
  }
}

/**
 * 删除客户
 */
export async function deleteCustomer(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // 检查是否有相关订单或库存
    const [inboundCount, outboundCount, inventoryCount] = await Promise.all([
      prisma.inboundOrder.count({ where: { customerId: Number(id) } }),
      prisma.outboundOrder.count({ where: { customerId: Number(id) } }),
      prisma.inventory.count({ where: { customerId: Number(id) } }),
    ]);

    if (inboundCount > 0 || outboundCount > 0 || inventoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该客户存在关联的订单或库存，无法删除',
      });
    }

    await prisma.customer.delete({
      where: { id: Number(id) },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    console.error('删除客户失败:', error);
    res.status(500).json({ success: false, message: error.message || '删除客户失败' });
  }
}

/**
 * 搜索客户（用于下拉选择）
 */
export async function searchCustomers(req: Request, res: Response) {
  try {
    const { keyword } = req.query;

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: keyword as string } },
          { code: { contains: keyword as string } },
        ],
      },
      take: 10,
      select: {
        id: true,
        code: true,
        name: true,
        contact: true,
        phone: true,
      },
    });

    res.json({ success: true, data: customers });
  } catch (error: any) {
    console.error('搜索客户失败:', error);
    res.status(500).json({ success: false, message: error.message || '搜索客户失败' });
  }
}
