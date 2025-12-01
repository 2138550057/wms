<template>
  <view class="todo-page">
    <!-- 顶部标签切换 -->
    <view class="tabs">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'"
      >
        <text class="tab-text">全部</text>
        <view class="tab-badge" v-if="todoStore.counts.total > 0">
          {{ todoStore.counts.total }}
        </view>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'inbound' }"
        @click="activeTab = 'inbound'"
      >
        <text class="tab-text">待入库</text>
        <view class="tab-badge inbound" v-if="todoStore.counts.inbound > 0">
          {{ todoStore.counts.inbound }}
        </view>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'outbound' }"
        @click="activeTab = 'outbound'"
      >
        <text class="tab-text">待出库</text>
        <view class="tab-badge outbound" v-if="todoStore.counts.outbound > 0">
          {{ todoStore.counts.outbound }}
        </view>
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view
      class="order-scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="order-list" v-if="filteredOrders.length > 0">
        <view
          v-for="order in filteredOrders"
          :key="`${order.type}-${order.id}`"
          class="order-card"
          @click="showOrderDetail(order)"
        >
          <!-- 卡片头部 -->
          <view class="card-header">
            <view class="order-tag" :class="order.type">
              {{ order.type === 'inbound' ? '入库' : '出库' }}
            </view>
            <text class="order-no">{{ order.orderNo }}</text>
            <text class="order-time">{{ formatTime(order.createdAt) }}</text>
          </view>

          <!-- 卡片内容 -->
          <view class="card-body">
            <view class="info-row">
              <text class="info-label">客户</text>
              <text class="info-value">{{ order.customerName }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">件数</text>
              <text class="info-value highlight">{{ order.totalQuantity }} 件</text>
            </view>
            <view class="info-row" v-if="order.totalVolume">
              <text class="info-label">体积</text>
              <text class="info-value">{{ order.totalVolume?.toFixed(3) }} m³</text>
            </view>
          </view>

          <!-- 卡片底部 -->
          <view class="card-footer">
            <view class="item-count">
              <text class="count-icon">&#x1F4E6;</text>
              <text class="count-text">{{ order.items?.length || 0 }} 种商品</text>
            </view>
            <button
              class="confirm-btn"
              :class="order.type"
              @click.stop="handleConfirm(order)"
            >
              {{ order.type === 'inbound' ? '确认入库' : '确认出库' }}
            </button>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else>
        <text class="empty-icon">&#x2705;</text>
        <text class="empty-title">暂无待办任务</text>
        <text class="empty-desc">所有订单已处理完成</text>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-bottom"></view>
    </scroll-view>

    <!-- 订单详情弹窗 -->
    <OrderDetailPopup
      v-if="selectedOrder"
      :visible="showPopup"
      :order="selectedOrder"
      @close="closePopup"
      @confirm="handlePopupConfirm"
    />

    <!-- 自定义TabBar -->
    <CustomTabBar :current="1" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useTodoStore } from '@/stores/todo'
import type { BaseOrder } from '@/types'
import { formatDate } from '@/utils'
import OrderDetailPopup from '@/components/OrderDetailPopup.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'

// Store
const todoStore = useTodoStore()

// 状态
const activeTab = ref<'all' | 'inbound' | 'outbound'>('all')
const refreshing = ref(false)
const showPopup = ref(false)
const selectedOrder = ref<(BaseOrder & { type: 'inbound' | 'outbound' }) | null>(null)

// 过滤后的订单列表
const filteredOrders = computed(() => {
  if (activeTab.value === 'all') {
    return todoStore.allPendingOrders
  } else if (activeTab.value === 'inbound') {
    return todoStore.pendingInbounds.map(o => ({ ...o, type: 'inbound' as const }))
  } else {
    return todoStore.pendingOutbounds.map(o => ({ ...o, type: 'outbound' as const }))
  }
})

// 格式化时间
function formatTime(dateStr: string) {
  return formatDate(dateStr, 'MM-DD HH:mm')
}

// 下拉刷新
async function onRefresh() {
  refreshing.value = true
  try {
    await todoStore.fetchPendingOrders()
  } finally {
    refreshing.value = false
  }
}

// 显示订单详情
function showOrderDetail(order: BaseOrder & { type: 'inbound' | 'outbound' }) {
  selectedOrder.value = order
  showPopup.value = true
}

// 关闭弹窗
function closePopup() {
  showPopup.value = false
  selectedOrder.value = null
}

// 确认操作（直接确认）
async function handleConfirm(order: BaseOrder & { type: 'inbound' | 'outbound' }) {
  uni.showModal({
    title: '确认操作',
    content: `确定要${order.type === 'inbound' ? '确认入库' : '确认出库'}吗？`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中...' })
        try {
          if (order.type === 'inbound') {
            await todoStore.confirmInbound(order.id, { source: 'mobile' })
          } else {
            await todoStore.confirmOutbound(order.id, { source: 'mobile' })
          }
          uni.showToast({
            title: '操作成功',
            icon: 'success'
          })
        } catch (error: any) {
          uni.showToast({
            title: error.message || '操作失败',
            icon: 'none'
          })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 弹窗确认回调
async function handlePopupConfirm() {
  closePopup()
  await todoStore.fetchPendingOrders()
}

// 页面加载
onMounted(() => {
  todoStore.fetchPendingOrders()
})

// 页面显示
onShow(() => {
  todoStore.fetchPendingOrders()
})
</script>

<style lang="scss" scoped>
.todo-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 0 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  position: relative;

  &.active {
    .tab-text {
      color: #1890ff;
      font-weight: 600;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 48rpx;
      height: 4rpx;
      background: #1890ff;
      border-radius: 2rpx;
    }
  }
}

.tab-text {
  font-size: 30rpx;
  color: #666;
}

.tab-badge {
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 10rpx;
  margin-left: 8rpx;
  background: #ff4d4f;
  color: #fff;
  font-size: 22rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &.inbound {
    background: #1890ff;
  }
  &.outbound {
    background: #fa8c16;
  }
}

.order-scroll {
  flex: 1;
  height: calc(100vh - 96rpx);
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

.order-tag {
  padding: 6rpx 16rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  font-weight: 500;
  margin-right: 16rpx;

  &.inbound {
    background: #e6f7ff;
    color: #1890ff;
  }
  &.outbound {
    background: #fff7e6;
    color: #fa8c16;
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
    color: #1890ff;
    font-weight: 600;
  }
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx 24rpx;
}

.item-count {
  display: flex;
  align-items: center;
}

.count-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.count-text {
  font-size: 24rpx;
  color: #999;
}

.confirm-btn {
  height: 64rpx;
  padding: 0 32rpx;
  font-size: 26rpx;
  font-weight: 500;
  border-radius: 32rpx;
  border: none;
  color: #fff;

  &::after {
    border: none;
  }

  &.inbound {
    background: linear-gradient(90deg, #1890ff 0%, #096dd9 100%);
  }
  &.outbound {
    background: linear-gradient(90deg, #fa8c16 0%, #d46b08 100%);
  }

  &:active {
    opacity: 0.9;
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

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
}

.safe-bottom {
  height: 120rpx;
}
</style>
