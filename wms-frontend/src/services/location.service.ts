import api from './api';
import { Location, LocationFilterOptions, PaginatedResponse, ApiResponse } from '../types';

export const locationAPI = {
  // 获取库位列表
  list: (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    status?: string;
    bonded?: string;
    zone?: string;
    category?: string;
  }) =>
    api.get<PaginatedResponse<Location>>('/locations', { params }),

  // 获取可用库位列表(用于下拉选择，支持分级筛选)
  getActive: (params?: {
    bonded?: string;
    zone?: string;
    category?: string;
    keyword?: string;
  }) =>
    api.get<ApiResponse<Location[]>>('/locations/active', { params }),

  // 获取库位筛选选项
  getFilterOptions: () =>
    api.get<ApiResponse<LocationFilterOptions>>('/locations/filter-options'),

  // 获取库位详情
  getById: (id: number) =>
    api.get<ApiResponse<Location>>(`/locations/${id}`),

  // 创建库位
  create: (data: {
    bonded: boolean;
    zone: string;
    number: string;
    level: number;
    category: string;
    status?: string;
    remark?: string;
  }) =>
    api.post<ApiResponse<Location>>('/locations', data),

  // 批量创建库位
  batchCreate: (data: {
    bonded: boolean;
    zone: string;
    numberStart: number;
    numberEnd: number;
    levelStart: number;
    levelEnd: number;
    category: string;
  }) =>
    api.post<ApiResponse<{ created: number; skipped: number }>>('/locations/batch', data),

  // 更新库位
  update: (id: number, data: Partial<Location>) =>
    api.put<ApiResponse<Location>>(`/locations/${id}`, data),

  // 删除库位
  delete: (id: number) =>
    api.delete<ApiResponse>(`/locations/${id}`),

  // 批量删除库位
  batchDelete: (ids: number[]) =>
    api.post<ApiResponse<{ count: number }>>('/locations/batch-delete', { ids }),
};
