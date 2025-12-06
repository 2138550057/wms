import api from './api';
import { InboundOrder, PaginatedResponse, ApiResponse } from '../types';

interface InboundOrderCreateData {
  customerId: number;
  customerName: string;
  contactPerson?: string;
  contactPhone?: string;
  deliveryCompany?: string;
  vehicleNumber?: string;
  driverName?: string;
  businessType?: string;
  inboundDate: string;
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
    unitGrossWeight?: number;    // 单件毛重(kg)
    totalGrossWeight?: number;   // 总毛重(kg)
    area?: number;               // 平方(m²)
    remark?: string;
  }>;
}

export const inboundAPI = {
  // 创建入库单
  create: (data: InboundOrderCreateData) =>
    api.post<ApiResponse<InboundOrder>>('/inbound/orders', data),

  // 获取入库单列表
  list: (params?: {
    page?: number;
    size?: number;
    customerName?: string;
    orderNo?: string;
    dateFrom?: string;
    dateTo?: string;
  }) =>
    api.get<PaginatedResponse<InboundOrder>>('/inbound/orders', { params }),

  // 获取入库单详情
  getById: (id: number) =>
    api.get<ApiResponse<InboundOrder>>(`/inbound/orders/${id}`),

  // 更新入库单
  update: (id: number, data: InboundOrderCreateData) =>
    api.put<ApiResponse<InboundOrder>>(`/inbound/orders/${id}`, data),

  // 确认入库
  confirm: (id: number) =>
    api.post<ApiResponse<InboundOrder>>(`/inbound/orders/${id}/confirm`),

  // 反审核入库单
  reverseAudit: (id: number) =>
    api.post<ApiResponse<InboundOrder>>(`/inbound/orders/${id}/reverse-audit`),

  // 删除入库单
  delete: (id: number) =>
    api.delete<ApiResponse>(`/inbound/orders/${id}`),

  // 强制删除入库单
  forceDelete: (id: number) =>
    api.delete<ApiResponse>(`/inbound/orders/${id}?force=true`),

  // 检查重复进仓编号
  checkDuplicates: (entryNos: string[]) =>
    api.post('/inbound/check-duplicates', { entryNos }),
};
