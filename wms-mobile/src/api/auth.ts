import { http } from './request'
import type { User, LoginResponse } from '@/types'

export const authApi = {
  // 获取验证码
  getCaptcha() {
    return http.get<{ captchaId: string; captchaSvg: string }>('/auth/captcha', undefined, {
      showLoading: false
    })
  },

  // 登录
  login(data: {
    username: string
    password: string
    captchaId: string
    captchaCode: string
  }) {
    return http.post<LoginResponse>('/auth/login', data)
  },

  // 获取当前用户信息
  getCurrentUser() {
    return http.get<User>('/auth/me')
  },

  // 登出
  logout() {
    return http.post('/auth/logout', undefined, { showLoading: false, showError: false })
  },

  // 修改密码
  changePassword(data: { oldPassword: string; newPassword: string }) {
    return http.put('/users/password', data)
  }
}
