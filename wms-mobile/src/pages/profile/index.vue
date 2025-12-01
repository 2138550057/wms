<template>
  <view class="profile-page">
    <!-- 用户信息头部 -->
    <view class="profile-header">
      <view class="avatar">
        <text class="avatar-text">{{ userInitial }}</text>
      </view>
      <view class="user-info">
        <text class="username">{{ authStore.user?.realName || authStore.user?.username || '用户' }}</text>
        <text class="role">{{ roleText }}</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-group">
        <view class="menu-item" @click="goToPage('/pages/inbound/index')">
          <view class="menu-icon" style="background: #e6f7ff;">
            <text>&#x1F4E5;</text>
          </view>
          <text class="menu-text">入库管理</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goToPage('/pages/outbound/index')">
          <view class="menu-icon" style="background: #fff7e6;">
            <text>&#x1F4E4;</text>
          </view>
          <text class="menu-text">出库管理</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goToPage('/pages/inventory/index')">
          <view class="menu-icon" style="background: #f6ffed;">
            <text>&#x1F4E6;</text>
          </view>
          <text class="menu-text">库存查询</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @click="showAbout">
          <view class="menu-icon" style="background: #f0f5ff;">
            <text>&#x2139;</text>
          </view>
          <text class="menu-text">关于我们</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="checkUpdate">
          <view class="menu-icon" style="background: #f9f0ff;">
            <text>&#x1F504;</text>
          </view>
          <text class="menu-text">检查更新</text>
          <view class="menu-extra">
            <text class="version">v1.0.0</text>
          </view>
        </view>
        <view class="menu-item" @click="clearCache">
          <view class="menu-icon" style="background: #fff1f0;">
            <text>&#x1F5D1;</text>
          </view>
          <text class="menu-text">清除缓存</text>
          <view class="menu-extra">
            <text class="cache-size">{{ cacheSize }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-section">
      <button class="logout-btn" @click="handleLogout">
        退出登录
      </button>
    </view>

    <!-- 底部版权 -->
    <view class="footer">
      <text class="copyright">© 2025 WMS仓库管理系统</text>
    </view>

    <!-- 自定义TabBar -->
    <CustomTabBar :current="3" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'
import { useTodoStore } from '@/stores/todo'
import CustomTabBar from '@/components/CustomTabBar.vue'

// Stores
const authStore = useAuthStore()
const todoStore = useTodoStore()

// 缓存大小
const cacheSize = ref('计算中...')

// 用户首字母
const userInitial = computed(() => {
  const name = authStore.user?.realName || authStore.user?.username || 'U'
  return name.charAt(0).toUpperCase()
})

// 角色文字
const roleText = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') return '管理员'
  if (role === 'operator') return '操作员'
  return '普通用户'
})

// 跳转页面
function goToPage(url: string) {
  uni.navigateTo({ url })
}

// 显示关于
function showAbout() {
  uni.showModal({
    title: '关于我们',
    content: 'WMS仓库管理系统移动端\n\n版本: 1.0.0\n\n用于仓库现场入库出库操作、库存查询等功能。',
    showCancel: false
  })
}

// 检查更新
function checkUpdate() {
  uni.showLoading({ title: '检查中...' })

  setTimeout(() => {
    uni.hideLoading()
    uni.showModal({
      title: '检查更新',
      content: '当前已是最新版本',
      showCancel: false
    })
  }, 1000)
}

// 计算缓存大小
function calculateCacheSize() {
  // #ifdef APP-PLUS
  // @ts-ignore - plus.cache is a native API
  plus.cache.calculate((size: number) => {
    if (size < 1024) {
      cacheSize.value = size + ' B'
    } else if (size < 1024 * 1024) {
      cacheSize.value = (size / 1024).toFixed(2) + ' KB'
    } else {
      cacheSize.value = (size / 1024 / 1024).toFixed(2) + ' MB'
    }
  })
  // #endif

  // #ifndef APP-PLUS
  cacheSize.value = '0 KB'
  // #endif
}

// 清除缓存
function clearCache() {
  uni.showModal({
    title: '提示',
    content: '确定要清除缓存吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '清除中...' })

        // 清除扫码历史
        uni.removeStorageSync('scanHistory')

        // #ifdef APP-PLUS
        // @ts-ignore - plus.cache is a native API
        plus.cache.clear(() => {
          uni.hideLoading()
          uni.showToast({ title: '清除成功', icon: 'success' })
          calculateCacheSize()
        })
        // #endif

        // #ifndef APP-PLUS
        setTimeout(() => {
          uni.hideLoading()
          uni.showToast({ title: '清除成功', icon: 'success' })
          cacheSize.value = '0 KB'
        }, 500)
        // #endif
      }
    }
  })
}

// 退出登录
function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 停止待办轮询
        todoStore.stopPolling()

        // 执行登出
        authStore.logout()

        // 跳转到登录页
        uni.reLaunch({ url: '/pages/login/index' })
      }
    }
  })
}

// 页面加载
onMounted(() => {
  calculateCacheSize()

  // 获取用户信息
  if (authStore.isLoggedIn && !authStore.user) {
    authStore.fetchProfile()
  }
})

// 页面显示
onShow(() => {
  calculateCacheSize()
})
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.profile-header {
  display: flex;
  align-items: center;
  padding: 64rpx 32rpx;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}

.avatar {
  width: 128rpx;
  height: 128rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 32rpx;
}

.avatar-text {
  font-size: 56rpx;
  font-weight: bold;
  color: #fff;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 40rpx;
  font-weight: 600;
  color: #fff;
}

.role {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

.menu-section {
  padding: 24rpx;
}

.menu-group {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #fafafa;
  }
}

.menu-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  margin-right: 24rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.menu-arrow {
  font-size: 36rpx;
  color: #ccc;
}

.menu-extra {
  display: flex;
  align-items: center;
}

.version,
.cache-size {
  font-size: 26rpx;
  color: #999;
  margin-right: 8rpx;
}

.logout-section {
  padding: 48rpx 32rpx;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #fff;
  color: #ff4d4f;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 16rpx;
  border: 2rpx solid #ff4d4f;

  &::after {
    border: none;
  }

  &:active {
    background: #fff1f0;
  }
}

.footer {
  padding: 40rpx;
  text-align: center;
}

.copyright {
  font-size: 24rpx;
  color: #999;
}
</style>
