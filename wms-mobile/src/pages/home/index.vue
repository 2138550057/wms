<template>
  <view class="home-page">
    <!-- 顶部区域 -->
    <view class="header">
      <view class="header-bg"></view>
      <view class="header-content">
        <view class="user-section">
          <view class="avatar">
            <text class="avatar-text">{{ userStore.realName?.charAt(0) || 'U' }}</text>
          </view>
          <view class="user-info">
            <text class="greeting">{{ greetingText }}</text>
            <text class="username">{{ userStore.realName || '用户' }}</text>
          </view>
        </view>
        <view class="header-right">
          <view class="weather-info">
            <text class="date">{{ currentDate }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 待办统计卡片 -->
    <view class="todo-cards">
      <view class="todo-card inbound" @click="goToTodo('inbound')">
        <view class="card-bg inbound-bg"></view>
        <view class="card-content">
          <view class="card-header">
            <view class="card-icon-wrapper inbound">
              <text class="card-icon">📦</text>
            </view>
            <view class="card-badge" v-if="todoStore.counts.inbound > 0">
              <text class="badge-text">待处理</text>
            </view>
          </view>
          <view class="card-body">
            <text class="card-count">{{ todoStore.counts.inbound }}</text>
            <text class="card-label">待入库订单</text>
          </view>
        </view>
      </view>
      <view class="todo-card outbound" @click="goToTodo('outbound')">
        <view class="card-bg outbound-bg"></view>
        <view class="card-content">
          <view class="card-header">
            <view class="card-icon-wrapper outbound">
              <text class="card-icon">📤</text>
            </view>
            <view class="card-badge" v-if="todoStore.counts.outbound > 0">
              <text class="badge-text">待处理</text>
            </view>
          </view>
          <view class="card-body">
            <text class="card-count">{{ todoStore.counts.outbound }}</text>
            <text class="card-label">待出库订单</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="section">
      <view class="section-title">快捷操作</view>
      <view class="quick-actions">
        <view class="action-row">
          <view class="action-item" @click="navigateTo('/pages/todo/index')">
            <view class="action-icon todo">
              <text class="icon-emoji">📋</text>
            </view>
            <text class="action-text">待办中心</text>
          </view>
          <view class="action-item" @click="navigateTo('/pages/inventory/index')">
            <view class="action-icon inventory">
              <text class="icon-emoji">📊</text>
            </view>
            <text class="action-text">库存查询</text>
          </view>
          <view class="action-item" @click="goToStocktaking">
            <view class="action-icon stocktaking">
              <text class="icon-emoji">🗂️</text>
            </view>
            <text class="action-text">盘库管理</text>
          </view>
          <view class="action-item" @click="handleScan">
            <view class="action-icon scan">
              <text class="icon-emoji">📷</text>
            </view>
            <text class="action-text">扫码</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 数据概览 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">数据概览</text>
        <text class="section-date">{{ todayText }}</text>
      </view>
      <view class="stats-container">
        <view class="stats-row">
          <view class="stat-card primary">
            <view class="stat-icon-bg">
              <text class="stat-icon">📥</text>
            </view>
            <view class="stat-info">
              <text class="stat-value">{{ stats.todayInbound }}</text>
              <text class="stat-label">今日入库</text>
            </view>
          </view>
          <view class="stat-card success">
            <view class="stat-icon-bg">
              <text class="stat-icon">📤</text>
            </view>
            <view class="stat-info">
              <text class="stat-value">{{ stats.todayOutbound }}</text>
              <text class="stat-label">今日出库</text>
            </view>
          </view>
        </view>
        <view class="stats-row">
          <view class="stat-card warning">
            <view class="stat-icon-bg">
              <text class="stat-icon">📦</text>
            </view>
            <view class="stat-info">
              <text class="stat-value">{{ stats.totalSku }}</text>
              <text class="stat-label">库存SKU</text>
            </view>
          </view>
          <view class="stat-card info">
            <view class="stat-icon-bg">
              <text class="stat-icon">👥</text>
            </view>
            <view class="stat-info">
              <text class="stat-value">{{ stats.totalCustomer }}</text>
              <text class="stat-label">客户总数</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 库位概况 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">库位概况</text>
        <text class="section-more" @click="goToStocktaking">查看详情 ></text>
      </view>
      <view class="location-overview">
        <view class="overview-chart">
          <view class="chart-ring">
            <view class="ring-progress" :style="{ background: locationRingStyle }"></view>
            <view class="ring-center">
              <text class="ring-percent">{{ locationUsagePercent }}%</text>
              <text class="ring-label">使用率</text>
            </view>
          </view>
        </view>
        <view class="overview-stats">
          <view class="overview-item">
            <view class="overview-dot occupied"></view>
            <text class="overview-label">已占用</text>
            <text class="overview-value">{{ locationStats.occupied }}</text>
          </view>
          <view class="overview-item">
            <view class="overview-dot empty"></view>
            <text class="overview-label">空置</text>
            <text class="overview-value">{{ locationStats.empty }}</text>
          </view>
          <view class="overview-item">
            <view class="overview-dot unassigned"></view>
            <text class="overview-label">未分配库存</text>
            <text class="overview-value">{{ locationStats.unassigned }}</text>
          </view>
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
            {{ order.type === 'inbound' ? '入' : '出' }}
          </view>
          <view class="order-info">
            <text class="order-no">{{ order.orderNo }}</text>
            <text class="order-customer">{{ order.customerName }}</text>
          </view>
          <view class="order-right">
            <text class="order-quantity">{{ order.totalQuantity }}件</text>
            <text class="order-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部留白 -->
    <view class="bottom-space"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useTodoStore } from '@/stores/todo'
import { dashboardApi } from '@/api/dashboard'
import { stocktakingApi } from '@/api/stocktaking'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import type { DashboardStats } from '@/types'

dayjs.locale('zh-cn')

const userStore = useUserStore()
const todoStore = useTodoStore()

// 问候语
const greetingText = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

// 当前日期
const currentDate = computed(() => dayjs().format('MM/DD ddd'))
const todayText = computed(() => dayjs().format('YYYY年MM月DD日'))

// 仪表板统计
const stats = ref<DashboardStats>({
  todayInbound: 0,
  todayOutbound: 0,
  totalSku: 0,
  totalCustomer: 0
})

// 库位统计
const locationStats = ref({
  total: 0,
  occupied: 0,
  empty: 0,
  unassigned: 0
})

// 库位使用率
const locationUsagePercent = computed(() => {
  if (locationStats.value.total === 0) return 0
  return Math.round((locationStats.value.occupied / locationStats.value.total) * 100)
})

// 圆环样式
const locationRingStyle = computed(() => {
  const percent = locationUsagePercent.value
  return `conic-gradient(#1890ff 0% ${percent}%, #e8e8e8 ${percent}% 100%)`
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

// 获取库位统计
async function fetchLocationStats() {
  try {
    const [locRes, unassignedRes] = await Promise.all([
      stocktakingApi.getAllLocationsSummary(),
      stocktakingApi.getUnassignedInventory({ page: 1, size: 1 })
    ])

    if (locRes.success) {
      const locStats = (locRes as any).stats || {}
      locationStats.value.total = locStats.totalLocations || 0
      locationStats.value.occupied = locStats.occupiedLocations || 0
      locationStats.value.empty = locStats.emptyLocations || 0
    }

    if (unassignedRes.success) {
      locationStats.value.unassigned = unassignedRes.total || 0
    }
  } catch (error) {
    console.error('获取库位统计失败:', error)
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

// 跳转到盘库管理
function goToStocktaking() {
  uni.navigateTo({ url: '/pages/stocktaking/index' })
}

// 扫码
function handleScan() {
  uni.scanCode({
    scanType: ['barCode', 'qrCode'],
    success: (res) => {
      const code = res.result
      if (code.startsWith('WI')) {
        uni.navigateTo({ url: `/pages/todo/inbound-detail?orderNo=${code}` })
      } else if (code.startsWith('WO')) {
        uni.navigateTo({ url: `/pages/todo/outbound-detail?orderNo=${code}` })
      } else {
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
    fetchStats(),
    fetchLocationStats()
  ])
}

onMounted(() => {
  initData()
})

onShow(() => {
  todoStore.fetchPendingCount()
  fetchLocationStats()
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f5ff 0%, #f5f5f5 30%);
}

.header {
  position: relative;
  padding: 0 32rpx;
  padding-top: calc(var(--status-bar-height) + 20rpx);
  padding-bottom: 100rpx;
  overflow: hidden;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 50%, #0050b3 100%);
  border-radius: 0 0 60rpx 60rpx;
}

.header-content {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1;
}

.user-section {
  display: flex;
  align-items: center;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.5);
}

.avatar-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.greeting {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.username {
  font-size: 34rpx;
  font-weight: bold;
  color: #ffffff;
  margin-top: 4rpx;
}

.header-right {
  text-align: right;
}

.date {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

.todo-cards {
  display: flex;
  gap: 24rpx;
  padding: 0 32rpx;
  margin-top: -60rpx;
}

.todo-card {
  flex: 1;
  position: relative;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  &.inbound-bg {
    background: linear-gradient(135deg, #ffffff 0%, #e6f7ff 100%);
  }
  &.outbound-bg {
    background: linear-gradient(135deg, #ffffff 0%, #f9f0ff 100%);
  }
}

.card-content {
  position: relative;
  padding: 28rpx;
  z-index: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.card-icon-wrapper {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &.inbound {
    background: rgba(24, 144, 255, 0.15);
  }
  &.outbound {
    background: rgba(114, 46, 209, 0.15);
  }
}

.card-icon {
  font-size: 32rpx;
}

.card-badge {
  background: #ff4d4f;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.badge-text {
  font-size: 20rpx;
  color: #ffffff;
}

.card-body {
  display: flex;
  flex-direction: column;
}

.card-count {
  font-size: 56rpx;
  font-weight: bold;
  color: #333333;
  line-height: 1.2;
}

.card-label {
  font-size: 24rpx;
  color: #666666;
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
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.section-date {
  font-size: 24rpx;
  color: #999999;
}

.section-more {
  font-size: 26rpx;
  color: #1890ff;
}

.quick-actions {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.action-row {
  display: flex;
  justify-content: space-around;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rpx 16rpx;
}

.action-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;

  &.todo {
    background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  }
  &.inventory {
    background: linear-gradient(135deg, #f6ffed 0%, #b7eb8f 100%);
  }
  &.stocktaking {
    background: linear-gradient(135deg, #fff1f0 0%, #ffa39e 100%);
  }
  &.scan {
    background: linear-gradient(135deg, #fff7e6 0%, #ffd591 100%);
  }
}

.icon-emoji {
  font-size: 44rpx;
}

.action-text {
  font-size: 24rpx;
  color: #666666;
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.stats-row {
  display: flex;
  gap: 16rpx;
}

.stat-card {
  flex: 1;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

  &.primary .stat-icon-bg {
    background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  }
  &.success .stat-icon-bg {
    background: linear-gradient(135deg, #f6ffed 0%, #b7eb8f 100%);
  }
  &.warning .stat-icon-bg {
    background: linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%);
  }
  &.info .stat-icon-bg {
    background: linear-gradient(135deg, #f9f0ff 0%, #d3adf7 100%);
  }
}

.stat-icon-bg {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.stat-icon {
  font-size: 36rpx;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #333333;
  line-height: 1.2;
}

.stat-label {
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
}

.location-overview {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.overview-chart {
  margin-right: 40rpx;
}

.chart-ring {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  position: relative;
}

.ring-progress {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.ring-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120rpx;
  height: 120rpx;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-percent {
  font-size: 32rpx;
  font-weight: bold;
  color: #1890ff;
}

.ring-label {
  font-size: 20rpx;
  color: #999999;
}

.overview-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.overview-item {
  display: flex;
  align-items: center;
}

.overview-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 12rpx;

  &.occupied {
    background: #1890ff;
  }
  &.empty {
    background: #e8e8e8;
  }
  &.unassigned {
    background: #faad14;
  }
}

.overview-label {
  flex: 1;
  font-size: 26rpx;
  color: #666666;
}

.overview-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
}

.recent-list {
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.recent-item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #fafafa;
  }
}

.order-type {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
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

.order-right {
  display: flex;
  align-items: center;
}

.order-quantity {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
}

.order-arrow {
  font-size: 32rpx;
  color: #cccccc;
  margin-left: 12rpx;
}

.bottom-space {
  height: 140rpx;
}
</style>
