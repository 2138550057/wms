<template>
  <view class="todo-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="navbar-title">待办中心</view>
      <view class="navbar-badge" v-if="todoStore.counts.total > 0">
        {{ todoStore.counts.total }}
      </view>
    </view>

    <!-- Tab 切换 -->
    <view class="tabs">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'"
      >
        全部
        <text class="tab-count" v-if="todoStore.counts.total > 0">
          ({{ todoStore.counts.total }})
        </text>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'inbound' }"
        @click="activeTab = 'inbound'"
      >
        待入库
        <text class="tab-count" v-if="todoStore.counts.inbound > 0">
          ({{ todoStore.counts.inbound }})
        </text>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'outbound' }"
        @click="activeTab = 'outbound'"
      >
        待出库
        <text class="tab-count" v-if="todoStore.counts.outbound > 0">
          ({{ todoStore.counts.outbound }})
        </text>
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view
      class="order-list"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="handleRefresh"
    >
      <!-- 空状态 -->
      <view class="empty-state" v-if="!loading && displayOrders.length === 0">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无待办订单</text>
      </view>

      <!-- 入库订单 -->
      <view
        v-for="order in displayOrders"
        :key="`${order.type}-${order.id}`"
        class="order-card"
        @click="handleOrderClick(order)"
      >
        <view class="order-header">
          <view class="order-type" :class="order.type">
            {{ order.type === 'inbound' ? '入库' : '出库' }}
          </view>
          <text class="order-no">{{ order.orderNo }}</text>
          <text class="order-status pending">待处理</text>
        </view>

        <view class="order-body">
          <view class="info-row">
            <text class="info-label">客户</text>
            <text class="info-value">{{ order.customerName }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">业务类型</text>
            <text class="info-value">{{ formatBusinessType(order.businessType, order.type) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">{{ order.type === 'inbound' ? '入库日期' : '出库日期' }}</text>
            <text class="info-value">{{ formatDate(order.type === 'inbound' ? order.inboundDate : order.outboundDate) }}</text>
          </view>
        </view>

        <view class="order-footer">
          <view class="order-stats">
            <view class="stat-item">
              <text class="stat-value">{{ order.totalQuantity }}</text>
              <text class="stat-label">件数</text>
            </view>
            <view class="stat-item" v-if="order.totalVolume">
              <text class="stat-value">{{ order.totalVolume?.toFixed(2) }}</text>
              <text class="stat-label">体积(m³)</text>
            </view>
            <view class="stat-item" v-if="order.totalWeight">
              <text class="stat-value">{{ order.totalWeight?.toFixed(2) }}</text>
              <text class="stat-label">重量(kg)</text>
            </view>
          </view>
          <view class="order-action">
            <text class="action-btn">处理 ></text>
          </view>
        </view>

        <view class="order-meta">
          <text class="meta-text">创建人: {{ order.creator?.realName || order.creator?.username || '-' }}</text>
          <text class="meta-text">{{ formatRelativeTime(order.createdAt) }}</text>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading-state" v-if="loading">
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { useTodoStore } from '@/stores/todo'
import { formatDate, formatRelativeTime, formatBusinessType } from '@/utils/format'
import type { InboundOrder, OutboundOrder } from '@/types'

const todoStore = useTodoStore()

// 当前 Tab
const activeTab = ref<'all' | 'inbound' | 'outbound'>('all')
const loading = ref(false)
const refreshing = ref(false)

// 显示的订单列表
const displayOrders = computed(() => {
  const inbounds = todoStore.inbounds.map(o => ({ ...o, type: 'inbound' as const }))
  const outbounds = todoStore.outbounds.map(o => ({ ...o, type: 'outbound' as const }))

  if (activeTab.value === 'inbound') {
    return inbounds
  } else if (activeTab.value === 'outbound') {
    return outbounds
  } else {
    // 合并并按创建时间排序
    return [...inbounds, ...outbounds].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }
})

// 加载数据
async function loadData() {
  loading.value = true
  try {
    await todoStore.fetchPendingOrders()
  } finally {
    loading.value = false
  }
}

// 下拉刷新
async function handleRefresh() {
  refreshing.value = true
  try {
    await todoStore.fetchPendingOrders()
  } finally {
    refreshing.value = false
  }
}

// 点击订单
function handleOrderClick(order: any) {
  const url = order.type === 'inbound'
    ? `/pages/todo/inbound-detail?id=${order.id}`
    : `/pages/todo/outbound-detail?id=${order.id}`
  uni.navigateTo({ url })
}

onLoad((options) => {
  if (options?.type) {
    activeTab.value = options.type as 'inbound' | 'outbound'
  }
})

onMounted(() => {
  loadData()
})

onShow(() => {
  // 每次显示页面时刷新数据
  todoStore.fetchPendingCount()
})
</script>

<style lang="scss" scoped>
.todo-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.navbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  background: #ffffff;
  padding-top: var(--status-bar-height);
}

.navbar-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333333;
}

.navbar-badge {
  position: absolute;
  right: 32rpx;
  top: 50%;
  transform: translateY(-50%);
  background: #ff4d4f;
  color: #ffffff;
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  margin-top: calc(var(--status-bar-height) / 2);
}

.tabs {
  display: flex;
  background: #ffffff;
  padding: 0 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #666666;
  position: relative;

  &.active {
    color: #1890ff;
    font-weight: bold;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60rpx;
      height: 4rpx;
      background: #1890ff;
      border-radius: 2rpx;
    }
  }
}

.tab-count {
  color: #999999;
  font-weight: normal;
}

.order-list {
  flex: 1;
  padding: 24rpx 32rpx;
  padding-bottom: 120rpx;
}

.order-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.order-type {
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  margin-right: 16rpx;

  &.inbound {
    background: #e6f7ff;
    color: #1890ff;
  }
  &.outbound {
    background: #f9f0ff;
    color: #722ed1;
  }
}

.order-no {
  flex: 1;
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
}

.order-status {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;

  &.pending {
    background: #fff7e6;
    color: #faad14;
  }
}

.order-body {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row {
  display: flex;
  margin-bottom: 12rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  width: 160rpx;
  font-size: 26rpx;
  color: #999999;
}

.info-value {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20rpx;
}

.order-stats {
  display: flex;
  gap: 40rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.stat-label {
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
}

.order-action {
  .action-btn {
    font-size: 28rpx;
    color: #1890ff;
    font-weight: 500;
  }
}

.order-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx dashed #f0f0f0;
}

.meta-text {
  font-size: 22rpx;
  color: #999999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.loading-state {
  text-align: center;
  padding: 40rpx;
  color: #999999;
  font-size: 26rpx;
}
</style>
