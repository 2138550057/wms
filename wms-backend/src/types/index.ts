export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface InboundOrderCreateData {
  customerId: number;
  customerName: string;
  warehouseEntryNo?: string;
  contactPerson?: string;
  contactPhone?: string;
  actualQuantity?: number;
  vehicleNumber?: string;
  driverName?: string;
  businessType?: string;
  inboundDate: string;
  remark?: string;
  items: InboundOrderItemData[];
}

export interface InboundOrderItemData {
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
  unitGrossWeight?: number;
  totalGrossWeight?: number;
  area?: number;
  remark?: string;
}

export interface OutboundOrderCreateData {
  customerId: number;
  customerName: string;
  contactPerson?: string;
  contactPhone?: string;
  receivingCompany?: string;
  receivingAddress?: string;
  vehicleNumber?: string;
  driverName?: string;
  businessType?: string;
  outboundDate: string;
  remark?: string;
  items: OutboundOrderItemData[];
}

export interface OutboundOrderItemData {
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
  unitGrossWeight?: number;
  totalGrossWeight?: number;
  area?: number;
  remark?: string;
}

export interface InventoryQueryParams extends PaginationParams {
  customerId?: number;
  customerName?: string;
  sku?: string;
  productName?: string;
  locationCode?: string;
}
