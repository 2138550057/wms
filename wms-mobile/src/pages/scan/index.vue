<template>
  <view class="inventory-check-page">
    <!-- 顶部统计 -->
    <view class="stats-header">
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-value">{{ stats.totalSku }}</text>
          <text class="stat-label">库存SKU</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.totalQty }}</text>
          <text class="stat-label">总件数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.locations }}</text>
          <text class="stat-label">库位数</text>
        </view>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input
          v-model="searchKey"
          type="text"
          placeholder="搜索货名/进仓编号/库位"
          class="search-input"
          @confirm="handleSearch"
        />
        <text v-if="searchKey" class="clear-btn" @click="clearSearch">×</text>
      </view>
    </view>

    <!-- 筛选排序栏 -->
    <view class="filter-bar">
      <view class="filter-item" :class="{ active: sortOrder === 'desc' }" @click="toggleSort">
        <text>{{ sortOrder === 'desc' ? '最新入库' : '最早入库' }}</text>
        <text class="sort-icon">{{ sortOrder === 'desc' ? '↓' : '↑' }}</text>
      </view>
      <view class="filter-item" @click="showCustomerPicker = true">
        <text>{{ currentCustomer || '全部客户' }}</text>
        <text class="arrow">▼</text>
      </view>
      <view class="filter-item" @click="showLocationPicker = true">
        <text>{{ currentLocation || '全部库位' }}</text>
        <text class="arrow">▼</text>
      </view>
    </view>

    <!-- 库存列表 -->
    <scroll-view
      class="inventory-scroll"
      scroll-y
      @scrolltolower="loadMore"
    >
      <view class="inventory-list" v-if="items.length > 0">
        <view
          v-for="item in items"
          :key="item.id"
          class="inventory-card"
          @click="showDetail(item)"
        >
          <!-- 第一行：入库日期 + 库龄 | 数量 -->
          <view class="card-top">
            <view class="date-info">
              <text class="date-text">{{ formatInboundDate(item.lastInboundDate) }}</text>
              <text class="age-badge" :class="getAgeBadgeClass(item.lastInboundDate)">
                {{ calculateAge(item.lastInboundDate) }}天
              </text>
            </view>
            <view class="qty-info">
              <text class="qty-value">{{ item.quantity }}</text>
              <text class="qty-unit">件</text>
            </view>
          </view>

          <!-- 第二行：货名（大标题） -->
          <view class="card-main">
            <text class="product-name">{{ item.productName || item.sku || '未命名商品' }}</text>
          </view>

          <!-- 第三行：库位 + 进仓编号 -->
          <view class="card-info">
            <view class="info-tag location">
              <text class="tag-icon">📍</text>
              <text class="tag-text">{{ item.locationCode || '未分配' }}</text>
            </view>
            <view class="info-tag entry" v-if="item.warehouseEntryNo">
              <text class="tag-icon">📄</text>
              <text class="tag-text">{{ item.warehouseEntryNo }}</text>
            </view>
          </view>

          <!-- 第四行：客户 -->
          <view class="card-footer">
            <text class="customer-name">{{ item.customerName || '-' }}</text>
            <text class="sku-text" v-if="item.sku">SKU: {{ item.sku }}</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else-if="!loading">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无库存数据</text>
        <text class="empty-hint">下拉刷新试试</text>
      </view>

      <!-- 加载中 -->
      <view class="loading-state" v-if="loading && items.length === 0">
        <text>加载中...</text>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" v-if="loading && items.length > 0">
        <text>加载中...</text>
      </view>

      <!-- 没有更多 -->
      <view class="no-more" v-if="!hasMore && items.length > 0">
        <text>— 已加载全部 {{ items.length }} 条 —</text>
      </view>

      <view class="safe-bottom"></view>
    </scroll-view>

    <!-- 客户选择器 -->
    <view class="picker-mask" v-if="showCustomerPicker" @click="showCustomerPicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择客户</text>
          <text class="picker-close" @click="showCustomerPicker = false">×</text>
        </view>
        <scroll-view class="picker-scroll" scroll-y>
          <view
            class="picker-item"
            :class="{ active: currentCustomer === '' }"
            @click="selectCustomer('')"
          >
            全部客户
          </view>
          <view
            v-for="customer in customers"
            :key="customer"
            class="picker-item"
            :class="{ active: currentCustomer === customer }"
            @click="selectCustomer(customer)"
          >
            {{ customer }}
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 库位选择器 -->
    <view class="picker-mask" v-if="showLocationPicker" @click="showLocationPicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择库位</text>
          <text class="picker-close" @click="showLocationPicker = false">×</text>
        </view>
        <scroll-view class="picker-scroll" scroll-y>
          <view
            class="picker-item"
            :class="{ active: currentLocation === '' }"
            @click="selectLocation('')"
          >
            全部库位
          </view>
          <view
            v-for="location in locations"
            :key="location"
            class="picker-item"
            :class="{ active: currentLocation === location }"
            @click="selectLocation(location)"
          >
            {{ location }}
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 详情弹窗 -->
    <view class="detail-popup" v-if="selectedItem" @click="selectedItem = null" @touchmove.stop>
      <view class="detail-content" @click.stop>
        <view class="detail-header">
          <text class="detail-title">库存详情</text>
          <text class="detail-close" @click="selectedItem = null">×</text>
        </view>
        <scroll-view class="detail-scroll" scroll-y @touchmove.stop>
          <!-- 核心信息 -->
          <view class="detail-highlight">
            <view class="highlight-item">
              <text class="highlight-label">入库日期</text>
              <text class="highlight-value">{{ formatFullDate(selectedItem.lastInboundDate) }}</text>
            </view>
            <view class="highlight-item">
              <text class="highlight-label">库龄</text>
              <text class="highlight-value age" :class="getAgeBadgeClass(selectedItem.lastInboundDate)">
                {{ calculateAge(selectedItem.lastInboundDate) }} 天
              </text>
            </view>
            <view class="highlight-item primary">
              <text class="highlight-label">库存数量</text>
              <text class="highlight-value">{{ selectedItem.quantity }} 件</text>
            </view>
          </view>

          <!-- 基本信息 -->
          <view class="detail-section">
            <view class="section-title">商品信息</view>
            <view class="detail-grid">
              <view class="detail-item full">
                <text class="label">货名</text>
                <text class="value">{{ selectedItem.productName || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">CMD编号</text>
                <text class="value">{{ selectedItem.sku || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">内部货号</text>
                <text class="value">{{ selectedItem.internalCode || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">型号</text>
                <text class="value">{{ selectedItem.productModel || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">唛头</text>
                <text class="value">{{ selectedItem.shippingMark || '-' }}</text>
              </view>
            </view>
          </view>

          <!-- 库存信息 -->
          <view class="detail-section">
            <view class="section-title">库存信息</view>
            <view class="detail-grid">
              <view class="detail-item">
                <text class="label">库位</text>
                <text class="value">{{ selectedItem.locationCode || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">进仓编号</text>
                <text class="value">{{ selectedItem.warehouseEntryNo || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">可用数量</text>
                <text class="value">{{ selectedItem.availableQuantity }} 件</text>
              </view>
              <view class="detail-item">
                <text class="label">锁定数量</text>
                <text class="value">{{ selectedItem.lockedQuantity || 0 }} 件</text>
              </view>
              <view class="detail-item">
                <text class="label">客户</text>
                <text class="value">{{ selectedItem.customerName || '-' }}</text>
              </view>
            </view>
          </view>

          <!-- 规格信息 -->
          <view class="detail-section" v-if="selectedItem.length || selectedItem.volume">
            <view class="section-title">规格信息</view>
            <view class="detail-grid">
              <view class="detail-item" v-if="selectedItem.length">
                <text class="label">尺寸(cm)</text>
                <text class="value">{{ selectedItem.length }} × {{ selectedItem.width }} × {{ selectedItem.height }}</text>
              </view>
              <view class="detail-item" v-if="selectedItem.volume">
                <text class="label">体积(m³)</text>
                <text class="value">{{ selectedItem.volume.toFixed(4) }}</text>
              </view>
              <view class="detail-item" v-if="selectedItem.unitGrossWeight">
                <text class="label">单件毛重(kg)</text>
                <text class="value">{{ selectedItem.unitGrossWeight.toFixed(2) }}</text>
              </view>
              <view class="detail-item" v-if="selectedItem.totalGrossWeight">
                <text class="label">总毛重(kg)</text>
                <text class="value">{{ selectedItem.totalGrossWeight.toFixed(2) }}</text>
              </view>
            </view>
          </view>

          <!-- 备注 -->
          <view class="detail-section" v-if="selectedItem.remark">
            <view class="section-title">备注</view>
            <text class="remark-text">{{ selectedItem.remark }}</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 自定义TabBar -->
    <CustomTabBar :current="2" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomTabBar from '@/components/CustomTabBar.vue'
import { inventoryAPI } from '@/api'
import type { Inventory } from '@/types'
import { formatDate } from '@/utils'

// 统计数据
const stats = reactive({
  totalSku: 0,
  totalQty: 0,
  locations: 0
})

// 列表数据
const items = ref<Inventory[]>([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const size = ref(20)

// 搜索和筛选
const searchKey = ref('')
const sortOrder = ref<'desc' | 'asc'>('desc')
const currentCustomer = ref('')
const currentLocation = ref('')

// 选择器
const showCustomerPicker = ref(false)
const showLocationPicker = ref(false)
const customers = ref<string[]>([])
const locations = ref<string[]>([])

// 详情
const selectedItem = ref<Inventory | null>(null)

// 计算库龄
function calculateAge(dateStr?: string): number {
  if (!dateStr) return 0
  const inboundDate = new Date(dateStr)
  const today = new Date()
  const diffTime = today.getTime() - inboundDate.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// 获取库龄样式
function getAgeBadgeClass(dateStr?: string): string {
  const age = calculateAge(dateStr)
  if (age > 90) return 'danger'
  if (age > 30) return 'warning'
  return 'normal'
}

// 格式化入库日期
function formatInboundDate(dateStr?: string): string {
  if (!dateStr) return '-'
  return formatDate(dateStr, 'MM-DD')
}

// 格式化完整日期
function formatFullDate(dateStr?: string): string {
  if (!dateStr) return '-'
  return formatDate(dateStr, 'YYYY-MM-DD')
}

// 加载库存列表
async function loadItems(isRefresh = false) {
  if (loading.value) return

  if (isRefresh) {
    page.value = 1
    hasMore.value = true
  }

  loading.value = true

  try {
    const params: any = {
      page: page.value,
      size: size.value,
      sortBy: 'lastInboundDate',
      sortOrder: sortOrder.value
    }

    if (searchKey.value) {
      params.search = searchKey.value
    }
    if (currentCustomer.value) {
      params.customerName = currentCustomer.value
    }
    if (currentLocation.value) {
      params.locationCode = currentLocation.value
    }

    const res = await inventoryAPI.list(params)
    const newItems = res.data || []

    if (isRefresh || page.value === 1) {
      items.value = newItems

      // 更新统计
      stats.totalSku = res.total || newItems.length
      let totalQty = 0
      const locationSet = new Set<string>()
      const customerSet = new Set<string>()

      newItems.forEach((item: Inventory) => {
        totalQty += item.quantity || 0
        if (item.locationCode) locationSet.add(item.locationCode)
        if (item.customerName) customerSet.add(item.customerName)
      })

      stats.totalQty = totalQty
      stats.locations = locationSet.size
      locations.value = Array.from(locationSet)
      customers.value = Array.from(customerSet)
    } else {
      items.value = [...items.value, ...newItems]
    }

    hasMore.value = newItems.length >= size.value
  } catch (error: any) {
    console.error('加载库存失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 加载更多
function loadMore() {
  if (!hasMore.value || loading.value) return
  page.value++
  loadItems()
}

// 搜索
function handleSearch() {
  loadItems(true)
}

// 清除搜索
function clearSearch() {
  searchKey.value = ''
  loadItems(true)
}

// 切换排序
function toggleSort() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  loadItems(true)
}

// 选择客户
function selectCustomer(customer: string) {
  currentCustomer.value = customer
  showCustomerPicker.value = false
  loadItems(true)
}

// 选择库位
function selectLocation(location: string) {
  currentLocation.value = location
  showLocationPicker.value = false
  loadItems(true)
}

// 显示详情
function showDetail(item: Inventory) {
  selectedItem.value = item
}

// 页面加载
onMounted(() => {
  loadItems()
})

// 页面显示
onShow(() => {
  if (items.value.length > 0) {
    loadItems(true)
  }
})
</script>

<style lang="scss" scoped>
.inventory-check-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 120rpx;
}

// 顶部统计
.stats-header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 32rpx;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

// 搜索栏
.search-section {
  padding: 24rpx;
  background: #fff;
}

.search-bar {
  display: flex;
  align-items: center;
  height: 80rpx;
  padding: 0 24rpx;
  background: #f5f7fa;
  border-radius: 40rpx;
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

.clear-btn {
  font-size: 40rpx;
  color: #999;
  padding: 0 8rpx;
}

// 筛选栏
.filter-bar {
  display: flex;
  padding: 16rpx 24rpx;
  background: #fff;
  border-top: 1rpx solid #f0f0f0;
  gap: 16rpx;
}

.filter-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56rpx;
  background: #f5f7fa;
  border-radius: 28rpx;
  font-size: 24rpx;
  color: #666;

  &.active {
    background: #e6f7ff;
    color: #1890ff;
  }
}

.sort-icon, .arrow {
  font-size: 20rpx;
  margin-left: 6rpx;
}

// 库存列表
.inventory-scroll {
  height: calc(100vh - 360rpx);
}

.inventory-list {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

// 库存卡片 - 关键信息突出显示
.inventory-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  &:active {
    background: #fafafa;
  }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.date-text {
  font-size: 28rpx;
  color: #1890ff;
  font-weight: 500;
}

.age-badge {
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: 22rpx;

  &.normal {
    background: #f6ffed;
    color: #52c41a;
  }
  &.warning {
    background: #fffbe6;
    color: #faad14;
  }
  &.danger {
    background: #fff1f0;
    color: #ff4d4f;
  }
}

.qty-info {
  display: flex;
  align-items: baseline;
}

.qty-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #52c41a;
}

.qty-unit {
  font-size: 24rpx;
  color: #52c41a;
  margin-left: 4rpx;
}

.card-main {
  margin-bottom: 16rpx;
}

.product-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.card-info {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.info-tag {
  display: flex;
  align-items: center;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;

  &.location {
    background: #f0f5ff;
    color: #2f54eb;
  }
  &.entry {
    background: #f6ffed;
    color: #389e0d;
  }
}

.tag-icon {
  font-size: 24rpx;
  margin-right: 6rpx;
}

.tag-text {
  max-width: 200rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.customer-name {
  font-size: 26rpx;
  color: #666;
}

.sku-text {
  font-size: 22rpx;
  color: #999;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #999;
}

.loading-state,
.load-more,
.no-more {
  text-align: center;
  padding: 32rpx;
  font-size: 26rpx;
  color: #999;
}

.safe-bottom {
  height: 40rpx;
}

// 选择器
.picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.picker-content {
  width: 100%;
  max-height: 60vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.picker-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.picker-close {
  font-size: 48rpx;
  color: #999;
}

.picker-scroll {
  max-height: calc(60vh - 100rpx);
}

.picker-item {
  padding: 32rpx;
  font-size: 30rpx;
  color: #333;
  border-bottom: 1rpx solid #f5f5f5;

  &.active {
    color: #1890ff;
    background: #e6f7ff;
  }
}

// 详情弹窗
.detail-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.detail-content {
  width: 100%;
  max-height: 85vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.detail-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.detail-close {
  font-size: 48rpx;
  color: #999;
}

.detail-scroll {
  max-height: calc(85vh - 100rpx);
  padding: 0 32rpx 32rpx;
}

// 核心信息高亮
.detail-highlight {
  display: flex;
  justify-content: space-around;
  padding: 32rpx 0;
  background: #fafafa;
  margin: 24rpx -32rpx;
  padding: 32rpx;
}

.highlight-item {
  display: flex;
  flex-direction: column;
  align-items: center;

  &.primary .highlight-value {
    color: #52c41a;
  }
}

.highlight-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.highlight-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;

  &.age {
    &.normal { color: #52c41a; }
    &.warning { color: #faad14; }
    &.danger { color: #ff4d4f; }
  }
}

.detail-section {
  margin-top: 32rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.detail-item {
  padding: 16rpx;
  background: #f8f9fa;
  border-radius: 8rpx;

  &.full {
    grid-column: span 2;
  }

  .label {
    font-size: 24rpx;
    color: #999;
    display: block;
    margin-bottom: 4rpx;
  }

  .value {
    font-size: 28rpx;
    color: #333;
  }
}

.remark-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}
</style>
