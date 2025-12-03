<template>
  <view class="detail-page">
    <view class="navbar">
      <view class="navbar-back" @click="handleBack">← 返回</view>
      <view class="navbar-title">库存详情</view>
      <view class="navbar-action"></view>
    </view>

    <scroll-view class="content" scroll-y v-if="inventory">
      <view class="card">
        <view class="card-header">
          <text class="card-title">{{ inventory.productName }}</text>
        </view>

        <view class="stock-summary">
          <view class="stock-item">
            <text class="stock-value">{{ inventory.quantity }}</text>
            <text class="stock-label">总库存</text>
          </view>
          <view class="stock-item">
            <text class="stock-value available">{{ inventory.availableQuantity }}</text>
            <text class="stock-label">可用</text>
          </view>
          <view class="stock-item">
            <text class="stock-value locked">{{ inventory.lockedQuantity }}</text>
            <text class="stock-label">锁定</text>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="card-header">
          <text class="card-title">基本信息</text>
        </view>

        <view class="info-list">
          <view class="info-item" v-if="inventory.productModel">
            <text class="info-label">型号</text>
            <text class="info-value">{{ inventory.productModel }}</text>
          </view>
          <view class="info-item" v-if="inventory.sku">
            <text class="info-label">CMD编号</text>
            <text class="info-value">{{ inventory.sku }}</text>
          </view>
          <view class="info-item" v-if="inventory.internalCode">
            <text class="info-label">内部货号</text>
            <text class="info-value">{{ inventory.internalCode }}</text>
          </view>
          <view class="info-item" v-if="inventory.productCode">
            <text class="info-label">CMD料号</text>
            <text class="info-value">{{ inventory.productCode }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">客户</text>
            <text class="info-value">{{ inventory.customerName }}</text>
          </view>
          <view class="info-item" v-if="inventory.locationCode">
            <text class="info-label">库位</text>
            <text class="info-value">{{ inventory.locationCode }}</text>
          </view>
          <view class="info-item" v-if="inventory.warehouseEntryNo">
            <text class="info-label">进仓编号</text>
            <text class="info-value">{{ inventory.warehouseEntryNo }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="card-header">
          <text class="card-title">规格信息</text>
        </view>

        <view class="spec-grid">
          <view class="spec-item" v-if="inventory.length">
            <text class="spec-value">{{ inventory.length }}</text>
            <text class="spec-label">长(cm)</text>
          </view>
          <view class="spec-item" v-if="inventory.width">
            <text class="spec-value">{{ inventory.width }}</text>
            <text class="spec-label">宽(cm)</text>
          </view>
          <view class="spec-item" v-if="inventory.height">
            <text class="spec-value">{{ inventory.height }}</text>
            <text class="spec-label">高(cm)</text>
          </view>
          <view class="spec-item" v-if="inventory.volume">
            <text class="spec-value">{{ inventory.volume?.toFixed(3) }}</text>
            <text class="spec-label">体积(m³)</text>
          </view>
          <view class="spec-item" v-if="inventory.unitGrossWeight">
            <text class="spec-value">{{ inventory.unitGrossWeight }}</text>
            <text class="spec-label">单件重(kg)</text>
          </view>
          <view class="spec-item" v-if="inventory.totalGrossWeight">
            <text class="spec-value">{{ inventory.totalGrossWeight }}</text>
            <text class="spec-label">总重(kg)</text>
          </view>
        </view>
      </view>

      <view class="card" v-if="inventory.lastInboundDate || inventory.lastOutboundDate">
        <view class="card-header">
          <text class="card-title">时间记录</text>
        </view>
        <view class="info-list">
          <view class="info-item" v-if="inventory.lastInboundDate">
            <text class="info-label">最后入库</text>
            <text class="info-value">{{ formatDate(inventory.lastInboundDate) }}</text>
          </view>
          <view class="info-item" v-if="inventory.lastOutboundDate">
            <text class="info-label">最后出库</text>
            <text class="info-value">{{ formatDate(inventory.lastOutboundDate) }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { inventoryApi } from '@/api/inventory'
import { formatDate } from '@/utils/format'
import type { Inventory } from '@/types'

const inventoryId = ref<number>(0)
const inventory = ref<Inventory | null>(null)
const loading = ref(false)

async function loadInventory() {
  if (!inventoryId.value) return

  loading.value = true
  try {
    const res = await inventoryApi.getDetail(inventoryId.value)
    if (res.success && res.data) {
      inventory.value = res.data
    }
  } catch (error) {
    console.error('加载库存失败:', error)
  } finally {
    loading.value = false
  }
}

function handleBack() {
  uni.navigateBack()
}

onLoad((options) => {
  if (options?.id) {
    inventoryId.value = Number(options.id)
  }
})

onMounted(() => {
  loadInventory()
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  background: #ffffff;
  padding: 0 32rpx;
  padding-top: var(--status-bar-height);
}

.navbar-back {
  font-size: 28rpx;
  color: #1890ff;
}

.navbar-title {
  font-size: 34rpx;
  font-weight: bold;
}

.navbar-action {
  width: 100rpx;
}

.content {
  padding: 24rpx 32rpx;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.card-header {
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.stock-summary {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
}

.stock-item {
  text-align: center;
}

.stock-value {
  display: block;
  font-size: 44rpx;
  font-weight: bold;
  color: #333333;

  &.available {
    color: #52c41a;
  }

  &.locked {
    color: #faad14;
  }
}

.stock-label {
  display: block;
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
}

.info-list {
  // styles
}

.info-item {
  display: flex;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
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

.spec-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.spec-item {
  text-align: center;
  padding: 16rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.spec-value {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
}

.spec-label {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 8rpx;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100rpx;
  color: #999999;
}
</style>
