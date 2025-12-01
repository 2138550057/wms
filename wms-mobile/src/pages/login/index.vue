<template>
  <view class="login-page">
    <!-- 顶部装饰 -->
    <view class="login-header">
      <view class="logo-wrapper">
        <view class="logo">
          <text class="logo-text">WMS</text>
        </view>
        <text class="app-name">仓库管理系统</text>
        <text class="app-desc">移动端</text>
      </view>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <view class="form-title">账号登录</view>

      <!-- 用户名 -->
      <view class="form-item">
        <view class="input-wrapper">
          <text class="input-icon">&#x1F464;</text>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            class="input"
            @confirm="focusPassword"
          />
        </view>
      </view>

      <!-- 密码 -->
      <view class="form-item">
        <view class="input-wrapper">
          <text class="input-icon">&#x1F512;</text>
          <input
            ref="passwordInput"
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            class="input"
            @confirm="focusCaptcha"
          />
        </view>
      </view>

      <!-- 验证码 -->
      <view class="form-item">
        <view class="input-wrapper captcha-wrapper">
          <text class="input-icon">&#x1F522;</text>
          <input
            ref="captchaInput"
            v-model="form.captchaCode"
            type="text"
            placeholder="验证码"
            class="input captcha-input"
            maxlength="4"
            @confirm="handleLogin"
          />
          <view class="captcha-box" @click="refreshCaptcha">
            <image
              v-if="captchaSvg"
              :src="captchaDataUrl"
              class="captcha-image"
              mode="aspectFit"
            />
            <text v-else class="captcha-loading">加载中</text>
          </view>
        </view>
      </view>

      <!-- 登录按钮 -->
      <button
        class="login-btn"
        :class="{ disabled: !canSubmit }"
        :disabled="!canSubmit || loading"
        @click="handleLogin"
      >
        <text v-if="loading">登录中...</text>
        <text v-else>登 录</text>
      </button>

      <!-- 提示信息 -->
      <view class="login-tips">
        <text class="tip-text">请使用PC端账号登录</text>
      </view>
    </view>

    <!-- 底部版权 -->
    <view class="login-footer">
      <text class="copyright">© 2025 WMS仓库管理系统</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api'

const authStore = useAuthStore()

// 表单数据
const form = ref({
  username: '',
  password: '',
  captchaCode: ''
})

// 验证码
const captchaId = ref('')
const captchaSvg = ref('')
const loading = ref(false)

// 验证码图片URL
const captchaDataUrl = computed(() => {
  if (!captchaSvg.value) return ''
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(captchaSvg.value)}`
})

// 是否可以提交
const canSubmit = computed(() => {
  return (
    form.value.username.trim() &&
    form.value.password.trim() &&
    form.value.captchaCode.trim().length === 4
  )
})

// 聚焦密码输入框
function focusPassword() {
  // UniApp 中无法直接聚焦，这里只是占位
}

// 聚焦验证码输入框
function focusCaptcha() {
  // UniApp 中无法直接聚焦，这里只是占位
}

// 获取验证码
async function refreshCaptcha() {
  try {
    const data = await authAPI.getCaptcha()
    captchaId.value = data.captchaId
    captchaSvg.value = data.captchaSvg
  } catch (error: any) {
    console.error('获取验证码失败:', error)
    uni.showToast({
      title: '获取验证码失败',
      icon: 'none'
    })
  }
}

// 登录
async function handleLogin() {
  if (!canSubmit.value || loading.value) return

  // 表单验证
  if (!form.value.username.trim()) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return
  }
  if (!form.value.password.trim()) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }
  if (form.value.captchaCode.trim().length !== 4) {
    uni.showToast({ title: '请输入4位验证码', icon: 'none' })
    return
  }

  loading.value = true

  try {
    await authStore.login({
      username: form.value.username.trim(),
      password: form.value.password.trim(),
      captchaId: captchaId.value,
      captchaCode: form.value.captchaCode.trim()
    })

    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })

    // 跳转到首页
    setTimeout(() => {
      uni.switchTab({ url: '/pages/home/index' })
    }, 500)
  } catch (error: any) {
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none'
    })
    // 刷新验证码
    form.value.captchaCode = ''
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

// 页面加载时获取验证码
onMounted(() => {
  refreshCaptcha()
})
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1890ff 0%, #096dd9 100%);
  display: flex;
  flex-direction: column;
}

.login-header {
  padding: 120rpx 0 80rpx;
  display: flex;
  justify-content: center;
}

.logo-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  background: #fff;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.logo-text {
  font-size: 56rpx;
  font-weight: bold;
  color: #1890ff;
}

.app-name {
  margin-top: 24rpx;
  font-size: 40rpx;
  font-weight: 600;
  color: #fff;
}

.app-desc {
  margin-top: 8rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.login-form {
  flex: 1;
  margin: 0 32rpx;
  padding: 48rpx 40rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 48rpx;
}

.form-item {
  margin-bottom: 32rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  height: 96rpx;
  padding: 0 24rpx;
  background: #f5f7fa;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s;

  &:focus-within {
    border-color: #1890ff;
    background: #fff;
  }
}

.input-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.input {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: #333;
}

.captcha-wrapper {
  padding-right: 12rpx;
}

.captcha-input {
  flex: 1;
}

.captcha-box {
  width: 180rpx;
  height: 72rpx;
  margin-left: 16rpx;
  background: #e8e8e8;
  border-radius: 8rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-image {
  width: 100%;
  height: 100%;
}

.captcha-loading {
  font-size: 24rpx;
  color: #999;
}

.login-btn {
  margin-top: 48rpx;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(90deg, #1890ff 0%, #096dd9 100%);
  color: #fff;
  font-size: 34rpx;
  font-weight: 600;
  border-radius: 16rpx;
  border: none;

  &::after {
    border: none;
  }

  &.disabled {
    background: #ccc;
    color: #fff;
  }

  &:active:not(.disabled) {
    opacity: 0.9;
  }
}

.login-tips {
  margin-top: 32rpx;
  text-align: center;
}

.tip-text {
  font-size: 26rpx;
  color: #999;
}

.login-footer {
  padding: 40rpx 0;
  text-align: center;
}

.copyright {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}
</style>
