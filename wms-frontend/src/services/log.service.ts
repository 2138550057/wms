import api from './api';
import { PaginatedResponse } from '../types';

export interface OperationLog {
  id: number;
  operatorId?: number;
  operatorName: string;
  module: string;
  moduleName: string;
  action: string;
  actionName: string;
  targetId?: number;
  targetNo?: string;
  description: string;
  detail?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface InboundLog {
  id: number;
  orderId: number;
  orderNo: string;
  customerName: string;
  customerId: number;
  inboundDate: string;
  businessType: string;
  status: string;
  warehouseEntryNo: string;
  productName: string;
  productModel?: string;
  sku?: string;
  productCode?: string;
  shippingMark?: string;
  poNumber?: string;
  locationCode?: string;
  packageType?: string;
  quantity: number;
  length?: number;
  width?: number;
  height?: number;
  volume?: number;
  weight?: number;
  remark?: string;
  createdAt: string;
}

export interface OutboundLog {
  id: number;
  orderId: number;
  orderNo: string;
  customerName: string;
  customerId: number;
  outboundDate: string;
  businessType: string;
  status: string;
  receivingCompany?: string;
  receivingAddress?: string;
  vehicleNumber?: string;
  driverName?: string;
  contactPerson?: string;
  contactPhone?: string;
  warehouseEntryNo?: string;
  productName: string;
  productModel?: string;
  sku?: string;
  productCode?: string;
  shippingMark?: string;
  poNumber?: string;
  locationCode?: string;
  packageType?: string;
  quantity: number;
  length?: number;
  width?: number;
  height?: number;
  volume?: number;
  weight?: number;
  remark?: string;
  createdAt: string;
}

export interface InventoryLog {
  id: string;
  operationType: 'inbound' | 'outbound';
  operationTypeName: string;
  orderNo: string;
  customerName: string;
  customerId: number;
  status: string;
  statusName: string;
  businessType: string;
  businessTypeName: string;
  warehouseEntryNo?: string;
  productName: string;
  productModel?: string;
  sku?: string;
  productCode?: string;
  locationCode?: string;
  quantity: number;
  quantityChange: string;
  volume?: number;
  weight?: number;
  createdAt: string;
}

export const logAPI = {
  // 获取操作日志列表
  getOperationLogs: (params?: {
    page?: number;
    size?: number;
    module?: string;
    action?: string;
    operatorName?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get<PaginatedResponse<OperationLog>>('/logs/operations', { params }),

  // 获取入库日志列表
  getInboundLogs: (params?: {
    page?: number;
    size?: number;
    customerName?: string;
    orderNo?: string;
    warehouseEntryNo?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get<PaginatedResponse<InboundLog>>('/logs/inbound', { params }),

  // 获取出库日志列表
  getOutboundLogs: (params?: {
    page?: number;
    size?: number;
    customerName?: string;
    orderNo?: string;
    warehouseEntryNo?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get<PaginatedResponse<OutboundLog>>('/logs/outbound', { params }),

  // 获取库存管理日志
  getInventoryLogs: (params?: {
    page?: number;
    size?: number;
    customerName?: string;
    orderNo?: string;
    warehouseEntryNo?: string;
    dateFrom?: string;
    dateTo?: string;
    operationType?: 'inbound' | 'outbound' | 'all';
  }) => api.get<PaginatedResponse<InventoryLog>>('/logs/inventory', { params }),
};
