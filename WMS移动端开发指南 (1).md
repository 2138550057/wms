# WMS仓库管理系统 - 移动端开发指南

> 基于 UniApp + Vue3 + TypeScript 的多端统一开发方案
> 支持：H5 / Android APP / 微信小程序

---

## 目录

- [一、项目概述](#一项目概述)
- [二、技术架构](#二技术架构)
- [三、Web端需要更新的内容](#三web端需要更新的内容)
- [四、移动端开发步骤](#四移动端开发步骤)
- [五、核心功能：现场代办系统](#五核心功能现场代办系统)
- [六、功能模块详细设计](#六功能模块详细设计)
- [七、API接口文档](#七api接口文档)
- [八、UI/UX设计规范](#八uiux设计规范)
- [九、部署发布](#九部署发布)
- [十、功能扩展建议](#十功能扩展建议)

---

## 一、项目概述

### 1.1 项目背景

现有WMS仓库管理系统基于 React + Node.js 技术栈运行，需要开发移动端实现：
- 现场人员实时处理入库出库任务
- 拍照上传凭证
- 多端数据实时同步

### 1.2 开发目标

| 目标 | 说明 |
|------|------|
| 多端发布 | H5 + Android APP + 微信小程序 |
| 数据同步 | 与PC端实时同步 |
| 核心功能 | 现场代办处理 |
| 附件上传 | 拍照/相册上传 |
| 界面设计 | 简洁大气 |

### 1.3 现有系统信息

```
PC前端: https://wms.fexxo.cn (React 18 + Ant Design)
后端API: https://wmsapi.fexxo.cn/api (Node.js + Express + Prisma)
数据库: MySQL
认证: JWT
```

---

## 二、技术架构

### 2.1 技术选型

```
前端框架: UniApp 3.x (Vue3版本)
开发语言: TypeScript
状态管理: Pinia
UI组件库: uni-ui + uView (可选)
HTTP请求: uni.request 封装
构建工具: Vite
开发工具: HBuilderX
```

### 2.2 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                      客户端层                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ PC Web端 │  │   H5端   │  │ Android  │  │微信小程序│ │
│  │  React   │  │  UniApp  │  │  UniApp  │  │ UniApp  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
└───────┼─────────────┼─────────────┼─────────────┼───────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │ HTTPS
                             ▼
┌────────────────────────────────────────────────────────┐
│              API网关层 (Nginx)                          │
│           https://wmsapi.fexxo.cn/api                  │
└────────────────────────┬───────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────┐
│              后端服务层 (Express + Prisma)              │
└────────────────────────┬───────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────┐
│                   数据库 (MySQL)                        │
└────────────────────────────────────────────────────────┘
```

### 2.3 项目目录结构

```
wms-mobile/
├── src/
│   ├── pages/                    # 页面目录
│   │   ├── login/
│   │   │   └── index.vue         # 登录页
│   │   ├── home/
│   │   │   └── index.vue         # 首页
│   │   ├── todo/
│   │   │   └── index.vue         # 代办中心 ⭐核心
│   │   ├── inbound/
│   │   │   ├── index.vue         # 入库列表
│   │   │   ├── detail.vue        # 入库详情
│   │   │   └── create.vue        # 新建入库
│   │   ├── outbound/
│   │   │   ├── index.vue         # 出库列表
│   │   │   ├── detail.vue        # 出库详情
│   │   │   └── create.vue        # 新建出库
│   │   ├── inventory/
│   │   │   ├── index.vue         # 库存列表
│   │   │   └── detail.vue        # 库存详情
│   │   ├── scan/
│   │   │   └── index.vue         # 扫码页面
│   │   └── profile/
│   │       ├── index.vue         # 个人中心
│   │       └── password.vue      # 修改密码
│   │
│   ├── components/               # 公共组件
│   │   ├── TodoCard.vue          # 代办卡片
│   │   ├── OrderDetailPopup.vue  # 订单详情弹窗
│   │   ├── ImageUploader.vue     # 图片上传组件
│   │   ├── ConfirmDialog.vue     # 确认弹窗
│   │   ├── EmptyState.vue        # 空状态
│   │   └── LoadingState.vue      # 加载状态
│   │
│   ├── api/                      # API接口
│   │   ├── request.ts            # 请求封装
│   │   ├── auth.ts               # 认证接口
│   │   ├── todo.ts               # 代办接口
│   │   ├── inbound.ts            # 入库接口
│   │   ├── outbound.ts           # 出库接口
│   │   ├── inventory.ts          # 库存接口
│   │   └── attachment.ts         # 附件接口
│   │
│   ├── stores/                   # Pinia状态管理
│   │   ├── index.ts              # Store入口
│   │   ├── auth.ts               # 认证状态
│   │   ├── todo.ts               # 代办状态
│   │   └── app.ts                # 应用状态
│   │
│   ├── types/                    # TypeScript类型
│   │   ├── index.ts              # 类型导出
│   │   ├── auth.ts               # 认证类型
│   │   ├── order.ts              # 订单类型
│   │   └── api.ts                # API类型
│   │
│   ├── utils/                    # 工具函数
│   │   ├── index.ts              # 工具导出
│   │   ├── storage.ts            # 存储工具
│   │   ├── format.ts             # 格式化工具
│   │   └── validate.ts           # 验证工具
│   │
│   ├── static/                   # 静态资源
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── styles/                   # 全局样式
│   │   ├── variables.scss        # SCSS变量
│   │   └── common.scss           # 公共样式
│   │
│   ├── App.vue                   # 根组件
│   └── main.ts                   # 入口文件
│
├── pages.json                    # 页面配置
├── manifest.json                 # 应用配置
├── uni.scss                      # uni-app样式变量
├── vite.config.ts                # Vite配置
├── tsconfig.json                 # TS配置
└── package.json
```

---

## 三、Web端需要更新的内容

> ⚠️ 在开发移动端之前，需要先更新后端API

### 3.1 数据库Schema更新

在 `prisma/schema.prisma` 中添加：

```prisma
// ==================== 入库单表新增字段 ====================
model InboundOrder {
  // ... 现有字段保持不变
  
  // ⭐ 新增字段
  confirmedAt      DateTime?    // 确认时间
  confirmedBy      Int?         // 确认人ID
  confirmSource    String?      // 操作来源: pc/mobile/h5/miniprogram
  
  // 新增关联
  confirmer        User?        @relation("InboundConfirmer", fields: [confirmedBy], references: [id])
}

// ==================== 出库单表新增字段 ====================
model OutboundOrder {
  // ... 现有字段保持不变
  
  // ⭐ 新增字段
  confirmedAt      DateTime?
  confirmedBy      Int?
  confirmSource    String?
  
  confirmer        User?        @relation("OutboundConfirmer", fields: [confirmedBy], references: [id])
}

// ==================== 新增：操作日志表 ====================
model OperationLog {
  id           Int      @id @default(autoincrement())
  entityType   String   // inbound/outbound/inventory
  entityId     Int
  action       String   // create/confirm/cancel/update/upload
  source       String   // pc/mobile/h5/miniprogram
  operatorId   Int
  operatorName String
  details      Json?
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())
  
  operator     User     @relation(fields: [operatorId], references: [id])
  
  @@index([entityType, entityId])
  @@index([operatorId])
  @@index([createdAt])
}

// ==================== 用户表新增字段 ====================
model User {
  // ... 现有字段保持不变
  
  // ⭐ 新增字段
  phone     String?    // 手机号
  avatar    String?    // 头像URL
  
  // 新增关联
  inboundOrdersConfirmed  InboundOrder[]  @relation("InboundConfirmer")
  outboundOrdersConfirmed OutboundOrder[] @relation("OutboundConfirmer")
  operationLogs           OperationLog[]
}
```

**执行迁移：**
```bash
cd wms-backend
npx prisma migrate dev --name add_mobile_support
npx prisma generate
```

### 3.2 新增后端文件

#### 3.2.1 创建 `src/controllers/todo.controller.ts`

```typescript
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const todoController = {
  // 获取所有待办订单
  async getPendingOrders(req: Request, res: Response) {
    try {
      const { type } = req.query;
      
      const [inbounds, outbounds] = await Promise.all([
        type !== 'outbound' 
          ? prisma.inboundOrder.findMany({
              where: { status: 'pending' },
              include: { 
                customer: true, 
                items: true,
                creator: { select: { id: true, realName: true } }
              },
              orderBy: { createdAt: 'desc' }
            })
          : [],
        type !== 'inbound'
          ? prisma.outboundOrder.findMany({
              where: { status: 'pending' },
              include: { 
                customer: true, 
                items: true,
                creator: { select: { id: true, realName: true } }
              },
              orderBy: { createdAt: 'desc' }
            })
          : []
      ]);

      res.json({
        success: true,
        data: {
          inbounds,
          outbounds,
          counts: {
            inbound: inbounds.length,
            outbound: outbounds.length,
            total: inbounds.length + outbounds.length
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: '获取待办列表失败' });
    }
  },

  // 获取待办数量
  async getPendingCount(req: Request, res: Response) {
    try {
      const [inboundCount, outboundCount] = await Promise.all([
        prisma.inboundOrder.count({ where: { status: 'pending' } }),
        prisma.outboundOrder.count({ where: { status: 'pending' } })
      ]);

      res.json({
        success: true,
        data: {
          inbound: inboundCount,
          outbound: outboundCount,
          total: inboundCount + outboundCount
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: '获取待办数量失败' });
    }
  },

  // 移动端确认入库
  async confirmInbound(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { source = 'mobile', attachmentIds, remark } = req.body;
      const userId = (req as any).user.id;
      const userName = (req as any).user.realName || (req as any).user.username;

      const order = await prisma.inboundOrder.findUnique({
        where: { id: Number(id) },
        include: { items: true }
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
            remark: remark || order.remark
          }
        });

        // 更新库存
        for (const item of order.items) {
          await tx.inventory.upsert({
            where: {
              customerId_sku_locationCode: {
                customerId: order.customerId,
                sku: item.sku || '',
                locationCode: item.locationCode || ''
              }
            },
            create: {
              customerId: order.customerId,
              customerName: order.customerName,
              sku: item.sku || '',
              productName: item.productName,
              productModel: item.productModel,
              locationCode: item.locationCode || '',
              quantity: item.quantity,
              volume: item.volume || 0,
              weight: item.totalGrossWeight || 0,
              warehouseEntryNo: order.warehouseEntryNo || order.orderNo
            },
            update: {
              quantity: { increment: item.quantity },
              volume: { increment: item.volume || 0 },
              weight: { increment: item.totalGrossWeight || 0 }
            }
          });
        }

        // 记录操作日志
        await tx.operationLog.create({
          data: {
            entityType: 'inbound',
            entityId: Number(id),
            action: 'confirm',
            source,
            operatorId: userId,
            operatorName: userName,
            details: { attachmentIds, remark }
          }
        });

        return updated;
      });

      res.json({
        success: true,
        data: result,
        message: '入库确认成功'
      });
    } catch (error) {
      console.error('确认入库失败:', error);
      res.status(500).json({ success: false, message: '确认入库失败' });
    }
  },

  // 移动端确认出库
  async confirmOutbound(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { source = 'mobile', attachmentIds, remark } = req.body;
      const userId = (req as any).user.id;
      const userName = (req as any).user.realName || (req as any).user.username;

      const order = await prisma.outboundOrder.findUnique({
        where: { id: Number(id) },
        include: { items: true }
      });

      if (!order) {
        return res.status(404).json({ success: false, message: '出库单不存在' });
      }

      if (order.status === 'completed') {
        return res.status(400).json({ success: false, message: '该订单已确认' });
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
            remark: remark || order.remark
          }
        });

        // 扣减库存
        for (const item of order.items) {
          await tx.inventory.updateMany({
            where: {
              customerId: order.customerId,
              sku: item.sku || '',
              locationCode: item.locationCode || ''
            },
            data: {
              quantity: { decrement: item.quantity },
              volume: { decrement: item.volume || 0 },
              weight: { decrement: item.totalGrossWeight || 0 }
            }
          });
        }

        // 记录操作日志
        await tx.operationLog.create({
          data: {
            entityType: 'outbound',
            entityId: Number(id),
            action: 'confirm',
            source,
            operatorId: userId,
            operatorName: userName,
            details: { attachmentIds, remark }
          }
        });

        return updated;
      });

      res.json({
        success: true,
        data: result,
        message: '出库确认成功'
      });
    } catch (error) {
      console.error('确认出库失败:', error);
      res.status(500).json({ success: false, message: '确认出库失败' });
    }
  }
};
```

#### 3.2.2 创建 `src/routes/todo.routes.ts`

```typescript
import { Router } from 'express';
import { todoController } from '../controllers/todo.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.get('/pending', todoController.getPendingOrders);
router.get('/count', todoController.getPendingCount);
router.post('/inbound/:id/confirm', todoController.confirmInbound);
router.post('/outbound/:id/confirm', todoController.confirmOutbound);

export default router;
```

#### 3.2.3 在 `src/app.ts` 中注册路由

```typescript
import todoRoutes from './routes/todo.routes';

// 在其他路由之后添加
app.use('/api/todo', todoRoutes);
```

### 3.3 更新CORS配置

在 `src/app.ts` 中更新：

```typescript
import cors from 'cors';

const allowedOrigins = [
  'https://wms.fexxo.cn',
  'https://m.wms.fexxo.cn',
  'https://servicewechat.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### 3.4 API接口汇总

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/todo/pending` | GET | 获取待办列表 | 新增 |
| `/api/todo/count` | GET | 获取待办数量 | 新增 |
| `/api/todo/inbound/:id/confirm` | POST | 移动端确认入库 | 新增 |
| `/api/todo/outbound/:id/confirm` | POST | 移动端确认出库 | 新增 |
| `/api/auth/login` | POST | 登录 | 已有 |
| `/api/auth/profile` | GET | 获取用户信息 | 已有 |
| `/api/inbound` | GET | 入库列表 | 已有 |
| `/api/inbound/:id` | GET | 入库详情 | 已有 |
| `/api/outbound` | GET | 出库列表 | 已有 |
| `/api/outbound/:id` | GET | 出库详情 | 已有 |
| `/api/inventory` | GET | 库存列表 | 已有 |
| `/api/attachments/upload` | POST | 上传附件 | 已有 |
| `/api/dashboard/stats` | GET | 统计数据 | 已有 |

---

## 四、移动端开发步骤

### 步骤1：项目初始化

```bash
# 1. 使用HBuilderX创建项目
# 选择：uni-app → Vue3 + TypeScript + Vite

# 2. 或使用CLI创建
npx degit dcloudio/uni-preset-vue#vite-ts wms-mobile
cd wms-mobile
npm install

# 3. 安装依赖
npm install pinia
npm install dayjs
npm install @dcloudio/uni-ui
```

### 步骤2：配置 pages.json

```json
{
  "pages": [
    {
      "path": "pages/home/index",
      "style": { "navigationBarTitleText": "首页" }
    },
    {
      "path": "pages/todo/index",
      "style": { "navigationBarTitleText": "代办中心" }
    },
    {
      "path": "pages/scan/index",
      "style": { "navigationBarTitleText": "扫码" }
    },
    {
      "path": "pages/profile/index",
      "style": { "navigationBarTitleText": "我的" }
    },
    {
      "path": "pages/login/index",
      "style": { "navigationBarTitleText": "登录" }
    },
    {
      "path": "pages/inbound/index",
      "style": { "navigationBarTitleText": "入库管理" }
    },
    {
      "path": "pages/inbound/detail",
      "style": { "navigationBarTitleText": "入库详情" }
    },
    {
      "path": "pages/outbound/index",
      "style": { "navigationBarTitleText": "出库管理" }
    },
    {
      "path": "pages/outbound/detail",
      "style": { "navigationBarTitleText": "出库详情" }
    },
    {
      "path": "pages/inventory/index",
      "style": { "navigationBarTitleText": "库存查询" }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "WMS仓库管理",
    "navigationBarBackgroundColor": "#ffffff",
    "backgroundColor": "#f5f7fa"
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#1890ff",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/home/index",
        "text": "首页",
        "iconPath": "static/icons/home.png",
        "selectedIconPath": "static/icons/home-active.png"
      },
      {
        "pagePath": "pages/todo/index",
        "text": "代办",
        "iconPath": "static/icons/todo.png",
        "selectedIconPath": "static/icons/todo-active.png"
      },
      {
        "pagePath": "pages/scan/index",
        "text": "扫码",
        "iconPath": "static/icons/scan.png",
        "selectedIconPath": "static/icons/scan-active.png"
      },
      {
        "pagePath": "pages/profile/index",
        "text": "我的",
        "iconPath": "static/icons/profile.png",
        "selectedIconPath": "static/icons/profile-active.png"
      }
    ]
  }
}
```

### 步骤3：配置 manifest.json

```json
{
  "name": "WMS仓库管理",
  "appid": "__UNI__XXXXXXX",
  "description": "WMS仓库管理系统移动端",
  "versionName": "1.0.0",
  "versionCode": "100",
  "transformPx": false,
  "h5": {
    "title": "WMS仓库管理",
    "router": {
      "mode": "history",
      "base": "/"
    },
    "devServer": {
      "port": 8080,
      "proxy": {
        "/api": {
          "target": "https://wmsapi.fexxo.cn",
          "changeOrigin": true
        }
      }
    }
  },
  "mp-weixin": {
    "appid": "wx1234567890abcdef",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "minified": true
    }
  },
  "app-plus": {
    "distribute": {
      "android": {
        "packagename": "cn.fexxo.wms"
      }
    }
  }
}
```

### 步骤4：创建请求封装

**文件：`src/api/request.ts`**

```typescript
import { useAuthStore } from '@/stores/auth';

const BASE_URL = 'https://wmsapi.fexxo.cn/api';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  showLoading?: boolean;
  showError?: boolean;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string };
}

export const request = async <T = any>(options: RequestOptions): Promise<T> => {
  const authStore = useAuthStore();
  
  if (options.showLoading !== false) {
    uni.showLoading({ title: '加载中...' });
  }

  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.header
  };

  if (authStore.token) {
    header['Authorization'] = `Bearer ${authStore.token}`;
  }

  try {
    const response = await uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header
    });

    const res = response.data as ApiResponse<T>;

    if (response.statusCode === 401) {
      authStore.logout();
      uni.reLaunch({ url: '/pages/login/index' });
      throw new Error('登录已过期');
    }

    if (!res.success) {
      throw new Error(res.message || res.error?.message || '请求失败');
    }

    return res.data as T;
  } catch (error: any) {
    if (options.showError !== false) {
      uni.showToast({
        title: error.message || '网络错误',
        icon: 'none'
      });
    }
    throw error;
  } finally {
    if (options.showLoading !== false) {
      uni.hideLoading();
    }
  }
};

export const get = <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) => {
  return request<T>({ url, method: 'GET', data, ...options });
};

export const post = <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) => {
  return request<T>({ url, method: 'POST', data, ...options });
};
```

### 步骤5：创建Store

**文件：`src/stores/auth.ts`**

```typescript
import { defineStore } from 'pinia';
import { post, get } from '@/api/request';

interface User {
  id: number;
  username: string;
  realName: string;
  role: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: uni.getStorageSync('token') || '',
    user: null as User | null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin'
  },

  actions: {
    async login(username: string, password: string) {
      const data = await post<{ token: string; user: User }>('/auth/login', {
        username,
        password
      });
      
      this.token = data.token;
      this.user = data.user;
      uni.setStorageSync('token', data.token);
      
      return data;
    },

    async fetchProfile() {
      if (!this.token) return;
      
      try {
        const user = await get<User>('/auth/profile');
        this.user = user;
      } catch {
        this.logout();
      }
    },

    logout() {
      this.token = '';
      this.user = null;
      uni.removeStorageSync('token');
      uni.reLaunch({ url: '/pages/login/index' });
    }
  }
});
```

**文件：`src/stores/todo.ts`**

```typescript
import { defineStore } from 'pinia';
import { get, post } from '@/api/request';

interface OrderItem {
  id: number;
  productName: string;
  sku: string;
  quantity: number;
}

interface Order {
  id: number;
  orderNo: string;
  customerName: string;
  totalQuantity: number;
  totalVolume: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  type?: 'inbound' | 'outbound';
}

interface TodoCounts {
  inbound: number;
  outbound: number;
  total: number;
}

export const useTodoStore = defineStore('todo', {
  state: () => ({
    pendingInbounds: [] as Order[],
    pendingOutbounds: [] as Order[],
    counts: { inbound: 0, outbound: 0, total: 0 } as TodoCounts,
    lastUpdated: null as Date | null,
    pollingTimer: null as number | null
  }),

  getters: {
    allPendingOrders(): Order[] {
      const inbounds = this.pendingInbounds.map(o => ({ ...o, type: 'inbound' as const }));
      const outbounds = this.pendingOutbounds.map(o => ({ ...o, type: 'outbound' as const }));
      return [...inbounds, ...outbounds].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  },

  actions: {
    async fetchPendingOrders() {
      const data = await get<{
        inbounds: Order[];
        outbounds: Order[];
        counts: TodoCounts;
      }>('/todo/pending', {}, { showLoading: false, showError: false });

      this.pendingInbounds = data.inbounds;
      this.pendingOutbounds = data.outbounds;
      this.counts = data.counts;
      this.lastUpdated = new Date();

      // 更新TabBar角标
      if (data.counts.total > 0) {
        uni.setTabBarBadge({ index: 1, text: String(data.counts.total) });
      } else {
        uni.removeTabBarBadge({ index: 1 });
      }
    },

    async fetchCounts() {
      const counts = await get<TodoCounts>('/todo/count', {}, { showLoading: false, showError: false });
      this.counts = counts;
      
      if (counts.total > 0) {
        uni.setTabBarBadge({ index: 1, text: String(counts.total) });
      } else {
        uni.removeTabBarBadge({ index: 1 });
      }
    },

    async confirmInbound(id: number, data?: { attachmentIds?: number[]; remark?: string }) {
      await post(`/todo/inbound/${id}/confirm`, {
        source: 'mobile',
        ...data
      });
      await this.fetchPendingOrders();
    },

    async confirmOutbound(id: number, data?: { attachmentIds?: number[]; remark?: string }) {
      await post(`/todo/outbound/${id}/confirm`, {
        source: 'mobile',
        ...data
      });
      await this.fetchPendingOrders();
    },

    startPolling(interval = 30000) {
      this.stopPolling();
      this.fetchPendingOrders();
      this.pollingTimer = setInterval(() => {
        this.fetchPendingOrders();
      }, interval) as unknown as number;
    },

    stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }
    }
  }
});
```

### 步骤6：创建页面组件

后续步骤请参考【五、核心功能：现场代办系统】和【六、功能模块详细设计】

---

## 五、核心功能：现场代办系统

### 5.1 业务流程

```
┌─────────────────────────────────────────────────────────────┐
│  PC端/其他端                                                 │
│  ┌────────────────────┐                                     │
│  │ 1. 录入入库/出库单 │ ──▶ 订单状态: pending(待处理)       │
│  └────────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ 实时同步（轮询/WebSocket）
┌─────────────────────────────────────────────────────────────┐
│  移动端 - 代办中心                                           │
│                                                             │
│  ┌────────────────────┐                                     │
│  │ 2. 显示待办订单列表 │ ◀── 自动刷新(30秒) / 下拉刷新       │
│  └────────────────────┘                                     │
│              │                                              │
│              ▼ 点击订单卡片                                  │
│  ┌────────────────────┐                                     │
│  │ 3. 弹出订单详情弹窗 │                                     │
│  │   - 基本信息       │                                     │
│  │   - 货物明细       │                                     │
│  │   - 附件上传       │                                     │
│  └────────────────────┘                                     │
│              │                                              │
│              ├──▶ [拍照/相册上传] ──▶ 上传附件               │
│              │                                              │
│              ▼ 点击"确认入库/出库"                           │
│  ┌────────────────────┐                                     │
│  │ 4. 二次确认弹窗     │                                     │
│  │   "确定要确认入库?" │                                     │
│  └────────────────────┘                                     │
│              │                                              │
│              ▼ 确认                                         │
│  ┌────────────────────┐                                     │
│  │ 5. 调用确认API     │ ──▶ 订单状态变为 completed           │
│  │   更新库存         │     订单从代办列表消失               │
│  │   记录操作日志     │                                     │
│  └────────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 代办中心页面

**文件：`src/pages/todo/index.vue`**

```vue
<template>
  <view class="todo-page">
    <!-- 顶部Tab筛选 -->
    <view class="filter-tabs">
      <view 
        v-for="tab in tabs" 
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        <text>{{ tab.label }}</text>
        <text class="count" v-if="tab.count > 0">{{ tab.count }}</text>
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view 
      class="order-list"
      scroll-y
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 空状态 -->
      <view v-if="!loading && filteredOrders.length === 0" class="empty-state">
        <image src="/static/images/empty.png" class="empty-image" />
        <text class="empty-text">暂无待办事项</text>
      </view>

      <!-- 订单卡片 -->
      <view 
        v-for="order in filteredOrders" 
        :key="`${order.type}-${order.id}`"
        class="order-card"
        @click="showOrderDetail(order)"
      >
        <view class="card-header">
          <view :class="['type-tag', order.type]">
            <text>{{ order.type === 'inbound' ? '入库' : '出库' }}</text>
          </view>
          <text class="order-no">{{ order.orderNo }}</text>
        </view>
        
        <view class="card-body">
          <view class="info-row">
            <text class="label">客户</text>
            <text class="value">{{ order.customerName }}</text>
          </view>
          <view class="info-row">
            <text class="label">数量</text>
            <text class="value">{{ order.totalQuantity }}件</text>
            <text class="label" style="margin-left: 24rpx;">体积</text>
            <text class="value">{{ order.totalVolume || 0 }}m³</text>
          </view>
        </view>

        <view class="card-footer">
          <text class="time">{{ formatTime(order.createdAt) }}</text>
          <view class="arrow">
            <text>›</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 订单详情弹窗 -->
    <OrderDetailPopup
      v-if="showDetail"
      :visible="showDetail"
      :order="selectedOrder"
      @close="showDetail = false"
      @confirm="handleConfirm"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useTodoStore } from '@/stores/todo';
import OrderDetailPopup from '@/components/OrderDetailPopup.vue';
import dayjs from 'dayjs';

const todoStore = useTodoStore();

const activeTab = ref('all');
const showDetail = ref(false);
const selectedOrder = ref<any>(null);
const isRefreshing = ref(false);
const loading = ref(true);

const tabs = computed(() => [
  { key: 'all', label: '全部', count: todoStore.counts.total },
  { key: 'inbound', label: '待入库', count: todoStore.counts.inbound },
  { key: 'outbound', label: '待出库', count: todoStore.counts.outbound },
]);

const filteredOrders = computed(() => {
  const orders = todoStore.allPendingOrders;
  if (activeTab.value === 'all') return orders;
  return orders.filter(o => o.type === activeTab.value);
});

const formatTime = (time: string) => {
  return dayjs(time).format('MM-DD HH:mm');
};

const showOrderDetail = (order: any) => {
  selectedOrder.value = order;
  showDetail.value = true;
};

const handleConfirm = async () => {
  showDetail.value = false;
  uni.showToast({ title: '操作成功', icon: 'success' });
};

const onRefresh = async () => {
  isRefreshing.value = true;
  await todoStore.fetchPendingOrders();
  isRefreshing.value = false;
};

onMounted(async () => {
  loading.value = true;
  await todoStore.fetchPendingOrders();
  loading.value = false;
  todoStore.startPolling();
});

onUnmounted(() => {
  todoStore.stopPolling();
});
</script>

<style lang="scss" scoped>
.todo-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.filter-tabs {
  display: flex;
  background: #fff;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 16rpx 0;
    font-size: 28rpx;
    color: #666;
    position: relative;

    &.active {
      color: #1890ff;
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 48rpx;
        height: 4rpx;
        background: #1890ff;
        border-radius: 2rpx;
      }
    }

    .count {
      margin-left: 8rpx;
      font-size: 24rpx;
    }
  }
}

.order-list {
  height: calc(100vh - 120rpx);
  padding: 24rpx;
}

.order-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;

    .type-tag {
      padding: 6rpx 16rpx;
      border-radius: 8rpx;
      font-size: 24rpx;
      margin-right: 16rpx;

      &.inbound {
        background: #e6f7ff;
        color: #1890ff;
      }

      &.outbound {
        background: #fff1f0;
        color: #ff4d4f;
      }
    }

    .order-no {
      font-size: 28rpx;
      font-weight: 600;
      color: #1a1a2e;
    }
  }

  .card-body {
    .info-row {
      display: flex;
      align-items: center;
      margin-bottom: 12rpx;

      .label {
        font-size: 26rpx;
        color: #999;
        margin-right: 8rpx;
      }

      .value {
        font-size: 26rpx;
        color: #333;
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16rpx;
    padding-top: 16rpx;
    border-top: 1rpx solid #f0f0f0;

    .time {
      font-size: 24rpx;
      color: #999;
    }

    .arrow {
      font-size: 32rpx;
      color: #ccc;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;

  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 32rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style>
```

### 5.3 订单详情弹窗组件

**文件：`src/components/OrderDetailPopup.vue`**

```vue
<template>
  <view class="popup-mask" v-if="visible" @click="handleClose">
    <view class="popup-content" @click.stop>
      <!-- 头部 -->
      <view class="popup-header">
        <text class="title">{{ order?.type === 'inbound' ? '入库单' : '出库单' }}详情</text>
        <view class="close-btn" @click="handleClose">×</view>
      </view>

      <!-- 内容区 -->
      <scroll-view class="popup-body" scroll-y>
        <!-- 基本信息 -->
        <view class="section">
          <view class="section-title">基本信息</view>
          <view class="info-grid">
            <view class="info-item">
              <text class="label">单号</text>
              <text class="value">{{ order?.orderNo }}</text>
            </view>
            <view class="info-item">
              <text class="label">客户</text>
              <text class="value">{{ order?.customerName }}</text>
            </view>
            <view class="info-item">
              <text class="label">总件数</text>
              <text class="value">{{ order?.totalQuantity }}件</text>
            </view>
            <view class="info-item">
              <text class="label">总体积</text>
              <text class="value">{{ order?.totalVolume || 0 }}m³</text>
            </view>
          </view>
        </view>

        <!-- 货物明细 -->
        <view class="section">
          <view class="section-title">货物明细 ({{ order?.items?.length || 0 }}项)</view>
          <view class="item-list">
            <view 
              v-for="(item, index) in order?.items" 
              :key="item.id"
              class="item-card"
            >
              <text class="item-index">{{ index + 1 }}</text>
              <view class="item-info">
                <text class="item-name">{{ item.productName }}</text>
                <text class="item-detail">{{ item.sku || '-' }} | {{ item.quantity }}件</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 附件上传 -->
        <view class="section">
          <view class="section-title">附件上传</view>
          <ImageUploader
            :entity-type="order?.type"
            :entity-id="order?.id"
            @uploaded="handleImagesUploaded"
          />
        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="popup-footer">
        <button class="confirm-btn" @click="handleConfirm" :loading="confirming">
          {{ order?.type === 'inbound' ? '确认入库' : '确认出库' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTodoStore } from '@/stores/todo';
import ImageUploader from './ImageUploader.vue';

const props = defineProps<{
  visible: boolean;
  order: any;
}>();

const emit = defineEmits(['close', 'confirm']);

const todoStore = useTodoStore();
const confirming = ref(false);
const uploadedImages = ref<number[]>([]);

const handleClose = () => {
  emit('close');
};

const handleImagesUploaded = (images: { id: number }[]) => {
  uploadedImages.value = images.map(img => img.id);
};

const handleConfirm = () => {
  uni.showModal({
    title: '确认操作',
    content: `确定要确认${props.order?.type === 'inbound' ? '入库' : '出库'}吗？`,
    success: async (res) => {
      if (res.confirm) {
        confirming.value = true;
        try {
          if (props.order?.type === 'inbound') {
            await todoStore.confirmInbound(props.order.id, {
              attachmentIds: uploadedImages.value
            });
          } else {
            await todoStore.confirmOutbound(props.order.id, {
              attachmentIds: uploadedImages.value
            });
          }
          emit('confirm');
        } catch (error) {
          uni.showToast({ title: '操作失败', icon: 'error' });
        } finally {
          confirming.value = false;
        }
      }
    }
  });
};
</script>

<style lang="scss" scoped>
.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.popup-content {
  width: 100%;
  max-height: 85vh;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #eee;

  .title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1a1a2e;
  }

  .close-btn {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48rpx;
    color: #999;
  }
}

.popup-body {
  flex: 1;
  padding: 32rpx;
  max-height: 60vh;
}

.section {
  margin-bottom: 32rpx;

  .section-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 20rpx;
    padding-left: 16rpx;
    border-left: 6rpx solid #1890ff;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;

  .info-item {
    .label {
      font-size: 24rpx;
      color: #999;
      display: block;
      margin-bottom: 8rpx;
    }

    .value {
      font-size: 28rpx;
      color: #333;
    }
  }
}

.item-list {
  .item-card {
    display: flex;
    align-items: center;
    padding: 20rpx;
    background: #f9f9f9;
    border-radius: 12rpx;
    margin-bottom: 16rpx;

    .item-index {
      width: 48rpx;
      height: 48rpx;
      background: #1890ff;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rpx;
      margin-right: 20rpx;
    }

    .item-info {
      flex: 1;

      .item-name {
        font-size: 28rpx;
        color: #333;
        display: block;
      }

      .item-detail {
        font-size: 24rpx;
        color: #999;
        margin-top: 8rpx;
      }
    }
  }
}

.popup-footer {
  padding: 32rpx;
  border-top: 1rpx solid #eee;

  .confirm-btn {
    width: 100%;
    height: 88rpx;
    background: #1890ff;
    color: #fff;
    border: none;
    border-radius: 16rpx;
    font-size: 32rpx;
    font-weight: 600;
  }
}
</style>
```

### 5.4 图片上传组件

**文件：`src/components/ImageUploader.vue`**

```vue
<template>
  <view class="image-uploader">
    <view class="image-list">
      <!-- 已上传图片 -->
      <view 
        v-for="(img, index) in images" 
        :key="index" 
        class="image-item"
      >
        <image :src="img.url" mode="aspectFill" @click="previewImage(index)" />
        <view class="delete-btn" @click.stop="removeImage(index)">×</view>
      </view>

      <!-- 添加按钮 -->
      <view 
        v-if="images.length < maxCount" 
        class="add-btn" 
        @click="chooseImage"
      >
        <text class="add-icon">+</text>
        <text class="add-text">添加</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const props = withDefaults(defineProps<{
  entityType?: string;
  entityId?: number;
  maxCount?: number;
}>(), {
  maxCount: 9
});

const emit = defineEmits(['uploaded']);

const authStore = useAuthStore();
const images = ref<{ id: number; url: string }[]>([]);
const uploading = ref(false);

const chooseImage = () => {
  uni.showActionSheet({
    itemList: ['拍照', '从相册选择'],
    success: (res) => {
      const sourceType = res.tapIndex === 0 ? ['camera'] : ['album'];
      
      uni.chooseImage({
        count: props.maxCount - images.value.length,
        sourceType,
        success: async (chooseRes) => {
          for (const tempPath of chooseRes.tempFilePaths) {
            await uploadImage(tempPath);
          }
        }
      });
    }
  });
};

const uploadImage = async (filePath: string) => {
  uni.showLoading({ title: '上传中...' });
  uploading.value = true;

  try {
    const uploadRes = await uni.uploadFile({
      url: 'https://wmsapi.fexxo.cn/api/attachments/upload',
      filePath,
      name: 'file',
      header: {
        Authorization: `Bearer ${authStore.token}`
      },
      formData: {
        entityType: props.entityType || 'temp',
        entityId: props.entityId || 0,
        category: 'confirmation'
      }
    });

    const result = JSON.parse(uploadRes.data);
    
    if (result.success) {
      images.value.push({
        id: result.data.id,
        url: result.data.url
      });
      emit('uploaded', images.value);
    } else {
      uni.showToast({ title: '上传失败', icon: 'error' });
    }
  } catch (error) {
    uni.showToast({ title: '上传失败', icon: 'error' });
  } finally {
    uni.hideLoading();
    uploading.value = false;
  }
};

const previewImage = (index: number) => {
  uni.previewImage({
    current: index,
    urls: images.value.map(img => img.url)
  });
};

const removeImage = (index: number) => {
  images.value.splice(index, 1);
  emit('uploaded', images.value);
};
</script>

<style lang="scss" scoped>
.image-uploader {
  .image-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }

  .image-item {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
    overflow: hidden;
    position: relative;

    image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .delete-btn {
      position: absolute;
      top: 0;
      right: 0;
      width: 40rpx;
      height: 40rpx;
      background: rgba(0, 0, 0, 0.5);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      border-radius: 0 12rpx 0 12rpx;
    }
  }

  .add-btn {
    width: 160rpx;
    height: 160rpx;
    border: 2rpx dashed #ddd;
    border-radius: 12rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fafafa;

    .add-icon {
      font-size: 48rpx;
      color: #999;
    }

    .add-text {
      font-size: 24rpx;
      color: #999;
      margin-top: 8rpx;
    }
  }
}
</style>
```

---

## 六、功能模块详细设计

### 6.1 登录页面

**文件：`src/pages/login/index.vue`**

```vue
<template>
  <view class="login-page">
    <view class="login-header">
      <image src="/static/images/logo.png" class="logo" />
      <text class="title">WMS仓库管理</text>
      <text class="subtitle">移动端登录</text>
    </view>

    <view class="login-form">
      <view class="form-item">
        <input 
          v-model="form.username" 
          placeholder="请输入用户名"
          class="input"
        />
      </view>
      <view class="form-item">
        <input 
          v-model="form.password" 
          type="password"
          placeholder="请输入密码"
          class="input"
        />
      </view>
      <button class="login-btn" @click="handleLogin" :loading="loading">
        登录
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const loading = ref(false);
const form = reactive({
  username: '',
  password: ''
});

const handleLogin = async () => {
  if (!form.username || !form.password) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    await authStore.login(form.username, form.password);
    uni.switchTab({ url: '/pages/home/index' });
  } catch (error: any) {
    uni.showToast({ title: error.message || '登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};
</script>
```

### 6.2 首页

**文件：`src/pages/home/index.vue`**

```vue
<template>
  <view class="home-page">
    <!-- 用户信息 -->
    <view class="user-header">
      <view class="user-info">
        <view class="avatar">
          <text>{{ userInitial }}</text>
        </view>
        <view class="info">
          <text class="name">{{ authStore.user?.realName || '用户' }}</text>
          <text class="role">{{ authStore.isAdmin ? '管理员' : '操作员' }}</text>
        </view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-grid">
      <view class="stat-card" @click="goToTodo('inbound')">
        <text class="stat-value">{{ todoStore.counts.inbound }}</text>
        <text class="stat-label">待入库</text>
      </view>
      <view class="stat-card" @click="goToTodo('outbound')">
        <text class="stat-value">{{ todoStore.counts.outbound }}</text>
        <text class="stat-label">待出库</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.todayInbound }}</text>
        <text class="stat-label">今日入库</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.todayOutbound }}</text>
        <text class="stat-label">今日出库</text>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="section">
      <view class="section-title">快捷操作</view>
      <view class="quick-grid">
        <view class="quick-item" @click="goTo('/pages/inbound/index')">
          <view class="quick-icon inbound">📥</view>
          <text>入库管理</text>
        </view>
        <view class="quick-item" @click="goTo('/pages/outbound/index')">
          <view class="quick-icon outbound">📤</view>
          <text>出库管理</text>
        </view>
        <view class="quick-item" @click="goTo('/pages/inventory/index')">
          <view class="quick-icon inventory">📦</view>
          <text>库存查询</text>
        </view>
        <view class="quick-item" @click="uni.switchTab({ url: '/pages/scan/index' })">
          <view class="quick-icon scan">📷</view>
          <text>扫码</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useTodoStore } from '@/stores/todo';
import { get } from '@/api/request';

const authStore = useAuthStore();
const todoStore = useTodoStore();

const stats = ref({
  todayInbound: 0,
  todayOutbound: 0
});

const userInitial = computed(() => {
  const name = authStore.user?.realName || authStore.user?.username || '?';
  return name.charAt(0).toUpperCase();
});

const goTo = (url: string) => {
  uni.navigateTo({ url });
};

const goToTodo = (type: string) => {
  uni.switchTab({ url: '/pages/todo/index' });
};

onMounted(async () => {
  await todoStore.fetchCounts();
  
  try {
    const data = await get('/dashboard/stats', {}, { showLoading: false });
    stats.value = {
      todayInbound: data.todayInbound || 0,
      todayOutbound: data.todayOutbound || 0
    };
  } catch {}
});
</script>
```

### 6.3 其他页面结构

| 页面 | 路径 | 功能 |
|------|------|------|
| 入库列表 | `/pages/inbound/index.vue` | 显示入库单列表，支持筛选、搜索 |
| 入库详情 | `/pages/inbound/detail.vue` | 入库单详情，货物明细 |
| 出库列表 | `/pages/outbound/index.vue` | 显示出库单列表 |
| 出库详情 | `/pages/outbound/detail.vue` | 出库单详情 |
| 库存查询 | `/pages/inventory/index.vue` | 按客户/SKU/库位查询 |
| 扫码页面 | `/pages/scan/index.vue` | 扫描条码快速查询 |
| 个人中心 | `/pages/profile/index.vue` | 用户信息、修改密码、退出 |

---

## 七、API接口文档

### 7.1 认证接口

```
POST /api/auth/login
请求：{ username, password }
响应：{ success, data: { token, user } }

GET /api/auth/profile
请求头：Authorization: Bearer <token>
响应：{ success, data: { id, username, realName, role } }
```

### 7.2 代办接口

```
GET /api/todo/pending
参数：type?: 'inbound' | 'outbound'
响应：{ success, data: { inbounds, outbounds, counts } }

GET /api/todo/count
响应：{ success, data: { inbound, outbound, total } }

POST /api/todo/inbound/:id/confirm
请求：{ source, attachmentIds?, remark? }
响应：{ success, data: { ...order }, message }

POST /api/todo/outbound/:id/confirm
请求：{ source, attachmentIds?, remark? }
响应：{ success, data: { ...order }, message }
```

### 7.3 入库接口

```
GET /api/inbound
参数：page, pageSize, status?, customerId?, orderNo?
响应：{ success, data: { list, pagination } }

GET /api/inbound/:id
响应：{ success, data: { ...order, items, attachments } }
```

### 7.4 出库接口

```
GET /api/outbound
参数：page, pageSize, status?, customerId?, orderNo?
响应：{ success, data: { list, pagination } }

GET /api/outbound/:id
响应：{ success, data: { ...order, items, attachments } }
```

### 7.5 库存接口

```
GET /api/inventory
参数：page, pageSize, customerId?, sku?, locationCode?
响应：{ success, data: { list, pagination } }
```

### 7.6 附件接口

```
POST /api/attachments/upload
Content-Type: multipart/form-data
FormData: file, entityType, entityId, category
响应：{ success, data: { id, filename, url } }
```

---

## 八、UI/UX设计规范

### 8.1 色彩

| 用途 | 色值 | 说明 |
|------|------|------|
| 主色 | #1890ff | 品牌色、按钮、选中 |
| 成功 | #52c41a | 入库标识 |
| 危险 | #ff4d4f | 出库标识 |
| 警告 | #faad14 | 待处理状态 |
| 背景 | #f5f7fa | 页面背景 |
| 主文字 | #1a1a2e | 标题 |
| 次文字 | #666666 | 描述 |

### 8.2 字体

| 用途 | 字号 |
|------|------|
| 页面标题 | 36rpx Bold |
| 卡片标题 | 32rpx Bold |
| 正文 | 28rpx |
| 辅助 | 24rpx |

### 8.3 间距

| 类型 | 数值 |
|------|------|
| 页面边距 | 32rpx |
| 卡片间距 | 24rpx |
| 按钮高度 | 88rpx |
| 圆角 | 16rpx |

---

## 九、部署发布

### 9.1 H5部署

```bash
# 构建
npm run build:h5

# 部署到 /www/wwwroot/wms-mobile/h5
# Nginx配置
server {
    listen 443 ssl;
    server_name m.wms.fexxo.cn;
    
    root /www/wwwroot/wms-mobile/h5;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 9.2 Android打包

```bash
# HBuilderX云打包
发行 → 原生App-云打包 → 选择Android → 下载APK
```

### 9.3 微信小程序

```bash
# 构建
npm run build:mp-weixin

# 使用微信开发者工具
# 导入 dist/build/mp-weixin
# 上传代码 → 提交审核
```

---

## 十、功能扩展建议

### 10.1 推荐增加

| 功能 | 说明 |
|------|------|
| 消息推送 | 新订单通知、超时提醒 |
| 离线支持 | 数据缓存、自动同步 |
| 扫码增强 | 连续扫码、批量操作 |
| 电子签名 | 确认时手写签名 |
| 语音播报 | 新订单语音提醒 |
| 批量确认 | 多选后一次确认 |

### 10.2 版本规划

| 版本 | 功能 |
|------|------|
| v1.0 | 登录、代办中心、入出库、附件上传 |
| v1.1 | 扫码功能、消息通知 |
| v1.2 | 离线支持、电子签名 |
| v2.0 | 报表统计、高级功能 |

---

## 开发检查清单

### 后端开发 ✅

- [ ] 更新 Prisma Schema
- [ ] 执行数据库迁移
- [ ] 创建 todo.controller.ts
- [ ] 创建 todo.routes.ts
- [ ] 注册路由到 app.ts
- [ ] 更新 CORS 配置
- [ ] API 测试

### 移动端开发 ✅

- [ ] 创建 UniApp 项目
- [ ] 配置 pages.json
- [ ] 配置 manifest.json
- [ ] 封装 request.ts
- [ ] 创建 auth store
- [ ] 创建 todo store
- [ ] 登录页面
- [ ] 首页
- [ ] 代办中心页面
- [ ] 订单详情弹窗
- [ ] 图片上传组件
- [ ] 入库列表/详情
- [ ] 出库列表/详情
- [ ] 库存查询
- [ ] 扫码页面
- [ ] 个人中心

### 测试 ✅

- [ ] 登录功能测试
- [ ] 代办列表刷新测试
- [ ] 确认入库测试
- [ ] 确认出库测试
- [ ] 附件上传测试
- [ ] 多端同步测试

### 部署 ✅

- [ ] H5 构建部署
- [ ] Android 打包
- [ ] 微信小程序审核

---

**文档版本**: v1.0  
**更新日期**: 2025-11-28  
**作者**: Claude AI
