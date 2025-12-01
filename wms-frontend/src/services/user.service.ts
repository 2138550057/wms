import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types';

export interface UserData {
  id: number;
  username: string;
  realName?: string;
  email?: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  realName?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface UpdateUserData {
  realName?: string;
  email?: string;
  phone?: string;
  role?: string;
  password?: string;
}

export interface UpdateProfileData {
  realName?: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export const userAPI = {
  // 获取用户列表(管理员)
  list: (params?: { page?: number; size?: number; username?: string; realName?: string; role?: string }) =>
    api.get<PaginatedResponse<UserData>>('/users', { params }),

  // 获取用户详情(管理员)
  getById: (id: number) =>
    api.get<ApiResponse<UserData>>(`/users/${id}`),

  // 创建用户(管理员)
  create: (data: CreateUserData) =>
    api.post<ApiResponse<UserData>>('/users', data),

  // 更新用户(管理员)
  update: (id: number, data: UpdateUserData) =>
    api.put<ApiResponse<UserData>>(`/users/${id}`, data),

  // 删除用户(管理员)
  delete: (id: number) =>
    api.delete<ApiResponse>(`/users/${id}`),

  // 获取当前用户信息
  getProfile: () =>
    api.get<ApiResponse<UserData>>('/users/profile'),

  // 更新当前用户信息
  updateProfile: (data: UpdateProfileData) =>
    api.put<ApiResponse<UserData>>('/users/profile', data),

  // 修改当前用户密码
  changePassword: (data: ChangePasswordData) =>
    api.put<ApiResponse>('/users/change-password', data),
};
