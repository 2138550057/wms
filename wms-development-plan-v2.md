# WMS仓库管理系统 - 技术文档 v2.1

> 本文档基于实际开发的WMS系统，记录了真实的技术栈、架构设计和实现细节。

## 最近更新 (2025-11-28)

### 附件系统优化
- **文件命名改进**: 实现自动重命名为 `{category}_{timestamp}_{random}.{ext}` 格式
  - 解决中文文件名乱码问题
  - 时间戳格式: YYYYMMDDHHmmss
  - 随机数: 6位数字,确保唯一性
- **跨域上传修复**: AttachmentUploader 组件使用环境变量配置 API URL
  - 开发环境: `/api` (通过 Vite 代理)
  - 生产环境: `https://wmsapi.fexxo.cn/api`
  - 修复了生产环境 HTTP 405 错误

### UI/UX 改进
- **详情模态框重构**: 入库/出库详情页改用垂直卡片布局
  - 移除标签页 (Tabs) 组件
  - 基本信息和明细列表垂直排列在同一视图
  - 添加滚动容器 (maxHeight: 70vh)
  - 改善信息浏览体验,无需切换标签

### 生产部署
- **分离式架构**: 前后端独立部署
  - 前端: https://wms.fexxo.cn (Nginx 静态文件)
  - 后端: https://wmsapi.fexxo.cn (Node.js API)
- **Nginx 配置**: React Router 支持
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```
  - 防止刷新路由时出现 404 错误

## 一、技术栈（实际使用）

### 前端技术栈
```
- React 18 + TypeScript
- Ant Design 5.x (UI组件库)
- Zustand (状态管理 - 仅用于auth)
- React Router v6 (路由管理)
- Axios (HTTP请求库)
- Day.js (日期处理)
- XLSX (Excel导入导出)
- Vite (构建工具)
```

### 后端技术栈
```
- Node.js + Express + TypeScript
- MySQL (生产环境数据库)
- Prisma ORM (数据库操作)
- JWT (身份认证)
- Bcrypt (密码加密)
- Nodemon (开发热重载)
```

### 开发环境
```
- 前端运行端口: 3000 (0.0.0.0:3000 支持外部访问)
- 后端运行端口: 3001 (:::3001)
- 数据库: MySQL
- 部署路径: /www/wwwroot/wms/
```

## 二、项目结构（实际）

### 前端目录结构
```
wms-frontend/
├── src/
│   ├── pages/                  # 页面组件
│   │   ├── dashboard/          # 仪表盘
│   │   │   └── index.tsx       # 数据概览页面
│   │   ├── inbound/            # 入库管理
│   │   │   ├── InboundList.tsx     # 入库列表
│   │   │   ├── InboundForm.tsx     # 新建入库
│   │   │   ├── InboundEdit.tsx     # 编辑入库
│   │   │   └── InboundDetail.tsx   # 入库详情 (已废弃,使用Modal代替)
│   │   ├── outbound/           # 出库管理
│   │   │   ├── OutboundList.tsx    # 出库列表
│   │   │   ├── OutboundForm.tsx    # 新建出库
│   │   │   ├── OutboundEdit.tsx    # 编辑出库
│   │   │   └── OutboundDetail.tsx  # 出库详情 (已废弃,使用Modal代替)
│   │   ├── inventory/          # 库存管理
│   │   │   ├── index.tsx           # 库存列表
│   │   │   └── InventoryDetail.tsx # 库存详情
│   │   ├── logs/               # 日志管理
│   │   │   ├── InboundLogList.tsx  # 入库日志
│   │   │   ├── OutboundLogList.tsx # 出库日志
│   │   │   ├── InventoryLogList.tsx # 库存日志
│   │   │   ├── OperationLogList.tsx # 操作日志
│   │   │   └── index.tsx
│   │   ├── settings/           # 系统设置
│   │   │   ├── SystemSettings.tsx  # 系统配置
│   │   │   └── BusinessTypes.tsx   # 业务类型管理
│   │   ├── customer/           # 客户管理
│   │   │   └── index.tsx
│   │   ├── location/           # 库位管理
│   │   │   └── index.tsx
│   │   ├── user/               # 用户管理
│   │   │   ├── UserList.tsx
│   │   │   └── UserForm.tsx
│   │   ├── profile/            # 个人中心
│   │   │   ├── Profile.tsx
│   │   │   └── ChangePassword.tsx
│   │   └── login/              # 登录页
│   │       └── index.tsx
│   ├── components/             # 公共组件
│   │   ├── MainLayout.tsx           # 主布局（侧边栏+顶栏）
│   │   ├── InboundDetailModal.tsx   # 入库详情模态框 ⭐新增
│   │   ├── OutboundDetailModal.tsx  # 出库详情模态框 ⭐新增
│   │   ├── AttachmentViewer.tsx     # 附件查看器 ⭐新增
│   │   └── AttachmentUploader.tsx   # 附件上传器 ⭐新增
│   ├── services/               # API服务层
│   │   ├── api.ts              # Axios实例配置
│   │   ├── auth.service.ts     # 认证API
│   │   ├── inbound.service.ts  # 入库API
│   │   ├── outbound.service.ts # 出库API
│   │   ├── inventory.service.ts # 库存API
│   │   ├── customer.service.ts # 客户API
│   │   ├── location.service.ts # 库位API
│   │   ├── user.service.ts     # 用户API
│   │   ├── dashboard.service.ts # 仪表盘API
│   │   ├── attachment.service.ts # 附件API ⭐新增
│   │   └── log.service.ts      # 日志API
│   ├── stores/                 # Zustand状态管理
│   │   ├── auth.store.ts       # 认证状态
│   │   └── app.store.ts        # 应用状态
│   ├── types/                  # TypeScript类型定义
│   │   └── index.ts
│   ├── utils/                  # 工具函数
│   │   ├── excel.ts            # Excel导出工具
│   │   ├── getSystemDomain.ts  # 获取系统域名
│   │   └── helpers.ts
│   ├── App.tsx                 # 根组件
│   ├── main.tsx                # 入口文件
│   ├── vite.config.ts          # Vite配置
│   ├── .env                    # 开发环境变量
│   └── .env.production         # 生产环境变量
├── package.json
└── tsconfig.json
```

### 后端目录结构
```
wms-backend/
├── src/
│   ├── controllers/            # 控制器层
│   │   ├── auth.controller.ts      # 认证控制器
│   │   ├── inbound.controller.ts   # 入库控制器
│   │   ├── outbound.controller.ts  # 出库控制器
│   │   ├── inventory.controller.ts # 库存控制器
│   │   ├── customer.controller.ts  # 客户管理
│   │   ├── location.controller.ts  # 库位管理
│   │   ├── user.controller.ts      # 用户管理
│   │   ├── dashboard.controller.ts # 仪表盘统计
│   │   ├── attachment.controller.ts # 附件管理 ⭐新增
│   │   ├── systemSetting.controller.ts # 系统设置 ⭐新增
│   │   └── log.controller.ts       # 日志控制器
│   ├── routes/                 # 路由层
│   │   ├── auth.routes.ts
│   │   ├── inbound.routes.ts
│   │   ├── outbound.routes.ts
│   │   ├── inventory.routes.ts
│   │   ├── customer.routes.ts
│   │   ├── location.routes.ts
│   │   ├── user.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── attachment.routes.ts     # 附件路由 ⭐新增
│   │   ├── systemSetting.routes.ts  # 系统设置路由 ⭐新增
│   │   └── log.routes.ts
│   ├── services/               # 业务逻辑层
│   │   ├── attachment.service.ts    # 附件服务 ⭐新增
│   │   ├── operationLog.service.ts  # 操作日志服务 ⭐新增
│   │   ├── tempFileCleanup.service.ts # 临时文件清理 ⭐新增
│   │   └── storage/                 # 存储适配器 ⭐新增
│   │       ├── types.ts             # 存储类型定义
│   │       ├── factory.ts           # 存储工厂
│   │       ├── local.adapter.ts     # 本地存储
│   │       ├── s3.adapter.ts        # AWS S3
│   │       ├── qiniu.adapter.ts     # 七牛云
│   │       └── index.ts
│   ├── middlewares/            # 中间件
│   │   ├── auth.ts                 # JWT认证中间件
│   │   ├── upload.ts               # 文件上传中间件
│   │   └── errorHandler.ts         # 错误处理
│   ├── utils/                  # 工具函数
│   │   ├── prisma.ts               # Prisma实例
│   │   ├── helpers.ts              # 辅助函数
│   │   └── getSystemDomain.ts      # 获取系统域名
│   ├── types/                  # 类型定义
│   │   └── index.ts
│   └── app.ts                  # 应用入口
├── prisma/
│   ├── schema.prisma           # 数据库模型定义
│   └── migrations/             # 数据库迁移文件
├── uploads/                    # 文件上传目录 ⭐新增
│   ├── permanent/              # 永久文件
│   └── temp/                   # 临时文件(24小时后删除)
├── .env                        # 环境变量
├── package.json
└── tsconfig.json
```

## 三、数据库设计（实际Schema）

### 核心表结构

```prisma
// prisma/schema.prisma

datasource db {
  provider = "mysql"  // 实际使用MySQL
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 用户表
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  realName  String?
  role      String   @default("operator")  // admin/operator
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  inboundOrders  InboundOrder[]
  outboundOrders OutboundOrder[]
}

// 客户表
model Customer {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  name        String
  contact     String?
  phone       String?
  address     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  inboundOrders  InboundOrder[]
  outboundOrders OutboundOrder[]
  inventory      Inventory[]
}

// 库位表
model Location {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  name        String
  warehouse   String?
  zone        String?
  aisle       String?
  shelf       String?
  layer       String?
  position    String?
  status      String   @default("active")  // active/disabled
  remark      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 入库单主表
model InboundOrder {
  id               Int      @id @default(autoincrement())
  orderNo          String   @unique                    // WI+日期+序号
  warehouseEntryNo String?                             // 进仓编号（手动输入）
  customerId       Int
  customerName     String
  contactPerson    String?
  contactPhone     String?
  deliveryCompany  String?
  vehicleNumber    String?
  driverName       String?
  businessType     String   @default("normal")        // normal/return/transfer
  inboundDate      DateTime
  status           String   @default("pending")       // pending/completed
  totalQuantity    Int      @default(0)
  totalVolume      Float?
  totalWeight      Float?
  remark           String?
  createdBy        Int?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  customer Customer @relation(fields: [customerId], references: [id])
  creator  User?    @relation(fields: [createdBy], references: [id])
  items    InboundOrderItem[]
}

// 入库单明细表
model InboundOrderItem {
  id               Int      @id @default(autoincrement())
  orderId          Int
  productName      String
  productModel     String?
  sku              String?
  internalCode     String?                        // 内部货号 ⭐新增
  productCode      String?
  shippingMark     String?                             // 唛头
  poNumber         String?                             // PO号
  locationCode     String?
  packageType      String?                             // 包装形式
  quantity         Int
  length           Float?                              // 长(cm)
  width            Float?                              // 宽(cm)
  height           Float?                              // 高(cm)
  unitGrossWeight  Float?                              // 单件毛重(kg)
  totalGrossWeight Float?                              // 总毛重(kg)
  area             Float?                              // 平方(m²)
  volume           Float?                              // 体积(m³)
  remark           String?

  order InboundOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

// 出库单主表
model OutboundOrder {
  id               Int      @id @default(autoincrement())
  orderNo          String   @unique                    // WO+日期+序号
  customerId       Int
  customerName     String
  contactPerson    String?
  contactPhone     String?
  receivingCompany String?
  receivingAddress String?
  vehicleNumber    String?
  driverName       String?
  businessType     String   @default("sales")         // sales/return/transfer
  outboundDate     DateTime
  status           String   @default("pending")       // pending/completed
  totalQuantity    Int      @default(0)
  totalVolume      Float?
  totalWeight      Float?
  remark           String?
  createdBy        Int?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  customer Customer @relation(fields: [customerId], references: [id])
  creator  User?    @relation(fields: [createdBy], references: [id])
  items    OutboundOrderItem[]
}

// 出库单明细表
model OutboundOrderItem {
  id               Int      @id @default(autoincrement())
  orderId          Int
  warehouseEntryNo String?                             // 进仓编号（关键字段）⭐新增
  productName      String
  productModel     String?
  sku              String?
  internalCode     String?                             // 内部货号 ⭐新增
  productCode      String?
  shippingMark     String?
  poNumber         String?
  locationCode     String?
  packageType      String?
  quantity         Int
  length           Float?
  width            Float?
  height           Float?
  unitGrossWeight  Float?
  totalGrossWeight Float?
  area             Float?
  volume           Float?
  remark           String?

  order OutboundOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

// 库存表
model Inventory {
  id                 Int      @id @default(autoincrement())
  sku                String
  productName        String
  productModel       String?
  internalCode       String?                     // 内部货号 ⭐新增
  productCode        String?
  customerId         Int
  customerName       String
  locationCode       String?
  quantity           Int      @default(0)              // 总数量
  availableQuantity  Int      @default(0)              // 可用数量
  lockedQuantity     Int      @default(0)              // 锁定数量
  length             Float?
  width              Float?
  height             Float?
  unitGrossWeight    Float?                            // 单件毛重
  totalGrossWeight   Float?                            // 总毛重
  area               Float?                            // 平方
  volume             Float?                            // 体积
  warehouseEntryNo   String?                           // 进仓编号
  shippingMark       String?                           // 唛头
  poNumber           String?                           // PO号
  packageType        String?                           // 包装形式
  lastInboundDate    DateTime?
  lastOutboundDate   DateTime?
  remark             String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  customer Customer @relation(fields: [customerId], references: [id])

  @@unique([customerId, sku, locationCode])
}

// 附件表 ⭐新增
model Attachment {
  id             Int       @id @default(autoincrement())
  fileName       String                                 // 文件名
  fileSize       Int                                    // 文件大小(bytes)
  mimeType       String                                 // MIME类型
  storageType    String    @default("local")            // 存储类型: local/s3/qiniu/aliyun/tencent
  storagePath    String                                 // 存储路径
  storageUrl     String?                                // 访问URL
  entityType     String                                 // 关联实体类型: inbound/outbound/inventory/customer
  entityId       Int                                    // 关联实体ID
  category       String    @default("default")          // 分类: default/image/document/contract/other
  uploadedBy     Int?                                   // 上传人ID
  uploadedByName String?                                // 上传人姓名
  isShared       Boolean   @default(false)              // 是否已分享
  shareToken     String?   @unique                      // 分享令牌
  shareExpireAt  DateTime?                              // 分享过期时间
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

// 系统设置表 ⭐新增
model SystemSetting {
  id          Int       @id @default(autoincrement())
  settingKey  String    @unique                         // 配置键
  settingValue String   @db.Text                        // 配置值(JSON格式)
  category    String    @default("basic")               // 分类: basic/business/storage/notification
  description String?                                   // 说明
  isPublic    Boolean   @default(false)                 // 是否公开(前端可访问)
  updatedBy   Int?                                      // 更新人ID
  updatedByName String?                                 // 更新人姓名
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// 业务类型表 ⭐新增
model BusinessType {
  id        Int       @id @default(autoincrement())
  code      String    @unique                           // 类型代码
  name      String                                      // 类型名称
  category  String                                      // 业务分类: inbound/outbound
  color     String?                                     // 显示颜色
  isActive  Boolean   @default(true)                    // 是否启用
  sortOrder Int       @default(0)                       // 排序
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

// 操作日志表 ⭐新增
model OperationLog {
  id           Int       @id @default(autoincrement())
  operatorId   Int                                      // 操作人ID
  operatorName String                                   // 操作人姓名
  module       String                                   // 模块: inbound/outbound/inventory/customer/location
  action       String                                   // 动作: create/update/delete/confirm/reverse/import/export
  targetId     Int?                                     // 目标记录ID
  targetNo     String?                                  // 目标单号
  description  String?   @db.Text                       // 操作描述
  createdAt    DateTime  @default(now())
}
```

## 四、核心业务流程（实际实现）

### 4.1 入库流程

```
1. 创建入库单 (status: pending)
   ├─ 填写入库信息（客户、日期、业务类型等）
   ├─ 添加入库明细（货名、数量、尺寸等）
   ├─ 自动生成入库单号：WI + YYYYMMDD + 4位序号
   └─ 保存到数据库（不更新库存）

2. 确认入库 (status: pending → completed)
   ├─ 使用Prisma事务确保原子性
   ├─ 更新订单状态为completed
   ├─ 创建或更新库存记录
   │   ├─ 匹配规则：customerId + sku + locationCode
   │   ├─ 增加 quantity 和 availableQuantity
   │   ├─ 更新 lastInboundDate
   │   └─ 保存 warehouseEntryNo 用于追溯
   └─ 提交事务

3. 反入库 (completed → pending)
   ├─ 检查该批次是否已有出库记录
   ├─ 如有出库，禁止反入库（提示先反出库）
   ├─ 使用事务回退库存
   │   ├─ 减少对应库存的数量
   │   └─ 如果数量归零，删除库存记录
   └─ 更新订单状态为pending

4. 编辑入库单
   ├─ 仅允许编辑 pending 状态的单据
   ├─ 已完成的单据需要先反入库才能编辑
   └─ 编辑后重新确认入库

5. 删除入库单
   ├─ 仅允许删除 pending 状态的单据
   ├─ 已完成的单据需要先反入库
   └─ 级联删除明细记录（Cascade）
```

### 4.2 出库流程

```
1. 创建出库单 (status: pending)
   ├─ 选择客户
   ├─ 添加出库明细
   │   ├─ 通过进仓编号（warehouseEntryNo）选择库存
   │   ├─ 自动填充商品信息（只读）
   │   ├─ 输入出库数量
   │   └─ 前端检查库存可用性
   ├─ 自动生成出库单号：WO + YYYYMMDD + 4位序号
   └─ 保存到数据库（不扣减库存）

2. 确认出库 (status: pending → completed)
   ├─ 重新检查库存可用性
   ├─ 使用Prisma事务
   ├─ 更新订单状态为completed
   ├─ 扣减库存
   │   ├─ 匹配规则：根据warehouseEntryNo或sku
   │   ├─ 减少 quantity 和 availableQuantity
   │   └─ 更新 lastOutboundDate
   └─ 提交事务

3. 反出库 (completed → pending)
   ├─ 使用事务恢复库存
   │   ├─ 增加对应库存的数量
   │   └─ 如果库存记录不存在，重新创建
   └─ 更新订单状态为pending

4. 编辑出库单
   ├─ 仅允许编辑 pending 状态的单据
   └─ 已完成的单据需要先反出库

5. 删除出库单
   ├─ 仅允许删除 pending 状态的单据
   └─ 级联删除明细记录
```

### 4.3 库存管理

```
库存查询功能：
├─ 多条件筛选
│   ├─ 客户名称
│   ├─ 进仓编号
│   ├─ SKU/货名
│   ├─ 库位
│   └─ 入库日期范围
├─ 显示字段
│   ├─ 进仓日期、进仓编号
│   ├─ 货名、型号、SKU、编号
│   ├─ 唛头、PO号、包装形式
│   ├─ 件数、库位
│   ├─ 长宽高、总毛重、平方、体积
│   ├─ 出库日期、备注
│   └─ 库龄（当前日期 - 最后入库日期）
└─ 操作功能
    ├─ 查看详情
    └─ 导出Excel（支持19个字段）

库存更新规则：
├─ 入库：创建或更新记录，增加数量
├─ 出库：扣减现有记录，可能删除（数量归零时）
└─ 反审核：相应地增加或减少数量
```

## 五、API接口设计（实际实现）

### 5.1 认证相关
```
POST   /api/auth/login              # 用户登录
POST   /api/auth/register           # 用户注册
GET    /api/auth/profile            # 获取当前用户信息
```

### 5.2 入库相关
```
POST   /api/inbound/orders          # 创建入库单
GET    /api/inbound/orders          # 查询入库单列表（支持分页和筛选）
GET    /api/inbound/orders/:id      # 获取入库单详情
PUT    /api/inbound/orders/:id      # 更新入库单（仅pending状态）
DELETE /api/inbound/orders/:id      # 删除入库单（仅pending状态）
POST   /api/inbound/orders/:id/confirm        # 确认入库
POST   /api/inbound/orders/:id/reverse-audit  # 反入库
```

### 5.3 出库相关
```
POST   /api/outbound/check-stock    # 检查库存
POST   /api/outbound/orders         # 创建出库单
GET    /api/outbound/orders         # 查询出库单列表
GET    /api/outbound/orders/:id     # 获取出库单详情
PUT    /api/outbound/orders/:id     # 更新出库单（仅pending状态）
DELETE /api/outbound/orders/:id     # 删除出库单（仅pending状态）
POST   /api/outbound/orders/:id/confirm        # 确认出库
POST   /api/outbound/orders/:id/reverse-audit  # 反出库
```

### 5.4 库存相关
```
GET    /api/inventory               # 查询库存列表（支持多条件筛选）
GET    /api/inventory/:id           # 查看库存详情
```

### 5.5 日志相关（新增）
```
GET    /api/logs/inbound            # 入库日志（基于入库单明细）
GET    /api/logs/outbound           # 出库日志（基于出库单明细）
GET    /api/logs/inventory          # 库存管理日志（综合入库+出库）
```

### 5.6 仪表盘相关
```
GET    /api/dashboard/stats         # 获取仪表盘统计数据
```

### 5.7 基础数据
```
GET    /api/customers               # 客户列表
POST   /api/customers               # 创建客户
PUT    /api/customers/:id           # 更新客户
DELETE /api/customers/:id           # 删除客户

GET    /api/locations               # 库位列表
POST   /api/locations               # 创建库位
PUT    /api/locations/:id           # 更新库位
DELETE /api/locations/:id           # 删除库位

GET    /api/users                   # 用户列表
POST   /api/users                   # 创建用户
PUT    /api/users/:id               # 更新用户
DELETE /api/users/:id               # 删除用户
```

### 5.8 附件管理 ⭐新增
```
POST   /api/attachments/upload      # 上传附件（支持多文件）
GET    /api/attachments             # 查询附件列表（支持entityType和entityId筛选）
GET    /api/attachments/:id         # 获取附件详情
DELETE /api/attachments/:id         # 删除附件
POST   /api/attachments/:id/share   # 生成分享链接
GET    /api/attachments/shared/:token # 通过分享令牌访问附件（无需认证）
POST   /api/attachments/batch-download # 批量下载（返回ZIP文件）
PUT    /api/attachments/:id/category   # 更新附件分类
```

**附件上传关键实现**:
```typescript
// AttachmentUploader.tsx - 使用环境变量配置API URL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
xhr.open('POST', `${apiBaseUrl}/attachments/upload`);

// 文件命名格式: {category}_{timestamp}_{random}.{ext}
// 示例: image_20251128143025_482619.jpg
```

### 5.9 系统设置 ⭐新增
```
GET    /api/system/settings         # 获取所有设置
GET    /api/system/settings/:key    # 获取单个设置
PUT    /api/system/settings/:key    # 更新设置
POST   /api/system/settings/batch   # 批量更新设置
```

### 5.10 操作日志 ⭐新增
```
GET    /api/logs/operations         # 查询操作日志（支持筛选：module, action, operator, dateRange）
```

## 六、前端核心实现

### 6.1 状态管理（Zustand）

```typescript
// stores/auth.store.ts
import { create } from 'zustand';

interface AuthState {
  user: any;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),

  login: async (username, password) => {
    const response = await authAPI.login({ username, password });
    if (response.success) {
      localStorage.setItem('token', response.token);
      set({ user: response.user, token: response.token });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  isAuthenticated: () => {
    const token = get().token;
    return !!token;
  },
}));
```

### 6.2 API拦截器配置

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',  // 使用Vite代理
});

// 请求拦截器 - 添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 6.3 Excel导出实现

```typescript
// utils/excel.ts
import * as XLSX from 'xlsx';

export function exportToExcelWithHeaders(
  data: any[],
  headers: Record<string, string>,
  filename: string,
  sheetName: string
) {
  // 将数据映射为中文表头
  const excelData = data.map((item) => {
    const row: any = {};
    Object.keys(headers).forEach((key) => {
      row[headers[key]] = item[key];
    });
    return row;
  });

  // 创建工作表
  const ws = XLSX.utils.json_to_sheet(excelData);

  // 设置列宽
  const colWidths = Object.keys(headers).map(() => ({ wch: 15 }));
  ws['!cols'] = colWidths;

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // 导出文件
  XLSX.writeFile(wb, filename);
}
```

### 6.4 详情模态框组件 ⭐新增

**设计理念**: 使用模态框代替页面跳转,提供更流畅的用户体验

**InboundDetailModal.tsx / OutboundDetailModal.tsx**:
```typescript
// 核心特性:
// 1. 垂直卡片布局 - 基本信息和明细表格上下排列
// 2. 滚动容器 - maxHeight: 70vh，内容过多时可滚动
// 3. 状态感知按钮 - 根据订单状态显示/隐藏操作按钮
// 4. 集成附件管理 - "查看附件"按钮打开AttachmentViewer

<Modal
  title={`入库单详情 - ${order.orderNo}`}
  open={visible}
  onCancel={onCancel}
  width={1400}
  style={{ top: 20 }}
  footer={[
    <Button key="attachment" onClick={() => setAttachmentViewerVisible(true)}>
      查看附件
    </Button>,
    order.status === 'pending' && <Button key="edit">编辑</Button>,
    order.status === 'pending' && <Button key="confirm">确认入库</Button>,
    order.status === 'completed' && <Button key="reverse">反审核</Button>,
    <Button key="close" onClick={onCancel}>关闭</Button>,
  ]}
>
  <Spin spinning={loading}>
    <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
      {/* 基本信息卡片 */}
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={3} size="small">
          {/* 订单字段... */}
        </Descriptions>
      </Card>

      {/* 明细表格卡片 */}
      <Card title={`入库明细 (${order.items?.length || 0}条)`} size="small">
        <Table
          columns={columns}
          dataSource={order.items}
          pagination={false}
          scroll={{ x: 1500, y: 350 }}
          size="small"
        />
      </Card>
    </div>
  </Spin>
</Modal>
```

**使用方式**:
```typescript
// 在列表页中
const [detailVisible, setDetailVisible] = useState(false);
const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

// 表格操作列
<Button onClick={() => {
  setSelectedOrderId(record.id);
  setDetailVisible(true);
}}>
  详情
</Button>

// 渲染模态框
<InboundDetailModal
  visible={detailVisible}
  orderId={selectedOrderId}
  onCancel={() => setDetailVisible(false)}
  onEdit={(id) => navigate(`/inbound/edit/${id}`)}
  onReload={loadData}
/>
```

### 6.5 附件管理组件 ⭐新增

**AttachmentViewer.tsx** - 全功能附件管理器:

```typescript
// 核心功能:
// - 左侧过滤栏: 分类筛选 + 订单信息展示
// - 右侧网格布局: 附件缩略图列表
// - 多选功能: 支持全选/单选
// - 批量操作: 批量下载/分享/删除
// - 单个操作: 查看/下载/分享/删除（悬停显示）

interface AttachmentViewerProps {
  visible: boolean;
  onCancel: () => void;
  entityType: string;        // 'inbound' | 'outbound' | 'inventory' | 'customer'
  entityId: number;
  title?: string;
  // 可选的左侧展示字段
  orderNo?: string;
  warehouseEntryNo?: string;
  vehicleNumber?: string;
  // ...其他订单信息
}

// 布局结构:
<Modal width={1400}>
  <div style={{ display: 'flex', gap: 16 }}>
    {/* 左侧过滤栏 */}
    <div style={{ width: 250 }}>
      <Select placeholder="选择分类" onChange={handleCategoryFilter}>
        <Option value="">全部</Option>
        <Option value="image">图片</Option>
        <Option value="document">文档</Option>
        <Option value="contract">合同</Option>
      </Select>
      {/* 订单信息展示 */}
      <Descriptions column={1} size="small">
        <Item label="单号">{orderNo}</Item>
        {/* ...其他字段 */}
      </Descriptions>
    </div>

    {/* 右侧附件列表 */}
    <div style={{ flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {attachments.map(att => (
          <Card
            hoverable
            cover={<Image src={att.storageUrl} />}
            actions={[
              <EyeOutlined onClick={() => handleView(att)} />,
              <DownloadOutlined onClick={() => handleDownload(att)} />,
              <ShareAltOutlined onClick={() => handleShare(att)} />,
              <DeleteOutlined onClick={() => handleDelete(att)} />,
            ]}
          >
            <Checkbox checked={selected.includes(att.id)} />
            <Text ellipsis>{att.fileName}</Text>
          </Card>
        ))}
      </div>

      {/* 底部工具栏 */}
      <div style={{ marginTop: 16 }}>
        <Space>
          <Checkbox onChange={handleSelectAll}>全选</Checkbox>
          <Button onClick={handleBatchDownload}>
            {selectedAttachments.length > 0
              ? `下载选中(${selectedAttachments.length})`
              : '下载全部'}
          </Button>
          <Button onClick={handleBatchShare}>分享选中</Button>
          <Button danger onClick={handleBatchDelete}>删除选中</Button>
        </Space>
      </div>
    </div>
  </div>
</Modal>
```

**AttachmentUploader.tsx** - 文件上传器:

```typescript
// 特性:
// - 拖拽上传支持
// - 多文件同时上传
// - 分类选择(必填)
// - 实时进度显示
// - 图片预览
// - 二次确认机制

interface AttachmentUploaderProps {
  visible: boolean;
  onCancel: () => void;
  entityType: string;
  entityId: number;
  onUploadComplete: () => void;
}

// 关键实现 - 使用环境变量配置API URL:
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const xhr = new XMLHttpRequest();
xhr.open('POST', `${apiBaseUrl}/attachments/upload`);

// 上传进度跟踪:
xhr.upload.onprogress = (e) => {
  if (e.lengthComputable) {
    const percent = Math.round((e.loaded * 100) / e.total);
    setUploadProgress(prev => ({
      ...prev,
      [file.uid]: percent
    }));
  }
};

// 表单数据构建:
const formData = new FormData();
files.forEach(file => formData.append('files', file.originFileObj));
formData.append('entityType', entityType);
formData.append('entityId', entityId.toString());
formData.append('category', selectedCategory);
```

### 6.6 环境变量配置 ⭐重要

**开发环境** (.env):
```env
VITE_API_BASE_URL=/api
```

**生产环境** (.env.production):
```env
VITE_API_BASE_URL=https://wmsapi.fexxo.cn/api
```

**Vite配置** (vite.config.ts):
```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

### 6.4 路由配置

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="inbound" element={<InboundList />} />
          <Route path="inbound/create" element={<InboundForm />} />
          <Route path="inbound/edit/:id" element={<InboundEdit />} />
          <Route path="inbound/:id" element={<InboundDetail />} />
          <Route path="outbound" element={<OutboundList />} />
          <Route path="inventory" element={<InventoryList />} />
          <Route path="logs/inbound" element={<InboundLogList />} />
          <Route path="logs/outbound" element={<OutboundLogList />} />
          <Route path="logs/inventory" element={<InventoryLogList />} />
          {/* 其他路由... */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

## 七、后端核心实现

### 7.1 辅助函数

```typescript
// utils/helpers.ts

// 生成订单号
export function generateOrderNo(prefix: 'WI' | 'WO', date: Date, sequence: number): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(sequence).padStart(4, '0');
  return `${prefix}${dateStr}${seq}`;
}

// 计算体积
export function calculateVolume(length?: number, width?: number, height?: number): number | null {
  if (!length || !width || !height) return null;
  return (length * width * height) / 1000000; // 转换为m³
}

// 计算总毛重
export function calculateTotalWeight(quantity: number, unitWeight?: number): number | null {
  if (!unitWeight) return null;
  return quantity * unitWeight;
}
```

### 7.2 确认入库实现

```typescript
// controllers/inbound.controller.ts

export async function confirmInboundOrder(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '入库单不存在' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: '入库单已确认' });
    }

    // 使用事务
    await prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.inboundOrder.update({
        where: { id: Number(id) },
        data: { status: 'completed' },
      });

      // 更新库存
      for (const item of order.items) {
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
              // 更新其他字段...
            },
          });
        } else {
          // 创建新库存记录
          await tx.inventory.create({
            data: {
              customerId: order.customerId,
              customerName: order.customerName,
              sku: item.sku || '',
              productName: item.productName,
              quantity: item.quantity,
              availableQuantity: item.quantity,
              lastInboundDate: new Date(),
              warehouseEntryNo: order.warehouseEntryNo || order.orderNo,
              // 其他字段...
            },
          });
        }
      }
    });

    res.json({ success: true, message: '确认入库成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
```

### 7.3 确认出库实现

```typescript
// controllers/outbound.controller.ts

export async function confirmOutboundOrder(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const order = await prisma.outboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!order || order.status === 'completed') {
      return res.status(400).json({ success: false, message: '订单状态异常' });
    }

    // 重新检查库存
    for (const item of order.items) {
      const inventory = await prisma.inventory.findFirst({
        where: {
          customerId: order.customerId,
          warehouseEntryNo: item.warehouseEntryNo,
        },
      });

      if (!inventory || inventory.availableQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${item.productName} 库存不足`,
        });
      }
    }

    // 使用事务扣减库存
    await prisma.$transaction(async (tx) => {
      await tx.outboundOrder.update({
        where: { id: Number(id) },
        data: { status: 'completed' },
      });

      for (const item of order.items) {
        const inventory = await tx.inventory.findFirst({
          where: {
            customerId: order.customerId,
            warehouseEntryNo: item.warehouseEntryNo,
          },
        });

        if (inventory) {
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: inventory.quantity - item.quantity,
              availableQuantity: inventory.availableQuantity - item.quantity,
              lastOutboundDate: new Date(),
            },
          });
        }
      }
    });

    res.json({ success: true, message: '确认出库成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
```

### 7.4 附件服务实现 ⭐新增

**存储适配器架构** - 支持多种存储后端:

```typescript
// services/storage/types.ts
export interface StorageAdapter {
  upload(file: UploadFileInfo, path?: string, category?: string): Promise<UploadResult>;
  delete(storagePath: string): Promise<void>;
  getUrl(storagePath: string, expiresIn?: number): Promise<string>;
}

export type StorageType = 'local' | 's3' | 'qiniu' | 'aliyun' | 'tencent';
```

**本地存储适配器 - 文件自动重命名**:

```typescript
// services/storage/local.adapter.ts
export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir = path.join(process.cwd(), 'uploads');
  private baseUrl = process.env.BASE_URL || 'http://localhost:3001';

  // 生成文件名: {category}_{timestamp}_{random}.{ext}
  private generateFileName(originalName: string, category?: string): string {
    const ext = path.extname(originalName);
    const prefix = category || 'file';

    // 时间戳: YYYYMMDDHHmmss
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dateTime = `${year}${month}${day}${hours}${minutes}${seconds}`;

    // 6位随机数
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    // 组合: {category}_{timestamp}_{random}.{ext}
    return `${prefix}_${dateTime}_${random}${ext}`;
  }

  async upload(file: UploadFileInfo, subPath?: string, category?: string): Promise<UploadResult> {
    const fileName = this.generateFileName(file.originalname, category);

    let fullPath = this.uploadDir;
    if (subPath) {
      fullPath = path.join(this.uploadDir, subPath);
      await fs.mkdir(fullPath, { recursive: true });
    }

    const filePath = path.join(fullPath, fileName);
    const relativePath = subPath ? path.join(subPath, fileName) : fileName;

    await fs.writeFile(filePath, file.buffer);

    return {
      fileName: fileName,  // 使用生成的新文件名而不是原始文件名
      fileSize: file.size,
      mimeType: file.mimetype,
      storageType: 'local',
      storagePath: relativePath,
      storageUrl: `${this.baseUrl}/${relativePath.replace(/\\/g, '/')}`,
    };
  }

  async delete(storagePath: string): Promise<void> {
    const filePath = path.join(this.uploadDir, storagePath);
    await fs.unlink(filePath);
  }

  async getUrl(storagePath: string): Promise<string> {
    return `${this.baseUrl}/${storagePath.replace(/\\/g, '/')}`;
  }
}
```

**存储工厂 - 动态选择存储后端**:

```typescript
// services/storage/factory.ts
export class StorageFactory {
  static getAdapter(type?: StorageType): StorageAdapter {
    const storageType = type || this.getDefaultType();

    switch (storageType) {
      case 'local':
        return new LocalStorageAdapter();
      case 's3':
        return new S3StorageAdapter();
      case 'qiniu':
        return new QiniuStorageAdapter();
      // ... 其他适配器
      default:
        return new LocalStorageAdapter();
    }
  }

  static getDefaultType(): StorageType {
    return (process.env.DEFAULT_STORAGE_TYPE as StorageType) || 'local';
  }
}
```

**附件服务层 - 域名配置支持**:

```typescript
// services/attachment.service.ts
export const attachmentService = {
  async create(data: CreateAttachmentDTO) {
    const { file, entityType, entityId, category } = data;

    // 获取存储适配器
    const adapter = StorageFactory.getAdapter(data.storageType);
    const type = data.storageType || StorageFactory.getDefaultType();

    // 上传文件到存储（传递分类用于文件命名）
    const uploadResult = await adapter.upload(file, entityType, category);

    // 获取系统域名配置
    const systemDomain = await getSystemDomain();

    // 对于本地存储，使用配置的域名替换硬编码的 localhost
    let finalStorageUrl = uploadResult.storageUrl;
    if (type === 'local' && systemDomain) {
      const parts = uploadResult.storageUrl.split('/uploads/');
      if (parts.length > 1) {
        finalStorageUrl = `${systemDomain}/uploads/${parts[1]}`;
      }
    }

    // 创建数据库记录
    const attachment = await prisma.attachment.create({
      data: {
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        storageType: type,
        storagePath: uploadResult.storagePath,
        storageUrl: finalStorageUrl,
        entityType,
        entityId,
        category: category || 'default',
        uploadedBy: data.uploadedBy,
        uploadedByName: data.uploadedByName,
      },
    });

    return attachment;
  },

  async generateShareLink(id: number, expiresInDays: number = 7) {
    const crypto = require('crypto');
    const shareToken = crypto.randomBytes(32).toString('hex');

    const shareExpireAt = new Date();
    shareExpireAt.setDate(shareExpireAt.getDate() + expiresInDays);

    await prisma.attachment.update({
      where: { id },
      data: { isShared: true, shareToken, shareExpireAt },
    });

    return {
      shareToken,
      shareUrl: `/api/attachments/shared/${shareToken}`,
      expiresAt: shareExpireAt,
    };
  },

  // ... 其他方法: list, getById, delete, deleteBatch, createZipArchive
};
```

**临时文件清理服务**:

```typescript
// services/tempFileCleanup.service.ts
export class TempFileCleanupService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // 6小时
  private readonly FILE_MAX_AGE = 24 * 60 * 60 * 1000;    // 24小时

  start() {
    console.log('临时文件清理服务已启动（每6小时清理一次）');
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);

    // 立即执行一次清理
    this.cleanup();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('临时文件清理服务已停止');
    }
  }

  private async cleanup() {
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    const now = Date.now();

    try {
      const files = await fs.readdir(tempDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        // 删除超过24小时的文件
        if (now - stats.mtimeMs > this.FILE_MAX_AGE) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`临时文件清理完成，删除 ${deletedCount} 个文件`);
      }
    } catch (error) {
      console.error('临时文件清理失败:', error);
    }
  }
}

// 在 app.ts 中启动服务
const tempFileCleanup = new TempFileCleanupService();
tempFileCleanup.start();

// 优雅关闭
process.on('SIGTERM', () => {
  tempFileCleanup.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  tempFileCleanup.stop();
  process.exit(0);
});
```

## 八、仪表盘统计（新增功能）

### 统计指标
```
基础统计：
- 今日入库单数
- 今日出库单数
- 库存SKU总数
- 客户总数

待处理数据：
- 待处理入库单数
- 待处理出库单数

库存汇总：
- 库存总件数
- 库存总体积

趋势数据：
- 近7日入库/出库趋势图

最近操作：
- 最近5条入库记录
- 最近5条出库记录

客户统计：
- 客户库存排名TOP5（按体积）

库存预警：
- 库存量 < 10 的商品列表
```

## 九、日志管理（新增功能）

### 9.1 入库日志
```
基于入库单明细表查询
显示字段：
- 入库日期、入库单号、进仓编号
- 客户名称、业务类型
- 货名、型号、SKU、编号
- 唛头、PO号、库位、包装形式
- 件数、长宽高、体积、重量
- 状态、创建时间、备注

筛选条件：
- 客户名称
- 入库单号
- 进仓编号
- 日期范围

支持导出Excel
```

### 9.2 出库日志
```
基于出库单明细表查询
额外显示：
- 收货单位、收货地址
- 车牌号、司机
- 联系人、联系电话

支持同样的筛选和导出功能
```

### 9.3 库存日志
```
综合查询入库和出库记录
显示：
- 操作时间、操作类型（入库/出库）
- 单号、客户、业务类型
- 进仓编号、货名、型号、SKU
- 库位、数量变更（+增加/-减少）
- 状态

支持按操作类型筛选（全部/入库/出库）
```

## 十、关键技术要点

### 10.1 数据一致性
```
1. 使用Prisma事务确保原子性
2. 出入库必须通过确认操作才更新库存
3. 反审核时检查依赖关系
4. 编辑和删除仅限pending状态
```

### 10.2 库存追溯
```
通过 warehouseEntryNo（进仓编号）实现：
- 每批入库货物有唯一编号
- 出库时记录对应的进仓编号
- 可以追溯货物来源和流向
- 支持按批次管理库存
```

### 10.3 性能优化
```
1. 数据库索引优化
   - orderNo唯一索引
   - customerId索引
   - 组合索引：(customerId, sku, locationCode)

2. 查询优化
   - 使用Prisma的include精确控制关联查询
   - 分页查询避免大数据集
   - 并行查询使用Promise.all

3. 前端优化
   - Vite构建优化
   - 按需加载Ant Design组件
   - Axios请求拦截统一处理
```

### 10.4 安全措施
```
1. JWT认证
   - Token存储在localStorage
   - 请求拦截器自动添加Authorization头
   - Token过期自动跳转登录

2. 权限控制
   - 路由守卫保护私有页面
   - 后端中间件验证Token
   - 按角色控制功能访问

3. 数据验证
   - 前端表单验证（Ant Design Form）
   - 后端参数验证
   - Prisma Schema类型约束
```

## 十一、部署和运行

### 11.1 开发环境
```bash
# 后端
cd wms-backend
npm run dev          # 启动开发服务器（端口3001）
npm run prisma:generate  # 生成Prisma Client
npm run prisma:migrate   # 运行数据库迁移
npm run prisma:studio    # 打开Prisma Studio

# 前端
cd wms-frontend
npm run dev          # 启动开发服务器（端口3000）
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
```

### 11.2 环境变量
```env
# wms-backend/.env
DATABASE_URL="mysql://user:password@localhost:3306/wms"
JWT_SECRET="your-secret-key"
PORT=3001
NODE_ENV=development
```

```env
# wms-frontend/.env
VITE_API_BASE_URL=/api
```

### 11.3 Vite代理配置
```typescript
// wms-frontend/vite.config.ts
export default defineConfig({
  server: {
    host: '0.0.0.0',  // 允许外部访问
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

## 十二、常见问题和解决方案

### 12.1 TypeScript类型错误
```
问题：Prisma查询返回null但TypeScript期望undefined
解决：使用 || undefined 转换 null 为 undefined
```

### 12.2 库存扣减并发问题
```
问题：多个出库单同时确认可能导致超卖
解决：使用数据库事务和乐观锁
```

### 12.3 进仓编号为空
```
问题：早期入库单没有warehouseEntryNo
解决：使用 warehouseEntryNo || orderNo 作为备用值
```

### 12.4 日期时区问题
```
问题：前后端日期格式不一致
解决：统一使用ISO 8601格式，前端用Day.js处理
```

## 十三、未来扩展方向

```
1. 打印功能
   - 入库单打印
   - 出库单打印
   - 标签打印

2. 高级报表
   - 库存报表
   - 出入库报表
   - 客户对账单

3. 移动端
   - 响应式设计优化
   - 移动端专用页面

4. 权限细化
   - 细粒度权限控制
   - 数据权限隔离

5. 集成功能
   - Excel批量导入
   - 条码扫描
   - 电子签名
   - 消息通知
```

---

**文档版本**: v2.1
**更新日期**: 2025-11-28
**系统状态**: 生产运行中
**主要更新**: 附件系统优化、详情模态框重构、生产部署配置完善
**维护者**: Claude AI Assistant
