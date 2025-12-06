// 用户相关类型
export interface User {
  id: number
  username: string
  realName?: string
  email?: string
  phone?: string
  avatar?: string
  role: string
  createdAt?: string
  updatedAt?: string
}

export interface LoginRequest {
  username: string
  password: string
  captchaId?: string
  captchaCode?: string
}

export interface LoginResponse {
  token: string
  user: User
}

// 客户相关类型
export interface Customer {
  id: number
  code: string
  name: string
  contact?: string
  phone?: string
  address?: string
  createdAt: string
}

// 创建人信息
export interface Creator {
  id: number
  realName?: string
  username: string
}

// 入库单相关类型
export interface InboundOrder {
  id: number
  orderNo: string
  warehouseEntryNo?: string
  customerId: number
  customerName: string
  contactPerson?: string
  contactPhone?: string
  actualQuantity?: number
  vehicleNumber?: string
  driverName?: string
  businessType: string
  inboundDate: string
  status: 'pending' | 'completed'
  totalQuantity: number
  totalVolume?: number
  totalWeight?: number
  remark?: string
  createdBy?: number
  confirmedAt?: string
  confirmedBy?: number
  confirmSource?: string
  createdAt: string
  updatedAt: string
  items?: InboundOrderItem[]
  customer?: Customer
  creator?: Creator
  confirmer?: Creator
  attachmentCount?: number
}

export interface InboundOrderItem {
  id: number
  orderId: number
  productName: string
  productModel?: string
  sku?: string
  internalCode?: string
  productCode?: string
  shippingMark?: string
  poNumber?: string
  locationCode?: string
  packageType?: string
  quantity: number
  length?: number
  width?: number
  height?: number
  unitGrossWeight?: number
  totalGrossWeight?: number
  area?: number
  volume?: number
  remark?: string
}

// 出库单相关类型
export interface OutboundOrder {
  id: number
  orderNo: string
  customerId: number
  customerName: string
  contactPerson?: string
  contactPhone?: string
  receivingCompany?: string
  receivingAddress?: string
  vehicleNumber?: string
  driverName?: string
  businessType: string
  outboundDate: string
  status: 'pending' | 'completed'
  totalQuantity: number
  totalVolume?: number
  totalWeight?: number
  remark?: string
  createdBy?: number
  confirmedAt?: string
  confirmedBy?: number
  confirmSource?: string
  createdAt: string
  updatedAt: string
  items?: OutboundOrderItem[]
  customer?: Customer
  creator?: Creator
  confirmer?: Creator
  attachmentCount?: number
}

export interface OutboundOrderItem {
  id: number
  orderId: number
  warehouseEntryNo?: string
  productName: string
  productModel?: string
  sku?: string
  internalCode?: string
  productCode?: string
  shippingMark?: string
  poNumber?: string
  locationCode?: string
  packageType?: string
  quantity: number
  length?: number
  width?: number
  height?: number
  unitGrossWeight?: number
  totalGrossWeight?: number
  area?: number
  volume?: number
  remark?: string
}

// 库存相关类型
export interface Inventory {
  id: number
  sku: string
  internalCode?: string
  productName: string
  productModel?: string
  productCode?: string
  customerId: number
  customerName: string
  locationCode?: string
  quantity: number
  availableQuantity: number
  lockedQuantity: number
  length?: number
  width?: number
  height?: number
  unitGrossWeight?: number
  totalGrossWeight?: number
  area?: number
  volume?: number
  warehouseEntryNo?: string
  shippingMark?: string
  poNumber?: string
  packageType?: string
  remark?: string
  lastInboundDate?: string
  lastOutboundDate?: string
  createdAt: string
  updatedAt: string
}

// 库位相关类型
export interface Location {
  id: number
  code: string           // 库位编码(自动生成)，如: 3F16-1
  bonded: boolean        // 是否保税: true=保税(3), false=非保税(1)
  zone: string           // 库位地区: A-Z
  number: string         // 库位分号: 01-99
  level: number          // 库位层数: 1, 2, 3...
  category: string       // 库位分类: shelf(货架)/floor(地面)/large(大件)/small(小件)
  status: string         // 状态: active/disabled
  remark?: string
  createdAt?: string
  updatedAt?: string
}

// 附件相关类型
export interface Attachment {
  id: number
  fileName: string
  fileSize: number
  mimeType: string
  storageType: string
  storagePath: string
  storageUrl?: string
  entityType: string
  entityId: number
  category: string
  uploadedBy?: number
  uploadedByName?: string
  createdAt: string
}

// 待办相关类型
export interface PendingOrdersResponse {
  inbounds: InboundOrder[]
  outbounds: OutboundOrder[]
  counts: {
    inbound: number
    outbound: number
    total: number
  }
}

export interface PendingCountResponse {
  inbound: number
  outbound: number
  total: number
}

// 仪表板统计
export interface DashboardStats {
  todayInbound: number
  todayOutbound: number
  totalSku: number
  totalCustomer: number
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  total?: number
  page?: number
  size?: number
}
