# 盘库管理功能实施计划

## 功能概述

开发一个可视化盘库管理系统，包含：
1. **可视化库位图** - 类似CAD风格的仓库布局图，支持拖拽和缩放
2. **库位交互** - 点击库位显示货物信息、进仓编号
3. **库位详情** - 查看库位下所有库存明细
4. **货物操作** - 选择库位添加货物（快捷入库）
5. **库位统计表** - 显示每个库位的货物件数汇总

---

## 一、数据库设计

### 1.1 新增表：WarehouseLayout（仓库布局配置）

用于存储库位在可视化地图中的位置和尺寸信息。

```prisma
model WarehouseLayout {
  id          Int      @id @default(autoincrement())
  locationId  Int?     // 关联的库位ID（可为空，表示区域标签）
  locationCode String?  // 库位编码（冗余存储，方便查询）

  // 布局信息
  type        String   @default("location")  // 类型: location(库位) / zone(区域标签) / wall(墙) / door(门)
  label       String?  // 显示标签（如"保税B区"、"办公室"）

  // 位置和尺寸（相对于画布的百分比或像素）
  x           Float    // X坐标
  y           Float    // Y坐标
  width       Float    // 宽度
  height      Float    // 高度
  rotation    Float    @default(0)  // 旋转角度

  // 样式
  bgColor     String?  // 背景颜色
  borderColor String?  // 边框颜色
  fontSize    Int?     // 字体大小

  // 分组（用于区域划分）
  zoneGroup   String?  // 所属区域组（如"B区"、"F区"）
  floor       Int      @default(1)  // 楼层

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  location    Location? @relation(fields: [locationId], references: [id])

  @@index([locationCode])
  @@index([zoneGroup])
  @@index([floor])
}
```

### 1.2 扩展 Location 表

添加关联到布局的字段（可选，考虑到有些库位可能没有布局）：

```prisma
model Location {
  // ... 现有字段 ...

  layout      WarehouseLayout?  // 关联到布局配置
}
```

---

## 二、后端API设计

### 2.1 盘库管理API (`/api/stocktaking`)

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/stocktaking/layout` | GET | 获取仓库布局数据 |
| `/api/stocktaking/layout` | POST | 创建布局元素 |
| `/api/stocktaking/layout/:id` | PUT | 更新布局元素位置/尺寸 |
| `/api/stocktaking/layout/:id` | DELETE | 删除布局元素 |
| `/api/stocktaking/layout/batch` | POST | 批量更新布局（保存整个画布） |
| `/api/stocktaking/location/:code/summary` | GET | 获取库位汇总（件数、货物列表） |
| `/api/stocktaking/location/:code/inventory` | GET | 获取库位详细库存 |
| `/api/stocktaking/locations/summary` | GET | 获取所有库位汇总统计 |
| `/api/stocktaking/quick-inbound` | POST | 快捷入库（选中库位添加货物） |

### 2.2 API 响应结构

**获取库位汇总:**
```typescript
GET /api/stocktaking/location/3F16-1/summary

Response:
{
  success: true,
  data: {
    locationCode: "3F16-1",
    totalQuantity: 150,          // 总件数
    totalSku: 5,                 // SKU种类数
    inventory: [
      {
        warehouseEntryNo: "WI20251201001",
        productName: "电子元器件A",
        sku: "CMD001",
        quantity: 50,
        customerName: "客户A"
      },
      // ...
    ]
  }
}
```

**获取仓库布局:**
```typescript
GET /api/stocktaking/layout?floor=1

Response:
{
  success: true,
  data: {
    floor: 1,
    canvasWidth: 1200,
    canvasHeight: 800,
    elements: [
      {
        id: 1,
        type: "zone",
        label: "保税B区",
        x: 100, y: 50,
        width: 300, height: 200,
        bgColor: "#f0f8ff"
      },
      {
        id: 2,
        type: "location",
        locationCode: "3F16-1",
        label: "3F16",
        x: 150, y: 100,
        width: 60, height: 40,
        quantity: 150  // 关联库存件数
      },
      // ...
    ]
  }
}
```

---

## 三、前端实现

### 3.1 新增页面路由

```
/stocktaking           - 盘库管理主页（库位图）
/stocktaking/table     - 库位统计表格视图
/stocktaking/layout-editor  - 布局编辑器（管理员）
```

### 3.2 核心组件

#### 3.2.1 WarehouseMap 组件（库位可视化地图）

**技术选型**: 使用 React + SVG/Canvas 实现，推荐使用 `react-konva` 或纯SVG

**功能:**
- 渲染仓库布局（区域、库位、墙、门等）
- 支持缩放（滚轮/按钮）
- 支持拖拽移动画布
- 库位颜色根据库存状态变化：
  - 绿色：有货
  - 灰色：空置
  - 红色：预警（可配置阈值）
- 悬浮显示库位信息（件数）
- 点击弹出详情面板

**组件结构:**
```
WarehouseMap/
├── index.tsx          # 主组件
├── MapCanvas.tsx      # 画布渲染
├── LocationBlock.tsx  # 单个库位块
├── ZoneLabel.tsx      # 区域标签
├── MapToolbar.tsx     # 工具栏（缩放、全屏等）
├── LocationPopover.tsx # 库位悬浮信息
└── LocationDetailPanel.tsx # 库位详情侧边栏
```

#### 3.2.2 LocationDetailPanel 组件（库位详情面板）

点击库位后显示的侧边抽屉，包含：
- 库位基本信息
- 库存列表（进仓编号、货名、件数）
- 操作按钮：查看详情、添加货物

#### 3.2.3 QuickInboundModal 组件（快捷入库弹窗）

选择库位后快速添加货物的表单：
- 选择/输入客户
- 输入货物信息（SKU、货名、件数等）
- 生成入库单并自动确认

#### 3.2.4 LayoutEditor 组件（布局编辑器）

管理员用于设计仓库布局：
- 拖拽添加库位块
- 调整库位大小和位置
- 添加区域标签、墙、门
- 批量导入库位
- 保存布局

#### 3.2.5 LocationSummaryTable 组件（库位统计表）

表格形式展示所有库位统计：

| 库位编码 | 保税 | 区域 | 件数 | SKU数 | 状态 | 操作 |
|----------|------|------|------|-------|------|------|
| 3F16-1   | 是   | F区  | 150  | 5     | 正常 | 详情 |
| 1A01-1   | 否   | A区  | 0    | 0     | 空置 | - |

---

## 四、界面布局设计

### 4.1 盘库管理主页 (/stocktaking)

```
┌─────────────────────────────────────────────────────────────────┐
│  [工具栏]  楼层选择: [1层▼]  区域筛选: [全部▼]  [编辑布局] [表格视图]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     ┌───────────────────┐                       │
│  ┌─────────┐        │   保税B区         │        ┌──────────┐   │
│  │ 1A01-1  │        ├───┬───┬───┬───┬───┤        │ 办公室   │   │
│  │  (50)   │        │3B │3B │3B │3B │3B │        └──────────┘   │
│  ├─────────┤        │17 │18 │19 │20 │21 │                       │
│  │ 1A02-1  │        │(0)│(25│(0)│(30│(15│                       │
│  │  (30)   │        └───┴───┴───┴───┴───┘                       │
│  └─────────┘                                                    │
│                     ┌───────────────────┐                       │
│                     │   保税F区         │                       │
│                     ├───┬───┬───┬───┬───┤                       │
│  [缩放工具]         │3F │3F │3F │3F │3F │        [图例]         │
│  [+] [-] [适配]     │16 │17 │18 │19 │20 │        ■ 有货         │
│                     │(15│(0)│(45│(0)│(0)│        □ 空置         │
│                     └───┴───┴───┴───┴───┘        ■ 预警         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [侧边详情面板 - 点击库位后显示]                                  │
│  库位: 3F16-1  |  总件数: 150  |  SKU: 5种                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 进仓编号         | 货名           | 件数  | 客户          │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ WI20251201001    | 电子元器件A    | 50    | 客户A         │   │
│  │ WI20251201002    | 电子元器件B    | 100   | 客户B         │   │
│  └──────────────────────────────────────────────────────────┘   │
│  [查看详情]  [添加货物]  [关闭]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 布局编辑器 (/stocktaking/layout-editor)

```
┌─────────────────────────────────────────────────────────────────┐
│  [保存] [撤销] [重做] | 楼层: [1层▼] | [导入库位] [清空布局]      │
├────────────┬────────────────────────────────────────────────────┤
│ 元素面板   │                                                    │
│            │                                                    │
│ [+] 库位   │                  画布区域                           │
│ [+] 区域   │                                                    │
│ [+] 墙     │     （可拖拽放置元素、调整大小）                    │
│ [+] 门     │                                                    │
│ [+] 文本   │                                                    │
│            │                                                    │
├────────────┤                                                    │
│ 属性面板   │                                                    │
│            │                                                    │
│ X: [100]   │                                                    │
│ Y: [200]   │                                                    │
│ W: [60]    │                                                    │
│ H: [40]    │                                                    │
│ 颜色: [#] │                                                    │
│            │                                                    │
└────────────┴────────────────────────────────────────────────────┘
```

---

## 五、实施步骤

### 第一阶段：基础架构（预计工作量：中）

1. **数据库迁移**
   - 添加 WarehouseLayout 模型
   - 运行 Prisma migrate

2. **后端API开发**
   - 创建 stocktaking.controller.ts
   - 创建 stocktaking.routes.ts
   - 实现布局CRUD接口
   - 实现库位汇总查询接口

3. **前端服务层**
   - 创建 stocktaking.service.ts
   - 定义类型接口

### 第二阶段：可视化地图（预计工作量：大）

4. **WarehouseMap 组件开发**
   - 画布渲染（SVG）
   - 库位块渲染
   - 缩放和拖拽功能
   - 库位颜色状态

5. **交互功能**
   - 悬浮显示件数
   - 点击选中库位
   - 详情面板展示

### 第三阶段：业务功能（预计工作量：中）

6. **库位详情面板**
   - 库存列表展示
   - 跳转详情页

7. **快捷入库功能**
   - 快捷入库弹窗
   - 自动创建并确认入库单

8. **库位统计表**
   - 表格视图组件
   - 筛选和导出

### 第四阶段：布局编辑器（预计工作量：大）

9. **布局编辑器开发**
   - 拖拽放置元素
   - 调整大小功能
   - 属性面板
   - 保存布局

10. **批量导入**
    - 根据现有库位自动生成布局
    - 支持调整和保存

---

## 六、技术选型建议

### 6.1 可视化库

**推荐: react-konva**
- 基于 Canvas，性能好
- 支持大量元素渲染
- 内置缩放、拖拽功能
- 支持自定义形状

**备选: 纯SVG**
- 无需额外依赖
- DOM操作直观
- 适合元素较少的场景

### 6.2 状态管理

- 使用 React useState/useReducer 管理画布状态
- 复杂场景可考虑 Zustand

### 6.3 布局编辑器

- 可参考 react-grid-layout 的交互模式
- 或使用 react-konva 的 Transformer 组件

---

## 七、数据初始化方案

### 7.1 自动生成初始布局

根据现有 Location 表数据，按照以下规则自动生成布局：

```typescript
// 按区域分组
const zones = groupBy(locations, 'zone');

// 每个区域按行列排列
zones.forEach((locations, zone) => {
  const sorted = sortBy(locations, ['number', 'level']);
  sorted.forEach((loc, index) => {
    const row = Math.floor(index / columnsPerRow);
    const col = index % columnsPerRow;
    createLayoutElement({
      locationCode: loc.code,
      x: zoneStartX + col * blockWidth,
      y: zoneStartY + row * blockHeight,
      width: blockWidth,
      height: blockHeight
    });
  });
});
```

### 7.2 参考用户提供的布局图

根据用户提供的图片，识别以下区域：
- 保税B区 (3B开头)
- 保税E区 (3E开头)
- 保税D区 (3D开头)
- 保税F区 (3F开头)
- 非保税区 (1A开头)

---

## 八、后续扩展

1. **盘点任务管理** - 创建盘点任务、分配人员、记录差异
2. **库存预警** - 库存过低/过期预警
3. **移动端盘点** - 扫码盘点、拍照记录
4. **历史记录** - 库位变更历史、盘点记录

---

## 九、风险与注意事项

1. **性能考虑**: 库位数量多时需要虚拟化渲染
2. **布局保存**: 需要处理并发编辑冲突
3. **数据一致性**: 库位删除时需同步删除布局
4. **权限控制**: 布局编辑应限制管理员

---

## 已确认需求

1. **布局编辑器**: 方案A - 完整的拖拽式布局编辑器
2. **库位操作**: 选择现有库存订单分配/切换库位（不是创建新入库单）
3. **初始布局**: 根据系统中已有库位数据自动生成，兼容后续新增库位
4. **移动端**: 最后开发，先完善PC端
5. **开发顺序**: 先基础版本，逐步增加功能

## 开发阶段规划

### 阶段一：基础版本 ✅ 当前
- [x] 后端API - 获取库位及库存汇总
- [x] 前端库位图组件 - 自动根据库位数据渲染网格
- [x] 点击库位显示库存详情
- [x] 库位统计表格视图

### 阶段二：库位操作
- [ ] 库存分配库位功能
- [ ] 库存切换库位功能
- [ ] 未分配库存列表

### 阶段三：布局编辑器
- [ ] 拖拽调整库位位置
- [ ] 调整库位大小
- [ ] 添加区域标签
- [ ] 保存布局配置

### 阶段四：移动端
- [ ] 移动端库位图
- [ ] 移动端库存分配
