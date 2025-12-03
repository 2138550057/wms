import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>(uni.getStorageSync('token') || '')
  const user = ref<User | null>(null)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => user.value?.username || '')
  const realName = computed(() => user.value?.realName || user.value?.username || '')

  // 初始化用户信息
  function initUser() {
    const storedUser = uni.getStorageSync('user')
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (e) {
        user.value = null
      }
    }
  }

  // 设置登录信息
  function setLogin(loginToken: string, loginUser: User) {
    token.value = loginToken
    user.value = loginUser
    uni.setStorageSync('token', loginToken)
    uni.setStorageSync('user', JSON.stringify(loginUser))
  }

  // 登出
  function logout() {
    token.value = ''
    user.value = null
    uni.removeStorageSync('token')
    uni.removeStorageSync('user')
  }

  // 检查登录状态
  function checkLogin(): boolean {
    if (!token.value) {
      uni.reLaunch({ url: '/pages/login/index' })
      return false
    }
    return true
  }

  // 初始化
  initUser()

  return {
    token,
    user,
    isLoggedIn,
    username,
    realName,
    setLogin,
    logout,
    checkLogin,
    initUser
  }
})
