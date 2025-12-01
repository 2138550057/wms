/**
 * 环境变量类型声明
 */
declare global {
  interface ImportMetaEnv {
    VITE_API_BASE_URL: string
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

/**
 * API 响应类型
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  total?: number
  page?: number
  size?: number
  error?: {
    code: string
    message: string
  }
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  size: number
}

/**
 * 用户信息
 */
export interface User {
  id: number
  username: string
  realName: string
  role: 'admin' | 'operator' | 'user'
  avatar?: string
  phone?: string
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string
  password: string
  captchaId?: string
  captchaCode?: string
}

/**
 * 登录响应
 */
export interface LoginResponse {
  token: string
  user: User
}

/**
 * 验证码响应
 */
export interface CaptchaResponse {
  captchaId: string
  captchaSvg: string
}

/**
 * 订单项
 */
export interface OrderItem {
  id: number
  productName: string
  productModel?: string
  sku?: string
  internalCode?: string
  productCode?: string
  shippingMark?: string
  poNumber?: string
  warehouseEntryNo?: string
  quantity: number
  declaredQuantity?: number
  packageType?: string
  length?: number
  width?: number
  height?: number
  volume?: number
  area?: number
  unitGrossWeight?: number
  totalGrossWeight?: number
  locationCode?: string
  remark?: string
}

/**
 * 基础订单
 */
export interface BaseOrder {
  id: number
  orderNo: string
  customerId: number
  customerName: string
  warehouseEntryNo?: string
  businessType?: string
  totalQuantity: number
  totalVolume?: number
  totalWeight?: number
  status: 'pending' | 'completed'
  remark?: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

/**
 * 入库单
 */
export interface InboundOrder extends BaseOrder {
  deliveryCompany?: string
  vehicleNumber?: string
  inboundDate?: string
}

/**
 * 出库单
 */
export interface OutboundOrder extends BaseOrder {
  outboundDate?: string
  recipientName?: string
  recipientPhone?: string
  recipientAddress?: string
  deliveryAddress?: string
}

/**
 * 库存
 */
export interface Inventory {
  id: number
  customerId: number
  customerName: string
  sku?: string
  productName: string
  productModel?: string
  internalCode?: string
  warehouseEntryNo?: string
  shippingMark?: string
  locationCode?: string
  quantity: number
  availableQuantity: number
  lockedQuantity?: number
  length?: number
  width?: number
  height?: number
  volume?: number
  area?: number
  unitGrossWeight?: number
  totalGrossWeight?: number
  weight?: number
  lastInboundDate?: string
  lastOutboundDate?: string
  remark?: string
}

/**
 * 待办统计
 */
export interface TodoCounts {
  inbound: number
  outbound: number
  total: number
}

/**
 * 待办数据
 */
export interface TodoData {
  inbounds: BaseOrder[]
  outbounds: BaseOrder[]
  counts: TodoCounts
}

/**
 * 确认操作请求
 */
export interface ConfirmRequest {
  source?: 'pc' | 'mobile' | 'h5' | 'miniprogram'
  attachmentIds?: number[]
  remark?: string
  images?: string[]
  items?: OrderItem[]
}

/**
 * 附件
 */
export interface Attachment {
  id: number
  entityType: string
  entityId: number
  filename: string
  originalName: string
  category: string
  storagePath?: string
  storageUrl: string
  url?: string
  fileSize: number
  mimeType: string
  createdAt: string
}

/**
 * 客户
 */
export interface Customer {
  id: number
  name: string
  code?: string
  contact?: string
  phone?: string
}
