# WMS 仓库管理系统

一个功能完整的仓库管理系统，包含入库、出库、库存管理、Excel导入导出等核心功能。

## 项目特点

- 🚀 全栈 TypeScript 开发
- 📦 Prisma ORM 数据库管理
- 🔐 JWT + 验证码认证系统
- 📊 实时库存管理
- 🎯 自动单号生成
- 📋 出库库存检查
- 💾 MySQL 生产环境支持
- 📤 Excel 批量导入导出
- ✅ 入库/出库审核流程
- 📈 仪表板统计功能
- 🔄 库存反审核支持

## 技术栈

### 后端
- Node.js + Express
- TypeScript
- Prisma ORM
- MySQL (生产)
- JWT 认证
- svg-captcha 验证码
- bcryptjs 密码加密

### 前端
- React 18
- TypeScript
- Vite
- Ant Design 5.x
- Zustand 状态管理
- React Router v6
- Axios
- xlsx (Excel 导入导出)

## 项目结构

```
wms/
├── wms-backend/              # 后端服务
│   ├── prisma/              # 数据库模型
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑
│   │   ├── routes/          # 路由
│   │   ├── middlewares/     # 中间件
│   │   ├── utils/           # 工具函数
│   │   └── app.ts          # 入口文件
│   └── README.md
│
├── wms-frontend/            # 前端应用
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── components/     # 公共组件
│   │   ├── services/       # API服务
│   │   ├── stores/         # 状态管理
│   │   └── types/          # 类型定义
│   └── README.md
│
├── CLAUDE.md                # Claude Code 指南
└── README.md                # 项目说明
```

## 快速开始

### 1. 启动后端服务

```bash
# 进入后端目录
cd wms-backend

# 安装依赖
npm install

# 复制环境变量配置
cp .env.example .env

# 编辑 .env 文件（配置MySQL数据库）
# DATABASE_URL="mysql://root:password@localhost:3306/wms"
# JWT_SECRET="your-secret-key"
# PORT=3001

# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 启动开发服务器
npm run dev
```

后端服务将在 http://localhost:3001 启动

### 2. 启动前端应用

```bash
# 进入前端目录
cd wms-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用将在 http://localhost:3000 启动

### 3. 默认管理员账号

- 用户名: `admin`
- 密码: `admin123`

首次使用可通过注册接口创建管理员账号：

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "realName": "系统管理员",
    "role": "admin"
  }'
```

## 核心功能

### ✅ 已完成功能

#### 1. **用户认证**
   - 用户注册/登录
   - JWT Token 认证（7天有效期）
   - SVG 验证码验证（4位数字）
   - 密码加密存储
   - 权限验证中间件
   - 自动登录超时跳转

#### 2. **客户管理**
   - 创建/查询/更新/删除客户
   - 客户搜索功能
   - 客户列表分页显示

#### 3. **入库管理**
   - 创建入库单（自动生成单号: WI+日期+序号）
   - 入库单列表（支持分页、多条件筛选）
   - 查看入库单详情
   - 编辑入库单（仅待审核状态）
   - 删除入库单（带关联检查）
   - **确认入库**（审核通过，更新库存）
   - **反审核**（撤销入库，恢复库存）
   - Excel 批量导入入库单
   - 下载导入模板
   - 支持字段：
     - CMD编号（sku）
     - 内部货号（internalCode）
     - CMD料号（productCode）
     - 进仓编号（warehouseEntryNo）
     - 唛头、PO号、包装形式等

#### 4. **出库管理**
   - 创建出库单（自动生成单号: WO+日期+序号）
   - 出库前库存充足性检查
   - 按进仓编号选择库存
   - 查询出库单列表（支持筛选）
   - 查看出库单详情
   - 编辑出库单（仅待审核状态）
   - 删除出库单
   - **确认出库**（审核通过，扣减库存）
   - **反审核**（撤销出库，恢复库存）
   - 业务类型支持（普通出库/退货/调拨）

#### 5. **库存管理**
   - 实时库存查询（总数量/可用/锁定）
   - 多维度筛选（客户/CMD编号/货名/库位）
   - 库存详情查看
   - 库存导出 Excel（21个字段）
   - 库存统计合计行
   - 库存字段包含：
     - CMD编号、内部货号、CMD料号
     - 进仓编号、唛头、PO号
     - 尺寸、重量、体积、面积
     - 进仓/出库日期
   - 库龄计算

#### 6. **仪表板**
   - 今日入库数量统计
   - 今日出库数量统计
   - 总SKU统计
   - 客户数量统计
   - 实时数据更新

#### 7. **库位管理**
   - 创建/查询/更新/停用库位
   - 库位列表分页显示
   - 库位状态管理（启用/停用）

## API 文档

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/captcha` - 获取验证码
- `GET /api/auth/current` - 获取当前用户信息

### 客户管理
- `POST /api/customers` - 创建客户
- `GET /api/customers` - 获取客户列表
- `GET /api/customers/:id` - 获取客户详情
- `PUT /api/customers/:id` - 更新客户
- `DELETE /api/customers/:id` - 删除客户

### 入库管理
- `POST /api/inbound/orders` - 创建入库单
- `GET /api/inbound/orders` - 获取入库单列表
- `GET /api/inbound/orders/:id` - 获取入库单详情
- `PUT /api/inbound/orders/:id` - 更新入库单
- `DELETE /api/inbound/orders/:id` - 删除入库单
- `POST /api/inbound/orders/:id/confirm` - 确认入库
- `POST /api/inbound/orders/:id/reverse` - 反审核
- `POST /api/inbound/import` - 批量导入

### 出库管理
- `POST /api/outbound/check-stock` - 检查库存
- `POST /api/outbound/orders` - 创建出库单
- `GET /api/outbound/orders` - 获取出库单列表
- `GET /api/outbound/orders/:id` - 获取出库单详情
- `PUT /api/outbound/orders/:id` - 更新出库单
- `DELETE /api/outbound/orders/:id` - 删除出库单
- `POST /api/outbound/orders/:id/confirm` - 确认出库
- `POST /api/outbound/orders/:id/reverse` - 反审核

### 库存管理
- `GET /api/inventory` - 获取库存列表
- `GET /api/inventory/:id` - 获取库存详情

### 库位管理
- `POST /api/locations` - 创建库位
- `GET /api/locations` - 获取库位列表
- `GET /api/locations/active` - 获取启用的库位
- `PUT /api/locations/:id` - 更新库位
- `DELETE /api/locations/:id` - 删除库位

### 仪表板
- `GET /api/dashboard/stats` - 获取统计数据

## 数据库模型

### 主要表结构

- **User** - 用户表
- **Customer** - 客户表
- **Location** - 库位表
- **InboundOrder** / **InboundOrderItem** - 入库单主表/明细表
- **OutboundOrder** / **OutboundOrderItem** - 出库单主表/明细表
- **Inventory** - 库存表

### 关键字段说明

- **sku**: CMD编号（产品识别码）
- **internalCode**: 内部货号（内部追踪码）
- **productCode**: CMD料号（物料编号）
- **warehouseEntryNo**: 进仓编号（关联到原始入库单）

查看完整数据库设计: [wms-backend/prisma/schema.prisma](./wms-backend/prisma/schema.prisma)

## 开发工具

### 查看数据库

```bash
cd wms-backend
npm run prisma:studio
```

访问 http://localhost:5555 可视化查看和编辑数据库

### 构建生产版本

```bash
# 后端
cd wms-backend
npm run build
npm start

# 前端
cd wms-frontend
npm run build
npm run preview
```

## 业务流程

### 入库流程
1. 创建入库单（状态：待审核）
2. 填写入库明细（货名、CMD编号、内部货号、件数等）
3. 确认入库（审核通过）→ 自动更新库存
4. 如需撤销，可进行反审核 → 库存回滚

### 出库流程
1. 创建出库单（状态：待审核）
2. 按进仓编号选择库存
3. 系统检查库存充足性
4. 确认出库（审核通过）→ 自动扣减库存
5. 如需撤销，可进行反审核 → 库存恢复

### 库存管理
- 库存按照 [CMD编号 + 客户 + 库位] 唯一约束
- 实时追踪可用数量和锁定数量
- 支持按多维度查询和导出

## 注意事项

### 开发环境
- 使用 MySQL 数据库
- 默认端口: 后端 3001, 前端 3000
- 支持热重载
- 前端通过 Vite proxy 连接后端

### 生产环境
- **使用 MySQL 数据库**
- 修改 DATABASE_URL 环境变量
- 使用强随机字符串作为 JWT_SECRET
- 启用 HTTPS
- 配置反向代理（Nginx）
- 建议定期备份数据库

### 重要提醒
- 确认入库/出库后会立即更新库存，请谨慎操作
- 反审核功能会检查关联数据，确保数据一致性
- Excel 导入支持批量操作，请使用提供的模板格式
- 日期格式支持 YYYY-MM-DD 和 YYYY/MM/DD

## 项目进度

- [x] 后端完整开发 (100%)
- [x] 数据库设计 (100%)
- [x] API接口开发 (100%)
- [x] 认证系统 (100%)
- [x] 前端项目初始化 (100%)
- [x] 前端页面开发 (100%)
- [x] Excel功能 (100%)
- [x] 审核流程 (100%)
- [x] 仪表板统计 (100%)
- [ ] 打印功能 (0%)
- [ ] 系统完整测试 (进行中)

## 贡献指南

欢迎提交 Issue 和 Pull Request！

开发时请参考 [CLAUDE.md](./CLAUDE.md) 文件了解项目架构和开发规范。

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系开发团队。

---

**当前状态**:
- ✅ 后端已完全开发并稳定运行
- ✅ 前端已完整开发，所有核心功能已实现
- ✅ Excel 导入导出功能完成
- ✅ 入库/出库审核流程完成
- ✅ 库存管理完整实现
- 🚀 系统可投入使用

**最新更新**:
- 新增内部货号字段支持
- 完善确认入库时字段保存逻辑
- 优化库存管理导出功能
- 增强入库单批量导入功能
