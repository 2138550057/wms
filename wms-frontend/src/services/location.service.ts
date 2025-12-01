import api from './api';
import { Location, PaginatedResponse, ApiResponse } from '../types';

export const locationAPI = {
  // 获取库位列表
  list: (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    status?: string;
  }) =>
    api.get<PaginatedResponse<Location>>('/locations', { params }),

  // 获取可用库位列表(用于下拉选择)
  getActive: () =>
    api.get<ApiResponse<Location[]>>('/locations/active'),

  // 获取库位详情
  getById: (id: number) =>
    api.get<ApiResponse<Location>>(`/locations/${id}`),

  // 创建库位
  create: (data: Partial<Location>) =>
    api.post<ApiResponse<Location>>('/locations', data),

  // 更新库位
  update: (id: number, data: Partial<Location>) =>
    api.put<ApiResponse<Location>>(`/locations/${id}`, data),

  // 删除库位
  delete: (id: number) =>
    api.delete<ApiResponse>(`/locations/${id}`),
};
