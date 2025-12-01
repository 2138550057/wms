<template>
  <view class="outbound-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <text class="search-icon">&#x1F50D;</text>
        <input
          v-model="searchKey"
          type="text"
          placeholder="搜索订单号/客户名称"
          class="search-input"
          @confirm="handleSearch"
        />
        <text v-if="searchKey" class="clear-icon" @click="clearSearch">×</text>
      </view>
    </view>

    <!-- 状态筛选 -->
    <view class="filter-bar">
      <view
        class="filter-item"
        :class="{ active: currentStatus === '' }"
        @click="currentStatus = ''"
      >
        全部
      </view>
      <view
        class="filter-item"
        :class="{ active: currentStatus === 'pending' }"
        @click="currentStatus = 'pending'"
      >
        待出库
      </view>
      <view
        class="filter-item"
        :class="{ active: currentStatus === 'completed' }"
        @click="currentStatus = 'completed'"
      >
        已完成
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view
      class="order-scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <view class="order-list" v-if="orders.length > 0">
        <view
          v-for="order in orders"
          :key="order.id"
          class="order-card"
          @click="goToDetail(order.id)"
        >
          <view class="card-header">
            <view class="status-tag" :class="order.status">
              {{ order.status === 'pending' ? '待出库' : '已完成' }}
            </view>
            <text class="order-no">{{ order.orderNo }}</text>
            <text class="order-time">{{ formatTime(order.createdAt) }}</text>
          </view>

          <view class="card-body">
            <view class="info-row">
              <text class="info-label">客户</text>
              <text class="info-value">{{ order.customerName }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">件数</text>
              <text class="info-value highlight">{{ order.totalQuantity }} 件</text>
            </view>
            <view class="info-row" v-if="order.businessType">
              <text class="info-label">类型</text>
              <text class="info-value">{{ getBusinessTypeLabel(order.businessType) }}</text>
            </view>
          </view>

          <view class="card-footer">
            <view class="item-count">
              <text class="count-text">{{ order.items?.length || 0 }} 种商品</text>
            </view>
            <view class="action-btn" @click.stop="handleAction(order)">
              {{ order.status === 'pending' ? '确认出库' : '查看详情' }}
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else-if="!loading">
        <text class="empty-icon">&#x1F4E4;</text>
        <text class="empty-text">暂无出库订单</text>
      </view>

      <!-- 加载状态 -->
      <view class="loading-more" v-if="loading && orders.length > 0">
        <text>加载中...</text>
      </view>

      <!-- 没有更多 -->
      <view class="no-more" v-if="!hasMore && orders.length > 0">
        <text>没有更多了</text>
      </view>

      <view class="safe-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { outboundAPI } from '@/api'
import type { OutboundOrder } from '@/types'
import { formatDate } from '@/utils'

// 状态
const orders = ref<OutboundOrder[]>([])
const loading = ref(false)
const refreshing = ref(false)
const searchKey = ref('')
const currentStatus = ref('')
const page = ref(1)
const size = ref(20)
const hasMore = ref(true)

// 监听筛选条件变化
watch([searchKey, currentStatus], () => {
  page.value = 1
  orders.value = []
  loadOrders()
})

// 格式化时间
function formatTime(dateStr: string) {
  return formatDate(dateStr, 'MM-DD HH:mm')
}

// 获取业务类型标签
function getBusinessTypeLabel(type: string) {
  const typeMap: Record<string, string> = {
    'sales': '普通出库',
    'return': '退货出库',
    'transfer': '调拨出库'
  }
  return typeMap[type] || type
}

// 加载订单列表
async function loadOrders() {
  if (loading.value) return

  loading.value = true

  try {
    const params: any = {
      page: page.value,
      size: size.value
    }

    if (searchKey.value) {
      params.search = searchKey.value
    }

    if (currentStatus.value) {
      params.status = currentStatus.value
    }

    const res = await outboundAPI.list(params)
    const newOrders = res.data || []

    if (page.value === 1) {
      orders.value = newOrders
    } else {
      orders.value = [...orders.value, ...newOrders]
    }

    hasMore.value = newOrders.length >= size.value
  } catch (error: any) {
    console.error('加载订单失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 下拉刷新
async function onRefresh() {
  refreshing.value = true
  page.value = 1
  await loadOrders()
  refreshing.value = false
}

// 加载更多
function loadMore() {
  if (!hasMore.value || loading.value) return
  page.value++
  loadOrders()
}

// 搜索
function handleSearch() {
  page.value = 1
  orders.value = []
  loadOrders()
}

// 清除搜索
function clearSearch() {
  searchKey.value = ''
}

// 跳转详情
function goToDetail(id: number) {
  uni.navigateTo({ url: `/pages/outbound/detail?id=${id}` })
}

// 操作按钮
async function handleAction(order: OutboundOrder) {
  if (order.status === 'pending') {
    uni.showModal({
      title: '确认出库',
      content: `确定要将订单 ${order.orderNo} 确认出库吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            uni.showLoading({ title: '处理中...' })
            await outboundAPI.confirm(order.id, { source: 'mobile' })
            uni.showToast({ title: '出库成功', icon: 'success' })
            onRefresh()
          } catch (error: any) {
            uni.showToast({ title: error.message || '操作失败', icon: 'none' })
          } finally {
            uni.hideLoading()
          }
        }
      }
    })
  } else {
    goToDetail(order.id)
  }
}

// 页面加载
onMounted(() => {
  loadOrders()
})

// 页面显示
onShow(() => {
  if (orders.value.length > 0) {
    onRefresh()
  }
})
</script>

<style lang="scss" scoped>
.outbound-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.search-bar {
  padding: 24rpx;
  background: #fff;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  height: 72rpx;
  padding: 0 24rpx;
  background: #f5f7fa;
  border-radius: 36rpx;
}

.search-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.search-input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: #333;
}

.clear-icon {
  font-size: 36rpx;
  color: #999;
  padding: 8rpx;
}

.filter-bar {
  display: flex;
  padding: 0 24rpx 24rpx;
  background: #fff;
  gap: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.filter-item {
  padding: 12rpx 32rpx;
  font-size: 26rpx;
  color: #666;
  background: #f5f7fa;
  border-radius: 24rpx;

  &.active {
    background: #fff7e6;
    color: #fa8c16;
    font-weight: 500;
  }
}

.order-scroll {
  flex: 1;
  height: calc(100vh - 200rpx);
}

.order-list {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.order-card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  &:active {
    background: #fafafa;
  }
}

.card-header {
  display: flex;
  align-items: center;
  padding: 24rpx 24rpx 16rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.status-tag {
  padding: 6rpx 16rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  font-weight: 500;
  margin-right: 16rpx;

  &.pending {
    background: #fff7e6;
    color: #fa8c16;
  }
  &.completed {
    background: #f6ffed;
    color: #52c41a;
  }
}

.order-no {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.order-time {
  font-size: 24rpx;
  color: #999;
}

.card-body {
  padding: 20rpx 24rpx;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  width: 80rpx;
  font-size: 26rpx;
  color: #999;
}

.info-value {
  flex: 1;
  font-size: 26rpx;
  color: #333;

  &.highlight {
    color: #fa8c16;
    font-weight: 600;
  }
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx 24rpx;
}

.count-text {
  font-size: 24rpx;
  color: #999;
}

.action-btn {
  padding: 12rpx 32rpx;
  font-size: 26rpx;
  font-weight: 500;
  color: #fa8c16;
  background: #fff7e6;
  border-radius: 24rpx;

  &:active {
    opacity: 0.8;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 48rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 24rpx;
  font-size: 26rpx;
  color: #999;
}

.safe-bottom {
  height: 40rpx;
}
</style>
