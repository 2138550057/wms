import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

/**
 * 获取用户列表(管理员)
 */
export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const { page = 1, size = 20, username, realName, role } = req.query;

    const where: any = {};
    if (username) where.username = { contains: username as string };
    if (realName) where.realName = { contains: realName as string };
    if (role) where.role = role;

    const skip = (Number(page) - 1) * Number(size);
    const take = Number(size);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          username: true,
          realName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      total,
      page: Number(page),
      size: Number(size),
    });
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取用户列表失败' });
  }
}

/**
 * 获取用户详情(管理员)
 */
export async function getUserById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取用户详情失败' });
  }
}

/**
 * 创建用户(管理员)
 */
export async function createUser(req: AuthRequest, res: Response) {
  try {
    const { username, password, realName, email, phone, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        realName,
        email,
        phone,
        role: role || 'operator',
      },
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: user, message: '用户创建成功' });
  } catch (error: any) {
    console.error('创建用户失败:', error);
    res.status(500).json({ success: false, message: error.message || '创建用户失败' });
  }
}

/**
 * 更新用户信息(管理员)
 */
export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { realName, email, phone, role, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const updateData: any = {};
    if (realName !== undefined) updateData.realName = realName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: updatedUser, message: '用户信息更新成功' });
  } catch (error: any) {
    console.error('更新用户失败:', error);
    res.status(500).json({ success: false, message: error.message || '更新用户失败' });
  }
}

/**
 * 删除用户(管理员)
 */
export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    // 检查是否是当前登录用户
    if (req.userId === Number(id)) {
      return res.status(400).json({ success: false, message: '不能删除自己的账号' });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    await prisma.user.delete({
      where: { id: Number(id) },
    });

    res.json({ success: true, message: '用户删除成功' });
  } catch (error: any) {
    console.error('删除用户失败:', error);
    res.status(500).json({ success: false, message: error.message || '删除用户失败' });
  }
}

/**
 * 获取当前用户信息
 */
export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取用户信息失败' });
  }
}

/**
 * 更新当前用户信息
 */
export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { realName, email, phone } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const updateData: any = {};
    if (realName !== undefined) updateData.realName = realName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: user, message: '个人信息更新成功' });
  } catch (error: any) {
    console.error('更新个人信息失败:', error);
    res.status(500).json({ success: false, message: error.message || '更新个人信息失败' });
  }
}

/**
 * 修改当前用户密码
 */
export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '旧密码和新密码不能为空' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码长度不能少于6位' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: '旧密码错误' });
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: '密码修改成功' });
  } catch (error: any) {
    console.error('修改密码失败:', error);
    res.status(500).json({ success: false, message: error.message || '修改密码失败' });
  }
}
