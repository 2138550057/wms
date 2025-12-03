<template>
  <view class="detail-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="navbar-back" @click="handleBack">
        <text>← 返回</text>
      </view>
      <view class="navbar-title">出库单详情</view>
      <view class="navbar-action"></view>
    </view>

    <scroll-view class="content" scroll-y v-if="order">
      <!-- 基本信息卡片 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">基本信息</text>
          <view class="status-tag pending">待出库</view>
        </view>

        <view class="info-list">
          <view class="info-item">
            <text class="info-label">订单号</text>
            <text class="info-value">{{ order.orderNo }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">客户</text>
            <text class="info-value">{{ order.customerName }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">业务类型</text>
            <text class="info-value">{{ formatBusinessType(order.businessType, 'outbound') }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">出库日期</text>
            <text class="info-value">{{ formatDate(order.outboundDate) }}</text>
          </view>
          <view class="info-item" v-if="order.receivingCompany">
            <text class="info-label">收货单位</text>
            <text class="info-value">{{ order.receivingCompany }}</text>
          </view>
          <view class="info-item" v-if="order.receivingAddress">
            <text class="info-label">收货地址</text>
            <text class="info-value">{{ order.receivingAddress }}</text>
          </view>
          <view class="info-item" v-if="order.vehicleNumber">
            <text class="info-label">车牌号</text>
            <text class="info-value">{{ order.vehicleNumber }}</text>
          </view>
        </view>

        <!-- 汇总信息 -->
        <view class="summary-row">
          <view class="summary-item">
            <text class="summary-value">{{ order.totalQuantity }}</text>
            <text class="summary-label">总件数</text>
          </view>
          <view class="summary-item">
            <text class="summary-value">{{ order.totalVolume?.toFixed(2) || '-' }}</text>
            <text class="summary-label">总体积(m³)</text>
          </view>
          <view class="summary-item">
            <text class="summary-value">{{ order.totalWeight?.toFixed(2) || '-' }}</text>
            <text class="summary-label">总重量(kg)</text>
          </view>
        </view>
      </view>

      <!-- 商品明细卡片 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">商品明细</text>
          <text class="card-subtitle">共 {{ order.items?.length || 0 }} 项</text>
        </view>

        <view class="item-list">
          <view
            v-for="(item, index) in order.items"
            :key="item.id"
            class="product-item"
          >
            <view class="product-header">
              <text class="product-index">{{ index + 1 }}</text>
              <text class="product-name">{{ item.productName }}</text>
            </view>

            <view class="product-details">
              <view class="detail-row" v-if="item.productModel">
                <text class="detail-label">型号</text>
                <text class="detail-value">{{ item.productModel }}</text>
              </view>
              <view class="detail-row" v-if="item.sku">
                <text class="detail-label">CMD编号</text>
                <text class="detail-value">{{ item.sku }}</text>
              </view>
              <view class="detail-row" v-if="item.warehouseEntryNo">
                <text class="detail-label">进仓编号</text>
                <text class="detail-value">{{ item.warehouseEntryNo }}</text>
              </view>
              <view class="detail-row" v-if="item.locationCode">
                <text class="detail-label">库位</text>
                <text class="detail-value">{{ item.locationCode }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">数量</text>
                <text class="detail-value highlight">{{ item.quantity }} 件</text>
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

      <view style="height: 160rpx;"></view>
    </scroll-view>

    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 底部操作栏 -->
    <view class="footer-bar" v-if="order">
      <button class="btn-confirm" @click="handleConfirm" :disabled="confirming">
        {{ confirming ? '确认中...' : '确认出库' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { todoApi } from '@/api/todo'
import { attachmentApi } from '@/api/attachment'
import { useTodoStore } from '@/stores/todo'
import { formatDate, formatBusinessType } from '@/utils/format'
import { showConfirm, showSuccess, showError } from '@/utils'
import type { OutboundOrder, Attachment } from '@/types'

const todoStore = useTodoStore()

const orderId = ref<number>(0)
const orderNo = ref<string>('')
const order = ref<OutboundOrder | null>(null)
const loading = ref(false)
const confirming = ref(false)
const remark = ref('')
const attachments = ref<Attachment[]>([])

async function loadOrder() {
  if (!orderId.value && !orderNo.value) return

  loading.value = true
  try {
    let res
    if (orderId.value) {
      res = await todoApi.getOutboundDetail(orderId.value)
    } else {
      res = await todoApi.getOutboundDetailByNo(orderNo.value)
    }

    if (res.success && res.data) {
      order.value = res.data
      orderId.value = res.data.id
      remark.value = res.data.remark || ''
      loadAttachments()
    } else {
      showError('订单不存在或已完成')
      setTimeout(() => uni.navigateBack(), 1500)
    }
  } catch (error) {
    showError('加载订单失败')
  } finally {
    loading.value = false
  }
}

async function loadAttachments() {
  try {
    const res = await attachmentApi.getByEntity('outbound', orderId.value)
    if (res.success && res.data) {
      attachments.value = res.data
    }
  } catch (error) {
    console.error('加载附件失败:', error)
  }
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

function previewAttachment(att: Attachment) {
  if (isImage(att.mimeType)) {
    uni.previewImage({
      urls: attachments.value.filter(a => isImage(a.mimeType)).map(a => a.storageUrl || ''),
      current: att.storageUrl
    })
  }
}

function showUploadOptions() {
  uni.showActionSheet({
    itemList: ['拍照', '从相册选择'],
    success: (res) => {
      const sourceType = res.tapIndex === 0 ? 'camera' : 'album'
      chooseAndUpload(sourceType)
    }
  })
}

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
            entityType: 'outbound',
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

async function handleConfirm() {
  const confirmed = await showConfirm({
    title: '确认出库',
    content: `确定要出库吗？\n\n订单号：${order.value?.orderNo}\n总件数：${order.value?.totalQuantity} 件\n已上传附件：${attachments.value.length} 个\n\n确认后库存将自动扣减。`,
    confirmText: '确认出库'
  })

  if (!confirmed) return

  confirming.value = true
  try {
    await todoApi.confirmOutbound(orderId.value, {
      attachmentIds: attachments.value.map(a => a.id),
      remark: remark.value
    })

    todoStore.removeOutbound(orderId.value)
    showSuccess('出库成功')

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    showError('出库失败')
  } finally {
    confirming.value = false
  }
}

function handleBack() {
  uni.navigateBack()
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
}

.navbar-back {
  font-size: 28rpx;
  color: #722ed1;
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

.status-tag.pending {
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  background: #fff7e6;
  color: #faad14;
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
}

.summary-value {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #722ed1;
}

.summary-label {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 8rpx;
}

.product-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.product-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.product-index {
  width: 40rpx;
  height: 40rpx;
  background: #722ed1;
  color: #ffffff;
  font-size: 24rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.product-name {
  flex: 1;
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
}

.product-details {
  padding-left: 56rpx;
}

.detail-row {
  display: flex;
  margin-bottom: 8rpx;
}

.detail-label {
  width: 140rpx;
  font-size: 24rpx;
  color: #999999;
}

.detail-value {
  font-size: 24rpx;
  color: #333333;

  &.highlight {
    color: #722ed1;
    font-weight: bold;
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
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.btn-confirm {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(90deg, #722ed1 0%, #9254de 100%);
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
</style>
