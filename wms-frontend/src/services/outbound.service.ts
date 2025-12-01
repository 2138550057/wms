import api from './api';
import { OutboundOrder, PaginatedResponse, ApiResponse } from '../types';

interface OutboundOrderCreateData {
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
  items: Array<{
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
    weight?: number;
    remark?: string;
  }>;
}

export const outboundAPI = {
  // 检查库存
  checkStock: (data: { customerId: number; items: any[] }) =>
    api.post('/outbound/check-stock', data),

  // 创建出库单
  create: (data: OutboundOrderCreateData) =>
    api.post<ApiResponse<OutboundOrder>>('/outbound/orders', data),

  // 获取出库单列表
  list: (params?: {
    page?: number;
    size?: number;
    customerName?: string;
    orderNo?: string;
    dateFrom?: string;
    dateTo?: string;
  }) =>
    api.get<PaginatedResponse<OutboundOrder>>('/outbound/orders', { params }),

  // 获取出库单详情
  getById: (id: number) =>
    api.get<ApiResponse<OutboundOrder>>(`/outbound/orders/${id}`),

  // 更新出库单
  update: (id: number, data: OutboundOrderCreateData) =>
    api.put<ApiResponse<OutboundOrder>>(`/outbound/orders/${id}`, data),

  // 确认出库
  confirm: (id: number) =>
    api.post<ApiResponse<OutboundOrder>>(`/outbound/orders/${id}/confirm`),

  // 反审核出库单
  reverseAudit: (id: number) =>
    api.post<ApiResponse<OutboundOrder>>(`/outbound/orders/${id}/reverse-audit`),

  // 删除出库单
  delete: (id: number) =>
    api.delete<ApiResponse>(`/outbound/orders/${id}`),

  // 强制删除出库单
  forceDelete: (id: number) =>
    api.delete<ApiResponse>(`/outbound/orders/${id}?force=true`),
};
