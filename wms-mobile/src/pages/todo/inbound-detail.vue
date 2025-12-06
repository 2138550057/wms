<template>
  <view class="detail-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="navbar-back" @click="handleBack">
        <text class="back-icon">&lt;</text>
        <text>返回</text>
      </view>
      <view class="navbar-title">入库单详情</view>
      <view class="navbar-action"></view>
    </view>

    <scroll-view class="content" scroll-y v-if="order">
      <!-- 基本信息卡片 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">基本信息</text>
          <view class="status-tag pending">待入库</view>
        </view>

        <view class="info-list">
          <view class="info-item">
            <text class="info-label">订单号</text>
            <text class="info-value">{{ order.orderNo }}</text>
          </view>
          <view class="info-item" v-if="order.warehouseEntryNo">
            <text class="info-label">进仓编号</text>
            <text class="info-value">{{ order.warehouseEntryNo }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">客户</text>
            <text class="info-value">{{ order.customerName }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">业务类型</text>
            <text class="info-value">{{ formatBusinessType(order.businessType, 'inbound') }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">入库日期</text>
            <text class="info-value">{{ formatDate(order.inboundDate) }}</text>
          </view>
          <view class="info-item" v-if="order.vehicleNumber">
            <text class="info-label">车牌号</text>
            <text class="info-value">{{ order.vehicleNumber }}</text>
          </view>
          <view class="info-item" v-if="order.driverName">
            <text class="info-label">司机</text>
            <text class="info-value">{{ order.driverName }}</text>
          </view>
        </view>

        <!-- 汇总信息 -->
        <view class="summary-row">
          <view class="summary-item">
            <text class="summary-value">{{ order.totalQuantity }}</text>
            <text class="summary-label">预计件数</text>
          </view>
          <view class="summary-item highlight">
            <text class="summary-value">{{ actualTotalQuantity }}</text>
            <text class="summary-label">实到件数</text>
          </view>
          <view class="summary-item">
            <text class="summary-value">{{ order.totalVolume?.toFixed(2) || '-' }}</text>
            <text class="summary-label">体积(m³)</text>
          </view>
          <view class="summary-item">
            <text class="summary-value">{{ order.totalWeight?.toFixed(2) || '0.00' }}</text>
            <text class="summary-label">重量(kg)</text>
          </view>
        </view>
      </view>

      <!-- 商品明细卡片 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">商品明细</text>
          <view class="header-actions">
            <text class="card-subtitle">共 {{ editableItems.length }} 项</text>
            <view class="add-item-btn" @click="showAddItemModal">
              <text>+ 添加</text>
            </view>
          </view>
        </view>

        <view class="item-list">
          <view
            v-for="(item, index) in editableItems"
            :key="item.id || `new-${index}`"
            class="product-item"
          >
            <view class="product-main" @click="openItemDetail(index)">
              <view class="product-left">
                <text class="product-index">{{ index + 1 }}</text>
                <view class="product-info">
                  <text class="product-name">{{ item.productName || '未命名商品' }}</text>
                  <view class="product-tags">
                    <text class="tag" v-if="item.productModel">{{ item.productModel }}</text>
                    <text class="tag" v-if="item.sku">{{ item.sku }}</text>
                  </view>
                </view>
              </view>
              <view class="product-right-btn">
                <text class="detail-btn">详情 &gt;</text>
              </view>
            </view>
            <!-- 可编辑的库位和数量 -->
            <view class="product-inputs">
              <view class="input-group location-group">
                <text class="input-label">库位</text>
                <picker
                  mode="selector"
                  :range="locationCodes"
                  :value="locationCodes.indexOf(item.locationCode || '')"
                  @change="(e: any) => item.locationCode = locationCodes[e.detail.value]"
                  @click.stop
                >
                  <view class="picker-field" :class="{ placeholder: !item.locationCode }">
                    {{ item.locationCode || '选择库位' }}
                  </view>
                </picker>
              </view>
              <view class="input-group">
                <text class="input-label">实收件数</text>
                <input
                  v-model.number="item.quantity"
                  type="number"
                  class="input-field quantity"
                  placeholder="数量"
                  @click.stop
                />
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 附件区域 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">现场附件</text>
          <text class="card-subtitle">{{ attachments.length }} 个</text>
        </view>

        <view class="attachment-grid">
          <view
            v-for="att in attachments"
            :key="att.id"
            class="attachment-item"
            @click="previewAttachment(att)"
          >
            <image
              v-if="isImage(att.mimeType)"
              :src="att.storageUrl"
              mode="aspectFill"
              class="attachment-image"
            />
            <view v-else class="attachment-file">
              <text class="file-icon">📄</text>
            </view>
            <view class="attachment-delete" @click.stop="deleteAttachment(att.id)">×</view>
          </view>

          <view class="attachment-add" @click="showUploadOptions">
            <text class="add-icon">+</text>
            <text class="add-text">添加</text>
          </view>
        </view>
      </view>

      <!-- 备注 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">备注</text>
        </view>
        <textarea
          v-model="remark"
          class="remark-input"
          placeholder="输入现场备注（可选）"
          :maxlength="500"
        />
      </view>

      <view style="height: 180rpx;"></view>
    </scroll-view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 底部操作栏 -->
    <view class="footer-bar" v-if="order">
      <button class="btn-save" @click="handleSave" :disabled="saving">
        {{ saving ? '保存中...' : '保存修改' }}
      </button>
      <button class="btn-confirm" @click="handleConfirm" :disabled="confirming">
        {{ confirming ? '确认中...' : '确认入库' }}
      </button>
    </view>

    <!-- 明细详情弹窗 -->
    <view class="modal-mask" v-if="showItemModal" @click="closeItemModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isNewItem ? '添加明细' : '明细详情' }}</text>
          <text class="modal-close" @click="closeItemModal">×</text>
        </view>

        <scroll-view class="modal-body" scroll-y>
          <view class="form-group">
            <text class="form-label required">商品名称</text>
            <input
              type="text"
              class="form-input"
              v-model="currentItem.productName"
              placeholder="请输入商品名称"
            />
          </view>

          <view class="form-group">
            <text class="form-label">型号/规格</text>
            <input
              type="text"
              class="form-input"
              v-model="currentItem.productModel"
              placeholder="请输入型号规格"
            />
          </view>

          <view class="form-group">
            <text class="form-label">CMD编号 (SKU)</text>
            <input
              type="text"
              class="form-input"
              v-model="currentItem.sku"
              placeholder="请输入CMD编号"
            />
          </view>

          <view class="form-group">
            <text class="form-label">内部货号</text>
            <input
              type="text"
              class="form-input"
              v-model="currentItem.internalCode"
              placeholder="请输入内部货号"
            />
          </view>

          <view class="form-group">
            <text class="form-label">CMD料号</text>
            <input
              type="text"
              class="form-input"
              v-model="currentItem.productCode"
              placeholder="请输入CMD料号"
            />
          </view>

          <view class="form-group">
            <text class="form-label">唛头</text>
            <input
              type="text"
              class="form-input"
              v-model="currentItem.shippingMark"
              placeholder="请输入唛头"
            />
          </view>

          <view class="form-group">
            <text class="form-label">PO号</text>
            <input
              type="text"
              class="form-input"
              v-model="currentItem.poNumber"
              placeholder="请输入PO号"
            />
          </view>

          <view class="form-group">
            <text class="form-label">包装形式</text>
            <input
              type="text"
              class="form-input"
              v-model="currentItem.packageType"
              placeholder="请输入包装形式"
            />
          </view>

          <view class="form-row">
            <view class="form-group half">
              <text class="form-label">预计件数</text>
              <input
                type="number"
                class="form-input"
                :value="currentItem.originalQuantity"
                disabled
                placeholder="-"
              />
            </view>
            <view class="form-group half">
              <text class="form-label required">实到件数</text>
              <input
                type="number"
                class="form-input"
                v-model.number="currentItem.quantity"
                placeholder="请输入实到件数"
              />
            </view>
          </view>

          <view class="form-group">
            <text class="form-label required">库位</text>
            <picker
              mode="selector"
              :range="locationCodes"
              :value="locationCodes.indexOf(currentItem.locationCode || '')"
              @change="(e: any) => currentItem.locationCode = locationCodes[e.detail.value]"
            >
              <view class="form-input picker-input" :class="{ placeholder: !currentItem.locationCode }">
                {{ currentItem.locationCode || '请选择库位' }}
              </view>
            </picker>
          </view>

          <view class="form-row">
            <view class="form-group third">
              <text class="form-label">长(cm)</text>
              <input
                type="digit"
                class="form-input"
                v-model.number="currentItem.length"
                placeholder="长"
              />
            </view>
            <view class="form-group third">
              <text class="form-label">宽(cm)</text>
              <input
                type="digit"
                class="form-input"
                v-model.number="currentItem.width"
                placeholder="宽"
              />
            </view>
            <view class="form-group third">
              <text class="form-label">高(cm)</text>
              <input
                type="digit"
                class="form-input"
                v-model.number="currentItem.height"
                placeholder="高"
              />
            </view>
          </view>

          <view class="form-row">
            <view class="form-group half">
              <text class="form-label">单件毛重(kg)</text>
              <input
                type="digit"
                class="form-input"
                v-model.number="currentItem.unitGrossWeight"
                placeholder="请输入"
              />
            </view>
            <view class="form-group half">
              <text class="form-label">总毛重(kg)</text>
              <input
                type="digit"
                class="form-input"
                v-model.number="currentItem.totalGrossWeight"
                placeholder="请输入"
              />
            </view>
          </view>

          <view class="form-group">
            <text class="form-label">备注</text>
            <textarea
              class="form-textarea"
              v-model="currentItem.remark"
              placeholder="请输入备注"
            />
          </view>
        </scroll-view>

        <view class="modal-footer">
          <button class="modal-btn cancel" @click="closeItemModal">取消</button>
          <button v-if="!isNewItem" class="modal-btn delete" @click="deleteItem">删除</button>
          <button class="modal-btn confirm" @click="saveItemDetail">
            {{ isNewItem ? '添加' : '保存' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { todoApi } from '@/api/todo'
import { attachmentApi } from '@/api/attachment'
import { locationApi, type Location } from '@/api/location'
import { useTodoStore } from '@/stores/todo'
import { formatDate, formatBusinessType } from '@/utils/format'
import { showConfirm, showSuccess, showError } from '@/utils'
import type { InboundOrder, InboundOrderItem, Attachment } from '@/types'

const todoStore = useTodoStore()

// 状态
const orderId = ref<number>(0)
const orderNo = ref<string>('')
const order = ref<InboundOrder | null>(null)
const loading = ref(false)
const saving = ref(false)
const confirming = ref(false)
const remark = ref('')

// 可编辑的明细列表
interface EditableItem extends Partial<InboundOrderItem> {
  originalQuantity: number
  isNew?: boolean
  tempId?: number
}
const editableItems = ref<EditableItem[]>([])

// 附件列表
const attachments = ref<Attachment[]>([])

// 库位列表
const locations = ref<Location[]>([])
const locationCodes = computed(() => locations.value.map(loc => loc.code))

// 明细弹窗
const showItemModal = ref(false)
const currentItemIndex = ref(-1)
const isNewItem = ref(false)
const currentItem = ref<EditableItem>({
  productName: '',
  productModel: '',
  sku: '',
  internalCode: '',
  productCode: '',
  shippingMark: '',
  poNumber: '',
  packageType: '',
  quantity: 1,
  originalQuantity: 0,
  locationCode: '',
  length: undefined,
  width: undefined,
  height: undefined,
  unitGrossWeight: undefined,
  totalGrossWeight: undefined,
  remark: ''
})

// 计算实到总件数
const actualTotalQuantity = computed(() => {
  return editableItems.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

// 加载订单详情
async function loadOrder() {
  if (!orderId.value && !orderNo.value) return

  loading.value = true
  try {
    let res
    if (orderId.value) {
      res = await todoApi.getInboundDetail(orderId.value)
    } else {
      res = await todoApi.getInboundDetailByNo(orderNo.value)
    }

    if (res.success && res.data) {
      order.value = res.data
      orderId.value = res.data.id
      remark.value = res.data.remark || ''

      // 初始化可编辑明细
      editableItems.value = (res.data.items || []).map(item => ({
        ...item,
        originalQuantity: item.quantity,
        locationCode: item.locationCode || ''
      }))

      // 加载附件
      loadAttachments()
    } else {
      showError('订单不存在或已完成')
      setTimeout(() => {
        const pages = getCurrentPages()
        if (pages.length > 1) {
          uni.navigateBack({ delta: 1 })
        } else {
          uni.switchTab({ url: '/pages/todo/index' })
        }
      }, 1500)
    }
  } catch (error) {
    console.error('加载订单失败:', error)
    showError('加载订单失败')
  } finally {
    loading.value = false
  }
}

// 加载附件
async function loadAttachments() {
  try {
    const res = await attachmentApi.getByEntity('inbound', orderId.value)
    if (res.success && res.data) {
      attachments.value = res.data
    }
  } catch (error) {
    console.error('加载附件失败:', error)
  }
}

// 加载库位列表
async function loadLocations() {
  try {
    const res = await locationApi.getActive()
    if (res.success && res.data) {
      locations.value = res.data
    }
  } catch (error) {
    console.error('加载库位失败:', error)
  }
}

// 判断是否为图片
function isImage(mimeType: string): boolean {
  return mimeType?.startsWith('image/') || false
}

// 预览附件
function previewAttachment(att: Attachment) {
  if (isImage(att.mimeType)) {
    uni.previewImage({
      urls: attachments.value.filter(a => isImage(a.mimeType)).map(a => a.storageUrl || ''),
      current: att.storageUrl
    })
  }
}

// 显示上传选项
function showUploadOptions() {
  uni.showActionSheet({
    itemList: ['拍照', '从相册选择'],
    success: (res) => {
      const sourceType = res.tapIndex === 0 ? 'camera' : 'album'
      chooseAndUpload(sourceType)
    }
  })
}

// 选择并上传图片
function chooseAndUpload(sourceType: 'camera' | 'album') {
  uni.chooseImage({
    count: 9,
    sourceType: [sourceType],
    success: async (res) => {
      uni.showLoading({ title: '上传中...' })

      try {
        for (const filePath of res.tempFilePaths) {
          const uploadRes = await attachmentApi.upload({
            filePath,
            entityType: 'inbound',
            entityId: orderId.value,
            category: 'image'
          })
          if (uploadRes.success && uploadRes.data) {
            attachments.value.push(uploadRes.data)
          }
        }
        showSuccess('上传成功')
      } catch (error) {
        showError('上传失败')
      } finally {
        uni.hideLoading()
      }
    }
  })
}

// 删除附件
async function deleteAttachment(id: number) {
  const confirmed = await showConfirm({ content: '确定删除这个附件吗？' })
  if (!confirmed) return

  try {
    await attachmentApi.delete(id)
    attachments.value = attachments.value.filter(a => a.id !== id)
    showSuccess('删除成功')
  } catch (error) {
    showError('删除失败')
  }
}

// 打开明细详情
function openItemDetail(index: number) {
  currentItemIndex.value = index
  isNewItem.value = false
  const item = editableItems.value[index]
  currentItem.value = { ...item }
  showItemModal.value = true
}

// 显示添加明细弹窗
function showAddItemModal() {
  currentItemIndex.value = -1
  isNewItem.value = true
  currentItem.value = {
    productName: '',
    productModel: '',
    sku: '',
    internalCode: '',
    productCode: '',
    shippingMark: '',
    poNumber: '',
    packageType: '',
    quantity: 1,
    originalQuantity: 0,
    locationCode: '',
    length: undefined,
    width: undefined,
    height: undefined,
    unitGrossWeight: undefined,
    totalGrossWeight: undefined,
    remark: '',
    isNew: true,
    tempId: Date.now()
  }
  showItemModal.value = true
}

// 关闭弹窗
function closeItemModal() {
  showItemModal.value = false
}

// 保存明细
function saveItemDetail() {
  // 验证必填字段
  if (!currentItem.value.productName?.trim()) {
    showError('请输入商品名称')
    return
  }
  if (!currentItem.value.quantity || currentItem.value.quantity <= 0) {
    showError('实到件数必须大于0')
    return
  }

  if (isNewItem.value) {
    // 添加新明细
    editableItems.value.push({ ...currentItem.value })
    showSuccess('添加成功')
  } else {
    // 更新现有明细
    editableItems.value[currentItemIndex.value] = { ...currentItem.value }
    showSuccess('保存成功')
  }

  closeItemModal()
}

// 删除明细
async function deleteItem() {
  const confirmed = await showConfirm({
    title: '确认删除',
    content: `确定要删除"${currentItem.value.productName}"吗？`,
    confirmText: '删除',
    confirmColor: '#ff4d4f'
  })

  if (!confirmed) return

  editableItems.value.splice(currentItemIndex.value, 1)
  showSuccess('删除成功')
  closeItemModal()
}

// 保存修改
async function handleSave() {
  // 验证数据
  for (const item of editableItems.value) {
    if (!item.quantity || item.quantity <= 0) {
      showError('数量必须大于0')
      return
    }
  }

  saving.value = true
  try {
    // 过滤出已有ID的明细进行更新
    const existingItems = editableItems.value
      .filter(item => item.id && !item.isNew)
      .map(item => ({
        id: item.id!,
        locationCode: item.locationCode || '',
        quantity: item.quantity || 0,
        remark: item.remark
      }))

    if (existingItems.length > 0) {
      await todoApi.updateInboundItems(orderId.value, existingItems)
    }

    showSuccess('保存成功')
    // 重新加载订单
    loadOrder()
  } catch (error) {
    showError('保存失败')
  } finally {
    saving.value = false
  }
}

// 确认入库
async function handleConfirm() {
  // 验证库位
  const missingLocation = editableItems.value.find(item => !item.locationCode?.trim())
  if (missingLocation) {
    showError('请填写所有商品的库位')
    return
  }

  // 二次确认
  const confirmed = await showConfirm({
    title: '确认入库',
    content: `确定要入库吗？\n\n订单号：${order.value?.orderNo}\n预计件数：${order.value?.totalQuantity} 件\n实到件数：${actualTotalQuantity.value} 件\n已上传附件：${attachments.value.length} 个\n\n确认后库存将自动更新。`,
    confirmText: '确认入库'
  })

  if (!confirmed) return

  confirming.value = true
  try {
    // 先保存修改
    const existingItems = editableItems.value
      .filter(item => item.id && !item.isNew)
      .map(item => ({
        id: item.id!,
        locationCode: item.locationCode || '',
        quantity: item.quantity || 0,
        remark: item.remark
      }))

    if (existingItems.length > 0) {
      await todoApi.updateInboundItems(orderId.value, existingItems)
    }

    // 确认入库
    await todoApi.confirmInbound(orderId.value, {
      attachmentIds: attachments.value.map(a => a.id),
      remark: remark.value
    })

    // 从待办列表中移除
    todoStore.removeInbound(orderId.value)

    showSuccess('入库成功')

    // 返回上一页
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack({ delta: 1 })
      } else {
        uni.switchTab({ url: '/pages/todo/index' })
      }
    }, 1500)
  } catch (error) {
    showError('入库失败')
  } finally {
    confirming.value = false
  }
}

// 返回
function handleBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 })
  } else {
    // 如果是第一页，跳转到待办列表
    uni.switchTab({ url: '/pages/todo/index' })
  }
}

onLoad((options) => {
  if (options?.id) {
    orderId.value = Number(options.id)
  } else if (options?.orderNo) {
    orderNo.value = options.orderNo
  }
})

onMounted(() => {
  loadOrder()
  loadLocations()
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  background: #ffffff;
  padding: 0 32rpx;
  padding-top: var(--status-bar-height);
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-back {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #1890ff;
  padding: 16rpx 0;
}

.back-icon {
  margin-right: 8rpx;
  font-weight: bold;
}

.navbar-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333333;
}

.navbar-action {
  width: 100rpx;
}

.content {
  flex: 1;
  padding: 24rpx 32rpx;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.card-subtitle {
  font-size: 24rpx;
  color: #999999;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.add-item-btn {
  padding: 8rpx 20rpx;
  background: #e6f7ff;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #1890ff;
}

.status-tag {
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;

  &.pending {
    background: #fff7e6;
    color: #faad14;
  }
}

.info-list {
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-item {
  display: flex;
  padding: 12rpx 0;
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

.summary-row {
  display: flex;
  justify-content: space-around;
  padding-top: 24rpx;
}

.summary-item {
  text-align: center;

  &.highlight .summary-value {
    color: #52c41a;
  }
}

.summary-value {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #1890ff;
}

.summary-label {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 8rpx;
}

.item-list {
  // 商品列表
}

.product-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.product-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-left {
  display: flex;
  align-items: flex-start;
  flex: 1;
}

.product-index {
  width: 40rpx;
  height: 40rpx;
  background: #1890ff;
  color: #ffffff;
  font-size: 24rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 8rpx;
  display: block;
}

.product-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.tag {
  font-size: 22rpx;
  color: #666666;
  background: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.product-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.quantity-info {
  text-align: right;
}

.qty-label {
  font-size: 22rpx;
  color: #999999;
  display: block;
}

.qty-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #52c41a;
}

.arrow {
  font-size: 28rpx;
  color: #cccccc;
}

.product-extra {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
  padding-left: 56rpx;
}

.extra-label {
  font-size: 24rpx;
  color: #999999;
  margin-right: 8rpx;
}

.extra-value {
  font-size: 24rpx;
  color: #666666;
}

// 右侧详情按钮
.product-right-btn {
  flex-shrink: 0;
}

.detail-btn {
  font-size: 26rpx;
  color: #1890ff;
  padding: 8rpx 0;
}

// 可编辑输入区域
.product-inputs {
  display: flex;
  gap: 24rpx;
  margin-top: 16rpx;
  padding-left: 56rpx;
  padding-right: 16rpx;
}

.input-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.input-label {
  font-size: 24rpx;
  color: #666666;
  flex-shrink: 0;
  white-space: nowrap;
}

.input-field {
  flex: 1;
  height: 64rpx;
  padding: 0 16rpx;
  background: #f8f9fa;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333333;
  box-sizing: border-box;

  &.quantity {
    width: 120rpx;
    flex: none;
    text-align: center;
    font-weight: bold;
    color: #52c41a;
  }

  &:focus {
    border-color: #1890ff;
    background: #ffffff;
  }
}

.location-group {
  flex: 1.5;
}

.picker-field {
  flex: 1;
  height: 64rpx;
  line-height: 64rpx;
  padding: 0 16rpx;
  background: #f8f9fa;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333333;
  box-sizing: border-box;

  &.placeholder {
    color: #999999;
  }
}

.picker-input {
  display: flex;
  align-items: center;
  height: 80rpx;

  &.placeholder {
    color: #999999;
  }
}

.attachment-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.attachment-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.attachment-image {
  width: 100%;
  height: 100%;
}

.attachment-file {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-icon {
  font-size: 48rpx;
}

.attachment-delete {
  position: absolute;
  top: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 12rpx 0 12rpx;
}

.attachment-add {
  width: 160rpx;
  height: 160rpx;
  border: 2rpx dashed #d9d9d9;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999999;
}

.add-icon {
  font-size: 48rpx;
}

.add-text {
  font-size: 24rpx;
  margin-top: 8rpx;
}

.remark-input {
  width: 100%;
  min-height: 160rpx;
  padding: 16rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #333333;
}

.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999999;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 24rpx;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.btn-save {
  flex: 1;
  height: 88rpx;
  background: #ffffff;
  border: 2rpx solid #1890ff;
  border-radius: 12rpx;
  color: #1890ff;
  font-size: 30rpx;
  font-weight: bold;

  &::after {
    border: none;
  }

  &[disabled] {
    opacity: 0.5;
  }
}

.btn-confirm {
  flex: 1;
  height: 88rpx;
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
  border: none;
  border-radius: 12rpx;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: bold;

  &::after {
    border: none;
  }

  &[disabled] {
    opacity: 0.5;
  }
}

// 弹窗样式
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-height: 85vh;
  background: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
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
  padding: 8rpx;
}

.modal-body {
  flex: 1;
  padding: 24rpx 32rpx;
  max-height: 60vh;
}

.form-group {
  margin-bottom: 24rpx;

  &.half {
    flex: 1;
  }

  &.third {
    flex: 1;
  }
}

.form-row {
  display: flex;
  gap: 20rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 12rpx;

  &.required::before {
    content: '*';
    color: #ff4d4f;
    margin-right: 4rpx;
  }
}

.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  background: #f8f9fa;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;

  &[disabled] {
    background: #f0f0f0;
    color: #999999;
  }
}

.form-textarea {
  width: 100%;
  min-height: 120rpx;
  padding: 16rpx 20rpx;
  background: #f8f9fa;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: bold;

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
    border: 1rpx solid #ffccc7;
  }

  &.confirm {
    background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
    color: #ffffff;
  }
}
</style>
