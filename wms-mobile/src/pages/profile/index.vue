<template>
  <view class="profile-page">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="avatar">
        <text class="avatar-text">{{ avatarText }}</text>
      </view>
      <view class="user-info">
        <text class="username">{{ userStore.realName || userStore.username }}</text>
        <text class="role">{{ roleText }}</text>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="menu-section">
      <view class="menu-group">
        <view class="menu-item" @click="navigateTo('/pages/profile/password')">
          <view class="menu-icon">🔒</view>
          <text class="menu-text">修改密码</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="showAbout">
          <view class="menu-icon">ℹ️</view>
          <text class="menu-text">关于系统</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @click="clearCache">
          <view class="menu-icon">🗑️</view>
          <text class="menu-text">清除缓存</text>
          <text class="menu-value">{{ cacheSize }}</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item">
          <view class="menu-icon">📱</view>
          <text class="menu-text">当前版本</text>
          <text class="menu-value">{{ appVersion }}</text>
        </view>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-section">
      <view class="logout-btn" @click="handleLogout">
        退出登录
      </view>
    </view>

    <!-- 关于弹窗 -->
    <view class="modal-mask" v-if="showAboutModal" @click="showAboutModal = false">
      <view class="modal-content about-modal" @click.stop>
        <view class="about-header">
          <view class="about-logo">📦</view>
          <text class="about-title">WMS仓库管理系统</text>
          <text class="about-version">移动端 v{{ appVersion }}</text>
        </view>
        <view class="about-body">
          <text class="about-desc">
            WMS仓库管理系统移动端，支持入库、出库待办处理，
            库存查询，扫码操作等功能，与PC端实时同步。
          </text>
          <view class="about-info">
            <view class="info-row">
              <text class="info-label">技术支持</text>
              <text class="info-value">Fexxo Technology</text>
            </view>
            <view class="info-row">
              <text class="info-label">服务器</text>
              <text class="info-value">{{ serverUrl }}</text>
            </view>
          </view>
        </view>
        <view class="about-footer" @click="showAboutModal = false">
          <text>确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const showAboutModal = ref(false)
const cacheSize = ref('0 KB')
const appVersion = ref('1.0.0')
const serverUrl = ref('')

// 头像文字
const avatarText = computed(() => {
  const name = userStore.realName || userStore.username || 'U'
  return name.charAt(0).toUpperCase()
})

// 角色文字
const roleText = computed(() => {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    operator: '操作员',
    viewer: '查看者'
  }
  return roleMap[userStore.role] || '普通用户'
})

// 获取缓存大小
async function getCacheSize() {
  try {
    const res = await uni.getStorageInfo()
    const size = res.currentSize || 0
    if (size < 1024) {
      cacheSize.value = `${size} KB`
    } else {
      cacheSize.value = `${(size / 1024).toFixed(2)} MB`
    }
  } catch (e) {
    cacheSize.value = '未知'
  }
}

// 清除缓存
function clearCache() {
  uni.showModal({
    title: '确认清除',
    content: '确定要清除所有缓存数据吗？（不会清除登录状态）',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 保存token和用户信息
          const token = uni.getStorageSync('token')
          const userInfo = uni.getStorageSync('userInfo')

          // 清除所有存储
          await uni.clearStorage()

          // 恢复token和用户信息
          if (token) {
            uni.setStorageSync('token', token)
          }
          if (userInfo) {
            uni.setStorageSync('userInfo', userInfo)
          }

          await getCacheSize()
          uni.showToast({ title: '清除成功', icon: 'success' })
        } catch (e) {
          uni.showToast({ title: '清除失败', icon: 'none' })
        }
      }
    }
  })
}

// 显示关于
function showAbout() {
  showAboutModal.value = true
}

// 页面跳转
function navigateTo(url: string) {
  uni.navigateTo({ url })
}

// 退出登录
function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        await userStore.logout()
        uni.reLaunch({ url: '/pages/login/index' })
      }
    }
  })
}

// 获取服务器地址
function getServerUrl() {
  // #ifdef H5
  serverUrl.value = window.location.origin
  // #endif

  // #ifndef H5
  serverUrl.value = 'https://wmsapi.fexxo.cn'
  // #endif
}

onMounted(() => {
  getCacheSize()
  getServerUrl()
})
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.user-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 60rpx 32rpx;
  padding-top: calc(60rpx + var(--status-bar-height));
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 32rpx;
}

.avatar-text {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8rpx;
}

.role {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.2);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.menu-section {
  padding: 24rpx 32rpx;
}

.menu-group {
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f5f5f5;
  }
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 24rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
}

.menu-value {
  font-size: 28rpx;
  color: #999999;
  margin-right: 16rpx;
}

.menu-arrow {
  font-size: 28rpx;
  color: #cccccc;
}

.logout-section {
  padding: 48rpx 32rpx;
}

.logout-btn {
  background: #ffffff;
  border-radius: 16rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #ff4d4f;
  font-weight: 500;

  &:active {
    background: #fff2f0;
  }
}

// 弹窗样式
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 600rpx;
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}

.about-modal {
  text-align: center;
}

.about-header {
  padding: 48rpx 32rpx;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}

.about-logo {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.about-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8rpx;
}

.about-version {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.about-body {
  padding: 32rpx;
}

.about-desc {
  display: block;
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
  text-align: left;
  margin-bottom: 32rpx;
}

.about-info {
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 24rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;

  &:first-child {
    border-bottom: 1rpx solid #e8e8e8;
  }
}

.info-label {
  font-size: 26rpx;
  color: #999999;
}

.info-value {
  font-size: 26rpx;
  color: #333333;
}

.about-footer {
  border-top: 1rpx solid #f0f0f0;
  padding: 32rpx;

  text {
    font-size: 32rpx;
    color: #1890ff;
    font-weight: 500;
  }
}
</style>
