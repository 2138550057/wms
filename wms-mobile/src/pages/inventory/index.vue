<template>
  <view class="inventory-page">
    <!-- 顶部标题栏 -->
    <view class="page-header">
      <view class="header-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">库存管理</text>
      <view class="header-right"></view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <text class="search-icon">🔍</text>
        <input
          v-model="searchKey"
          type="text"
          placeholder="搜索货名/SKU/进仓编号/库位"
          class="search-input"
          @confirm="handleSearch"
        />
        <text v-if="searchKey" class="clear-icon" @click="clearSearch">×</text>
      </view>
    </view>

    <!-- 筛选条件 -->
    <view class="filter-bar">
      <view class="filter-item" @click="showCustomerPicker = true">
        <text>{{ currentCustomer || '全部客户' }}</text>
        <text class="filter-arrow">▼</text>
      </view>
      <view class="filter-item" @click="showLocationPicker = true">
        <text>{{ currentLocation || '全部库位' }}</text>
        <text class="filter-arrow">▼</text>
      </view>
    </view>

    <!-- 库存列表 -->
    <scroll-view
      class="inventory-scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
      @touchmove.stop
    >
      <view class="inventory-list" v-if="items.length > 0">
        <view
          v-for="item in items"
          :key="item.id"
          class="inventory-card"
          @click="showDetail(item)"
        >
          <view class="card-header">
            <text class="product-name">{{ item.productName || item.sku || '未命名' }}</text>
            <view class="qty-badge">
              <text class="qty-value">{{ item.quantity }}</text>
              <text class="qty-unit">件</text>
            </view>
          </view>

          <view class="card-body">
            <view class="info-grid">
              <view class="info-item">
                <text class="info-label">CMD编号</text>
                <text class="info-value">{{ item.sku || '-' }}</text>
              </view>
              <view class="info-item">
                <text class="info-label">客户</text>
                <text class="info-value">{{ item.customerName || '-' }}</text>
              </view>
              <view class="info-item">
                <text class="info-label">进仓编号</text>
                <text class="info-value">{{ item.warehouseEntryNo || '-' }}</text>
              </view>
              <view class="info-item">
                <text class="info-label">库位</text>
                <text class="info-value">{{ item.locationCode || '-' }}</text>
              </view>
            </view>
          </view>

          <view class="card-actions">
            <button class="action-btn edit" @click.stop="openAdjustModal(item)">调整数量</button>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else-if="!loading">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无库存数据</text>
        <text class="empty-hint">下拉刷新或修改搜索条件</text>
      </view>

      <!-- 加载状态 -->
      <view class="loading-more" v-if="loading && items.length > 0">
        <text>加载中...</text>
      </view>

      <!-- 没有更多 -->
      <view class="no-more" v-if="!hasMore && items.length > 0">
        <text>— 已加载全部 {{ items.length }} 条 —</text>
      </view>

      <view class="safe-bottom"></view>
    </scroll-view>

    <!-- 客户选择器 -->
    <view class="picker-mask" v-if="showCustomerPicker" @click="showCustomerPicker = false" @touchmove.stop>
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择客户</text>
          <text class="picker-close" @click="showCustomerPicker = false">×</text>
        </view>
        <scroll-view class="picker-scroll" scroll-y @touchmove.stop>
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
    <view class="picker-mask" v-if="showLocationPicker" @click="showLocationPicker = false" @touchmove.stop>
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择库位</text>
          <text class="picker-close" @click="showLocationPicker = false">×</text>
        </view>
        <scroll-view class="picker-scroll" scroll-y @touchmove.stop>
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

    <!-- 库存详情弹窗 -->
    <view class="detail-popup" v-if="selectedItem" @click="selectedItem = null" @touchmove.stop>
      <view class="detail-content" @click.stop>
        <view class="detail-header">
          <text class="detail-title">库存详情</text>
          <text class="detail-close" @click="selectedItem = null">×</text>
        </view>
        <scroll-view class="detail-scroll" scroll-y @touchmove.stop>
          <view class="detail-section">
            <view class="section-title">基本信息</view>
            <view class="detail-grid">
              <view class="detail-item full">
                <text class="label">商品名称</text>
                <text class="value">{{ selectedItem.productName || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">CMD编号</text>
                <text class="value">{{ selectedItem.sku || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">型号</text>
                <text class="value">{{ selectedItem.productModel || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">内部货号</text>
                <text class="value">{{ selectedItem.internalCode || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">进仓编号</text>
                <text class="value">{{ selectedItem.warehouseEntryNo || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">客户</text>
                <text class="value">{{ selectedItem.customerName || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">库位</text>
                <text class="value">{{ selectedItem.locationCode || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">唛头</text>
                <text class="value">{{ selectedItem.shippingMark || '-' }}</text>
              </view>
            </view>
          </view>

          <view class="detail-section">
            <view class="section-title">数量信息</view>
            <view class="detail-grid">
              <view class="detail-item highlight">
                <text class="label">总件数</text>
                <text class="value">{{ selectedItem.quantity }} 件</text>
              </view>
              <view class="detail-item">
                <text class="label">可用数量</text>
                <text class="value">{{ selectedItem.availableQuantity }} 件</text>
              </view>
              <view class="detail-item">
                <text class="label">锁定数量</text>
                <text class="value">{{ selectedItem.lockedQuantity || 0 }} 件</text>
              </view>
            </view>
          </view>

          <view class="detail-section">
            <view class="section-title">规格信息</view>
            <view class="detail-grid">
              <view class="detail-item">
                <text class="label">尺寸(cm)</text>
                <text class="value">{{ selectedItem.length || 0 }} × {{ selectedItem.width || 0 }} × {{ selectedItem.height || 0 }}</text>
              </view>
              <view class="detail-item">
                <text class="label">体积(m³)</text>
                <text class="value">{{ selectedItem.volume?.toFixed(4) || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">单件毛重(kg)</text>
                <text class="value">{{ selectedItem.unitGrossWeight?.toFixed(2) || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">总毛重(kg)</text>
                <text class="value">{{ selectedItem.totalGrossWeight?.toFixed(2) || '-' }}</text>
              </view>
            </view>
          </view>

          <view class="detail-section">
            <view class="section-title">时间信息</view>
            <view class="detail-grid">
              <view class="detail-item">
                <text class="label">入库时间</text>
                <text class="value">{{ formatFullTime(selectedItem.lastInboundDate) }}</text>
              </view>
              <view class="detail-item" v-if="selectedItem.lastOutboundDate">
                <text class="label">出库时间</text>
                <text class="value">{{ formatFullTime(selectedItem.lastOutboundDate) }}</text>
              </view>
            </view>
          </view>

          <view class="detail-section" v-if="selectedItem.remark">
            <view class="section-title">备注</view>
            <text class="remark-text">{{ selectedItem.remark }}</text>
          </view>

          <!-- 操作按钮 -->
          <view class="detail-actions">
            <button class="btn-adjust" @click="openAdjustModalFromDetail">调整数量</button>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 库存调整弹窗 -->
    <view class="adjust-popup" v-if="showAdjustModal" @click="showAdjustModal = false" @touchmove.stop>
      <view class="adjust-content" @click.stop>
        <view class="adjust-header">
          <text class="adjust-title">库存调整</text>
          <text class="adjust-close" @click="showAdjustModal = false">×</text>
        </view>
        <view class="adjust-body">
          <view class="adjust-info">
            <text class="adjust-product">{{ adjustItem?.productName || adjustItem?.sku || '未命名商品' }}</text>
            <text class="adjust-current">当前库存：{{ adjustItem?.quantity || 0 }} 件</text>
          </view>

          <view class="adjust-form">
            <view class="form-label">调整数量（正数增加，负数减少）</view>
            <view class="adjust-input-row">
              <button class="adjust-btn minus" @click="adjustQuantity -= 1">-</button>
              <input
                v-model.number="adjustQuantity"
                type="number"
                class="adjust-input"
                placeholder="0"
              />
              <button class="adjust-btn plus" @click="adjustQuantity += 1">+</button>
            </view>
            <view class="adjust-preview" v-if="adjustQuantity !== 0">
              <text>调整后：</text>
              <text class="preview-value" :class="{ warning: (adjustItem?.quantity || 0) + adjustQuantity < 0 }">
                {{ (adjustItem?.quantity || 0) + adjustQuantity }} 件
              </text>
            </view>
          </view>

          <view class="form-item">
            <view class="form-label">备注（可选）</view>
            <input
              v-model="adjustRemark"
              type="text"
              class="form-input"
              placeholder="请输入调整原因"
            />
          </view>
        </view>
        <view class="adjust-footer">
          <button class="cancel-btn" @click="showAdjustModal = false">取消</button>
          <button class="confirm-btn" @click="submitAdjust" :disabled="adjustQuantity === 0 || adjusting">
            {{ adjusting ? '提交中...' : '确认调整' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { inventoryAPI } from '@/api'
import type { Inventory } from '@/types'
import { formatDate } from '@/utils'

// 状态
const items = ref<Inventory[]>([])
const loading = ref(false)
const refreshing = ref(false)
const searchKey = ref('')
const currentCustomer = ref('')
const currentLocation = ref('')
const page = ref(1)
const size = ref(20)
const hasMore = ref(true)

// 选择器
const showCustomerPicker = ref(false)
const showLocationPicker = ref(false)
const customers = ref<string[]>([])
const locations = ref<string[]>([])

// 详情弹窗
const selectedItem = ref<Inventory | null>(null)

// 库存调整
const showAdjustModal = ref(false)
const adjustItem = ref<Inventory | null>(null)
const adjustQuantity = ref(0)
const adjustRemark = ref('')
const adjusting = ref(false)

// 返回
function goBack() {
  uni.navigateBack()
}

// 格式化时间
function formatFullTime(dateStr?: string) {
  if (!dateStr) return '-'
  return formatDate(dateStr, 'YYYY-MM-DD HH:mm')
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
      size: size.value
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

      // 提取客户和库位列表
      const customerSet = new Set<string>()
      const locationSet = new Set<string>()
      newItems.forEach((item: Inventory) => {
        if (item.customerName) customerSet.add(item.customerName)
        if (item.locationCode) locationSet.add(item.locationCode)
      })
      customers.value = Array.from(customerSet)
      locations.value = Array.from(locationSet)
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
    refreshing.value = false
  }
}

// 下拉刷新
async function onRefresh() {
  refreshing.value = true
  await loadItems(true)
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

// 打开调整弹窗（从卡片）
function openAdjustModal(item: Inventory) {
  adjustItem.value = item
  adjustQuantity.value = 0
  adjustRemark.value = ''
  showAdjustModal.value = true
}

// 打开调整弹窗（从详情）
function openAdjustModalFromDetail() {
  if (selectedItem.value) {
    adjustItem.value = selectedItem.value
    adjustQuantity.value = 0
    adjustRemark.value = ''
    selectedItem.value = null
    showAdjustModal.value = true
  }
}

// 提交库存调整
async function submitAdjust() {
  if (!adjustItem.value || adjustQuantity.value === 0) return

  const newQty = adjustItem.value.quantity + adjustQuantity.value
  if (newQty < 0) {
    uni.showToast({ title: '调整后库存不能为负数', icon: 'none' })
    return
  }

  adjusting.value = true

  try {
    await inventoryAPI.adjust({
      id: adjustItem.value.id,
      adjustQuantity: adjustQuantity.value,
      remark: adjustRemark.value || undefined
    })

    uni.showToast({ title: '调整成功', icon: 'success' })
    showAdjustModal.value = false
    adjustItem.value = null

    // 刷新列表
    await loadItems(true)
  } catch (error: any) {
    uni.showToast({ title: error.message || '调整失败', icon: 'none' })
  } finally {
    adjusting.value = false
  }
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
.inventory-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

// 顶部标题栏
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.header-left {
  width: 80rpx;
}

.back-icon {
  font-size: 40rpx;
  color: #333;
}

.header-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.header-right {
  width: 80rpx;
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
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64rpx;
  background: #f5f7fa;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #666;
}

.filter-arrow {
  font-size: 20rpx;
  margin-left: 8rpx;
  color: #999;
}

.inventory-scroll {
  flex: 1;
  height: calc(100vh - 300rpx);
}

.inventory-list {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.inventory-card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.product-name {
  flex: 1;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qty-badge {
  display: flex;
  align-items: baseline;
  margin-left: 16rpx;
}

.qty-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #52c41a;
}

.qty-unit {
  font-size: 24rpx;
  color: #52c41a;
  margin-left: 4rpx;
}

.card-body {
  padding: 20rpx 24rpx;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.info-value {
  font-size: 26rpx;
  color: #333;
}

// 卡片操作按钮
.card-actions {
  padding: 16rpx 24rpx;
  border-top: 1rpx solid #f5f5f5;
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 12rpx 32rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  border: none;

  &::after {
    border: none;
  }

  &.edit {
    background: #1890ff;
    color: #fff;
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
  font-size: 32rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 26rpx;
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

// 选择器样式
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
  align-items: center;
  justify-content: space-between;
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

// 详情弹窗样式
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
  align-items: center;
  justify-content: space-between;
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
  display: flex;
  flex-direction: column;
  padding: 16rpx;
  background: #f8f9fa;
  border-radius: 8rpx;

  &.full {
    grid-column: span 2;
  }

  &.highlight .value {
    color: #52c41a;
    font-weight: 600;
  }

  .label {
    font-size: 24rpx;
    color: #999;
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

// 详情操作按钮
.detail-actions {
  margin-top: 32rpx;
  padding-top: 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn-adjust {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #1890ff;
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;

  &::after {
    border: none;
  }
}

// 库存调整弹窗
.adjust-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}

.adjust-content {
  width: 100%;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.adjust-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.adjust-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.adjust-close {
  font-size: 48rpx;
  color: #999;
}

.adjust-body {
  padding: 32rpx;
}

.adjust-info {
  text-align: center;
  padding-bottom: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  margin-bottom: 32rpx;
}

.adjust-product {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.adjust-current {
  font-size: 26rpx;
  color: #666;
}

.adjust-form {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.adjust-input-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.adjust-btn {
  width: 88rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: 12rpx;
  font-size: 40rpx;
  font-weight: bold;
  border: none;

  &::after {
    border: none;
  }

  &.minus {
    background: #fff1f0;
    color: #ff4d4f;
  }

  &.plus {
    background: #f6ffed;
    color: #52c41a;
  }
}

.adjust-input {
  flex: 1;
  height: 88rpx;
  text-align: center;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  background: #f5f7fa;
  border-radius: 12rpx;
}

.adjust-preview {
  margin-top: 16rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666;
}

.preview-value {
  font-weight: 600;
  color: #52c41a;

  &.warning {
    color: #ff4d4f;
  }
}

.form-item {
  margin-top: 24rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
  background: #f5f7fa;
  border-radius: 12rpx;
}

.adjust-footer {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 32rpx 32rpx;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
  border: none;

  &::after {
    border: none;
  }
}

.cancel-btn {
  background: #f5f7fa;
  color: #666;
}

.confirm-btn {
  background: #1890ff;
  color: #fff;

  &:disabled {
    background: #d9d9d9;
    color: #999;
  }
}
</style>
