# WMS 移动端开发指南

> 版本：1.0.0
> 创建日期：2025-12-02
> 最后更新：2025-12-02

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术选型](#2-技术选型)
3. [开发环境搭建](#3-开发环境搭建)
4. [项目结构规划](#4-项目结构规划)
5. [功能模块详解](#5-功能模块详解)
6. [API 对接规范](#6-api-对接规范)
7. [页面设计与交互](#7-页面设计与交互)
8. [后端需要新增/修改的内容](#8-后端需要新增修改的内容)
9. [开发步骤与里程碑](#9-开发步骤与里程碑)
10. [测试方案](#10-测试方案)
11. [部署指南](#11-部署指南)
12. [附录](#附录)

---

## 1. 项目概述

### 1.1 项目背景

WMS (Warehouse Management System) 是一套完整的仓库管理系统，目前已有 PC Web 端。为满足仓库现场作业需求，需要开发移动端应用，实现：

- **现场作业**：仓库人员可在现场通过手机处理入库/出库任务
- **实时同步**：PC端创建的订单实时同步到移动端待办列表
- **拍照取证**：支持现场拍照上传作为入库/出库凭证
- **快速确认**：简化操作流程，一键确认入库/出库

### 1.2 目标用户

- 仓库管理员
- 仓库操作员
- 现场调度人员

### 1.3 核心功能清单

| 功能模块 | 功能点 | 优先级 |
|---------|--------|-------|
| 用户认证 | 登录/登出/Token刷新 | P0 |
| 首页仪表板 | 待办数量统计/快捷入口 | P0 |
| 待办中心 | 待入库/待出库列表 | P0 |
| 入库确认 | 查看详情/编辑明细/输入库位/拍照上传/确认入库 | P0 |
| 出库确认 | 查看详情/确认出库/拍照上传 | P0 |
| 附件管理 | 拍照上传/相册选择/查看附件 | P0 |
| 库存查询 | 按条件搜索库存/查看库存详情 | P1 |
| 扫码功能 | 扫描条码快速查找订单/库存 | P1 |
| 个人中心 | 个人信息/修改密码/退出登录 | P1 |
| 消息通知 | 新订单推送/操作结果通知 | P2 |

### 1.4 与 PC 端功能对比

| 功能 | PC端 | 移动端 | 说明 |
|------|------|--------|------|
| 创建入库单 | ✅ | ❌ | 仅PC端创建，移动端确认 |
| 创建出库单 | ✅ | ❌ | 仅PC端创建，移动端确认 |
| 确认入库 | ✅ | ✅ | 两端都可操作 |
| 确认出库 | ✅ | ✅ | 两端都可操作 |
| 编辑订单明细 | ✅ | ✅（部分） | 移动端仅编辑库位、实到数量 |
| 附件上传 | ✅ | ✅ | 移动端增加拍照功能 |
| 库存管理 | ✅ | ✅（只读） | 移动端仅查询 |
| 客户管理 | ✅ | ❌ | 仅PC端 |
| 系统设置 | ✅ | ❌ | 仅PC端 |
| 日志查看 | ✅ | ❌ | 仅PC端 |

---

## 2. 技术选型

### 2.1 开发框架

**推荐方案：uni-app + Vue3 + TypeScript**

| 技术 | 版本 | 说明 |
|------|------|------|
| uni-app | ^3.0 | 跨平台框架，一套代码多端运行 |
| Vue | 3.x | 前端框架 |
| TypeScript | 5.x | 类型安全 |
| Pinia | 2.x | 状态管理 |
| uni-ui | latest | UI组件库（官方） |

**选择理由：**
1. 一套代码可编译为：H5网页、微信小程序、Android App、iOS App
2. 与现有 PC 端（Vue3）技术栈一致，降低学习成本
3. 丰富的组件生态，适合快速开发
4. 支持原生能力调用（相机、相册等）

### 2.2 备选方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| uni-app | 跨平台、生态丰富 | 性能略低于原生 | ⭐⭐⭐⭐⭐ |
| React Native | 性能好、社区活跃 | 需要独立开发 | ⭐⭐⭐⭐ |
| Flutter | 性能最佳、UI一致 | 学习成本高 | ⭐⭐⭐ |
| 纯H5 | 开发快、无需安装 | 无原生能力 | ⭐⭐ |

### 2.3 开发工具

- **IDE**: HBuilderX (推荐) 或 VS Code + uni-app 插件
- **调试**: Chrome DevTools (H5) / 微信开发者工具 (小程序)
- **版本控制**: Git
- **API测试**: Postman / Apifox

---

## 3. 开发环境搭建

### 3.1 前置条件

```bash
# Node.js 版本要求
node -v  # >= 16.x

# 安装 HBuilderX（推荐）
# 下载地址：https://www.dcloud.io/hbuilderx.html

# 或使用 VS Code + CLI
npm install -g @dcloudio/uni-cli
```

### 3.2 创建项目

```bash
# 在 wms 根目录下创建移动端项目
cd /www/wwwroot/wms

# 使用 CLI 创建（Vue3 + TypeScript 模板）
npx degit dcloudio/uni-preset-vue#vite-ts wms-mobile

# 进入项目目录
cd wms-mobile

# 安装依赖
npm install

# 安装额外依赖
npm install pinia dayjs
npm install -D @types/node sass
```

### 3.3 配置文件

**manifest.json** - 应用配置
```json
{
  "name": "WMS仓储助手",
  "appid": "__UNI__XXXXXX",
  "description": "WMS仓库管理系统移动端",
  "versionName": "1.0.0",
  "versionCode": 100,
  "transformPx": false,
  "h5": {
    "router": {
      "mode": "hash"
    },
    "devServer": {
      "proxy": {
        "/api": {
          "target": "https://wmsapi.fexxo.cn",
          "changeOrigin": true
        }
      }
    }
  },
  "mp-weixin": {
    "appid": "wx_your_appid",
    "setting": {
      "urlCheck": false
    }
  },
  "app-plus": {
    "distribute": {
      "android": {
        "permissions": [
          "<uses-permission android:name=\"android.permission.CAMERA\"/>",
          "<uses-permission android:name=\"android.permission.READ_EXTERNAL_STORAGE\"/>"
        ]
      }
    }
  }
}
```

**vite.config.ts** - Vite 配置
```typescript
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://wmsapi.fexxo.cn',
        changeOrigin: true
      }
    }
  }
})
```

### 3.4 环境变量配置

**.env.development**
```env
VITE_API_BASE_URL=/api
VITE_APP_TITLE=WMS仓储助手
```

**.env.production**
```env
VITE_API_BASE_URL=https://wmsapi.fexxo.cn/api
VITE_APP_TITLE=WMS仓储助手
```

---

## 4. 项目结构规划

```
wms-mobile/
├── src/
│   ├── api/                      # API 接口封装
│   │   ├── request.ts            # 请求封装（拦截器、错误处理）
│   │   ├── auth.ts               # 认证相关 API
│   │   ├── todo.ts               # 待办相关 API
│   │   ├── inbound.ts            # 入库相关 API
│   │   ├── outbound.ts           # 出库相关 API
│   │   ├── inventory.ts          # 库存相关 API
│   │   └── attachment.ts         # 附件相关 API
│   │
│   ├── components/               # 公共组件
│   │   ├── NavBar.vue            # 自定义导航栏
│   │   ├── TabBar.vue            # 自定义底部导航
│   │   ├── OrderCard.vue         # 订单卡片组件
│   │   ├── ItemList.vue          # 订单明细列表
│   │   ├── AttachmentGrid.vue    # 附件网格展示
│   │   ├── ImagePicker.vue       # 图片选择器（相册+拍照）
│   │   ├── SearchBar.vue         # 搜索栏
│   │   ├── EmptyState.vue        # 空状态占位
│   │   ├── LoadingState.vue      # 加载状态
│   │   └── ConfirmDialog.vue     # 确认弹窗
│   │
│   ├── pages/                    # 页面
│   │   ├── login/                # 登录模块
│   │   │   └── index.vue
│   │   │
│   │   ├── home/                 # 首页（仪表板）
│   │   │   └── index.vue
│   │   │
│   │   ├── todo/                 # 待办中心
│   │   │   ├── index.vue         # 待办列表
│   │   │   ├── inbound-detail.vue  # 入库单详情弹窗/页面
│   │   │   └── outbound-detail.vue # 出库单详情弹窗/页面
│   │   │
│   │   ├── inventory/            # 库存查询
│   │   │   ├── index.vue         # 库存列表
│   │   │   └── detail.vue        # 库存详情
│   │   │
│   │   ├── scan/                 # 扫码功能
│   │   │   └── index.vue
│   │   │
│   │   └── profile/              # 个人中心
│   │       ├── index.vue
│   │       └── change-password.vue
│   │
│   ├── stores/                   # Pinia 状态管理
│   │   ├── index.ts              # Store 入口
│   │   ├── user.ts               # 用户状态
│   │   ├── todo.ts               # 待办状态
│   │   └── app.ts                # 应用全局状态
│   │
│   ├── types/                    # TypeScript 类型定义
│   │   ├── index.ts              # 统一导出
│   │   ├── user.ts               # 用户相关类型
│   │   ├── order.ts              # 订单相关类型
│   │   ├── inventory.ts          # 库存相关类型
│   │   └── attachment.ts         # 附件相关类型
│   │
│   ├── utils/                    # 工具函数
│   │   ├── storage.ts            # 本地存储封装
│   │   ├── format.ts             # 格式化工具
│   │   ├── validate.ts           # 表单验证
│   │   └── permission.ts         # 权限检查
│   │
│   ├── styles/                   # 全局样式
│   │   ├── variables.scss        # SCSS 变量
│   │   ├── mixins.scss           # SCSS 混入
│   │   └── global.scss           # 全局样式
│   │
│   ├── static/                   # 静态资源
│   │   ├── images/               # 图片资源
│   │   └── icons/                # 图标资源
│   │
│   ├── App.vue                   # 应用入口组件
│   ├── main.ts                   # 应用入口
│   ├── pages.json                # 页面路由配置
│   ├── manifest.json             # 应用配置
│   └── uni.scss                  # uni-app 全局样式变量
│
├── .env.development              # 开发环境变量
├── .env.production               # 生产环境变量
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 5. 功能模块详解

### 5.1 用户认证模块

#### 5.1.1 功能描述

- 用户登录（用户名 + 密码 + 验证码）
- Token 存储与自动刷新
- 登出清理

#### 5.1.2 技术实现

```typescript
// src/api/auth.ts
import { request } from './request'

// 获取验证码
export function getCaptcha() {
  return request.get('/auth/captcha')
}

// 登录
export function login(data: {
  username: string
  password: string
  captchaId: string
  captchaCode: string
}) {
  return request.post('/auth/login', data)
}

// 获取当前用户信息
export function getCurrentUser() {
  return request.get('/auth/me')
}

// 登出
export function logout() {
  return request.post('/auth/logout')
}
```

#### 5.1.3 页面设计

**登录页 `/pages/login/index.vue`**

```
┌─────────────────────────────────┐
│                                 │
│           [Logo]                │
│       WMS 仓储助手              │
│                                 │
│  ┌─────────────────────────┐   │
│  │  👤 用户名               │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  🔒 密码                 │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌───────────────┐  ┌──────┐   │
│  │  验证码        │  │ 图片 │   │
│  └───────────────┘  └──────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │         登 录           │   │
│  └─────────────────────────┘   │
│                                 │
│       v1.0.0 | 记住密码 □       │
└─────────────────────────────────┘
```

### 5.2 首页仪表板模块

#### 5.2.1 功能描述

- 展示待办数量（待入库/待出库）
- 快捷入口（待办、库存查询、扫码）
- 今日统计概览

#### 5.2.2 API 调用

```typescript
// 获取待办数量
GET /api/todo/count

// 响应
{
  "success": true,
  "data": {
    "inbound": 5,   // 待入库数量
    "outbound": 3,  // 待出库数量
    "total": 8      // 总待办数量
  }
}

// 获取仪表板统计
GET /api/dashboard/stats

// 响应
{
  "success": true,
  "data": {
    "todayInbound": 12,
    "todayOutbound": 8,
    "totalSku": 156,
    "totalCustomer": 25
  }
}
```

#### 5.2.3 页面设计

**首页 `/pages/home/index.vue`**

```
┌─────────────────────────────────┐
│  WMS 仓储助手        👤 admin   │
├─────────────────────────────────┤
│                                 │
│  ┌─────────┐  ┌─────────┐      │
│  │  待入库  │  │  待出库  │      │
│  │    5    │  │    3    │      │
│  │   单    │  │   单    │      │
│  └─────────┘  └─────────┘      │
│                                 │
│  ── 快捷操作 ──────────────────  │
│                                 │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐│
│  │待办│  │库存│  │扫码│  │更多││
│  └────┘  └────┘  └────┘  └────┘│
│                                 │
│  ── 今日概览 ──────────────────  │
│                                 │
│  今日入库: 12 单                │
│  今日出库: 8 单                 │
│  库存SKU: 156 种                │
│  客户数: 25 家                  │
│                                 │
├─────────────────────────────────┤
│  🏠首页   📋待办   📦库存   👤我的 │
└─────────────────────────────────┘
```

### 5.3 待办中心模块（核心功能）

#### 5.3.1 功能描述

这是移动端的**核心功能模块**，实现现场作业的关键流程：

1. **待办列表展示**
   - Tab切换：全部 / 待入库 / 待出库
   - 订单卡片展示关键信息
   - 下拉刷新 / 上拉加载
   - 搜索筛选

2. **入库单详情弹窗**
   - 查看订单基本信息
   - 查看/编辑明细列表
   - 输入库位（必填）
   - 输入实到件数
   - 上传附件（拍照/相册）
   - 二次确认后入库

3. **出库单详情弹窗**
   - 查看订单基本信息
   - 查看明细列表（只读）
   - 上传附件（拍照/相册）
   - 二次确认后出库

#### 5.3.2 API 调用

```typescript
// 获取待办列表
GET /api/todo/pending?type=inbound|outbound|all

// 响应
{
  "success": true,
  "data": {
    "inbounds": [
      {
        "id": 1,
        "orderNo": "WI202512020001",
        "warehouseEntryNo": "RK20251202001",
        "customerName": "客户A",
        "businessType": "normal",
        "inboundDate": "2025-12-02",
        "status": "pending",
        "totalQuantity": 100,
        "totalVolume": 5.5,
        "totalWeight": 200,
        "remark": "备注信息",
        "createdAt": "2025-12-02T10:00:00Z",
        "items": [...],
        "customer": {...},
        "creator": { "id": 1, "realName": "张三", "username": "admin" }
      }
    ],
    "outbounds": [...],
    "counts": { "inbound": 5, "outbound": 3, "total": 8 }
  }
}

// 获取入库单详情
GET /api/inbound/orders/:id

// 更新入库单明细（新增API，见后端修改）
PUT /api/todo/inbound/:id/items

// 移动端确认入库
POST /api/todo/inbound/:id/confirm
Body: {
  "source": "mobile",
  "attachmentIds": [1, 2, 3],  // 可选
  "remark": "现场备注"         // 可选
}

// 移动端确认出库
POST /api/todo/outbound/:id/confirm
Body: {
  "source": "mobile",
  "attachmentIds": [1, 2, 3],
  "remark": "现场备注"
}
```

#### 5.3.3 页面设计

**待办列表 `/pages/todo/index.vue`**

```
┌─────────────────────────────────┐
│  ←  待办中心          🔍 搜索   │
├─────────────────────────────────┤
│  [全部(8)] [待入库(5)] [待出库(3)]│
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ 📦 WI202512020001       │   │
│  │ 入库 | 客户A | 普通入库  │   │
│  │ 件数: 100 | 体积: 5.5m³ │   │
│  │ 创建: 张三 | 12-02 10:00 │   │
│  │               [处理 →]  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 📤 WO202512020002       │   │
│  │ 出库 | 客户B | 普通出库  │   │
│  │ 件数: 50 | 体积: 2.3m³  │   │
│  │ 创建: 李四 | 12-02 11:00 │   │
│  │               [处理 →]  │   │
│  └─────────────────────────┘   │
│                                 │
│  ... 更多订单 ...               │
│                                 │
├─────────────────────────────────┤
│  🏠首页   📋待办   📦库存   👤我的 │
└─────────────────────────────────┘
```

**入库单详情弹窗 `/pages/todo/inbound-detail.vue`**

```
┌─────────────────────────────────┐
│  ← 入库单详情                   │
├─────────────────────────────────┤
│                                 │
│  ── 基本信息 ──────────────────  │
│  订单号: WI202512020001         │
│  进仓编号: RK20251202001        │
│  客户: 客户A                    │
│  业务类型: 普通入库             │
│  入库日期: 2025-12-02           │
│  总件数: 100                    │
│  总体积: 5.5 m³                 │
│  总重量: 200 kg                 │
│  备注: 请注意轻拿轻放           │
│                                 │
│  ── 商品明细 (可编辑) ────────   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 1. 电子产品A             │   │
│  │    型号: MODEL-001       │   │
│  │    预计: 50件 | 实到:    │   │
│  │    ┌─────────────────┐   │   │
│  │    │      50        │   │   │
│  │    └─────────────────┘   │   │
│  │    库位: (必填)          │   │
│  │    ┌─────────────────┐   │   │
│  │    │  请输入或选择    │   │   │
│  │    └─────────────────┘   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 2. 电子产品B             │   │
│  │    型号: MODEL-002       │   │
│  │    预计: 50件 | 实到:    │   │
│  │    ┌─────────────────┐   │   │
│  │    │      50        │   │   │
│  │    └─────────────────┘   │   │
│  │    库位: (必填)          │   │
│  │    ┌─────────────────┐   │   │
│  │    │  A-01-02        │   │   │
│  │    └─────────────────┘   │   │
│  └─────────────────────────┘   │
│                                 │
│  ── 附件上传 ──────────────────  │
│                                 │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│  │ 📷 │ │ 🖼️ │ │ 🖼️ │ │ +  │  │
│  │拍照│ │img1│ │img2│ │添加│  │
│  └────┘ └────┘ └────┘ └────┘  │
│                                 │
│  ── 备注 ──────────────────────  │
│  ┌─────────────────────────┐   │
│  │ 输入现场备注...          │   │
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │      ✅ 确认入库         │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘

确认入库弹窗：
┌─────────────────────────────────┐
│           确认入库？             │
│                                 │
│  订单号: WI202512020001         │
│  总件数: 100 件                 │
│  已上传附件: 3 个               │
│                                 │
│  确认入库后，库存将自动更新。    │
│  此操作不可撤销。               │
│                                 │
│  ┌──────────┐  ┌──────────┐   │
│  │   取消   │  │   确认   │   │
│  └──────────┘  └──────────┘   │
└─────────────────────────────────┘
```

### 5.4 附件管理模块

#### 5.4.1 功能描述

- 拍照上传：调用系统相机拍照
- 相册选择：从手机相册选择图片
- 多图上传：支持批量选择
- 图片预览：点击放大查看
- 删除附件：长按删除

#### 5.4.2 API 调用

```typescript
// 上传附件
POST /api/attachments/upload
Content-Type: multipart/form-data
Body: {
  file: <binary>,
  entityType: "inbound",
  entityId: 1,
  category: "image"
}

// 批量上传
POST /api/attachments/upload-multiple
Content-Type: multipart/form-data
Body: {
  files: [<binary>, ...],
  entityType: "inbound",
  entityId: 1,
  category: "image"
}

// 获取实体附件列表
GET /api/attachments/entity/:entityType/:entityId

// 删除附件
DELETE /api/attachments/:id
```

#### 5.4.3 技术实现

```typescript
// src/components/ImagePicker.vue
<template>
  <view class="image-picker">
    <!-- 已选图片 -->
    <view
      v-for="(img, index) in images"
      :key="index"
      class="image-item"
      @longpress="handleDelete(index)"
    >
      <image :src="img.url" mode="aspectFill" @click="handlePreview(index)" />
      <view class="delete-btn" @click.stop="handleDelete(index)">×</view>
    </view>

    <!-- 添加按钮 -->
    <view v-if="images.length < maxCount" class="add-btn" @click="showActionSheet">
      <text class="icon">+</text>
      <text class="text">添加图片</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  maxCount?: number
  entityType: string
  entityId: number
}>()

const emit = defineEmits(['change', 'upload'])

const images = ref<Array<{ url: string; id?: number }>>([])

// 显示选择菜单
function showActionSheet() {
  uni.showActionSheet({
    itemList: ['拍照', '从相册选择'],
    success: (res) => {
      if (res.tapIndex === 0) {
        chooseImage('camera')
      } else {
        chooseImage('album')
      }
    }
  })
}

// 选择图片
function chooseImage(sourceType: 'camera' | 'album') {
  uni.chooseImage({
    count: props.maxCount ? props.maxCount - images.value.length : 9,
    sourceType: [sourceType],
    success: (res) => {
      // 上传图片
      res.tempFilePaths.forEach(path => {
        uploadImage(path)
      })
    }
  })
}

// 上传图片
async function uploadImage(filePath: string) {
  uni.showLoading({ title: '上传中...' })

  try {
    const res = await uni.uploadFile({
      url: `${import.meta.env.VITE_API_BASE_URL}/attachments/upload`,
      filePath,
      name: 'file',
      formData: {
        entityType: props.entityType,
        entityId: props.entityId,
        category: 'image'
      },
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`
      }
    })

    const data = JSON.parse(res.data)
    if (data.success) {
      images.value.push({
        url: data.data.storageUrl,
        id: data.data.id
      })
      emit('change', images.value)
      emit('upload', data.data)
    }
  } finally {
    uni.hideLoading()
  }
}

// 预览图片
function handlePreview(index: number) {
  uni.previewImage({
    current: index,
    urls: images.value.map(img => img.url)
  })
}

// 删除图片
function handleDelete(index: number) {
  uni.showModal({
    title: '提示',
    content: '确定删除这张图片吗？',
    success: (res) => {
      if (res.confirm) {
        images.value.splice(index, 1)
        emit('change', images.value)
      }
    }
  })
}
</script>
```

### 5.5 库存查询模块

#### 5.5.1 功能描述

- 搜索库存（按SKU、产品名称、客户等）
- 查看库存列表
- 查看库存详情
- 按库位筛选

#### 5.5.2 API 调用

```typescript
// 查询库存列表
GET /api/inventory?page=1&size=20&keyword=xxx&customerId=xxx

// 响应
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "size": 20
}

// 获取库存详情
GET /api/inventory/:id
```

#### 5.5.3 页面设计

**库存查询 `/pages/inventory/index.vue`**

```
┌─────────────────────────────────┐
│  ←  库存查询                    │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │  🔍 搜索产品名称/SKU     │   │
│  └─────────────────────────┘   │
│  [筛选: 全部客户 ▼] [库位 ▼]   │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ 电子产品A                │   │
│  │ SKU: SKU001 | 客户A     │   │
│  │ 库位: A-01-02           │   │
│  │ 库存: 100件 | 可用: 90件 │   │
│  │ 体积: 5.5m³ | 重量: 200kg│   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 电子产品B                │   │
│  │ SKU: SKU002 | 客户B     │   │
│  │ 库位: B-02-03           │   │
│  │ 库存: 50件 | 可用: 50件  │   │
│  │ 体积: 2.3m³ | 重量: 80kg │   │
│  └─────────────────────────┘   │
│                                 │
│  ... 加载更多 ...               │
│                                 │
├─────────────────────────────────┤
│  🏠首页   📋待办   📦库存   👤我的 │
└─────────────────────────────────┘
```

### 5.6 扫码功能模块

#### 5.6.1 功能描述

- 扫描条码/二维码
- 快速查找订单
- 快速查找库存
- 支持手动输入

#### 5.6.2 技术实现

```typescript
// src/pages/scan/index.vue
function handleScan() {
  uni.scanCode({
    scanType: ['barCode', 'qrCode'],
    success: (res) => {
      const code = res.result
      // 根据编码格式判断是订单还是库存
      if (code.startsWith('WI') || code.startsWith('WO')) {
        // 订单号，跳转到待办详情
        navigateToOrder(code)
      } else {
        // 可能是SKU，搜索库存
        searchInventory(code)
      }
    },
    fail: () => {
      uni.showToast({ title: '扫码失败', icon: 'none' })
    }
  })
}
```

### 5.7 个人中心模块

#### 5.7.1 功能描述

- 显示用户信息
- 修改密码
- 退出登录
- 应用设置（可选）

#### 5.7.2 页面设计

```
┌─────────────────────────────────┐
│  个人中心                       │
├─────────────────────────────────┤
│                                 │
│        ┌─────────┐             │
│        │  👤    │             │
│        └─────────┘             │
│          admin                  │
│       仓库管理员                │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │  👤 个人信息         →  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  🔒 修改密码         →  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ⚙️ 设置             →  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ❓ 帮助与反馈       →  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  📱 关于             →  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │       退出登录          │   │
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│  🏠首页   📋待办   📦库存   👤我的 │
└─────────────────────────────────┘
```

---

## 6. API 对接规范

### 6.1 请求封装

```typescript
// src/api/request.ts
import { useUserStore } from '@/stores/user'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  header?: Record<string, string>
  showLoading?: boolean
  showError?: boolean
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  total?: number
  page?: number
  size?: number
}

export function request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
  const userStore = useUserStore()

  return new Promise((resolve, reject) => {
    // 显示 loading
    if (config.showLoading !== false) {
      uni.showLoading({ title: '加载中...', mask: true })
    }

    uni.request({
      url: BASE_URL + config.url,
      method: config.method || 'GET',
      data: config.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': userStore.token ? `Bearer ${userStore.token}` : '',
        ...config.header
      },
      success: (res: any) => {
        const data = res.data as ApiResponse<T>

        if (res.statusCode === 401) {
          // Token 过期，跳转登录
          userStore.logout()
          uni.reLaunch({ url: '/pages/login/index' })
          reject(new Error('登录已过期，请重新登录'))
          return
        }

        if (!data.success) {
          if (config.showError !== false) {
            uni.showToast({ title: data.message || '请求失败', icon: 'none' })
          }
          reject(new Error(data.message))
          return
        }

        resolve(data)
      },
      fail: (err) => {
        if (config.showError !== false) {
          uni.showToast({ title: '网络错误，请重试', icon: 'none' })
        }
        reject(err)
      },
      complete: () => {
        if (config.showLoading !== false) {
          uni.hideLoading()
        }
      }
    })
  })
}

// 快捷方法
export const http = {
  get: <T>(url: string, data?: any, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'GET', data, ...config }),

  post: <T>(url: string, data?: any, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'POST', data, ...config }),

  put: <T>(url: string, data?: any, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'PUT', data, ...config }),

  delete: <T>(url: string, data?: any, config?: Partial<RequestConfig>) =>
    request<T>({ url, method: 'DELETE', data, ...config }),
}
```

### 6.2 API 模块示例

```typescript
// src/api/todo.ts
import { http } from './request'
import type { InboundOrder, OutboundOrder } from '@/types'

interface PendingOrdersResponse {
  inbounds: InboundOrder[]
  outbounds: OutboundOrder[]
  counts: {
    inbound: number
    outbound: number
    total: number
  }
}

interface PendingCountResponse {
  inbound: number
  outbound: number
  total: number
}

// 获取待办列表
export function getPendingOrders(type?: 'inbound' | 'outbound') {
  return http.get<PendingOrdersResponse>('/todo/pending', { type })
}

// 获取待办数量
export function getPendingCount() {
  return http.get<PendingCountResponse>('/todo/count')
}

// 更新入库单明细
export function updateInboundItems(
  orderId: number,
  items: Array<{
    id: number
    locationCode: string
    quantity: number
    remark?: string
  }>
) {
  return http.put(`/todo/inbound/${orderId}/items`, { items })
}

// 确认入库
export function confirmInbound(
  orderId: number,
  data?: {
    source?: string
    attachmentIds?: number[]
    remark?: string
  }
) {
  return http.post(`/todo/inbound/${orderId}/confirm`, {
    source: 'mobile',
    ...data
  })
}

// 确认出库
export function confirmOutbound(
  orderId: number,
  data?: {
    source?: string
    attachmentIds?: number[]
    remark?: string
  }
) {
  return http.post(`/todo/outbound/${orderId}/confirm`, {
    source: 'mobile',
    ...data
  })
}
```

### 6.3 现有 API 端点清单

以下是移动端需要对接的所有 API 端点：

| 模块 | 方法 | 端点 | 说明 |
|------|------|------|------|
| **认证** | POST | `/api/auth/login` | 登录 |
| | GET | `/api/auth/captcha` | 获取验证码 |
| | GET | `/api/auth/me` | 获取当前用户 |
| | POST | `/api/auth/logout` | 登出 |
| **待办** | GET | `/api/todo/pending` | 获取待办列表 |
| | GET | `/api/todo/count` | 获取待办数量 |
| | PUT | `/api/todo/inbound/:id/items` | 更新入库明细 ⚠️新增 |
| | POST | `/api/todo/inbound/:id/confirm` | 确认入库 |
| | POST | `/api/todo/outbound/:id/confirm` | 确认出库 |
| **入库** | GET | `/api/inbound/orders/:id` | 获取入库单详情 |
| **出库** | GET | `/api/outbound/orders/:id` | 获取出库单详情 |
| **库存** | GET | `/api/inventory` | 查询库存列表 |
| | GET | `/api/inventory/:id` | 获取库存详情 |
| **附件** | POST | `/api/attachments/upload` | 上传单个文件 |
| | POST | `/api/attachments/upload-multiple` | 批量上传 |
| | GET | `/api/attachments/entity/:type/:id` | 获取实体附件 |
| | DELETE | `/api/attachments/:id` | 删除附件 |
| **仪表板** | GET | `/api/dashboard/stats` | 获取统计数据 |
| **库位** | GET | `/api/locations` | 获取库位列表 |
| **用户** | PUT | `/api/users/:id/password` | 修改密码 |

---

## 7. 页面设计与交互

### 7.1 设计规范

#### 7.1.1 色彩规范

```scss
// src/styles/variables.scss

// 主题色
$primary-color: #1890ff;      // 主色调-蓝色
$success-color: #52c41a;      // 成功-绿色
$warning-color: #faad14;      // 警告-橙色
$error-color: #ff4d4f;        // 错误-红色

// 文字颜色
$text-primary: #333333;       // 主文字
$text-secondary: #666666;     // 次级文字
$text-placeholder: #999999;   // 占位文字
$text-disabled: #cccccc;      // 禁用文字

// 背景色
$bg-page: #f5f5f5;            // 页面背景
$bg-white: #ffffff;           // 卡片背景
$bg-gray: #fafafa;            // 灰色背景

// 边框色
$border-color: #e8e8e8;       // 边框颜色
$divider-color: #f0f0f0;      // 分割线颜色

// 状态色
$status-pending: #faad14;     // 待处理
$status-completed: #52c41a;   // 已完成
$status-inbound: #1890ff;     // 入库标签
$status-outbound: #722ed1;    // 出库标签
```

#### 7.1.2 字体规范

```scss
// 字体大小
$font-size-xs: 20rpx;         // 辅助文字
$font-size-sm: 24rpx;         // 小号文字
$font-size-base: 28rpx;       // 正文
$font-size-md: 32rpx;         // 标题
$font-size-lg: 36rpx;         // 大标题
$font-size-xl: 40rpx;         // 特大标题

// 行高
$line-height-tight: 1.2;
$line-height-base: 1.5;
$line-height-loose: 1.8;
```

#### 7.1.3 间距规范

```scss
// 间距
$spacing-xs: 8rpx;
$spacing-sm: 16rpx;
$spacing-md: 24rpx;
$spacing-lg: 32rpx;
$spacing-xl: 48rpx;

// 圆角
$border-radius-sm: 8rpx;
$border-radius-md: 12rpx;
$border-radius-lg: 16rpx;
$border-radius-round: 9999rpx;
```

### 7.2 交互规范

#### 7.2.1 操作反馈

| 操作类型 | 反馈方式 | 示例 |
|---------|---------|------|
| 点击按钮 | 短暂震动 + 状态变化 | 按钮变色 |
| 加载数据 | Loading 弹窗 | "加载中..." |
| 提交成功 | Toast 提示 | "✓ 入库成功" |
| 操作失败 | Toast 提示 | "✗ 操作失败：xxx" |
| 危险操作 | 二次确认弹窗 | "确认入库？" |
| 下拉刷新 | 下拉动画 + 文字 | "刷新成功" |

#### 7.2.2 手势操作

| 手势 | 功能 |
|------|------|
| 点击 | 触发操作 |
| 长按 | 删除图片/更多操作 |
| 下拉 | 刷新数据 |
| 上拉 | 加载更多 |
| 左滑 | 删除订单卡片（可选） |

### 7.3 关键交互流程

#### 7.3.1 入库确认流程

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  待办列表 ──点击订单──→ 入库详情弹窗                      │
│                           │                             │
│                           ↓                             │
│                    查看订单信息                          │
│                           │                             │
│                           ↓                             │
│               ┌──── 编辑明细 ────┐                      │
│               │                  │                      │
│               ↓                  ↓                      │
│          输入库位           输入实到数量                 │
│               │                  │                      │
│               └────────┬─────────┘                      │
│                        │                                │
│                        ↓                                │
│                   上传附件(可选)                         │
│                   - 拍照                                │
│                   - 从相册选择                          │
│                        │                                │
│                        ↓                                │
│                  点击"确认入库"                          │
│                        │                                │
│                        ↓                                │
│              ┌──────────────────┐                       │
│              │   二次确认弹窗   │                       │
│              │                  │                       │
│              │  确定要入库吗？  │                       │
│              │                  │                       │
│              │ [取消]  [确认]  │                        │
│              └──────────────────┘                       │
│                        │                                │
│                  确认  │                                │
│                        ↓                                │
│               调用确认入库API                           │
│                        │                                │
│                        ↓                                │
│                   入库成功                              │
│                        │                                │
│                        ↓                                │
│              返回待办列表(自动刷新)                      │
│              订单从列表中消失                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### 7.3.2 附件上传流程

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  点击"+"添加按钮                                         │
│         │                                               │
│         ↓                                               │
│  ┌─────────────────┐                                    │
│  │   选择方式      │                                    │
│  │                 │                                    │
│  │  [📷 拍照]      │                                    │
│  │  [🖼️ 从相册]    │                                    │
│  │  [取消]         │                                    │
│  └─────────────────┘                                    │
│         │                                               │
│    拍照 │ 相册                                          │
│         ↓                                               │
│  ┌─────────────────┐    ┌─────────────────┐            │
│  │   打开相机      │    │   打开相册      │            │
│  │   拍摄照片      │    │   选择图片      │            │
│  └─────────────────┘    └─────────────────┘            │
│         │                      │                        │
│         └──────────┬───────────┘                        │
│                    │                                    │
│                    ↓                                    │
│             上传图片到服务器                            │
│             显示上传进度                                │
│                    │                                    │
│                    ↓                                    │
│             上传完成，显示缩略图                        │
│             记录 attachmentId                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 8. 后端需要新增/修改的内容

### 8.1 新增 API 端点

#### 8.1.1 更新入库单明细（移动端专用）

**文件**: `wms-backend/src/routes/todo.routes.ts`

```typescript
// 新增路由
router.put('/inbound/:id/items', todoController.updateInboundItems);
```

**文件**: `wms-backend/src/controllers/todo.controller.ts`

```typescript
/**
 * 移动端更新入库单明细
 * 仅允许更新库位和实到数量
 */
export async function updateInboundItems(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { items } = req.body;
    const userId = req.userId!;
    const userName = req.username || '未知用户';

    // 验证订单存在且状态为 pending
    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '入库单不存在' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: '只能修改待处理的订单' });
    }

    // 验证 items 数据
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: '明细数据不能为空' });
    }

    // 更新明细
    const updatePromises = items.map(item => {
      return prisma.inboundOrderItem.update({
        where: { id: item.id },
        data: {
          locationCode: item.locationCode,
          quantity: item.quantity,
          remark: item.remark,
        },
      });
    });

    await prisma.$transaction(updatePromises);

    // 重新计算总数
    const updatedItems = await prisma.inboundOrderItem.findMany({
      where: { orderId: Number(id) },
    });

    const totalQuantity = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalVolume = updatedItems.reduce((sum, item) => sum + (item.volume || 0), 0);
    const totalWeight = updatedItems.reduce((sum, item) => sum + (item.totalGrossWeight || 0), 0);

    // 更新订单汇总
    await prisma.inboundOrder.update({
      where: { id: Number(id) },
      data: {
        totalQuantity,
        totalVolume,
        totalWeight,
      },
    });

    // 记录操作日志
    await createOperationLog({
      operatorId: userId,
      operatorName: userName,
      module: 'inbound',
      action: 'update',
      targetId: Number(id),
      targetNo: order.orderNo,
      description: `移动端更新入库单明细 ${order.orderNo}`,
      source: 'mobile',
    });

    res.json({ success: true, message: '明细更新成功' });
  } catch (error: any) {
    console.error('更新入库明细失败:', error);
    res.status(500).json({ success: false, message: error.message || '更新失败' });
  }
}
```

### 8.2 修改现有 API

#### 8.2.1 入库单详情增加更多字段

**文件**: `wms-backend/src/controllers/inbound.controller.ts`

确保 `getInboundOrderById` 返回完整的关联数据：

```typescript
// 确保 include 包含所有需要的字段
const order = await prisma.inboundOrder.findUnique({
  where: { id: Number(id) },
  include: {
    customer: true,
    items: true,
    creator: { select: { id: true, realName: true, username: true } },
    // 新增：确认人信息
    confirmer: { select: { id: true, realName: true, username: true } },
  },
});
```

### 8.3 数据库变更

#### 8.3.1 确认来源字段（已存在，确认）

确保 `InboundOrder` 和 `OutboundOrder` 表包含 `confirmSource` 字段：

```prisma
model InboundOrder {
  // ... 其他字段
  confirmedAt    DateTime?
  confirmedBy    Int?
  confirmSource  String?    // 'pc' | 'mobile' | 'h5' | 'miniprogram'
  // ...
}

model OutboundOrder {
  // ... 其他字段
  confirmedAt    DateTime?
  confirmedBy    Int?
  confirmSource  String?    // 'pc' | 'mobile' | 'h5' | 'miniprogram'
  // ...
}
```

如果不存在，需要添加：

```bash
# 手动添加字段
mysql -u root -p<password> wms -e "
  ALTER TABLE InboundOrder ADD COLUMN confirmSource VARCHAR(50);
  ALTER TABLE OutboundOrder ADD COLUMN confirmSource VARCHAR(50);
"

# 重新生成 Prisma Client
cd wms-backend
npx prisma generate
```

### 8.4 后端修改清单汇总

| 类型 | 文件 | 修改内容 |
|------|------|---------|
| 新增路由 | `routes/todo.routes.ts` | 添加 `PUT /inbound/:id/items` |
| 新增控制器 | `controllers/todo.controller.ts` | 添加 `updateInboundItems` 函数 |
| 修改 | `controllers/inbound.controller.ts` | 确保返回完整关联数据 |
| 数据库 | `prisma/schema.prisma` | 确认 `confirmSource` 字段存在 |

---

## 9. 开发步骤与里程碑

### 9.1 开发阶段划分

#### 第一阶段：基础架构搭建（预计 2-3 天）

| 序号 | 任务 | 详细内容 | 交付物 |
|------|------|---------|--------|
| 1.1 | 项目初始化 | 创建 uni-app 项目，配置 TypeScript、Pinia | 可运行的空项目 |
| 1.2 | 目录结构 | 按规划创建目录和基础文件 | 完整目录结构 |
| 1.3 | 请求封装 | 实现 request.ts，配置拦截器 | API 请求模块 |
| 1.4 | 全局样式 | 配置 SCSS 变量、全局样式 | 样式规范文件 |
| 1.5 | 页面路由 | 配置 pages.json，定义所有页面路由 | 路由配置 |
| 1.6 | 状态管理 | 实现 user store、app store | Pinia stores |

#### 第二阶段：用户认证模块（预计 1-2 天）

| 序号 | 任务 | 详细内容 | 交付物 |
|------|------|---------|--------|
| 2.1 | 登录页面 | 实现登录表单、验证码获取 | login/index.vue |
| 2.2 | 认证 API | 对接登录、登出、获取用户信息 | api/auth.ts |
| 2.3 | Token 管理 | 实现 Token 存储、自动添加到请求头 | storage.ts |
| 2.4 | 路由守卫 | 实现未登录自动跳转登录页 | 路由拦截逻辑 |
| 2.5 | 登出功能 | 清理 Token，跳转登录页 | 登出流程 |

#### 第三阶段：首页与底部导航（预计 1-2 天）

| 序号 | 任务 | 详细内容 | 交付物 |
|------|------|---------|--------|
| 3.1 | 底部导航 | 实现 TabBar 组件，4个 tab | TabBar.vue |
| 3.2 | 首页布局 | 实现首页框架、待办数量卡片 | home/index.vue |
| 3.3 | 快捷入口 | 实现快捷操作按钮 | 快捷入口组件 |
| 3.4 | 今日统计 | 对接 dashboard API | 统计展示 |

#### 第四阶段：待办中心（核心，预计 5-7 天）

| 序号 | 任务 | 详细内容 | 交付物 |
|------|------|---------|--------|
| 4.1 | 待办列表 | Tab切换、订单卡片列表、下拉刷新 | todo/index.vue |
| 4.2 | 订单卡片 | 实现可复用的订单卡片组件 | OrderCard.vue |
| 4.3 | 入库详情弹窗 | 查看订单详情、显示明细 | inbound-detail.vue |
| 4.4 | 明细编辑 | 编辑库位、实到数量 | ItemList.vue |
| 4.5 | 附件上传 | 拍照、相册选择、上传 | ImagePicker.vue |
| 4.6 | 确认入库 | 二次确认、调用 API、成功反馈 | 确认流程 |
| 4.7 | 出库详情弹窗 | 查看出库单详情 | outbound-detail.vue |
| 4.8 | 确认出库 | 二次确认、调用 API | 出库确认流程 |

#### 第五阶段：库存查询（预计 2-3 天）

| 序号 | 任务 | 详细内容 | 交付物 |
|------|------|---------|--------|
| 5.1 | 库存列表 | 搜索、筛选、分页加载 | inventory/index.vue |
| 5.2 | 库存详情 | 显示库存详细信息 | inventory/detail.vue |
| 5.3 | 搜索组件 | 实现可复用搜索栏 | SearchBar.vue |

#### 第六阶段：扫码功能（预计 1-2 天）

| 序号 | 任务 | 详细内容 | 交付物 |
|------|------|---------|--------|
| 6.1 | 扫码页面 | 调用扫码 API，解析结果 | scan/index.vue |
| 6.2 | 结果处理 | 根据扫码结果跳转对应页面 | 跳转逻辑 |
| 6.3 | 手动输入 | 支持手动输入编号搜索 | 手动输入功能 |

#### 第七阶段：个人中心（预计 1-2 天）

| 序号 | 任务 | 详细内容 | 交付物 |
|------|------|---------|--------|
| 7.1 | 个人中心页 | 用户信息展示、菜单列表 | profile/index.vue |
| 7.2 | 修改密码 | 密码修改表单 | change-password.vue |
| 7.3 | 关于页面 | 版本信息、联系方式 | about.vue |

#### 第八阶段：优化与测试（预计 2-3 天）

| 序号 | 任务 | 详细内容 | 交付物 |
|------|------|---------|--------|
| 8.1 | UI 优化 | 界面细节调整、动画效果 | 优化后的 UI |
| 8.2 | 性能优化 | 列表虚拟滚动、图片懒加载 | 性能优化 |
| 8.3 | 错误处理 | 完善错误提示、异常处理 | 健壮的错误处理 |
| 8.4 | 兼容测试 | 多机型、多平台测试 | 测试报告 |
| 8.5 | Bug 修复 | 修复测试中发现的问题 | Bug 修复 |

### 9.2 里程碑节点

| 里程碑 | 目标 | 预计完成 |
|--------|------|---------|
| M1 | 基础架构 + 登录功能可用 | 第 4 天 |
| M2 | 首页 + 待办列表可查看 | 第 7 天 |
| M3 | 入库确认全流程可用 | 第 12 天 |
| M4 | 出库确认 + 库存查询可用 | 第 15 天 |
| M5 | 全功能可用 + 测试完成 | 第 18 天 |

### 9.3 并行开发建议

如果有 2 人或以上参与开发：

| 开发者 A | 开发者 B |
|---------|---------|
| 基础架构搭建 | UI 组件开发 |
| 登录模块 | 首页模块 |
| 待办中心（核心） | 库存查询 |
| 入库确认流程 | 出库确认流程 |
| 扫码功能 | 个人中心 |

---

## 10. 测试方案

### 10.1 测试环境

| 环境 | 用途 | 地址 |
|------|------|------|
| 开发环境 | 本地开发调试 | http://localhost:5173 |
| 测试环境 | 功能测试、集成测试 | https://wms-test.fexxo.cn |
| 生产环境 | 正式上线 | https://m.wms.fexxo.cn |

### 10.2 测试用例

#### 10.2.1 登录模块测试

| 测试点 | 预期结果 | 优先级 |
|--------|---------|--------|
| 正确账号密码登录 | 登录成功，跳转首页 | P0 |
| 错误密码登录 | 提示"用户名或密码错误" | P0 |
| 验证码错误 | 提示"验证码错误" | P0 |
| 验证码刷新 | 点击图片刷新验证码 | P1 |
| Token 过期 | 自动跳转登录页 | P0 |

#### 10.2.2 待办中心测试

| 测试点 | 预期结果 | 优先级 |
|--------|---------|--------|
| 待办列表加载 | 正确显示待入库/待出库订单 | P0 |
| Tab 切换 | 切换显示对应类型订单 | P0 |
| 下拉刷新 | 刷新列表数据 | P0 |
| 打开入库详情 | 显示订单详情弹窗 | P0 |
| 编辑库位 | 可输入/选择库位 | P0 |
| 编辑实到数量 | 可修改数量 | P0 |
| 拍照上传 | 调起相机，拍照后上传成功 | P0 |
| 相册上传 | 打开相册，选择后上传成功 | P0 |
| 确认入库 | 二次确认后入库成功，订单消失 | P0 |
| 确认出库 | 二次确认后出库成功，订单消失 | P0 |
| PC 端新建订单后 | 移动端实时显示新订单 | P0 |

#### 10.2.3 库存查询测试

| 测试点 | 预期结果 | 优先级 |
|--------|---------|--------|
| 搜索库存 | 按关键词搜索，显示结果 | P1 |
| 筛选客户 | 按客户筛选库存 | P1 |
| 库存详情 | 显示完整库存信息 | P1 |
| 上拉加载 | 分页加载更多数据 | P1 |

#### 10.2.4 扫码测试

| 测试点 | 预期结果 | 优先级 |
|--------|---------|--------|
| 扫描订单号 | 跳转到对应待办详情 | P1 |
| 扫描 SKU | 搜索对应库存 | P1 |
| 无效码 | 提示"未找到相关信息" | P1 |

### 10.3 兼容性测试

| 平台 | 测试机型/浏览器 | 优先级 |
|------|----------------|--------|
| H5 (iOS) | Safari 最新版 | P0 |
| H5 (Android) | Chrome 最新版 | P0 |
| 微信小程序 | iOS/Android 微信 | P1 |
| App (Android) | 主流 Android 手机 | P2 |
| App (iOS) | iPhone 12 及以上 | P2 |

### 10.4 性能指标

| 指标 | 目标值 |
|------|--------|
| 首屏加载时间 | < 3s (4G网络) |
| 列表滚动帧率 | >= 30fps |
| 接口响应时间 | < 500ms |
| 图片上传时间 | < 5s (单张 < 2MB) |
| 内存占用 | < 150MB |

---

## 11. 部署指南

### 11.1 H5 部署

#### 11.1.1 构建

```bash
cd wms-mobile

# 构建 H5 版本
npm run build:h5

# 构建产物位于 dist/build/h5/
```

#### 11.1.2 Nginx 配置

```nginx
# /www/server/panel/vhost/nginx/m.wms.fexxo.cn.conf

server {
    listen 80;
    listen 443 ssl http2;
    server_name m.wms.fexxo.cn;

    # SSL 配置
    ssl_certificate    /path/to/cert.pem;
    ssl_certificate_key    /path/to/key.pem;

    # 网站根目录
    root /www/wwwroot/wms/wms-mobile/dist/build/h5;
    index index.html;

    # 所有请求都重定向到 index.html (SPA 路由支持)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # API 代理（可选，如果需要同域）
    location /api {
        proxy_pass https://wmsapi.fexxo.cn/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 11.1.3 部署脚本

```bash
#!/bin/bash
# deploy-mobile.sh

echo "开始部署移动端..."

cd /www/wwwroot/wms/wms-mobile

# 拉取最新代码
git pull origin master

# 安装依赖
npm install

# 构建
npm run build:h5

# 设置权限
chown -R www:www /www/wwwroot/wms/wms-mobile/dist

# 重载 Nginx
nginx -s reload

echo "移动端部署完成！"
```

### 11.2 微信小程序部署

#### 11.2.1 构建

```bash
# 构建微信小程序版本
npm run build:mp-weixin

# 构建产物位于 dist/build/mp-weixin/
```

#### 11.2.2 上传

1. 打开微信开发者工具
2. 导入项目 `dist/build/mp-weixin/`
3. 点击"上传"，填写版本号
4. 在微信公众平台提交审核

### 11.3 App 部署

#### 11.3.1 云打包（推荐）

1. 在 HBuilderX 中打开项目
2. 发行 → 原生App-云打包
3. 配置应用信息、证书
4. 等待打包完成，下载安装包

#### 11.3.2 离线打包

参考 uni-app 官方文档进行离线打包配置。

---

## 附录

### A. 常用命令

```bash
# 开发
npm run dev:h5          # H5 开发
npm run dev:mp-weixin   # 微信小程序开发

# 构建
npm run build:h5        # 构建 H5
npm run build:mp-weixin # 构建微信小程序

# 其他
npm run lint           # 代码检查
npm run lint:fix       # 自动修复
```

### B. 调试技巧

1. **H5 调试**: 使用 Chrome DevTools，开启移动端模拟
2. **小程序调试**: 使用微信开发者工具
3. **网络请求**: 使用 Charles/Fiddler 抓包
4. **真机调试**: uni-app 提供真机调试功能

### C. 常见问题

**Q: 拍照上传在某些手机上不工作？**
A: 检查 manifest.json 中的相机权限配置，确保已声明 `camera` 和 `album` 权限。

**Q: 微信小程序上传文件失败？**
A: 检查服务器域名是否已在微信公众平台配置为合法域名。

**Q: Token 频繁过期？**
A: 检查 JWT 过期时间配置，建议设置为 7 天，并实现 Token 刷新机制。

### D. 参考文档

- [uni-app 官方文档](https://uniapp.dcloud.net.cn/)
- [Vue 3 文档](https://v3.cn.vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [uni-ui 组件库](https://uniapp.dcloud.net.cn/component/uniui/uni-ui.html)

### E. 联系方式

如有问题，请联系：
- 技术负责人：[待填写]
- 项目经理：[待填写]

---

> 文档版本：1.0.0
> 最后更新：2025-12-02
> 编写：Claude Code
