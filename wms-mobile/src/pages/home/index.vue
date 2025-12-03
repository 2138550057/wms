<template>
  <view class="home-page">
    <!-- 顶部区域 -->
    <view class="header">
      <view class="header-content">
        <view class="user-info">
          <text class="greeting">您好，</text>
          <text class="username">{{ userStore.realName }}</text>
        </view>
        <view class="header-right">
          <text class="date">{{ currentDate }}</text>
        </view>
      </view>
    </view>

    <!-- 待办统计卡片 -->
    <view class="todo-cards">
      <view class="todo-card inbound" @click="goToTodo('inbound')">
        <view class="card-icon">📦</view>
        <view class="card-info">
          <text class="card-count">{{ todoStore.counts.inbound }}</text>
          <text class="card-label">待入库</text>
        </view>
      </view>
      <view class="todo-card outbound" @click="goToTodo('outbound')">
        <view class="card-icon">📤</view>
        <view class="card-info">
          <text class="card-count">{{ todoStore.counts.outbound }}</text>
          <text class="card-label">待出库</text>
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="section">
      <view class="section-title">快捷操作</view>
      <view class="quick-actions">
        <view class="action-item" @click="navigateTo('/pages/todo/index')">
          <view class="action-icon todo">📋</view>
          <text class="action-text">待办中心</text>
        </view>
        <view class="action-item" @click="navigateTo('/pages/inventory/index')">
          <view class="action-icon inventory">📊</view>
          <text class="action-text">库存查询</text>
        </view>
        <view class="action-item" @click="handleScan">
          <view class="action-icon scan">📷</view>
          <text class="action-text">扫码</text>
        </view>
        <view class="action-item" @click="navigateTo('/pages/profile/index')">
          <view class="action-icon profile">👤</view>
          <text class="action-text">个人中心</text>
        </view>
      </view>
    </view>

    <!-- 今日统计 -->
    <view class="section">
      <view class="section-title">今日概览</view>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-value">{{ stats.todayInbound }}</text>
          <text class="stat-label">今日入库</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.todayOutbound }}</text>
          <text class="stat-label">今日出库</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.totalSku }}</text>
          <text class="stat-label">库存SKU</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.totalCustomer }}</text>
          <text class="stat-label">客户数</text>
        </view>
      </view>
    </view>

    <!-- 最近待办 -->
    <view class="section" v-if="recentOrders.length > 0">
      <view class="section-header">
        <text class="section-title">最近待办</text>
        <text class="section-more" @click="navigateTo('/pages/todo/index')">查看全部 ></text>
      </view>
      <view class="recent-list">
        <view
          v-for="order in recentOrders"
          :key="order.id"
          class="recent-item"
          @click="handleOrderClick(order)"
        >
          <view class="order-type" :class="order.type">
            {{ order.type === 'inbound' ? '入库' : '出库' }}
          </view>
          <view class="order-info">
            <text class="order-no">{{ order.orderNo }}</text>
            <text class="order-customer">{{ order.customerName }}</text>
          </view>
          <view class="order-quantity">
            <text class="quantity-value">{{ order.totalQuantity }}</text>
            <text class="quantity-unit">件</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useTodoStore } from '@/stores/todo'
import { dashboardApi } from '@/api/dashboard'
import dayjs from 'dayjs'
import type { DashboardStats, InboundOrder, OutboundOrder } from '@/types'

const userStore = useUserStore()
const todoStore = useTodoStore()

// 当前日期
const currentDate = computed(() => dayjs().format('MM月DD日 dddd'))

// 仪表板统计
const stats = ref<DashboardStats>({
  todayInbound: 0,
  todayOutbound: 0,
  totalSku: 0,
  totalCustomer: 0
})

// 最近待办订单
const recentOrders = computed(() => {
  const inbounds = todoStore.inbounds.slice(0, 2).map(o => ({ ...o, type: 'inbound' as const }))
  const outbounds = todoStore.outbounds.slice(0, 2).map(o => ({ ...o, type: 'outbound' as const }))
  return [...inbounds, ...outbounds].slice(0, 4)
})

// 获取统计数据
async function fetchStats() {
  try {
    const res = await dashboardApi.getStats()
    if (res.success && res.data) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 跳转到待办
function goToTodo(type: 'inbound' | 'outbound') {
  uni.navigateTo({
    url: `/pages/todo/index?type=${type}`
  })
}

// 页面跳转
function navigateTo(url: string) {
  if (url.includes('todo') || url.includes('inventory') || url.includes('profile')) {
    uni.switchTab({ url })
  } else {
    uni.navigateTo({ url })
  }
}

// 扫码
function handleScan() {
  uni.scanCode({
    scanType: ['barCode', 'qrCode'],
    success: (res) => {
      const code = res.result
      // 根据编码判断类型
      if (code.startsWith('WI')) {
        uni.navigateTo({ url: `/pages/todo/inbound-detail?orderNo=${code}` })
      } else if (code.startsWith('WO')) {
        uni.navigateTo({ url: `/pages/todo/outbound-detail?orderNo=${code}` })
      } else {
        // 可能是SKU，跳转库存搜索
        uni.navigateTo({ url: `/pages/inventory/index?keyword=${code}` })
      }
    },
    fail: () => {
      uni.showToast({ title: '扫码取消', icon: 'none' })
    }
  })
}

// 点击订单
function handleOrderClick(order: any) {
  const url = order.type === 'inbound'
    ? `/pages/todo/inbound-detail?id=${order.id}`
    : `/pages/todo/outbound-detail?id=${order.id}`
  uni.navigateTo({ url })
}

// 初始化数据
async function initData() {
  await Promise.all([
    todoStore.fetchPendingCount(),
    todoStore.fetchPendingOrders(),
    fetchStats()
  ])
}

onMounted(() => {
  initData()
})

onShow(() => {
  // 每次显示页面时刷新待办数量
  todoStore.fetchPendingCount()
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 60rpx 32rpx 80rpx;
  border-radius: 0 0 40rpx 40rpx;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: baseline;
}

.greeting {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.username {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
  margin-left: 8rpx;
}

.date {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.todo-cards {
  display: flex;
  gap: 24rpx;
  padding: 0 32rpx;
  margin-top: -40rpx;
}

.todo-card {
  flex: 1;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);

  &.inbound {
    border-left: 8rpx solid #1890ff;
  }

  &.outbound {
    border-left: 8rpx solid #722ed1;
  }
}

.card-icon {
  font-size: 56rpx;
  margin-right: 20rpx;
}

.card-info {
  display: flex;
  flex-direction: column;
}

.card-count {
  font-size: 48rpx;
  font-weight: bold;
  color: #333333;
}

.card-label {
  font-size: 24rpx;
  color: #999999;
  margin-top: 4rpx;
}

.section {
  margin-top: 32rpx;
  padding: 0 32rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 24rpx;
}

.section-more {
  font-size: 26rpx;
  color: #1890ff;
}

.quick-actions {
  display: flex;
  justify-content: space-between;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 32rpx 20rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.action-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  margin-bottom: 12rpx;

  &.todo {
    background: #e6f7ff;
  }
  &.inventory {
    background: #f6ffed;
  }
  &.scan {
    background: #fff7e6;
  }
  &.profile {
    background: #f9f0ff;
  }
}

.action-text {
  font-size: 24rpx;
  color: #666666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.stat-item {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx 16rpx;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #1890ff;
}

.stat-label {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 8rpx;
}

.recent-list {
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.recent-item {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.order-type {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  margin-right: 20rpx;

  &.inbound {
    background: #e6f7ff;
    color: #1890ff;
  }
  &.outbound {
    background: #f9f0ff;
    color: #722ed1;
  }
}

.order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.order-no {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.order-customer {
  font-size: 24rpx;
  color: #999999;
  margin-top: 4rpx;
}

.order-quantity {
  display: flex;
  align-items: baseline;
}

.quantity-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
}

.quantity-unit {
  font-size: 22rpx;
  color: #999999;
  margin-left: 4rpx;
}
</style>
