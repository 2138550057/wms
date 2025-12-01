import { get, post } from './request'
import type { LoginRequest, LoginResponse, CaptchaResponse, User } from '@/types'

/**
 * 认证相关 API
 */
export const authAPI = {
  /**
   * 获取验证码
   */
  getCaptcha() {
    return get<CaptchaResponse>('/auth/captcha', undefined, { showLoading: false })
  },

  /**
   * 登录
   */
  login(data: LoginRequest) {
    return post<LoginResponse>('/auth/login', data)
  },

  /**
   * 获取用户信息
   */
  getProfile() {
    return get<User>('/auth/current', undefined, { showLoading: false, showError: false })
  }
}
