// 用户相关类型
export interface User {
  id: number;
  username: string;
  realName?: string;
  email?: string;
  phone?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  captchaId?: string;
  captchaCode?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

// 客户相关类型
export interface Customer {
  id: number;
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

// 入库单相关类型
export interface InboundOrder {
  id: number;
  orderNo: string;
  warehouseEntryNo?: string;
  customerId: number;
  customerName: string;
  contactPerson?: string;
  contactPhone?: string;
  actualQuantity?: number;
  vehicleNumber?: string;
  driverName?: string;
  businessType: string;
  inboundDate: string;
  status: string;
  totalQuantity: number;
  totalVolume?: number;
  totalWeight?: number;
  remark?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  items?: InboundOrderItem[];
}

export interface InboundOrderItem {
  id?: number;
  orderId?: number;
  productName: string;
  productModel?: string;
  sku?: string;
  internalCode?: string;
  productCode?: string;
  shippingMark?: string;
  poNumber?: string;
  locationCode?: string;
  packageType?: string;
  quantity: number;
  length?: number;
  width?: number;
  height?: number;
  unitGrossWeight?: number;    // 单件毛重(kg)
  totalGrossWeight?: number;   // 总毛重(kg)
  area?: number;               // 平方(m²)
  volume?: number;
  remark?: string;
}

// 出库单相关类型
export interface OutboundOrder {
  id: number;
  orderNo: string;
  customerId: number;
  customerName: string;
  contactPerson?: string;
  contactPhone?: string;
  receivingCompany?: string;
  receivingAddress?: string;
  vehicleNumber?: string;
  driverName?: string;
  businessType: string;
  outboundDate: string;
  status: string;
  totalQuantity: number;
  totalVolume?: number;
  totalWeight?: number;
  remark?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  items?: OutboundOrderItem[];
}

export interface OutboundOrderItem {
  id?: number;
  orderId?: number;
  warehouseEntryNo?: string;
  productName: string;
  productModel?: string;
  sku?: string;
  internalCode?: string;
  productCode?: string;
  shippingMark?: string;
  poNumber?: string;
  locationCode?: string;
  packageType?: string;
  quantity: number;
  length?: number;
  width?: number;
  height?: number;
  unitGrossWeight?: number;    // 单件毛重(kg)
  totalGrossWeight?: number;   // 总毛重(kg)
  area?: number;               // 平方(m²)
  volume?: number;
  remark?: string;
}

// 库存相关类型
export interface Inventory {
  id: number;
  sku: string;
  internalCode?: string;
  productName: string;
  productModel?: string;
  productCode?: string;
  customerId: number;
  customerName: string;
  locationCode?: string;
  quantity: number;
  availableQuantity: number;
  lockedQuantity: number;
  length?: number;
  width?: number;
  height?: number;
  unitGrossWeight?: number;    // 单件毛重(kg)
  totalGrossWeight?: number;   // 总毛重(kg)
  area?: number;               // 平方(m²)
  volume?: number;             // 体积(m³)
  warehouseEntryNo?: string;   // 进仓编号
  shippingMark?: string;       // 唛头
  poNumber?: string;           // PO号
  packageType?: string;        // 包装形式
  remark?: string;             // 备注
  lastInboundDate?: string;
  lastOutboundDate?: string;
  createdAt: string;
  updatedAt: string;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  size?: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  size: number;
}

// 库位相关类型
export interface Location {
  id: number;
  code: string;
  name: string;
  warehouse?: string;
  zone?: string;
  aisle?: string;
  shelf?: string;
  layer?: string;
  position?: string;
  status: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// API响应
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// 附件相关类型
export type StorageType = 'local' | 's3' | 'qiniu' | 'aliyun' | 'tencent';

export interface Attachment {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageType: StorageType;
  storagePath: string;
  storageUrl?: string;
  entityType: string;
  entityId: number;
  category: string;              // 附件分类
  uploadedBy?: number;
  uploadedByName?: string;
  isShared: boolean;             // 是否分享
  shareToken?: string;           // 分享令牌
  shareExpireAt?: string;        // 分享过期时间
  createdAt: string;
  updatedAt: string;
}

export interface UploadAttachmentParams {
  file: File;
  entityType: string;
  entityId: number;
  storageType?: StorageType;
  category?: string;             // 附件分类
}

export interface UploadMultipleAttachmentsParams {
  files: File[];
  entityType: string;
  entityId: number;
  storageType?: StorageType;
  category?: string;             // 附件分类
}

export interface AttachmentQueryParams extends PaginationParams {
  entityType?: string;
  entityId?: number;
}

// 系统设置相关类型
export interface SystemSetting {
  id: number;
  settingKey: string;
  settingValue: any;  // 已解析的JSON值
  category: string;
  description?: string;
  isPublic: boolean;
  updatedBy?: number;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessType {
  id: number;
  code: string;
  name: string;
  category: string;  // 'inbound' | 'outbound'
  description?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessTypeFormData {
  code: string;
  name: string;
  category: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}


