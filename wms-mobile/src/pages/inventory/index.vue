<template>
  <view class="inventory-page">
    <!-- 顶部搜索和操作栏 -->
    <view class="header-bar">
      <view class="search-row">
        <view class="search-input-wrapper">
          <text class="search-icon">🔍</text>
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索货名/CMD编号"
            class="search-input"
            @confirm="handleSearch"
          />
          <text v-if="keyword" class="clear-icon" @click="clearKeyword">×</text>
        </view>
        <view class="filter-btn" @click="showFilterPanel = true">
          <text class="filter-icon">⚙️</text>
          <view v-if="activeFilterCount > 0" class="filter-badge">{{ activeFilterCount }}</view>
        </view>
      </view>

      <!-- 批量操作栏 -->
      <view class="batch-bar" v-if="isBatchMode">
        <view class="batch-left">
          <view class="checkbox-wrapper" @click="toggleSelectAll">
            <view class="checkbox" :class="{ checked: isAllSelected }">
              <text v-if="isAllSelected">✓</text>
            </view>
            <text class="select-text">全选</text>
          </view>
          <text class="selected-count">已选 {{ selectedIds.length }} 项</text>
        </view>
        <view class="batch-right">
          <button class="batch-btn delete" @click="handleBatchDelete">删除</button>
          <button class="batch-btn cancel" @click="exitBatchMode">取消</button>
        </view>
      </view>

      <!-- 普通操作栏 -->
      <view class="action-bar" v-else>
        <button class="action-btn" @click="enterBatchMode">
          <text>批量管理</text>
        </button>
        <view class="filter-tags-inline" v-if="activeFilterCount > 0">
          <text class="tags-text">{{ activeFilterCount }}个筛选</text>
          <text class="clear-filters" @click="clearAllFilters">清除</text>
        </view>
      </view>
    </view>

    <!-- 库存列表 -->
    <scroll-view
      class="inventory-list"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="handleRefresh"
      @scrolltolower="loadMore"
    >
      <view class="empty-state" v-if="!loading && inventoryList.length === 0">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无库存数据</text>
      </view>

      <view
        v-for="item in inventoryList"
        :key="item.id"
        class="inventory-card"
        :class="{ selected: selectedIds.includes(item.id) }"
        @click="handleCardClick(item)"
      >
        <!-- 批量选择框 -->
        <view v-if="isBatchMode" class="card-checkbox" @click.stop="toggleSelect(item.id)">
          <view class="checkbox" :class="{ checked: selectedIds.includes(item.id) }">
            <text v-if="selectedIds.includes(item.id)">✓</text>
          </view>
        </view>

        <view class="card-content">
          <!-- 头部：货名 + CMD编号 -->
          <view class="item-header">
            <view class="name-row">
              <text class="item-name">{{ item.productName || '未命名产品' }}</text>
              <text class="item-sku" v-if="item.sku">{{ item.sku }}</text>
            </view>
            <view class="item-quantity">
              <text class="quantity-value">{{ item.quantity }}</text>
              <text class="quantity-unit">件</text>
            </view>
          </view>

          <!-- 标签行：客户 + 库位 -->
          <view class="item-tags">
            <view class="tag customer" v-if="item.customerName">
              <text>{{ item.customerName }}</text>
            </view>
            <view class="tag location" v-if="item.locationCode">
              <text>{{ item.locationCode }}</text>
            </view>
          </view>

          <!-- 信息行：PO号、型号、进仓编号 -->
          <view class="item-info-grid">
            <view class="info-item" v-if="item.poNumber">
              <text class="info-label">PO号</text>
              <text class="info-value">{{ item.poNumber }}</text>
            </view>
            <view class="info-item" v-if="item.productModel">
              <text class="info-label">型号</text>
              <text class="info-value">{{ item.productModel }}</text>
            </view>
            <view class="info-item" v-if="item.warehouseEntryNo">
              <text class="info-label">进仓编号</text>
              <text class="info-value">{{ item.warehouseEntryNo }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">实收数量</text>
              <text class="info-value highlight">{{ item.quantity }}</text>
            </view>
          </view>

          <!-- 底部 -->
          <view class="item-footer">
            <view class="stock-info">
              <text class="stock-label">可用: </text>
              <text class="stock-value available">{{ item.availableQuantity }}</text>
              <text class="stock-label" v-if="item.lockedQuantity > 0"> | 锁定: </text>
              <text class="stock-value locked" v-if="item.lockedQuantity > 0">{{ item.lockedQuantity }}</text>
            </view>
            <text class="view-detail" v-if="!isBatchMode">详情 ></text>
          </view>
        </view>
      </view>

      <view class="loading-state" v-if="loading">
        <text>加载中...</text>
      </view>

      <view class="no-more" v-if="!loading && noMore && inventoryList.length > 0">
        <text>没有更多了</text>
      </view>
    </scroll-view>

    <!-- 筛选面板 -->
    <view class="filter-panel" :class="{ show: showFilterPanel }" @click="closeFilterOnMask">
      <view class="filter-content">
        <view class="filter-header">
          <text class="filter-title">高级筛选</text>
          <text class="filter-close" @click="showFilterPanel = false">×</text>
        </view>

        <scroll-view class="filter-body" scroll-y>
          <view class="filter-section">
            <text class="section-label">客户</text>
            <picker mode="selector" :range="customerOptions" range-key="name" @change="onCustomerChange">
              <view class="picker-input">
                <text :class="{ placeholder: !filters.customerName }">
                  {{ filters.customerName || '选择客户' }}
                </text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>

          <view class="filter-section">
            <text class="section-label">进仓编号</text>
            <input v-model="filters.warehouseEntryNo" placeholder="输入进仓编号" class="filter-input" />
          </view>

          <view class="filter-section">
            <text class="section-label">库位</text>
            <input v-model="filters.locationCode" placeholder="输入库位" class="filter-input" />
          </view>

          <view class="filter-section">
            <text class="section-label">CMD编号</text>
            <input v-model="filters.sku" placeholder="输入CMD编号" class="filter-input" />
          </view>

          <view class="filter-section">
            <text class="section-label">内部货号</text>
            <input v-model="filters.internalCode" placeholder="输入内部货号" class="filter-input" />
          </view>

          <view class="filter-section">
            <text class="section-label">PO号</text>
            <input v-model="filters.poNumber" placeholder="输入PO号" class="filter-input" />
          </view>

          <view class="filter-section">
            <text class="section-label">唛头</text>
            <input v-model="filters.shippingMark" placeholder="输入唛头" class="filter-input" />
          </view>
        </scroll-view>

        <view class="filter-footer">
          <button class="btn-reset" @click="resetFilters">重置</button>
          <button class="btn-apply" @click="applyFilters">应用</button>
        </view>
      </view>
    </view>

    <!-- 详情/编辑弹窗 -->
    <view class="detail-modal" :class="{ show: showDetailModal }" @click.self="closeDetailModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">库存详情</text>
          <text class="modal-close" @click="closeDetailModal">×</text>
        </view>

        <scroll-view class="modal-body" scroll-y v-if="currentItem">
          <!-- 基本信息 -->
          <view class="detail-section">
            <view class="section-title">基本信息</view>

            <view class="form-row">
              <text class="form-label">货名 <text class="required">*</text></text>
              <input v-model="currentItem.productName" class="form-input" placeholder="货名" />
            </view>

            <view class="form-row">
              <text class="form-label">CMD编号</text>
              <input v-model="currentItem.sku" class="form-input" placeholder="CMD编号" />
            </view>

            <view class="form-row">
              <text class="form-label">型号</text>
              <input v-model="currentItem.productModel" class="form-input" placeholder="型号" />
            </view>

            <view class="form-row">
              <text class="form-label">内部货号</text>
              <input v-model="currentItem.internalCode" class="form-input" placeholder="内部货号" />
            </view>

            <view class="form-row">
              <text class="form-label">CMD料号</text>
              <input v-model="currentItem.productCode" class="form-input" placeholder="CMD料号" />
            </view>

            <view class="form-row">
              <text class="form-label">客户</text>
              <input :value="currentItem.customerName" class="form-input readonly" disabled placeholder="客户" />
            </view>
          </view>

          <!-- 仓储信息 -->
          <view class="detail-section">
            <view class="section-title">仓储信息</view>

            <view class="form-row">
              <text class="form-label">进仓编号</text>
              <input v-model="currentItem.warehouseEntryNo" class="form-input" placeholder="进仓编号" />
            </view>

            <view class="form-row">
              <text class="form-label">库位</text>
              <input v-model="currentItem.locationCode" class="form-input" placeholder="库位" />
            </view>

            <view class="form-row">
              <text class="form-label">PO号</text>
              <input v-model="currentItem.poNumber" class="form-input" placeholder="PO号" />
            </view>

            <view class="form-row">
              <text class="form-label">唛头</text>
              <input v-model="currentItem.shippingMark" class="form-input" placeholder="唛头" />
            </view>

            <view class="form-row">
              <text class="form-label">包装形式</text>
              <input v-model="currentItem.packageType" class="form-input" placeholder="包装形式" />
            </view>
          </view>

          <!-- 数量信息 -->
          <view class="detail-section">
            <view class="section-title">数量信息</view>

            <view class="form-row">
              <text class="form-label">实收数量 <text class="required">*</text></text>
              <input v-model.number="currentItem.quantity" type="number" class="form-input" placeholder="实收数量" />
            </view>

            <view class="form-row">
              <text class="form-label">可用数量</text>
              <input v-model.number="currentItem.availableQuantity" type="number" class="form-input" placeholder="可用数量" />
            </view>

            <view class="form-row">
              <text class="form-label">锁定数量</text>
              <input v-model.number="currentItem.lockedQuantity" type="number" class="form-input" placeholder="锁定数量" />
            </view>
          </view>

          <!-- 尺寸重量 -->
          <view class="detail-section">
            <view class="section-title">尺寸重量</view>

            <view class="form-grid">
              <view class="grid-item">
                <text class="grid-label">长(cm)</text>
                <input v-model.number="currentItem.length" type="digit" class="form-input small" placeholder="长" />
              </view>
              <view class="grid-item">
                <text class="grid-label">宽(cm)</text>
                <input v-model.number="currentItem.width" type="digit" class="form-input small" placeholder="宽" />
              </view>
              <view class="grid-item">
                <text class="grid-label">高(cm)</text>
                <input v-model.number="currentItem.height" type="digit" class="form-input small" placeholder="高" />
              </view>
            </view>

            <view class="form-row">
              <text class="form-label">单件毛重(kg)</text>
              <input v-model.number="currentItem.unitGrossWeight" type="digit" class="form-input" placeholder="单件毛重" />
            </view>

            <view class="form-row">
              <text class="form-label">总毛重(kg)</text>
              <input v-model.number="currentItem.totalGrossWeight" type="digit" class="form-input" placeholder="总毛重" />
            </view>

            <view class="form-row">
              <text class="form-label">面积(m²)</text>
              <input v-model.number="currentItem.area" type="digit" class="form-input" placeholder="面积" />
            </view>

            <view class="form-row">
              <text class="form-label">体积(m³)</text>
              <input v-model.number="currentItem.volume" type="digit" class="form-input" placeholder="体积" />
            </view>
          </view>

          <!-- 其他信息 -->
          <view class="detail-section">
            <view class="section-title">其他信息</view>

            <view class="form-row">
              <text class="form-label">备注</text>
              <textarea v-model="currentItem.remark" class="form-textarea" placeholder="备注" />
            </view>

            <view class="form-row readonly-info" v-if="currentItem.lastInboundDate">
              <text class="form-label">最后入库</text>
              <text class="info-text">{{ formatDate(currentItem.lastInboundDate) }}</text>
            </view>

            <view class="form-row readonly-info" v-if="currentItem.lastOutboundDate">
              <text class="form-label">最后出库</text>
              <text class="info-text">{{ formatDate(currentItem.lastOutboundDate) }}</text>
            </view>
          </view>
        </scroll-view>

        <view class="modal-footer">
          <button class="modal-btn cancel" @click="closeDetailModal">取消</button>
          <button class="modal-btn delete" @click="handleDelete">删除</button>
          <button class="modal-btn save" @click="handleSave">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { inventoryApi } from '@/api/inventory'
import { customerApi } from '@/api/customer'
import type { Inventory } from '@/types'

interface Customer {
  id: number
  name: string
}

interface Filters {
  customerName: string
  customerId: number | null
  warehouseEntryNo: string
  locationCode: string
  sku: string
  internalCode: string
  productCode: string
  shippingMark: string
  poNumber: string
}

const keyword = ref('')
const inventoryList = ref<Inventory[]>([])
const loading = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = 20
const noMore = ref(false)

// 筛选相关
const showFilterPanel = ref(false)
const customerOptions = ref<Customer[]>([])
const filters = reactive<Filters>({
  customerName: '',
  customerId: null,
  warehouseEntryNo: '',
  locationCode: '',
  sku: '',
  internalCode: '',
  productCode: '',
  shippingMark: '',
  poNumber: ''
})

// 批量选择相关
const isBatchMode = ref(false)
const selectedIds = ref<number[]>([])

// 详情弹窗相关
const showDetailModal = ref(false)
const currentItem = ref<Inventory | null>(null)
const originalItem = ref<Inventory | null>(null)

// 计算活跃筛选数量
const activeFilterCount = computed(() => {
  let count = 0
  if (filters.customerName) count++
  if (filters.warehouseEntryNo) count++
  if (filters.locationCode) count++
  if (filters.sku) count++
  if (filters.internalCode) count++
  if (filters.productCode) count++
  if (filters.shippingMark) count++
  if (filters.poNumber) count++
  return count
})

// 是否全选
const isAllSelected = computed(() => {
  return inventoryList.value.length > 0 && selectedIds.value.length === inventoryList.value.length
})

// 加载客户列表
async function loadCustomers() {
  try {
    const res = await customerApi.getList()
    if (res.success && res.data) {
      customerOptions.value = [{ id: 0, name: '全部客户' }, ...res.data]
    }
  } catch (error) {
    console.error('加载客户列表失败:', error)
  }
}

function onCustomerChange(e: any) {
  const index = parseInt(e.detail.value)
  const customer = customerOptions.value[index]
  if (customer && customer.id !== 0) {
    filters.customerName = customer.name
    filters.customerId = customer.id
  } else {
    filters.customerName = ''
    filters.customerId = null
  }
}

// 点击遮罩关闭筛选面板
function closeFilterOnMask(e: any) {
  // 只有点击遮罩层本身才关闭，点击内容区域不关闭
  if (e.target === e.currentTarget) {
    showFilterPanel.value = false
  }
}

async function loadInventory(reset = false) {
  if (reset) {
    page.value = 1
    noMore.value = false
  }

  if (noMore.value && !reset) return

  loading.value = true
  try {
    const params: any = {
      page: page.value,
      size: pageSize
    }

    if (keyword.value) params.keyword = keyword.value
    if (filters.customerName) params.customerName = filters.customerName
    if (filters.warehouseEntryNo) params.warehouseEntryNo = filters.warehouseEntryNo
    if (filters.locationCode) params.locationCode = filters.locationCode
    if (filters.sku) params.sku = filters.sku
    if (filters.internalCode) params.internalCode = filters.internalCode
    if (filters.productCode) params.productCode = filters.productCode
    if (filters.shippingMark) params.shippingMark = filters.shippingMark
    if (filters.poNumber) params.poNumber = filters.poNumber

    const res = await inventoryApi.getList(params)

    if (res.success) {
      const data = res.data || []
      if (reset) {
        inventoryList.value = data
        selectedIds.value = []
      } else {
        inventoryList.value = [...inventoryList.value, ...data]
      }

      if (data.length < pageSize) {
        noMore.value = true
      }
    }
  } catch (error) {
    console.error('加载库存失败:', error)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function handleSearch() {
  loadInventory(true)
}

function clearKeyword() {
  keyword.value = ''
  loadInventory(true)
}

function clearAllFilters() {
  Object.keys(filters).forEach(key => {
    (filters as any)[key] = key === 'customerId' ? null : ''
  })
  loadInventory(true)
}

function resetFilters() {
  Object.keys(filters).forEach(key => {
    (filters as any)[key] = key === 'customerId' ? null : ''
  })
}

function applyFilters() {
  showFilterPanel.value = false
  loadInventory(true)
}

async function handleRefresh() {
  refreshing.value = true
  await loadInventory(true)
}

function loadMore() {
  if (loading.value || noMore.value) return
  page.value++
  loadInventory()
}

// 批量操作
function enterBatchMode() {
  isBatchMode.value = true
  selectedIds.value = []
}

function exitBatchMode() {
  isBatchMode.value = false
  selectedIds.value = []
}

function toggleSelect(id: number) {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = inventoryList.value.map(item => item.id)
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    uni.showToast({ title: '请选择要删除的记录', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认删除',
    content: `确定要删除选中的 ${selectedIds.value.length} 条记录吗？`,
    confirmText: '删除',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中...' })
          const result = await inventoryApi.batchDelete(selectedIds.value)
          uni.hideLoading()

          if (result.success) {
            uni.showToast({ title: result.message || '删除成功', icon: 'success' })
            exitBatchMode()
            loadInventory(true)
          } else {
            uni.showToast({ title: result.message || '删除失败', icon: 'none' })
          }
        } catch (error: any) {
          uni.hideLoading()
          uni.showToast({ title: error.message || '删除失败', icon: 'none' })
        }
      }
    }
  })
}

// 卡片点击
function handleCardClick(item: Inventory) {
  if (isBatchMode.value) {
    toggleSelect(item.id)
  } else {
    openDetailModal(item)
  }
}

// 详情弹窗
function openDetailModal(item: Inventory) {
  currentItem.value = JSON.parse(JSON.stringify(item))
  originalItem.value = JSON.parse(JSON.stringify(item))
  showDetailModal.value = true
}

function closeDetailModal() {
  showDetailModal.value = false
  currentItem.value = null
  originalItem.value = null
}

async function handleSave() {
  if (!currentItem.value) return

  if (!currentItem.value.productName) {
    uni.showToast({ title: '货名不能为空', icon: 'none' })
    return
  }

  if (!currentItem.value.quantity || currentItem.value.quantity < 0) {
    uni.showToast({ title: '数量必须大于等于0', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '保存中...' })
    const result = await inventoryApi.update(currentItem.value.id, currentItem.value)
    uni.hideLoading()

    if (result.success) {
      uni.showToast({ title: '保存成功', icon: 'success' })
      closeDetailModal()
      loadInventory(true)
    } else {
      uni.showToast({ title: result.message || '保存失败', icon: 'none' })
    }
  } catch (error: any) {
    uni.hideLoading()
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  }
}

async function handleDelete() {
  if (!currentItem.value) return

  uni.showModal({
    title: '确认删除',
    content: `确定要删除"${currentItem.value.productName}"吗？`,
    confirmText: '删除',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm && currentItem.value) {
        try {
          uni.showLoading({ title: '删除中...' })
          const result = await inventoryApi.delete(currentItem.value.id)
          uni.hideLoading()

          if (result.success) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            closeDetailModal()
            loadInventory(true)
          } else {
            uni.showToast({ title: result.message || '删除失败', icon: 'none' })
          }
        } catch (error: any) {
          uni.hideLoading()
          uni.showToast({ title: error.message || '删除失败', icon: 'none' })
        }
      }
    }
  })
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

onLoad((options) => {
  if (options?.keyword) {
    keyword.value = options.keyword
  }
})

onMounted(() => {
  loadCustomers()
  loadInventory(true)
})

onShow(() => {
  // 可选：每次显示时刷新
})
</script>

<style lang="scss" scoped>
.inventory-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  padding-bottom: 120rpx;
}

.header-bar {
  background: #ffffff;
  padding: 20rpx 32rpx;
  padding-top: calc(20rpx + var(--status-bar-height));
}

.search-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 40rpx;
  padding: 0 24rpx;
  height: 72rpx;
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: #333333;
}

.clear-icon {
  font-size: 36rpx;
  color: #999999;
  padding: 10rpx;
}

.filter-btn {
  width: 72rpx;
  height: 72rpx;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.filter-icon {
  font-size: 32rpx;
}

.filter-badge {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  background: #ff4d4f;
  color: #ffffff;
  font-size: 20rpx;
  min-width: 32rpx;
  height: 32rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 批量操作栏 */
.batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
  padding: 16rpx 0;
  border-top: 1rpx solid #f0f0f0;
}

.batch-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #d9d9d9;
  border-radius: 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #ffffff;
  transition: all 0.2s;

  &.checked {
    background: #1890ff;
    border-color: #1890ff;
  }
}

.select-text {
  font-size: 28rpx;
  color: #333333;
}

.selected-count {
  font-size: 26rpx;
  color: #666666;
}

.batch-right {
  display: flex;
  gap: 16rpx;
}

.batch-btn {
  padding: 12rpx 32rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  border: none;

  &::after {
    border: none;
  }

  &.delete {
    background: #fff2f0;
    color: #ff4d4f;
  }

  &.cancel {
    background: #f5f5f5;
    color: #666666;
  }
}

/* 普通操作栏 */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}

.action-btn {
  background: #e6f7ff;
  color: #1890ff;
  border: none;
  padding: 12rpx 32rpx;
  border-radius: 8rpx;
  font-size: 26rpx;

  &::after {
    border: none;
  }
}

.filter-tags-inline {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.tags-text {
  font-size: 24rpx;
  color: #666666;
}

.clear-filters {
  font-size: 24rpx;
  color: #ff4d4f;
}

/* 库存列表 */
.inventory-list {
  flex: 1;
  padding: 24rpx 32rpx;
}

.inventory-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  transition: all 0.2s;

  &.selected {
    background: #e6f7ff;
    border: 2rpx solid #1890ff;
  }
}

.card-checkbox {
  margin-right: 20rpx;
  display: flex;
  align-items: flex-start;
  padding-top: 8rpx;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.name-row {
  flex: 1;
  min-width: 0;
}

.item-name {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-sku {
  display: inline-block;
  font-size: 24rpx;
  color: #1890ff;
  background: #e6f7ff;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  margin-top: 8rpx;
}

.item-quantity {
  display: flex;
  align-items: baseline;
  margin-left: 16rpx;
}

.quantity-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #1890ff;
}

.quantity-unit {
  font-size: 24rpx;
  color: #999999;
  margin-left: 4rpx;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;

  &.customer {
    background: #fff7e6;
    color: #fa8c16;
  }

  &.location {
    background: #f6ffed;
    color: #52c41a;
  }
}

.item-info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx 24rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.info-label {
  font-size: 24rpx;
  color: #999999;
}

.info-value {
  font-size: 24rpx;
  color: #333333;

  &.highlight {
    color: #1890ff;
    font-weight: bold;
  }
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
}

.stock-info {
  display: flex;
  align-items: center;
}

.stock-label {
  font-size: 24rpx;
  color: #999999;
}

.stock-value {
  font-size: 26rpx;
  font-weight: bold;

  &.available {
    color: #52c41a;
  }

  &.locked {
    color: #faad14;
  }
}

.view-detail {
  font-size: 26rpx;
  color: #1890ff;
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

.loading-state,
.no-more {
  text-align: center;
  padding: 40rpx;
  color: #999999;
  font-size: 26rpx;
}

/* 筛选面板 */
.filter-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;

  &.show {
    opacity: 1;
    visibility: visible;

    .filter-content {
      transform: translateX(0);
    }
  }
}

.filter-content {
  position: absolute;
  top: 0;
  right: 0;
  width: 80%;
  max-width: 600rpx;
  height: 100%;
  background: #ffffff;
  transform: translateX(100%);
  transition: transform 0.3s;
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  padding-top: calc(32rpx + var(--status-bar-height));
  border-bottom: 1rpx solid #f0f0f0;
}

.filter-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.filter-close {
  font-size: 48rpx;
  color: #999999;
  padding: 10rpx;
}

.filter-body {
  flex: 1;
  padding: 32rpx;
}

.filter-section {
  margin-bottom: 32rpx;
}

.section-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  margin-bottom: 16rpx;
  display: block;
}

.picker-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 24rpx;

  text {
    font-size: 28rpx;
    color: #333333;

    &.placeholder {
      color: #999999;
    }
  }
}

.picker-arrow {
  font-size: 20rpx;
  color: #999999;
}

.filter-input {
  width: 100%;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.filter-footer {
  display: flex;
  gap: 24rpx;
  padding: 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn-reset,
.btn-apply {
  flex: 1;
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after {
    border: none;
  }
}

.btn-reset {
  background: #f5f5f5;
  color: #666666;
}

.btn-apply {
  background: #1890ff;
  color: #ffffff;
}

/* 详情弹窗 */
.detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;

  &.show {
    opacity: 1;
    visibility: visible;

    .modal-content {
      transform: translateY(0);
    }
  }
}

.modal-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 90vh;
  background: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  transform: translateY(100%);
  transition: transform 0.3s;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: #ffffff;
  flex-shrink: 0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.modal-close {
  font-size: 48rpx;
  color: #999999;
  padding: 10rpx;
}

.modal-body {
  flex: 1;
  padding: 24rpx 32rpx;
  height: 0; /* 关键：让flex:1生效并启用滚动 */
  overflow: hidden;
}

.detail-section {
  background: #fafafa;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #e8e8e8;
}

.form-row {
  margin-bottom: 20rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 8rpx;
}

.required {
  color: #ff4d4f;
}

.form-input {
  width: 100%;
  background: #ffffff;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;

  &.readonly {
    background: #f5f5f5;
    color: #999999;
  }

  &.small {
    padding: 16rpx;
  }
}

.form-grid {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.grid-item {
  flex: 1;
}

.grid-label {
  display: block;
  font-size: 24rpx;
  color: #666666;
  margin-bottom: 8rpx;
}

.form-textarea {
  width: 100%;
  background: #ffffff;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333333;
  min-height: 120rpx;
  box-sizing: border-box;
}

.readonly-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-text {
  font-size: 28rpx;
  color: #999999;
}

.modal-footer {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;
  background: #ffffff;
  flex-shrink: 0; /* 防止被压缩 */
}

.modal-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after {
    border: none;
  }

  &.cancel {
    background: #f5f5f5;
    color: #666666;
  }

  &.delete {
    background: #fff2f0;
    color: #ff4d4f;
  }

  &.save {
    background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
    color: #ffffff;
  }
}
</style>
