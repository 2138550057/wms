# WMS Backend

仓库管理系统后端服务

## 技术栈

- Node.js + Express + TypeScript
- Prisma ORM
- SQLite (开发环境) / PostgreSQL (生产环境)
- JWT 认证
- bcryptjs 密码加密

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并修改配置:

```bash
cp .env.example .env
```

编辑 `.env` 文件:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
PORT=3001
NODE_ENV=development
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate
```

### 4. 创建初始管理员用户

启动服务后,使用以下API创建管理员:

```bash
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "realName": "管理员",
  "role": "admin"
}
```

### 5. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3001 启动

### 6. 查看数据库

```bash
npm run prisma:studio
```

## API 文档

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/current` - 获取当前用户信息
- `POST /api/auth/change-password` - 修改密码
- `GET /api/auth/users` - 获取用户列表(管理员)

### 客户管理

- `POST /api/customers` - 创建客户
- `GET /api/customers` - 获取客户列表
- `GET /api/customers/search` - 搜索客户
- `GET /api/customers/:id` - 获取客户详情
- `PUT /api/customers/:id` - 更新客户
- `DELETE /api/customers/:id` - 删除客户

### 入库管理

- `POST /api/inbound/orders` - 创建入库单
- `GET /api/inbound/orders` - 获取入库单列表
- `GET /api/inbound/orders/:id` - 获取入库单详情
- `DELETE /api/inbound/orders/:id` - 删除入库单

### 出库管理

- `POST /api/outbound/check-stock` - 检查库存
- `POST /api/outbound/orders` - 创建出库单
- `GET /api/outbound/orders` - 获取出库单列表
- `GET /api/outbound/orders/:id` - 获取出库单详情
- `DELETE /api/outbound/orders/:id` - 删除出库单

### 库存管理

- `GET /api/inventory` - 获取库存列表
- `GET /api/inventory/:id` - 获取库存详情
- `POST /api/inventory/adjust` - 库存调整
- `POST /api/inventory/lock` - 冻结库存
- `POST /api/inventory/unlock` - 解冻库存
- `GET /api/inventory/summary/customer/:customerId` - 客户库存汇总

## 项目结构

```
wms-backend/
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── src/
│   ├── controllers/           # 控制器
│   │   ├── auth.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── inbound.controller.ts
│   │   ├── outbound.controller.ts
│   │   └── inventory.controller.ts
│   ├── services/             # 业务逻辑
│   │   └── inventory.service.ts
│   ├── routes/               # 路由定义
│   │   ├── auth.routes.ts
│   │   ├── customer.routes.ts
│   │   ├── inbound.routes.ts
│   │   ├── outbound.routes.ts
│   │   └── inventory.routes.ts
│   ├── middlewares/          # 中间件
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── utils/                # 工具函数
│   │   ├── prisma.ts
│   │   └── helpers.ts
│   ├── types/                # TypeScript类型
│   │   └── index.ts
│   └── app.ts                # 应用入口
├── package.json
├── tsconfig.json
└── .env
```

## 开发命令

- `npm run dev` - 启动开发服务器(热重载)
- `npm run build` - 构建生产版本
- `npm start` - 启动生产服务器
- `npm run prisma:generate` - 生成 Prisma Client
- `npm run prisma:migrate` - 运行数据库迁移
- `npm run prisma:studio` - 打开 Prisma Studio

## 数据库设计

### 主要表

1. **User** - 用户表
2. **Customer** - 客户表
3. **InboundOrder** - 入库单主表
4. **InboundOrderItem** - 入库单明细表
5. **OutboundOrder** - 出库单主表
6. **OutboundOrderItem** - 出库单明细表
7. **Inventory** - 库存表

详细的数据库模型请查看 `prisma/schema.prisma`

## 注意事项

1. 开发环境使用 SQLite,生产环境建议使用 PostgreSQL
2. JWT_SECRET 在生产环境必须更换为安全的随机字符串
3. 所有需要认证的接口都需要在请求头中携带 token:
   ```
   Authorization: Bearer <token>
   ```
4. 单号生成规则:
   - 入库单: WI + YYYYMMDD + 4位序号
   - 出库单: WO + YYYYMMDD + 4位序号
