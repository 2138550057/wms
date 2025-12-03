<template>
  <view class="login-page">
    <!-- 顶部装饰 -->
    <view class="login-header">
      <view class="logo-wrapper">
        <text class="logo-icon">📦</text>
      </view>
      <text class="app-name">WMS 仓储助手</text>
      <text class="app-desc">仓库管理移动端</text>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <view class="form-item">
        <view class="input-wrapper">
          <text class="input-icon">👤</text>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            class="form-input"
            @confirm="focusPassword"
          />
        </view>
      </view>

      <view class="form-item">
        <view class="input-wrapper">
          <text class="input-icon">🔒</text>
          <input
            v-model="form.password"
            :password="!showPassword"
            placeholder="请输入密码"
            class="form-input"
            @confirm="handleLogin"
          />
          <text class="toggle-password" @click="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </text>
        </view>
      </view>

      <view class="form-item captcha-item">
        <view class="input-wrapper captcha-input">
          <text class="input-icon">🔢</text>
          <input
            v-model="form.captchaCode"
            type="text"
            placeholder="验证码"
            class="form-input"
            maxlength="4"
            @confirm="handleLogin"
          />
        </view>
        <view class="captcha-image" @click="refreshCaptcha">
          <image
            v-if="captchaDataUrl"
            :src="captchaDataUrl"
            mode="aspectFit"
            class="captcha-img"
          />
          <text v-else class="captcha-loading">{{ captchaLoading ? '加载中...' : '点击获取' }}</text>
        </view>
      </view>

      <button
        class="login-btn"
        :class="{ disabled: !canSubmit || loading }"
        :disabled="!canSubmit || loading"
        @click="handleLogin"
      >
        <text v-if="loading">登录中...</text>
        <text v-else>登 录</text>
      </button>
    </view>

    <!-- 底部信息 -->
    <view class="login-footer">
      <text class="version">v1.0.0</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { authApi } from '@/api/auth'

const userStore = useUserStore()

// 表单数据
const form = reactive({
  username: '',
  password: '',
  captchaCode: ''
})

const captchaId = ref('')
const captchaDataUrl = ref('')
const captchaLoading = ref(false)
const loading = ref(false)
const showPassword = ref(false)

// 是否可以提交
const canSubmit = computed(() => {
  return form.username.trim() && form.password.trim() && form.captchaCode.trim().length >= 4
})

// Base64 编码函数 (兼容微信小程序)
function base64Encode(str: string): string {
  // 微信小程序没有 btoa，使用自定义实现
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let output = ''
  for (let i = 0; i < str.length; i += 3) {
    const char1 = str.charCodeAt(i)
    const char2 = i + 1 < str.length ? str.charCodeAt(i + 1) : NaN
    const char3 = i + 2 < str.length ? str.charCodeAt(i + 2) : NaN

    const enc1 = char1 >> 2
    const enc2 = ((char1 & 3) << 4) | (char2 >> 4)
    const enc3 = isNaN(char2) ? 64 : ((char2 & 15) << 2) | (char3 >> 6)
    const enc4 = isNaN(char3) ? 64 : char3 & 63

    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4)
  }
  return output
}

// 将 SVG 字符串转换为 base64 data URL
function svgToDataUrl(svg: string): string {
  // 对 SVG 进行 base64 编码
  const encoded = unescape(encodeURIComponent(svg))
  const base64 = base64Encode(encoded)
  return `data:image/svg+xml;base64,${base64}`
}

// 获取验证码
async function refreshCaptcha() {
  if (captchaLoading.value) return

  captchaLoading.value = true
  try {
    const res = await authApi.getCaptcha()
    if (res.success && res.data) {
      captchaId.value = res.data.captchaId
      // 将 SVG 转换为 data URL
      captchaDataUrl.value = svgToDataUrl(res.data.captchaSvg)
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
    captchaDataUrl.value = ''
  } finally {
    captchaLoading.value = false
  }
}

// 聚焦密码输入框
function focusPassword() {
  // uni-app 中使用 ref 方式略有不同，这里简化处理
}

// 登录
async function handleLogin() {
  if (!canSubmit.value || loading.value) return

  loading.value = true
  try {
    const res = await authApi.login({
      username: form.username.trim(),
      password: form.password,
      captchaId: captchaId.value,
      captchaCode: form.captchaCode.trim()
    })

    if (res.success && res.data) {
      // 保存登录信息
      userStore.setLogin(res.data.token, res.data.user)

      uni.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })

      // 跳转到首页
      setTimeout(() => {
        uni.switchTab({ url: '/pages/home/index' })
      }, 1500)
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    // 刷新验证码
    refreshCaptcha()
    form.captchaCode = ''
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 如果已登录，直接跳转首页
  if (userStore.isLoggedIn) {
    uni.switchTab({ url: '/pages/home/index' })
    return
  }
  refreshCaptcha()
})
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1890ff 0%, #096dd9 100%);
  display: flex;
  flex-direction: column;
  padding: 0 40rpx;
}

.login-header {
  padding-top: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.logo-wrapper {
  width: 160rpx;
  height: 160rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.logo-icon {
  font-size: 80rpx;
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 16rpx;
}

.app-desc {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.login-form {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.form-item {
  margin-bottom: 32rpx;

  &:last-of-type {
    margin-bottom: 48rpx;
  }
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 0 24rpx;
  height: 96rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s;

  &:focus-within {
    border-color: #1890ff;
    background: #ffffff;
  }
}

.input-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.form-input {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: #333333;
}

.toggle-password {
  font-size: 36rpx;
  padding: 10rpx;
}

.captcha-item {
  display: flex;
  gap: 20rpx;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 200rpx;
  height: 96rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-img {
  width: 100%;
  height: 100%;
}

.captcha-loading {
  font-size: 24rpx;
  color: #999999;
}

.login-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
  border: none;
  border-radius: 12rpx;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    border: none;
  }

  &:active {
    opacity: 0.9;
  }

  &.disabled {
    background: #cccccc;
    color: #ffffff;
  }
}

.login-footer {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 60rpx;
}

.version {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}
</style>
