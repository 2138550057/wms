import api from './api';
import { Customer, PaginatedResponse, ApiResponse } from '../types';

export const customerAPI = {
  // 创建客户
  create: (data: Omit<Customer, 'id' | 'createdAt'>) =>
    api.post<ApiResponse<Customer>>('/customers', data),

  // 获取客户列表
  list: (params?: { page?: number; size?: number; name?: string; code?: string }) =>
    api.get<PaginatedResponse<Customer>>('/customers', { params }),

  // 搜索客户
  search: (keyword: string) =>
    api.get<ApiResponse<Customer[]>>('/customers/search', { params: { keyword } }),

  // 获取客户详情
  getById: (id: number) =>
    api.get<ApiResponse<Customer>>(`/customers/${id}`),

  // 更新客户
  update: (id: number, data: Partial<Customer>) =>
    api.put<ApiResponse<Customer>>(`/customers/${id}`, data),

  // 删除客户
  delete: (id: number) =>
    api.delete<ApiResponse>(`/customers/${id}`),
};
