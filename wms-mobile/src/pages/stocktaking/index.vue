<template>
  <view class="stocktaking-page">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">盘库管理</text>
      <view class="nav-right"></view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-value">{{ stats.totalLocations }}</text>
        <text class="stat-label">库位总数</text>
      </view>
      <view class="stat-card">
        <text class="stat-value green">{{ stats.occupiedLocations }}</text>
        <text class="stat-label">已占用</text>
      </view>
      <view class="stat-card">
        <text class="stat-value gray">{{ stats.emptyLocations }}</text>
        <text class="stat-label">空置</text>
      </view>
      <view class="stat-card">
        <text class="stat-value blue">{{ stats.totalQuantity }}</text>
        <text class="stat-label">总件数</text>
      </view>
    </view>

    <!-- 筛选区域 -->
    <view class="filter-bar">
      <view class="filter-item" @click="showZoneFilter = true">
        <text>{{ currentZone || '全部区域' }}</text>
        <text class="arrow">▼</text>
      </view>
      <view class="filter-item" @click="showBondedFilter = true">
        <text>{{ bondedText }}</text>
        <text class="arrow">▼</text>
      </view>
      <view class="filter-item" @click="showInventoryFilter = true">
        <text>{{ inventoryText }}</text>
        <text class="arrow">▼</text>
      </view>
    </view>

    <!-- 库位列表 -->
    <scroll-view
      class="location-list"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="loading && locations.length === 0" class="loading-state">
        <text>加载中...</text>
      </view>

      <view v-else-if="locations.length === 0" class="empty-state">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无库位数据</text>
      </view>

      <view v-else>
        <view
          v-for="loc in locations"
          :key="loc.id"
          class="location-item"
          @click="goToDetail(loc)"
        >
          <view class="location-header">
            <view class="location-code">
              <text class="code" :class="{ bonded: loc.bonded }">{{ loc.code }}</text>
              <view class="bonded-tag" :class="loc.bonded ? 'is-bonded' : 'not-bonded'">
                {{ loc.bonded ? '保税' : '非保' }}
              </view>
            </view>
            <view class="location-quantity" :class="{ 'has-stock': loc.totalQuantity > 0 }">
              <text class="qty-value">{{ loc.totalQuantity }}</text>
              <text class="qty-unit">件</text>
            </view>
          </view>
          <view class="location-info">
            <text class="info-item">{{ loc.zone }}区 · {{ getCategoryName(loc.category) }}</text>
            <text class="info-item">SKU: {{ loc.skuCount }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="action-btn" @click="goToUnassigned">
        <text class="btn-icon">📋</text>
        <text class="btn-text">未分配库存</text>
        <view v-if="unassignedCount > 0" class="badge">{{ unassignedCount }}</view>
      </view>
    </view>

    <!-- 区域筛选弹窗 -->
    <view v-if="showZoneFilter" class="filter-popup" @click="showZoneFilter = false">
      <view class="popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">选择区域</text>
          <text class="popup-close" @click="showZoneFilter = false">×</text>
        </view>
        <view class="popup-options">
          <view
            class="option-item"
            :class="{ active: !currentZone }"
            @click="selectZone('')"
          >
            全部区域
          </view>
          <view
            v-for="zone in filterOptions.zones"
            :key="zone"
            class="option-item"
            :class="{ active: currentZone === zone }"
            @click="selectZone(zone)"
          >
            {{ zone }}区
          </view>
        </view>
      </view>
    </view>

    <!-- 保税筛选弹窗 -->
    <view v-if="showBondedFilter" class="filter-popup" @click="showBondedFilter = false">
      <view class="popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">保税类型</text>
          <text class="popup-close" @click="showBondedFilter = false">×</text>
        </view>
        <view class="popup-options">
          <view
            class="option-item"
            :class="{ active: currentBonded === '' }"
            @click="selectBonded('')"
          >
            全部
          </view>
          <view
            class="option-item"
            :class="{ active: currentBonded === 'true' }"
            @click="selectBonded('true')"
          >
            保税
          </view>
          <view
            class="option-item"
            :class="{ active: currentBonded === 'false' }"
            @click="selectBonded('false')"
          >
            非保税
          </view>
        </view>
      </view>
    </view>

    <!-- 库存状态筛选弹窗 -->
    <view v-if="showInventoryFilter" class="filter-popup" @click="showInventoryFilter = false">
      <view class="popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">库存状态</text>
          <text class="popup-close" @click="showInventoryFilter = false">×</text>
        </view>
        <view class="popup-options">
          <view
            class="option-item"
            :class="{ active: hasInventory === '' }"
            @click="selectInventory('')"
          >
            全部
          </view>
          <view
            class="option-item"
            :class="{ active: hasInventory === 'true' }"
            @click="selectInventory('true')"
          >
            有库存
          </view>
          <view
            class="option-item"
            :class="{ active: hasInventory === 'false' }"
            @click="selectInventory('false')"
          >
            无库存
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { stocktakingApi, type LocationWithStats } from '@/api/stocktaking'
import { locationApi, type LocationFilterOptions } from '@/api/location'

// 状态
const loading = ref(false)
const refreshing = ref(false)
const locations = ref<LocationWithStats[]>([])
const stats = ref({
  totalLocations: 0,
  occupiedLocations: 0,
  emptyLocations: 0,
  totalQuantity: 0,
})
const filterOptions = ref<LocationFilterOptions>({
  zones: [],
  categories: [],
  bondedOptions: [],
  categoryOptions: [],
})
const unassignedCount = ref(0)

// 筛选条件
const currentZone = ref('')
const currentBonded = ref('')
const hasInventory = ref('')

// 弹窗控制
const showZoneFilter = ref(false)
const showBondedFilter = ref(false)
const showInventoryFilter = ref(false)

// 计算属性
const bondedText = computed(() => {
  if (currentBonded.value === 'true') return '保税'
  if (currentBonded.value === 'false') return '非保税'
  return '全部类型'
})

const inventoryText = computed(() => {
  if (hasInventory.value === 'true') return '有库存'
  if (hasInventory.value === 'false') return '无库存'
  return '全部状态'
})

// 分类名称映射
function getCategoryName(category: string): string {
  const map: Record<string, string> = {
    shelf: '货架',
    floor: '地面',
    large: '大件',
    small: '小件',
  }
  return map[category] || category
}

// 加载库位数据
async function loadLocations() {
  loading.value = true
  try {
    const res = await stocktakingApi.getAllLocationsSummary({
      zone: currentZone.value || undefined,
      bonded: currentBonded.value || undefined,
      hasInventory: hasInventory.value || undefined,
    })
    if (res.success) {
      locations.value = (res.data as any)?.data || res.data || []
      stats.value = (res.data as any)?.stats || res.stats || stats.value
    }
  } catch (error) {
    console.error('加载库位失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载筛选选项
async function loadFilterOptions() {
  try {
    const res = await locationApi.getFilterOptions()
    if (res.success && res.data) {
      filterOptions.value = res.data
    }
  } catch (error) {
    console.error('加载筛选选项失败:', error)
  }
}

// 加载未分配库存数量
async function loadUnassignedCount() {
  try {
    const res = await stocktakingApi.getUnassignedInventory({ page: 1, size: 1 })
    if (res.success) {
      unassignedCount.value = res.total || 0
    }
  } catch (error) {
    console.error('加载未分配数量失败:', error)
  }
}

// 下拉刷新
async function onRefresh() {
  refreshing.value = true
  await Promise.all([loadLocations(), loadUnassignedCount()])
  refreshing.value = false
}

// 选择区域
function selectZone(zone: string) {
  currentZone.value = zone
  showZoneFilter.value = false
  loadLocations()
}

// 选择保税类型
function selectBonded(bonded: string) {
  currentBonded.value = bonded
  showBondedFilter.value = false
  loadLocations()
}

// 选择库存状态
function selectInventory(inventory: string) {
  hasInventory.value = inventory
  showInventoryFilter.value = false
  loadLocations()
}

// 返回
function goBack() {
  uni.navigateBack()
}

// 跳转到详情
function goToDetail(loc: LocationWithStats) {
  uni.navigateTo({
    url: `/pages/stocktaking/detail?code=${loc.code}`,
  })
}

// 跳转到未分配库存
function goToUnassigned() {
  uni.navigateTo({
    url: '/pages/stocktaking/unassigned',
  })
}

onMounted(() => {
  loadFilterOptions()
  loadLocations()
  loadUnassignedCount()
})

onShow(() => {
  loadLocations()
  loadUnassignedCount()
})
</script>

<style lang="scss" scoped>
.stocktaking-page {
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

.stats-row {
  display: flex;
  padding: 24rpx 32rpx;
  background: #ffffff;
  gap: 16rpx;
}

.stat-card {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  background: #f9f9f9;
  border-radius: 12rpx;
}

.stat-value {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;

  &.green {
    color: #52c41a;
  }
  &.gray {
    color: #999999;
  }
  &.blue {
    color: #1890ff;
  }
}

.stat-label {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
}

.filter-bar {
  display: flex;
  padding: 20rpx 32rpx;
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  gap: 16rpx;
}

.filter-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #666666;
}

.arrow {
  font-size: 20rpx;
  margin-left: 8rpx;
  color: #999999;
}

.location-list {
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

.location-item {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.location-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.location-code {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.code {
  font-size: 32rpx;
  font-weight: bold;
  color: #fa8c16;

  &.bonded {
    color: #1890ff;
  }
}

.bonded-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;

  &.is-bonded {
    background: #e6f7ff;
    color: #1890ff;
  }
  &.not-bonded {
    background: #fff7e6;
    color: #fa8c16;
  }
}

.location-quantity {
  display: flex;
  align-items: baseline;

  &.has-stock .qty-value {
    color: #52c41a;
  }
}

.qty-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #999999;
}

.qty-unit {
  font-size: 22rpx;
  color: #999999;
  margin-left: 4rpx;
}

.location-info {
  display: flex;
  justify-content: space-between;
}

.info-item {
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
  justify-content: center;
  padding: 0 32rpx;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 80rpx;
  background: #1890ff;
  border-radius: 12rpx;
  position: relative;
}

.btn-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.btn-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: bold;
}

.badge {
  position: absolute;
  top: -10rpx;
  right: 40rpx;
  min-width: 36rpx;
  height: 36rpx;
  background: #ff4d4f;
  border-radius: 18rpx;
  font-size: 22rpx;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.filter-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.popup-content {
  width: 100%;
  background: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 70vh;
  overflow-y: auto;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.popup-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.popup-close {
  font-size: 40rpx;
  color: #999999;
}

.popup-options {
  padding: 16rpx 0;
}

.option-item {
  padding: 28rpx 32rpx;
  font-size: 30rpx;
  color: #333333;

  &.active {
    color: #1890ff;
    background: #e6f7ff;
  }
}
</style>
