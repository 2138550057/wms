import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import svgCaptcha from 'svg-captcha';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 存储验证码的 Map
const captchaStore = new Map<string, { code: string; timestamp: number }>();

// 定时清理过期验证码（5分钟过期）
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of captchaStore.entries()) {
    if (now - value.timestamp > 5 * 60 * 1000) {
      captchaStore.delete(key);
    }
  }
}, 60 * 1000);

/**
 * 用户注册
 */
export async function register(req: Request, res: Response) {
  try {
    const { username, password, realName, role = 'operator' } = req.body;

    // 检查用户名是否已存在
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        realName,
        role,
      },
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: user, message: '注册成功' });
  } catch (error: any) {
    console.error('注册失败:', error);
    res.status(500).json({ success: false, message: error.message || '注册失败' });
  }
}

/**
 * 生成验证码
 */
export async function getCaptcha(req: Request, res: Response) {
  try {
    // 生成验证码
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      noise: 2, // 干扰线条数
      color: true, // 验证码字符是否有颜色，默认没有，如果设定了背景，则默认有
      background: '#f0f0f0', // 验证码背景颜色
      width: 120,
      height: 40,
      fontSize: 50,
      charPreset: '0123456789', // 只使用数字
    });

    // 生成唯一ID
    const captchaId = `captcha_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 存储验证码（转为小写以便不区分大小写）
    captchaStore.set(captchaId, {
      code: captcha.text.toLowerCase(),
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      data: {
        captchaId,
        captchaSvg: captcha.data,
      },
    });
  } catch (error: any) {
    console.error('生成验证码失败:', error);
    res.status(500).json({ success: false, message: error.message || '生成验证码失败' });
  }
}

/**
 * 用户登录
 */
export async function login(req: Request, res: Response) {
  try {
    const { username, password, captchaId, captchaCode } = req.body;

    // 验证验证码
    if (!captchaId || !captchaCode) {
      return res.status(400).json({ success: false, message: '请输入验证码' });
    }

    const storedCaptcha = captchaStore.get(captchaId);
    if (!storedCaptcha) {
      return res.status(400).json({ success: false, message: '验证码已过期，请刷新' });
    }

    if (storedCaptcha.code !== captchaCode.toLowerCase()) {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }

    // 验证成功后删除验证码
    captchaStore.delete(captchaId);

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          role: user.role,
        },
      },
      message: '登录成功',
    });
  } catch (error: any) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: error.message || '登录失败' });
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        createdAt: true,
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
 * 修改密码
 */
export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { oldPassword, newPassword } = req.body;

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '原密码错误' });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: '密码修改成功' });
  } catch (error: any) {
    console.error('修改密码失败:', error);
    res.status(500).json({ success: false, message: error.message || '修改密码失败' });
  }
}

/**
 * 获取用户列表（仅管理员）
 */
export async function getUsers(req: Request, res: Response) {
  try {
    const { page = 1, size = 20 } = req.query;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        skip: (Number(page) - 1) * Number(size),
        take: Number(size),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          realName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data,
      total,
      page: Number(page),
      size: Number(size),
    });
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取用户列表失败' });
  }
}
