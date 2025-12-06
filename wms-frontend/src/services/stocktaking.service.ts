import api from './api';
import {
  ApiResponse,
  WarehouseLayout,
  WarehouseLayoutElement,
  LocationSummary,
  LocationStatsResponse,
  Inventory,
  PaginatedResponse,
} from '@/types';

export const stocktakingAPI = {
  // 获取仓库布局
  getLayout: (floor: number = 1) =>
    api.get<ApiResponse<WarehouseLayout>>('/stocktaking/layout', {
      params: { floor },
    }),

  // 自动生成布局
  generateLayout: (data: { floor?: number; clearExisting?: boolean }) =>
    api.post<ApiResponse<{ count: number }>>('/stocktaking/layout/generate', data),

  // 批量更新布局
  updateLayoutBatch: (data: { elements: Partial<WarehouseLayoutElement>[]; floor?: number }) =>
    api.post<ApiResponse>('/stocktaking/layout/batch', data),

  // 创建布局元素
  createLayoutElement: (data: Partial<WarehouseLayoutElement>) =>
    api.post<ApiResponse<WarehouseLayoutElement>>('/stocktaking/layout', data),

  // 更新布局元素
  updateLayoutElement: (id: number, data: Partial<WarehouseLayoutElement>) =>
    api.put<ApiResponse<WarehouseLayoutElement>>(`/stocktaking/layout/${id}`, data),

  // 删除布局元素
  deleteLayoutElement: (id: number) =>
    api.delete<ApiResponse>(`/stocktaking/layout/${id}`),

  // 获取库位汇总信息
  getLocationSummary: (locationCode: string) =>
    api.get<ApiResponse<LocationSummary>>(`/stocktaking/location/${locationCode}/summary`),

  // 获取所有库位统计
  getAllLocationsSummary: (params?: {
    zone?: string;
    bonded?: string;
    hasInventory?: string;
  }) =>
    api.get<LocationStatsResponse & { success: boolean }>('/stocktaking/locations/summary', {
      params,
    }),

  // 更新库存库位
  updateInventoryLocation: (inventoryId: number, locationCode: string | null) =>
    api.put<ApiResponse<Inventory>>(`/stocktaking/inventory/${inventoryId}/location`, {
      locationCode,
    }),

  // 批量更新库存库位
  batchUpdateInventoryLocation: (inventoryIds: number[], locationCode: string | null) =>
    api.post<ApiResponse<{ count: number }>>('/stocktaking/inventory/batch-location', {
      inventoryIds,
      locationCode,
    }),

  // 获取未分配库位的库存
  getUnassignedInventory: (params?: {
    page?: number;
    size?: number;
    customerName?: string;
    productName?: string;
    sku?: string;
  }) =>
    api.get<PaginatedResponse<Inventory>>('/stocktaking/inventory/unassigned', { params }),
};

export default stocktakingAPI;
