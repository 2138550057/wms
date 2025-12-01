# WMS系统AI开发技术文档

## 一、技术栈定义

### 前端
```javascript
- React 18 + TypeScript
- Ant Design 5.x (UI组件)
- Zustand (状态管理，比Redux简单)
- React Router v6 (路由)
- Axios (HTTP请求)
- Day.js (日期处理)
- Lodash (工具函数)
- XLSX (Excel导入导出)
```

### 后端
```javascript
- Node.js + Express + TypeScript
- SQLite (开发阶段) / PostgreSQL (生产)
- Prisma ORM (数据库操作)
- JWT (认证)
- Multer (文件上传)
- Node-xlsx (Excel处理)
```

## 二、项目结构

### 前端目录结构
```
wms-frontend/
├── src/
│   ├── pages/              # 页面组件
│   │   ├── inbound/        # 入库管理
│   │   │   ├── InboundList.tsx
│   │   │   ├── InboundForm.tsx
│   │   │   └── InboundDetail.tsx
│   │   ├── outbound/       # 出库管理
│   │   │   ├── OutboundList.tsx
│   │   │   ├── OutboundForm.tsx
│   │   │   └── OutboundDetail.tsx
│   │   ├── inventory/      # 库存管理
│   │   │   ├── InventoryList.tsx
│   │   │   └── InventoryReport.tsx
│   │   └── login/          # 登录
│   ├── components/         # 公共组件
│   ├── services/           # API服务
│   ├── stores/            # Zustand状态
│   ├── types/             # TypeScript类型
│   ├── utils/             # 工具函数
│   └── App.tsx
```

### 后端目录结构
```
wms-backend/
├── src/
│   ├── controllers/       # 控制器
│   │   ├── inbound.controller.ts
│   │   ├── outbound.controller.ts
│   │   └── inventory.controller.ts
│   ├── services/         # 业务逻辑
│   ├── models/          # 数据模型
│   ├── routes/          # 路由定义
│   ├── middlewares/     # 中间件
│   ├── utils/           # 工具函数
│   └── app.ts
├── prisma/
│   └── schema.prisma    # 数据库模型
```

## 三、数据库设计

### Prisma Schema 定义

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
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
  role      String   @default("operator")
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
  
  inboundOrders  InboundOrder[]
  outboundOrders OutboundOrder[]
  inventory      Inventory[]
}

// 入库单主表
model InboundOrder {
  id               Int      @id @default(autoincrement())
  orderNo          String   @unique              // 进仓编号 WI+日期+序号
  customerId       Int                          // 客户ID
  customerName     String                       // 客户名称
  contactPerson    String?                      // 联系人
  contactPhone     String?                      // 联系电话
  deliveryCompany  String?                      // 送货单位
  vehicleNumber    String?                      // 车牌号
  driverName       String?                      // 司机姓名
  businessType     String   @default("normal")  // 业务类型
  inboundDate      DateTime                     // 入库日期
  status           String   @default("pending") // 状态: pending/completed
  totalQuantity    Int      @default(0)        // 总件数
  totalVolume      Float?                      // 总体积
  totalWeight      Float?                      // 总重量
  remark           String?                      // 备注
  createdBy        Int?                         // 创建人
  createdAt        DateTime @default(now())    
  updatedAt        DateTime @updatedAt
  
  customer Customer @relation(fields: [customerId], references: [id])
  creator  User?    @relation(fields: [createdBy], references: [id])
  items    InboundOrderItem[]
}

// 入库单明细表
model InboundOrderItem {
  id            Int      @id @default(autoincrement())
  orderId       Int                            // 入库单ID
  productName   String                         // 货名
  productModel  String?                        // 型号
  sku           String?                        // SKU
  productCode   String?                        // 编号
  shippingMark  String?                        // 唛头
  poNumber      String?                        // PO号
  locationCode  String?                        // 库位
  packageType   String?                        // 包装形式
  quantity      Int                            // 件数
  length        Float?                         // 长(cm)
  width         Float?                         // 宽(cm)
  height        Float?                         // 高(cm)
  weight        Float?                         // 重量(kg)
  volume        Float?                         // 体积(m³)
  remark        String?                        // 备注
  
  order InboundOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

// 出库单主表
model OutboundOrder {
  id               Int      @id @default(autoincrement())
  orderNo          String   @unique              // 出仓编号 WO+日期+序号
  customerId       Int                          // 客户ID
  customerName     String                       // 客户名称
  contactPerson    String?                      // 联系人
  contactPhone     String?                      // 联系电话
  receivingCompany String?                      // 收货单位
  receivingAddress String?                      // 收货地址
  vehicleNumber    String?                      // 车牌号
  driverName       String?                      // 司机姓名
  businessType     String   @default("sales")   // 业务类型
  outboundDate     DateTime                     // 出库日期
  status           String   @default("pending") // 状态
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
  id            Int      @id @default(autoincrement())
  orderId       Int                            
  productName   String                         
  productModel  String?                        
  sku           String?                        
  productCode   String?                        
  shippingMark  String?                        
  poNumber      String?                        
  locationCode  String?                        
  packageType   String?                        
  quantity      Int                            
  length        Float?                         
  width         Float?                         
  height        Float?                         
  weight        Float?                         
  volume        Float?                         
  remark        String?                        
  
  order OutboundOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

// 库存表
model Inventory {
  id                Int      @id @default(autoincrement())
  sku               String                      // SKU
  productName       String                      // 货名
  productModel      String?                     // 型号
  productCode       String?                     // 编号
  customerId        Int                         // 客户ID
  customerName      String                      // 客户名称
  locationCode      String?                     // 库位
  quantity          Int      @default(0)        // 当前数量
  availableQuantity Int      @default(0)        // 可用数量
  lockedQuantity    Int      @default(0)        // 锁定数量
  length            Float?                      // 长
  width             Float?                      // 宽
  height            Float?                      // 高
  weight            Float?                      // 重量
  lastInboundDate   DateTime?                   // 最后入库时间
  lastOutboundDate  DateTime?                   // 最后出库时间
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  customer Customer @relation(fields: [customerId], references: [id])
  
  @@unique([sku, customerId, locationCode])
}
```

## 四、核心功能实现

### 4.1 入库功能实现步骤

#### 前端 - 入库表单组件
```typescript
// InboundForm.tsx 关键实现逻辑

interface InboundFormData {
  orderNo: string;           // 自动生成
  customerId: number;        
  customerName: string;      // 必填
  contactPerson?: string;    
  contactPhone?: string;     
  deliveryCompany?: string;  
  vehicleNumber?: string;    
  driverName?: string;       
  businessType: string;      
  inboundDate: string;       // 必填
  items: InboundItem[];      // 明细项
}

interface InboundItem {
  productName: string;       // 必填
  productModel?: string;     
  sku?: string;             
  productCode?: string;      
  shippingMark?: string;     
  poNumber?: string;         
  locationCode?: string;     
  packageType?: string;      
  quantity: number;          // 必填
  length?: number;           
  width?: number;            
  height?: number;           
  weight?: number;           
  remark?: string;          
}

// 关键功能：
// 1. 自动生成入库单号：WI + YYYYMMDD + 4位序号
// 2. 客户选择器（支持搜索）
// 3. 动态添加/删除明细行
// 4. 自动计算总体积、总重量
// 5. Excel批量导入
// 6. 表单验证
```

#### 后端 - 入库API实现
```typescript
// inbound.controller.ts 关键接口

// 1. 创建入库单
POST /api/inbound/orders
Body: InboundFormData
Response: { success: boolean, data: InboundOrder }
业务逻辑：
- 生成入库单号
- 保存主表和明细表
- 更新库存（增加）
- 记录操作日志

// 2. 查询入库单列表
GET /api/inbound/orders?page=1&size=20&customerName=&dateFrom=&dateTo=
Response: { 
  data: InboundOrder[], 
  total: number,
  page: number,
  size: number 
}

// 3. 获取入库单详情
GET /api/inbound/orders/:id
Response: InboundOrder with items

// 4. Excel导入
POST /api/inbound/import
Body: FormData (Excel file)
Response: { success: boolean, imported: number, failed: number }
```

### 4.2 出库功能实现步骤

#### 前端 - 出库表单组件
```typescript
// OutboundForm.tsx 关键实现逻辑

// 关键功能：
// 1. 自动生成出库单号：WO + YYYYMMDD + 4位序号
// 2. 选择客户后自动加载该客户库存
// 3. 选择商品时检查库存数量
// 4. 库存不足时警告提示
// 5. 支持部分出库
```

#### 后端 - 出库API实现
```typescript
// outbound.controller.ts 关键逻辑

// 创建出库单时的库存检查
async function createOutboundOrder(data: OutboundFormData) {
  // 1. 检查每个商品的库存是否充足
  for (const item of data.items) {
    const inventory = await checkInventory(item.sku, item.quantity);
    if (!inventory.sufficient) {
      throw new Error(`商品 ${item.productName} 库存不足`);
    }
  }
  
  // 2. 创建出库单
  const order = await createOrder(data);
  
  // 3. 扣减库存
  await reduceInventory(data.items);
  
  // 4. 记录库存变动日志
  await logInventoryChange(order);
  
  return order;
}
```

### 4.3 库存管理实现步骤

#### 库存查询页面
```typescript
// InventoryList.tsx 关键功能

// 查询条件：
// - 客户名称
// - SKU/货名
// - 库位
// - 库存状态（正常/预警/缺货）

// 显示字段：
// - SKU、货名、型号、客户名称
// - 当前库存、可用库存、锁定库存
// - 库位、最后入库时间、最后出库时间
// - 库龄（当前时间 - 最后入库时间）

// 操作功能：
// - 库存调整（盘盈盘亏）
// - 库存冻结/解冻
// - 导出Excel
```

## 五、前端核心代码模板

### 5.1 API服务层
```typescript
// services/api.ts
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 入库相关API
export const inboundAPI = {
  create: (data: any) => api.post('/inbound/orders', data),
  list: (params: any) => api.get('/inbound/orders', { params }),
  detail: (id: number) => api.get(`/inbound/orders/${id}`),
  delete: (id: number) => api.delete(`/inbound/orders/${id}`),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/inbound/import', formData);
  },
};

// 出库相关API
export const outboundAPI = {
  create: (data: any) => api.post('/outbound/orders', data),
  list: (params: any) => api.get('/outbound/orders', { params }),
  detail: (id: number) => api.get(`/outbound/orders/${id}`),
  checkStock: (items: any[]) => api.post('/outbound/check-stock', { items }),
};

// 库存相关API
export const inventoryAPI = {
  list: (params: any) => api.get('/inventory', { params }),
  adjust: (data: any) => api.post('/inventory/adjust', data),
  export: (params: any) => api.get('/inventory/export', { params, responseType: 'blob' }),
};
```

### 5.2 状态管理
```typescript
// stores/useStore.ts
import { create } from 'zustand';

interface AppState {
  user: any;
  customers: any[];
  loading: boolean;
  setUser: (user: any) => void;
  setCustomers: (customers: any[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  customers: [],
  loading: false,
  setUser: (user) => set({ user }),
  setCustomers: (customers) => set({ customers }),
  setLoading: (loading) => set({ loading }),
}));
```

### 5.3 表格组件模板
```typescript
// components/DataTable.tsx
import { Table, Button, Space, Input, DatePicker } from 'antd';
import { useState } from 'react';

interface DataTableProps {
  columns: any[];
  fetchData: (params: any) => Promise<any>;
  searchFields?: any[];
}

export const DataTable: React.FC<DataTableProps> = ({ columns, fetchData, searchFields }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [searchParams, setSearchParams] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        size: pagination.pageSize,
        ...searchParams,
      };
      const result = await fetchData(params);
      setData(result.data);
      setPagination({ ...pagination, total: result.total });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 搜索栏 */}
      <div style={{ marginBottom: 16 }}>
        {/* 动态渲染搜索字段 */}
      </div>
      
      {/* 数据表格 */}
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        onChange={(p) => setPagination(p)}
      />
    </div>
  );
};
```

## 六、后端核心代码模板

### 6.1 Express服务器设置
```typescript
// app.ts
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// 路由注册
app.use('/api/inbound', inboundRouter);
app.use('/api/outbound', outboundRouter);
app.use('/api/inventory', inventoryRouter);

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

### 6.2 入库控制器
```typescript
// controllers/inbound.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InboundController {
  // 创建入库单
  async create(req: Request, res: Response) {
    const { customerName, inboundDate, items, ...mainData } = req.body;
    
    try {
      // 生成入库单号
      const orderNo = await generateOrderNo('WI');
      
      // 创建入库单（包含明细）
      const order = await prisma.inboundOrder.create({
        data: {
          orderNo,
          customerName,
          inboundDate: new Date(inboundDate),
          ...mainData,
          totalQuantity: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
          items: {
            create: items,
          },
        },
        include: {
          items: true,
        },
      });
      
      // 更新库存
      for (const item of items) {
        await updateInventory(item, 'inbound');
      }
      
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // 查询入库单列表
  async list(req: Request, res: Response) {
    const { page = 1, size = 20, customerName, dateFrom, dateTo } = req.query;
    
    const where: any = {};
    if (customerName) where.customerName = { contains: customerName as string };
    if (dateFrom || dateTo) {
      where.inboundDate = {};
      if (dateFrom) where.inboundDate.gte = new Date(dateFrom as string);
      if (dateTo) where.inboundDate.lte = new Date(dateTo as string);
    }
    
    const [data, total] = await Promise.all([
      prisma.inboundOrder.findMany({
        where,
        skip: (Number(page) - 1) * Number(size),
        take: Number(size),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inboundOrder.count({ where }),
    ]);
    
    res.json({ data, total, page: Number(page), size: Number(size) });
  }
}

// 辅助函数：生成单号
async function generateOrderNo(prefix: string): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.inboundOrder.count({
    where: {
      orderNo: { startsWith: `${prefix}${dateStr}` },
    },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}${dateStr}${seq}`;
}

// 辅助函数：更新库存
async function updateInventory(item: any, type: 'inbound' | 'outbound') {
  const existing = await prisma.inventory.findFirst({
    where: {
      sku: item.sku || item.productName,
      locationCode: item.locationCode,
    },
  });
  
  if (existing) {
    const quantity = type === 'inbound' 
      ? existing.quantity + item.quantity 
      : existing.quantity - item.quantity;
      
    await prisma.inventory.update({
      where: { id: existing.id },
      data: {
        quantity,
        availableQuantity: quantity,
        lastInboundDate: type === 'inbound' ? new Date() : existing.lastInboundDate,
        lastOutboundDate: type === 'outbound' ? new Date() : existing.lastOutboundDate,
      },
    });
  } else if (type === 'inbound') {
    await prisma.inventory.create({
      data: {
        sku: item.sku || item.productName,
        productName: item.productName,
        productModel: item.productModel,
        locationCode: item.locationCode,
        quantity: item.quantity,
        availableQuantity: item.quantity,
        customerId: item.customerId,
        customerName: item.customerName,
        lastInboundDate: new Date(),
      },
    });
  }
}
```

## 七、开发顺序建议

### 第1步：初始化项目
```bash
# 前端
npx create-react-app wms-frontend --template typescript
cd wms-frontend
npm install antd zustand axios dayjs lodash xlsx

# 后端
mkdir wms-backend && cd wms-backend
npm init -y
npm install express cors prisma @prisma/client
npm install -D typescript @types/node @types/express ts-node nodemon
npx prisma init
```

### 第2步：开发顺序
1. **后端数据库** → 创建Prisma schema，运行迁移
2. **后端API** → 实现基础CRUD接口
3. **前端布局** → 创建基础布局和路由
4. **入库功能** → 完整实现入库功能
5. **库存更新** → 确保入库后库存正确更新
6. **出库功能** → 实现出库和库存检查
7. **库存查询** → 实现库存列表和查询
8. **报表导出** → 实现Excel导出功能
9. **打印功能** → 实现单据打印

### 第3步：测试数据
```sql
-- 插入测试客户
INSERT INTO Customer (code, name, contact, phone) VALUES
('C001', '测试客户A', '张三', '13800138000'),
('C002', '测试客户B', '李四', '13900139000');

-- 插入测试用户
INSERT INTO User (username, password, realName, role) VALUES
('admin', 'hashed_password', '管理员', 'admin'),
('user1', 'hashed_password', '操作员1', 'operator');
```

## 八、关键注意事项

### 开发要点
1. **单号生成**：必须保证唯一性，使用事务锁
2. **库存计算**：入库增加、出库减少，要考虑并发
3. **数据验证**：前后端双重验证
4. **错误处理**：统一错误格式返回
5. **分页查询**：大数据量必须分页
6. **状态管理**：使用Zustand简化状态管理
7. **表单设计**：使用Ant Design Form组件
8. **Excel处理**：使用xlsx库处理导入导出

### 性能优化
1. 使用索引优化查询
2. 批量操作使用事务
3. 大表分页加载
4. 前端虚拟滚动
5. 接口响应缓存

### 安全考虑
1. JWT token认证
2. 接口权限校验  
3. SQL注入防护（使用ORM）
4. XSS防护（React自动处理）
5. 敏感数据加密