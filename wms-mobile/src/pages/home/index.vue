<template>
  <view class="home-page">
    <!-- 顶部用户信息 -->
    <view class="header">
      <view class="user-info">
        <view class="avatar">
          <text class="avatar-text">{{ authStore.userInitial }}</text>
        </view>
        <view class="user-detail">
          <text class="username">{{ authStore.user?.realName || authStore.user?.username || '用户' }}</text>
          <text class="role">{{ roleText }}</text>
        </view>
      </view>
      <view class="header-actions">
        <text class="date">{{ currentDate }}</text>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-section">
      <view class="stats-title">今日概览</view>
      <view class="stats-grid">
        <view class="stat-card" @click="goToTodo">
          <view class="stat-icon todo-icon">&#x1F4CB;</view>
          <view class="stat-info">
            <text class="stat-value">{{ todoStore.counts.total }}</text>
            <text class="stat-label">待办任务</text>
          </view>
        </view>
        <view class="stat-card" @click="goToTodo">
          <view class="stat-icon inbound-icon">&#x1F4E5;</view>
          <view class="stat-info">
            <text class="stat-value">{{ todoStore.counts.inbound }}</text>
            <text class="stat-label">待入库</text>
          </view>
        </view>
        <view class="stat-card" @click="goToTodo">
          <view class="stat-icon outbound-icon">&#x1F4E4;</view>
          <view class="stat-info">
            <text class="stat-value">{{ todoStore.counts.outbound }}</text>
            <text class="stat-label">待出库</text>
          </view>
        </view>
        <view class="stat-card" @click="goToInventory">
          <view class="stat-icon inventory-icon">&#x1F4E6;</view>
          <view class="stat-info">
            <text class="stat-value">--</text>
            <text class="stat-label">库存SKU</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-section">
      <view class="section-title">快捷操作</view>
      <view class="quick-grid-3">
        <view class="quick-item" @click="goToPage('/pages/inbound/index')">
          <view class="quick-icon" style="background: #e6f7ff;">
            <text>📥</text>
          </view>
          <text class="quick-label">入库管理</text>
        </view>
        <view class="quick-item" @click="goToPage('/pages/outbound/index')">
          <view class="quick-icon" style="background: #fff7e6;">
            <text>📤</text>
          </view>
          <text class="quick-label">出库管理</text>
        </view>
        <view class="quick-item" @click="goToInventory">
          <view class="quick-icon" style="background: #f6ffed;">
            <text>📦</text>
          </view>
          <text class="quick-label">库存管理</text>
        </view>
      </view>
    </view>

    <!-- 最近待办 -->
    <view class="recent-section" v-if="recentOrders.length > 0">
      <view class="section-header">
        <text class="section-title">最近待办</text>
        <text class="section-more" @click="goToTodo">查看全部</text>
      </view>
      <view class="order-list">
        <view
          v-for="order in recentOrders"
          :key="`${order.type}-${order.id}`"
          class="order-item"
          @click="goToDetail(order)"
        >
          <view class="order-tag" :class="order.type">
            {{ order.type === 'inbound' ? '入库' : '出库' }}
          </view>
          <view class="order-info">
            <text class="order-no">{{ order.orderNo }}</text>
            <text class="order-customer">{{ order.customerName }}</text>
          </view>
          <view class="order-qty">
            <text class="qty-value">{{ order.totalQuantity }}</text>
            <text class="qty-label">件</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-section" v-else>
      <text class="empty-icon">&#x2705;</text>
      <text class="empty-text">暂无待办任务</text>
    </view>

    <!-- 自定义TabBar -->
    <CustomTabBar :current="0" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'
import { useTodoStore } from '@/stores/todo'
import type { BaseOrder } from '@/types'
import { formatDate } from '@/utils'
import CustomTabBar from '@/components/CustomTabBar.vue'

// Stores
const authStore = useAuthStore()
const todoStore = useTodoStore()

// 当前日期
const currentDate = computed(() => {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekDay = weekDays[now.getDay()]
  return `${month}月${day}日 ${weekDay}`
})

// 角色文字
const roleText = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') return '管理员'
  if (role === 'operator') return '操作员'
  return '普通用户'
})

// 最近待办（最多显示5条）
const recentOrders = computed(() => {
  return todoStore.allPendingOrders.slice(0, 5)
})

// 跳转到待办
function goToTodo() {
  uni.switchTab({ url: '/pages/todo/index' })
}

// 跳转到库存管理（独立页面）
function goToInventory() {
  uni.navigateTo({ url: '/pages/inventory/index' })
}

// 跳转到页面
function goToPage(url: string) {
  uni.navigateTo({ url })
}

// 跳转到订单详情
function goToDetail(order: BaseOrder & { type: 'inbound' | 'outbound' }) {
  const url = order.type === 'inbound'
    ? `/pages/inbound/detail?id=${order.id}`
    : `/pages/outbound/detail?id=${order.id}`
  uni.navigateTo({ url })
}

// 页面加载
onMounted(() => {
  // 获取用户信息
  if (authStore.isLoggedIn && !authStore.user) {
    authStore.fetchProfile()
  }
  // 获取待办数据
  todoStore.fetchPendingOrders()
})

// 页面显示时刷新数据
onShow(() => {
  todoStore.fetchPendingOrders()
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 120rpx;
}

.header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 48rpx 32rpx 64rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.avatar-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
}

.role {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4rpx;
}

.header-actions {
  display: flex;
  align-items: center;
}

.date {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stats-section {
  margin: -32rpx 24rpx 24rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.stats-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;

  &:active {
    background: #f0f0f0;
  }
}

.stat-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;

  &.todo-icon {
    background: #fff1f0;
  }
  &.inbound-icon {
    background: #e6f7ff;
  }
  &.outbound-icon {
    background: #fff7e6;
  }
  &.inventory-icon {
    background: #f6ffed;
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.quick-section {
  margin: 0 24rpx 24rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.quick-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;

  &:active {
    opacity: 0.7;
  }
}

.quick-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  margin-bottom: 12rpx;
}

.quick-label {
  font-size: 24rpx;
  color: #666;
}

.recent-section {
  margin: 0 24rpx 24rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 16rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-more {
  font-size: 26rpx;
  color: #1890ff;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;

  &:active {
    background: #f0f0f0;
  }
}

.order-tag {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 500;
  margin-right: 20rpx;

  &.inbound {
    background: #e6f7ff;
    color: #1890ff;
  }
  &.outbound {
    background: #fff7e6;
    color: #fa8c16;
  }
}

.order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.order-no {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.order-customer {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-qty {
  display: flex;
  align-items: baseline;
  margin-left: 16rpx;
}

.qty-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.qty-label {
  font-size: 22rpx;
  color: #999;
  margin-left: 4rpx;
}

.empty-section {
  margin: 48rpx 24rpx;
  padding: 64rpx;
  background: #fff;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
