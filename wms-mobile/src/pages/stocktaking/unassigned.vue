<template>
  <view class="unassigned-page">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">未分配库存</text>
      <view class="nav-right">
        <text v-if="selectedIds.length > 0" class="select-count">
          已选 {{ selectedIds.length }}
        </text>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索货名/进仓编号"
          @confirm="onSearch"
        />
        <text v-if="keyword" class="clear-btn" @click="clearSearch">×</text>
      </view>
    </view>

    <!-- 库存列表 -->
    <scroll-view
      class="inventory-list"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <view v-if="loading && inventories.length === 0" class="loading-state">
        <text>加载中...</text>
      </view>

      <view v-else-if="inventories.length === 0" class="empty-state">
        <text class="empty-icon">✅</text>
        <text class="empty-text">所有库存已分配库位</text>
      </view>

      <view v-else>
        <view
          v-for="item in inventories"
          :key="item.id"
          class="inventory-item"
          :class="{ selected: selectedIds.includes(item.id) }"
          @click="toggleSelect(item)"
        >
          <view class="checkbox" :class="{ checked: selectedIds.includes(item.id) }">
            <text v-if="selectedIds.includes(item.id)">✓</text>
          </view>
          <view class="item-content">
            <view class="item-header">
              <text class="item-name">{{ item.productName }}</text>
              <view class="item-qty">
                <text class="qty-value">{{ item.quantity }}</text>
                <text class="qty-unit">件</text>
              </view>
            </view>
            <view class="item-info">
              <text class="info-label">进仓编号:</text>
              <text class="info-value">{{ item.warehouseEntryNo || '-' }}</text>
            </view>
            <view class="item-info">
              <text class="info-label">客户:</text>
              <text class="info-value">{{ item.customerName }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="loading && inventories.length > 0" class="loading-more">
        <text>加载中...</text>
      </view>

      <view v-if="!loading && !hasMore && inventories.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="selectedIds.length > 0">
      <view class="select-all" @click="toggleSelectAll">
        <view class="checkbox" :class="{ checked: isAllSelected }">
          <text v-if="isAllSelected">✓</text>
        </view>
        <text>全选</text>
      </view>
      <view class="action-btn" @click="openAssignModal">
        <text>分配库位 ({{ selectedIds.length }})</text>
      </view>
    </view>

    <!-- 分配库位弹窗 -->
    <view v-if="showAssignModal" class="modal-overlay" @click="closeAssignModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">分配库位</text>
          <text class="modal-close" @click="closeAssignModal">×</text>
        </view>
        <view class="modal-body">
          <text class="modal-label">已选择 {{ selectedIds.length }} 条库存</text>
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
          <view class="modal-btn cancel" @click="closeAssignModal">取消</view>
          <view
            class="modal-btn confirm"
            :class="{ disabled: !selectedLocation }"
            @click="handleAssign"
          >
            确认分配
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { stocktakingApi } from '@/api/stocktaking'
import { locationApi } from '@/api/location'
import type { Inventory } from '@/types'

// 状态
const loading = ref(false)
const refreshing = ref(false)
const inventories = ref<Inventory[]>([])
const selectedIds = ref<number[]>([])
const keyword = ref('')
const page = ref(1)
const size = ref(20)
const total = ref(0)
const hasMore = computed(() => inventories.value.length < total.value)
const isAllSelected = computed(
  () => inventories.value.length > 0 && selectedIds.value.length === inventories.value.length
)

// 分配弹窗
const showAssignModal = ref(false)
const selectedLocation = ref('')
const selectedLocationLabel = ref('')
const availableLocations = ref<{ value: string; label: string }[]>([])
const assigning = ref(false)

// 加载库存
async function loadInventories(reset = false) {
  if (reset) {
    page.value = 1
    inventories.value = []
    selectedIds.value = []
  }

  loading.value = true
  try {
    const res = await stocktakingApi.getUnassignedInventory({
      page: page.value,
      size: size.value,
      productName: keyword.value || undefined,
    })
    if (res.success) {
      if (reset) {
        inventories.value = res.data || []
      } else {
        inventories.value = [...inventories.value, ...(res.data || [])]
      }
      total.value = res.total || 0
    }
  } catch (error) {
    console.error('加载失败:', error)
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

// 下拉刷新
async function onRefresh() {
  refreshing.value = true
  await loadInventories(true)
  refreshing.value = false
}

// 加载更多
function loadMore() {
  if (loading.value || !hasMore.value) return
  page.value++
  loadInventories()
}

// 搜索
function onSearch() {
  loadInventories(true)
}

// 清除搜索
function clearSearch() {
  keyword.value = ''
  loadInventories(true)
}

// 切换选择
function toggleSelect(item: Inventory) {
  const index = selectedIds.value.indexOf(item.id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(item.id)
  }
}

// 切换全选
function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = inventories.value.map(i => i.id)
  }
}

// 打开分配弹窗
function openAssignModal() {
  selectedLocation.value = ''
  selectedLocationLabel.value = ''
  showAssignModal.value = true
  loadAvailableLocations()
}

// 关闭分配弹窗
function closeAssignModal() {
  showAssignModal.value = false
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

// 分配库位
async function handleAssign() {
  if (!selectedLocation.value || assigning.value || selectedIds.value.length === 0) return

  assigning.value = true
  try {
    const res = await stocktakingApi.batchUpdateInventoryLocation(
      selectedIds.value,
      selectedLocation.value
    )
    if (res.success) {
      uni.showToast({
        title: `成功分配 ${res.data?.count || selectedIds.value.length} 条`,
        icon: 'success',
      })
      closeAssignModal()
      selectedIds.value = []
      loadInventories(true)
    }
  } catch (error: any) {
    uni.showToast({ title: error.message || '分配失败', icon: 'none' })
  } finally {
    assigning.value = false
  }
}

// 返回
function goBack() {
  uni.navigateBack()
}

onMounted(() => {
  loadInventories(true)
})

onShow(() => {
  loadInventories(true)
})
</script>

<style lang="scss" scoped>
.unassigned-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
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
  width: 120rpx;
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

.select-count {
  font-size: 26rpx;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.2);
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.search-bar {
  padding: 20rpx 32rpx;
  background: #ffffff;
}

.search-input {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 20rpx;
  height: 72rpx;
}

.search-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

input {
  flex: 1;
  font-size: 28rpx;
}

.clear-btn {
  font-size: 36rpx;
  color: #999999;
  padding: 0 12rpx;
}

.inventory-list {
  flex: 1;
  padding: 24rpx 32rpx;
  padding-bottom: 140rpx;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.inventory-item {
  display: flex;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  &.selected {
    border: 2rpx solid #1890ff;
  }
}

.checkbox {
  width: 44rpx;
  height: 44rpx;
  border: 2rpx solid #d9d9d9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;

  &.checked {
    background: #1890ff;
    border-color: #1890ff;
    color: #ffffff;
    font-size: 24rpx;
  }
}

.item-content {
  flex: 1;
  overflow: hidden;
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
  font-size: 32rpx;
  font-weight: bold;
  color: #fa8c16;
}

.qty-unit {
  font-size: 22rpx;
  color: #999999;
  margin-left: 4rpx;
}

.item-info {
  display: flex;
  margin-bottom: 4rpx;
}

.info-label {
  font-size: 24rpx;
  color: #999999;
  width: 140rpx;
}

.info-value {
  font-size: 24rpx;
  color: #666666;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 24rpx 0;
  font-size: 24rpx;
  color: #999999;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  padding: 0 32rpx;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.08);
  gap: 24rpx;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
  color: #666666;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1890ff;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #ffffff;
  font-weight: bold;
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
