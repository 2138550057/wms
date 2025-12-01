import api from './api';
import { LoginRequest, LoginResponse, User, ApiResponse } from '../types';

export const authAPI = {
  // 获取验证码
  getCaptcha: () =>
    api.get<ApiResponse<{ captchaId: string; captchaSvg: string }>>('/auth/captcha'),

  // 登录
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),

  // 注册
  register: (data: { username: string; password: string; realName?: string; role?: string }) =>
    api.post<ApiResponse<User>>('/auth/register', data),

  // 获取当前用户信息
  getCurrentUser: () =>
    api.get<ApiResponse<User>>('/auth/current'),

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post<ApiResponse>('/auth/change-password', data),

  // 获取用户列表
  getUsers: (params?: { page?: number; size?: number }) =>
    api.get('/auth/users', { params }),
};
