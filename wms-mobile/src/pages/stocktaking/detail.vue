<template>
  <view class="detail-page">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">库位详情</text>
      <view class="nav-right"></view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <template v-else-if="summary">
      <!-- 库位信息卡片 -->
      <view class="info-card">
        <view class="info-header">
          <view class="location-code">
            <text class="code" :class="{ bonded: summary.location?.bonded }">
              {{ summary.locationCode }}
            </text>
            <view class="bonded-tag" :class="summary.location?.bonded ? 'is-bonded' : 'not-bonded'">
              {{ summary.location?.bonded ? '保税' : '非保税' }}
            </view>
          </view>
        </view>
        <view class="info-grid">
          <view class="info-item">
            <text class="label">区域</text>
            <text class="value">{{ summary.location?.zone }}区</text>
          </view>
          <view class="info-item">
            <text class="label">分类</text>
            <text class="value">{{ getCategoryName(summary.location?.category) }}</text>
          </view>
          <view class="info-item">
            <text class="label">总件数</text>
            <text class="value highlight">{{ summary.totalQuantity }}</text>
          </view>
          <view class="info-item">
            <text class="label">SKU数</text>
            <text class="value">{{ summary.totalSku }}</text>
          </view>
        </view>
      </view>

      <!-- 库存列表 -->
      <view class="section">
        <view class="section-title">库存列表</view>
        <view v-if="summary.inventory.length === 0" class="empty-state">
          <text class="empty-icon">📦</text>
          <text class="empty-text">该库位暂无库存</text>
        </view>
        <view v-else class="inventory-list">
          <view
            v-for="item in summary.inventory"
            :key="item.id"
            class="inventory-item"
          >
            <view class="item-header">
              <text class="item-name">{{ item.productName }}</text>
              <view class="item-qty">
                <text class="qty-value">{{ item.quantity }}</text>
                <text class="qty-unit">件</text>
              </view>
            </view>
            <view class="item-info">
              <text class="info-text">进仓编号: {{ item.warehouseEntryNo || '-' }}</text>
            </view>
            <view class="item-info">
              <text class="info-text">客户: {{ item.customerName }}</text>
            </view>
            <view class="item-actions">
              <view class="action-btn switch" @click="openSwitchModal(item)">
                <text>切换库位</text>
              </view>
              <view class="action-btn remove" @click="confirmRemove(item)">
                <text>移除</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </template>

    <!-- 切换库位弹窗 -->
    <view v-if="showSwitchModal" class="modal-overlay" @click="closeSwitchModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">切换库位</text>
          <text class="modal-close" @click="closeSwitchModal">×</text>
        </view>
        <view class="modal-body">
          <text class="modal-label">当前库存: {{ currentItem?.productName }}</text>
          <text class="modal-label">选择目标库位:</text>
          <picker
            mode="selector"
            :range="availableLocations"
            range-key="label"
            @change="onLocationSelect"
          >
            <view class="picker-input">
              <text>{{ selectedLocationLabel || '请选择库位' }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="modal-footer">
          <view class="modal-btn cancel" @click="closeSwitchModal">取消</view>
          <view
            class="modal-btn confirm"
            :class="{ disabled: !selectedLocation }"
            @click="handleSwitch"
          >
            确认切换
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { stocktakingApi, type LocationSummary, type LocationInventoryItem } from '@/api/stocktaking'
import { locationApi } from '@/api/location'

// 获取页面参数
const code = ref('')

// 状态
const loading = ref(false)
const summary = ref<LocationSummary | null>(null)
const showSwitchModal = ref(false)
const currentItem = ref<LocationInventoryItem | null>(null)
const selectedLocation = ref('')
const selectedLocationLabel = ref('')
const availableLocations = ref<{ value: string; label: string }[]>([])
const switching = ref(false)

// 分类名称映射
function getCategoryName(category?: string): string {
  if (!category) return '-'
  const map: Record<string, string> = {
    shelf: '货架',
    floor: '地面',
    large: '大件',
    small: '小件',
  }
  return map[category] || category
}

// 加载库位详情
async function loadDetail() {
  if (!code.value) return
  loading.value = true
  try {
    const res = await stocktakingApi.getLocationSummary(code.value)
    if (res.success && res.data) {
      summary.value = res.data
    }
  } catch (error) {
    console.error('加载详情失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 加载可用库位
async function loadAvailableLocations() {
  try {
    const res = await locationApi.getActive({})
    if (res.success && res.data) {
      availableLocations.value = res.data.map(loc => ({
        value: loc.code,
        label: `${loc.code} - ${loc.bonded ? '保税' : '非保税'} ${loc.zone}区`,
      }))
    }
  } catch (error) {
    console.error('加载库位失败:', error)
  }
}

// 打开切换库位弹窗
function openSwitchModal(item: LocationInventoryItem) {
  currentItem.value = item
  selectedLocation.value = ''
  selectedLocationLabel.value = ''
  showSwitchModal.value = true
  loadAvailableLocations()
}

// 关闭切换库位弹窗
function closeSwitchModal() {
  showSwitchModal.value = false
  currentItem.value = null
}

// 选择库位
function onLocationSelect(e: any) {
  const index = e.detail.value
  const loc = availableLocations.value[index]
  if (loc) {
    selectedLocation.value = loc.value
    selectedLocationLabel.value = loc.label
  }
}

// 切换库位
async function handleSwitch() {
  if (!currentItem.value || !selectedLocation.value || switching.value) return

  switching.value = true
  try {
    const res = await stocktakingApi.updateInventoryLocation(
      currentItem.value.id,
      selectedLocation.value
    )
    if (res.success) {
      uni.showToast({ title: '切换成功', icon: 'success' })
      closeSwitchModal()
      loadDetail()
    }
  } catch (error: any) {
    uni.showToast({ title: error.message || '切换失败', icon: 'none' })
  } finally {
    switching.value = false
  }
}

// 确认移除
function confirmRemove(item: LocationInventoryItem) {
  uni.showModal({
    title: '确认移除',
    content: `确定要将"${item.productName}"从当前库位移除吗？`,
    success: async (res) => {
      if (res.confirm) {
        await handleRemove(item)
      }
    },
  })
}

// 移除库位
async function handleRemove(item: LocationInventoryItem) {
  try {
    const res = await stocktakingApi.updateInventoryLocation(item.id, null)
    if (res.success) {
      uni.showToast({ title: '移除成功', icon: 'success' })
      loadDetail()
    }
  } catch (error: any) {
    uni.showToast({ title: error.message || '移除失败', icon: 'none' })
  }
}

// 返回
function goBack() {
  uni.navigateBack()
}

onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any).$page?.options || (currentPage as any).options || {}
  code.value = options.code || ''
  loadDetail()
})

onShow(() => {
  if (code.value) {
    loadDetail()
  }
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
  padding-top: var(--status-bar-height);
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}

.nav-left,
.nav-right {
  width: 60rpx;
}

.back-icon {
  font-size: 40rpx;
  color: #ffffff;
}

.nav-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #ffffff;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
  color: #999999;
}

.info-card {
  margin: 24rpx 32rpx;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.info-header {
  margin-bottom: 20rpx;
}

.location-code {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.code {
  font-size: 40rpx;
  font-weight: bold;
  color: #fa8c16;

  &.bonded {
    color: #1890ff;
  }
}

.bonded-tag {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;

  &.is-bonded {
    background: #e6f7ff;
    color: #1890ff;
  }
  &.not-bonded {
    background: #fff7e6;
    color: #fa8c16;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.info-item {
  text-align: center;
  padding: 16rpx 0;
  background: #f9f9f9;
  border-radius: 8rpx;
}

.label {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-bottom: 8rpx;
}

.value {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;

  &.highlight {
    color: #1890ff;
    font-size: 32rpx;
  }
}

.section {
  margin: 24rpx 32rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  background: #ffffff;
  border-radius: 16rpx;
}

.empty-icon {
  font-size: 60rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.inventory-list {
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}

.inventory-item {
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.item-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-qty {
  display: flex;
  align-items: baseline;
  margin-left: 16rpx;
}

.qty-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #52c41a;
}

.qty-unit {
  font-size: 22rpx;
  color: #999999;
  margin-left: 4rpx;
}

.item-info {
  margin-bottom: 8rpx;
}

.info-text {
  font-size: 24rpx;
  color: #999999;
}

.item-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.action-btn {
  flex: 1;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
  font-size: 26rpx;

  &.switch {
    background: #e6f7ff;
    color: #1890ff;
  }
  &.remove {
    background: #fff2f0;
    color: #ff4d4f;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 80%;
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.modal-close {
  font-size: 40rpx;
  color: #999999;
}

.modal-body {
  padding: 24rpx;
}

.modal-label {
  display: block;
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 16rpx;
}

.picker-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333333;
}

.arrow {
  font-size: 24rpx;
  color: #999999;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;

  &.cancel {
    color: #666666;
    border-right: 1rpx solid #f0f0f0;
  }
  &.confirm {
    color: #1890ff;
    font-weight: bold;

    &.disabled {
      color: #cccccc;
    }
  }
}
</style>
