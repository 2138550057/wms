import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/api'
import type { User, LoginRequest } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string>(uni.getStorageSync('token') || '')
  const user = ref<User | null>(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userInitial = computed(() => {
    const name = user.value?.realName || user.value?.username || '?'
    return name.charAt(0).toUpperCase()
  })

  // Actions

  /**
   * 登录
   */
  async function login(params: LoginRequest) {
    const data = await authAPI.login(params)

    token.value = data.token
    user.value = data.user

    // 保存 token 到本地
    uni.setStorageSync('token', data.token)

    return data
  }

  /**
   * 获取用户信息
   */
  async function fetchProfile() {
    if (!token.value) return

    try {
      const profile = await authAPI.getProfile()
      user.value = profile
    } catch (error) {
      // 如果获取失败，清除登录状态
      logout()
    }
  }

  /**
   * 退出登录
   */
  function logout() {
    token.value = ''
    user.value = null
    uni.removeStorageSync('token')
    uni.reLaunch({ url: '/pages/login/index' })
  }

  /**
   * 检查登录状态
   */
  function checkAuth(): boolean {
    if (!token.value) {
      uni.reLaunch({ url: '/pages/login/index' })
      return false
    }
    return true
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    userInitial,
    login,
    fetchProfile,
    logout,
    checkAuth
  }
})
