<template>
  <view class="detail-page">
    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 订单详情 -->
    <template v-else-if="order">
      <!-- 头部信息 -->
      <view class="detail-header">
        <view class="header-top">
          <view class="status-tag" :class="order.status">
            {{ order.status === 'pending' ? '待出库' : '已完成' }}
          </view>
          <text class="order-no">{{ order.orderNo }}</text>
        </view>
        <view class="header-bottom">
          <text class="create-time">创建时间: {{ formatTime(order.createdAt) }}</text>
        </view>
      </view>

      <!-- 订单信息卡片 -->
      <view class="info-card">
        <view class="card-title">基本信息</view>
        <view class="info-list">
          <view class="info-item">
            <text class="label">客户名称</text>
            <text class="value">{{ order.customerName }}</text>
          </view>
          <view class="info-item">
            <text class="label">业务类型</text>
            <text class="value">{{ getBusinessTypeLabel(order.businessType) }}</text>
          </view>
          <view class="info-item">
            <text class="label">总件数</text>
            <text class="value highlight">{{ order.totalQuantity }} 件</text>
          </view>
          <view class="info-item" v-if="order.totalVolume">
            <text class="label">总体积</text>
            <text class="value">{{ order.totalVolume?.toFixed(3) }} m³</text>
          </view>
          <view class="info-item" v-if="order.totalWeight">
            <text class="label">总重量</text>
            <text class="value">{{ order.totalWeight?.toFixed(2) }} kg</text>
          </view>
          <view class="info-item" v-if="order.deliveryAddress">
            <text class="label">送货地址</text>
            <text class="value">{{ order.deliveryAddress }}</text>
          </view>
          <view class="info-item full" v-if="order.remark">
            <text class="label">备注</text>
            <text class="value">{{ order.remark }}</text>
          </view>
        </view>
      </view>

      <!-- 商品明细 -->
      <view class="items-card">
        <view class="card-title">
          商品明细
          <text class="item-count">（{{ order.items?.length || 0 }} 种）</text>
        </view>
        <view class="items-list">
          <view
            v-for="(item, index) in order.items"
            :key="index"
            class="item-row"
          >
            <view class="item-main">
              <text class="item-name">{{ item.productName || item.sku || '未命名商品' }}</text>
              <text class="item-qty">× {{ item.quantity }}</text>
            </view>
            <view class="item-details">
              <text v-if="item.sku" class="detail-text">CMD编号: {{ item.sku }}</text>
              <text v-if="item.productModel" class="detail-text">型号: {{ item.productModel }}</text>
              <text v-if="item.warehouseEntryNo" class="detail-text">进仓编号: {{ item.warehouseEntryNo }}</text>
              <text v-if="item.locationCode" class="detail-text">库位: {{ item.locationCode }}</text>
            </view>
            <view class="item-specs" v-if="item.length || item.width || item.height">
              <text class="spec-text">
                尺寸: {{ item.length || 0 }} × {{ item.width || 0 }} × {{ item.height || 0 }} cm
              </text>
              <text v-if="item.volume" class="spec-text">
                体积: {{ item.volume?.toFixed(4) }} m³
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 操作日志 -->
      <view class="log-card" v-if="order.status === 'completed'">
        <view class="card-title">操作记录</view>
        <view class="log-list">
          <view class="log-item">
            <view class="log-dot"></view>
            <view class="log-content">
              <text class="log-text">出库确认</text>
              <text class="log-time">{{ formatTime(order.updatedAt) }}</text>
            </view>
          </view>
          <view class="log-item">
            <view class="log-dot"></view>
            <view class="log-content">
              <text class="log-text">创建订单</text>
              <text class="log-time">{{ formatTime(order.createdAt) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-bottom"></view>
    </template>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="order && order.status === 'pending'">
      <button class="confirm-btn" @click="handleConfirm">
        确认出库
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { outboundAPI } from '@/api'
import type { OutboundOrder } from '@/types'
import { formatDate } from '@/utils'

// 状态
const order = ref<OutboundOrder | null>(null)
const loading = ref(true)
const orderId = ref<number>(0)

// 页面加载获取参数
onLoad((options) => {
  if (options?.id) {
    orderId.value = Number(options.id)
  }
})

// 格式化时间
function formatTime(dateStr: string) {
  return formatDate(dateStr, 'YYYY-MM-DD HH:mm:ss')
}

// 获取业务类型标签
function getBusinessTypeLabel(type?: string) {
  if (!type) return '普通出库'
  const typeMap: Record<string, string> = {
    'sales': '普通出库',
    'return': '退货出库',
    'transfer': '调拨出库'
  }
  return typeMap[type] || type
}

// 加载订单详情
async function loadOrder() {
  if (!orderId.value) {
    uni.showToast({ title: '订单ID无效', icon: 'none' })
    return
  }

  loading.value = true

  try {
    const res = await outboundAPI.getById(orderId.value)
    order.value = res
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

// 确认出库
function handleConfirm() {
  if (!order.value) return

  uni.showModal({
    title: '确认出库',
    content: `确定要将订单 ${order.value.orderNo} 确认出库吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...' })
          await outboundAPI.confirm(orderId.value, { source: 'mobile' })
          uni.showToast({ title: '出库成功', icon: 'success' })

          // 刷新订单详情
          setTimeout(() => {
            loadOrder()
          }, 500)
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

// 页面加载
onMounted(() => {
  if (orderId.value) {
    loadOrder()
  }
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 140rpx;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400rpx;
  font-size: 28rpx;
  color: #999;
}

.detail-header {
  background: linear-gradient(135deg, #fa8c16 0%, #d46b08 100%);
  padding: 48rpx 32rpx;
  color: #fff;
}

.header-top {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.status-tag {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: 500;
  margin-right: 16rpx;

  &.pending {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
  &.completed {
    background: #52c41a;
    color: #fff;
  }
}

.order-no {
  font-size: 36rpx;
  font-weight: 600;
}

.header-bottom {
  .create-time {
    font-size: 26rpx;
    opacity: 0.8;
  }
}

.info-card,
.items-card,
.log-card {
  margin: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
}

.item-count {
  font-size: 26rpx;
  font-weight: normal;
  color: #999;
  margin-left: 8rpx;
}

.info-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.info-item {
  width: calc(50% - 10rpx);
  display: flex;
  flex-direction: column;

  &.full {
    width: 100%;
  }

  .label {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 8rpx;
  }

  .value {
    font-size: 28rpx;
    color: #333;

    &.highlight {
      color: #fa8c16;
      font-weight: 600;
    }
  }
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.item-row {
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.item-name {
  flex: 1;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-qty {
  font-size: 28rpx;
  font-weight: 600;
  color: #fa8c16;
  margin-left: 16rpx;
}

.item-details,
.item-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.detail-text,
.spec-text {
  font-size: 24rpx;
  color: #666;
}

.item-specs {
  margin-top: 8rpx;
}

.log-list {
  position: relative;
  padding-left: 24rpx;

  &::before {
    content: '';
    position: absolute;
    left: 8rpx;
    top: 20rpx;
    bottom: 20rpx;
    width: 2rpx;
    background: #e8e8e8;
  }
}

.log-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.log-dot {
  width: 16rpx;
  height: 16rpx;
  background: #fa8c16;
  border-radius: 50%;
  margin-right: 20rpx;
  margin-top: 8rpx;
  position: relative;
  z-index: 1;
}

.log-content {
  flex: 1;
}

.log-text {
  font-size: 28rpx;
  color: #333;
  display: block;
}

.log-time {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.safe-bottom {
  height: 40rpx;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.confirm-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(90deg, #fa8c16 0%, #d46b08 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 16rpx;
  border: none;

  &::after {
    border: none;
  }

  &:active {
    opacity: 0.9;
  }
}
</style>
