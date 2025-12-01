<template>
  <view class="popup-mask" v-if="visible" @click="handleClose">
    <view class="popup-content" @click.stop>
      <!-- 头部 -->
      <view class="popup-header">
        <view class="order-type-tag" :class="order.type">
          {{ order.type === 'inbound' ? '入库单' : '出库单' }}
        </view>
        <text class="order-no">{{ order.orderNo }}</text>
        <view class="close-btn" @click="handleClose">
          <text>×</text>
        </view>
      </view>

      <!-- 订单信息 -->
      <scroll-view class="popup-body" scroll-y>
        <!-- 基本信息 -->
        <view class="info-section">
          <view class="section-title">基本信息</view>
          <view class="info-grid">
            <view class="info-item">
              <text class="info-label">客户名称</text>
              <text class="info-value">{{ order.customerName }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">创建时间</text>
              <text class="info-value">{{ formatTime(order.createdAt) }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">总件数</text>
              <text class="info-value highlight">{{ order.totalQuantity }} 件</text>
            </view>
            <view class="info-item" v-if="order.businessType">
              <text class="info-label">业务类型</text>
              <text class="info-value">{{ getBusinessTypeLabel(order.businessType) }}</text>
            </view>
          </view>
          <!-- 实收数量和库位输入 -->
          <view class="input-fields">
            <view class="input-field">
              <text class="input-label">实收数量 <text class="required">*</text></text>
              <input
                type="number"
                v-model="actualQuantity"
                class="input-box"
                placeholder="请输入实收数量"
              />
            </view>
            <view class="input-field">
              <text class="input-label">库位 <text class="required">*</text></text>
              <input
                v-model="locationCode"
                class="input-box"
                placeholder="请输入库位"
              />
            </view>
          </view>
        </view>

        <!-- 商品明细 -->
        <view class="items-section">
          <view class="section-header">
            <view class="section-title">
              商品明细
              <text class="item-count">（{{ localItems.length }} 种）</text>
              <button class="add-item-btn" @click.stop="addNewItem">+ 添加</button>
            </view>
          </view>
          <view class="items-list">
            <view
              v-for="(item, index) in localItems"
              :key="index"
              class="item-card"
              @click="openEditItem(index)"
            >
              <view class="item-header">
                <text class="item-name">{{ item.productName || item.sku || '未命名商品' }}</text>
                <view class="edit-icon">
                  <text>&#x270E;</text>
                </view>
              </view>
              <view class="item-qty-row">
                <view class="qty-item">
                  <text class="qty-label">申报</text>
                  <text class="qty-value declared">{{ item.declaredQuantity || item.quantity }} 件</text>
                </view>
                <view class="qty-item">
                  <text class="qty-label">实收</text>
                  <text class="qty-value actual">{{ item.quantity }} 件</text>
                </view>
              </view>
              <view class="item-details">
                <view class="detail-row" v-if="item.sku">
                  <text class="detail-label">CMD编号</text>
                  <text class="detail-value">{{ item.sku }}</text>
                </view>
                <view class="detail-row" v-if="item.productModel">
                  <text class="detail-label">型号</text>
                  <text class="detail-value">{{ item.productModel }}</text>
                </view>
                <view class="detail-row" v-if="item.internalCode">
                  <text class="detail-label">内部货号</text>
                  <text class="detail-value">{{ item.internalCode }}</text>
                </view>
                <view class="detail-row" v-if="item.locationCode">
                  <text class="detail-label">库位</text>
                  <text class="detail-value">{{ item.locationCode }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 图片上传区域 -->
        <view class="upload-section">
          <view class="section-title">现场照片</view>
          <ImageUploader
            v-model="uploadedImages"
            :max-count="30"
            :entity-type="order.type"
            :entity-id="order.id"
            tips="支持拍照或从相册选择，最多上传30张"
          />
        </view>

        <!-- 备注 -->
        <view class="remark-section">
          <view class="section-title">备注说明</view>
          <textarea
            v-model="remark"
            class="remark-input"
            placeholder="请输入备注（选填）"
            :maxlength="500"
          />
        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="popup-footer">
        <button class="btn-cancel" @click="handleClose">取消</button>
        <button
          class="btn-confirm"
          :class="order.type"
          :loading="confirming"
          @click="handleConfirm"
        >
          {{ order.type === 'inbound' ? '确认入库' : '确认出库' }}
        </button>
      </view>
    </view>
  </view>

  <!-- 明细编辑弹窗 -->
  <view class="edit-mask" v-if="showEditPopup" @click="closeEditItem">
    <view class="edit-content" @click.stop>
      <view class="edit-header">
        <text class="edit-title">{{ editingIndex === -1 ? '新增明细' : '编辑明细' }}</text>
        <view class="edit-close" @click="closeEditItem">
          <text>×</text>
        </view>
      </view>

      <scroll-view class="edit-body" scroll-y v-if="editingItem">
        <!-- 基本信息 -->
        <view class="edit-section">
          <view class="edit-section-title">商品信息</view>
          <view class="edit-field">
            <text class="field-label">货名 *</text>
            <input v-model="editingItem.productName" class="field-input" placeholder="请输入货名" />
          </view>
          <view class="edit-field">
            <text class="field-label">工程编号</text>
            <input v-model="editingItem.productModel" class="field-input" placeholder="请输入工程编号" />
          </view>
          <view class="edit-field">
            <text class="field-label">CMD编号</text>
            <input v-model="editingItem.sku" class="field-input" placeholder="请输入CMD编号" />
          </view>
          <view class="edit-field">
            <text class="field-label">内部货号</text>
            <input v-model="editingItem.internalCode" class="field-input" placeholder="请输入内部货号" />
          </view>
          <view class="edit-field">
            <text class="field-label">CMD料号</text>
            <input v-model="editingItem.productCode" class="field-input" placeholder="请输入CMD料号" />
          </view>
          <view class="edit-field">
            <text class="field-label">唛头</text>
            <input v-model="editingItem.shippingMark" class="field-input" placeholder="请输入唛头" />
          </view>
          <view class="edit-field">
            <text class="field-label">PO号</text>
            <input v-model="editingItem.poNumber" class="field-input" placeholder="请输入PO号" />
          </view>
        </view>

        <!-- 数量信息 -->
        <view class="edit-section">
          <view class="edit-section-title">数量信息</view>
          <view class="edit-row">
            <view class="edit-field half">
              <text class="field-label">申报数量</text>
              <input
                type="number"
                :value="editingItem.declaredQuantity || editingItem.quantity"
                class="field-input"
                placeholder="申报数量"
                disabled
              />
            </view>
            <view class="edit-field half">
              <text class="field-label">实收数量 *</text>
              <input
                type="number"
                v-model="editingItem.quantity"
                class="field-input"
                placeholder="实收数量"
                @input="onQuantityChange"
              />
            </view>
          </view>
          <view class="edit-field">
            <text class="field-label">库位</text>
            <input v-model="editingItem.locationCode" class="field-input" placeholder="请输入库位" />
          </view>
          <view class="edit-field">
            <text class="field-label">包装形式</text>
            <input v-model="editingItem.packageType" class="field-input" placeholder="请输入包装形式" />
          </view>
        </view>

        <!-- 规格信息 -->
        <view class="edit-section">
          <view class="edit-section-title">规格信息</view>
          <view class="edit-row">
            <view class="edit-field third">
              <text class="field-label">长(cm)</text>
              <input type="digit" v-model="editingItem.length" class="field-input" placeholder="长" />
            </view>
            <view class="edit-field third">
              <text class="field-label">宽(cm)</text>
              <input type="digit" v-model="editingItem.width" class="field-input" placeholder="宽" />
            </view>
            <view class="edit-field third">
              <text class="field-label">高(cm)</text>
              <input type="digit" v-model="editingItem.height" class="field-input" placeholder="高" />
            </view>
          </view>
          <view class="edit-row">
            <view class="edit-field half">
              <text class="field-label">单件毛重(kg)</text>
              <input
                type="digit"
                v-model="editingItem.unitGrossWeight"
                class="field-input"
                placeholder="单件毛重"
                @input="onWeightChange"
              />
            </view>
            <view class="edit-field half">
              <text class="field-label">总毛重(kg)</text>
              <input
                type="digit"
                :value="calculatedTotalWeight"
                class="field-input"
                placeholder="总毛重"
                disabled
              />
            </view>
          </view>
          <view class="edit-field">
            <text class="field-label">平方(m²)</text>
            <input type="digit" v-model="editingItem.area" class="field-input" placeholder="请输入平方" />
          </view>
        </view>

        <!-- 备注 -->
        <view class="edit-section">
          <view class="edit-section-title">备注</view>
          <view class="edit-field">
            <textarea v-model="editingItem.remark" class="field-textarea" placeholder="请输入备注" />
          </view>
        </view>
      </scroll-view>

      <view class="edit-footer">
        <button class="btn-cancel" @click="closeEditItem">取消</button>
        <button class="btn-save" @click="saveEditItem">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useTodoStore } from '@/stores/todo'
import type { BaseOrder, OrderItem } from '@/types'
import { formatDate } from '@/utils'
import ImageUploader from './ImageUploader.vue'

// Props
const props = defineProps<{
  visible: boolean
  order: BaseOrder & { type: 'inbound' | 'outbound' }
}>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()

// Store
const todoStore = useTodoStore()

// 状态
const uploadedImages = ref<string[]>([])
const remark = ref('')
const confirming = ref(false)
const localItems = ref<any[]>([])
const actualQuantity = ref<string | number>('')
const locationCode = ref('')

// 明细编辑状态
const showEditPopup = ref(false)
const editingIndex = ref(-1)
const editingItem = ref<any>(null)

// 计算总毛重
const calculatedTotalWeight = computed(() => {
  if (!editingItem.value) return ''
  const qty = parseFloat(editingItem.value.quantity) || 0
  const unitWeight = parseFloat(editingItem.value.unitGrossWeight) || 0
  return qty && unitWeight ? (qty * unitWeight).toFixed(2) : ''
})

// 监听弹窗打开，重置状态
watch(() => props.visible, (val) => {
  if (val) {
    uploadedImages.value = []
    remark.value = props.order.remark || ''
    // 初始化实收数量和库位
    actualQuantity.value = props.order.totalQuantity || ''
    // 从第一个明细获取库位作为默认值
    const firstItem = props.order.items?.[0]
    locationCode.value = firstItem?.locationCode || ''
    // 深拷贝items到本地状态，保存申报数量
    localItems.value = (props.order.items || []).map(item => ({
      ...item,
      declaredQuantity: item.quantity // 保存原始申报数量
    }))
  }
}, { immediate: true })

// 格式化时间
function formatTime(dateStr: string) {
  return formatDate(dateStr, 'YYYY-MM-DD HH:mm')
}

// 获取业务类型标签
function getBusinessTypeLabel(type: string) {
  const typeMap: Record<string, string> = {
    'normal': '普通入库',
    'return': '退货入库',
    'transfer': '调拨入库',
    'sales': '普通出库',
    'return_out': '退货出库',
    'transfer_out': '调拨出库'
  }
  return typeMap[type] || type
}

// 添加新明细
function addNewItem() {
  // 创建新的空白明细
  const newItem = {
    id: null,
    productName: '',
    productModel: '',
    sku: '',
    internalCode: '',
    productCode: '',
    shippingMark: '',
    poNumber: '',
    locationCode: locationCode.value || '', // 使用基本信息中的库位
    packageType: '',
    quantity: 1,
    declaredQuantity: 0,
    length: 0,
    width: 0,
    height: 0,
    unitGrossWeight: 0,
    totalGrossWeight: 0,
    area: 0,
    volume: 0,
    remark: ''
  }
  // 打开编辑弹窗
  editingIndex.value = -1 // -1 表示新增
  editingItem.value = newItem
  showEditPopup.value = true
}

// 打开编辑明细
function openEditItem(index: number) {
  editingIndex.value = index
  // 深拷贝当前明细
  editingItem.value = { ...localItems.value[index] }
  showEditPopup.value = true
}

// 关闭编辑明细
function closeEditItem() {
  showEditPopup.value = false
  editingIndex.value = -1
  editingItem.value = null
}

// 数量变化时更新总毛重
function onQuantityChange() {
  // 触发computed重新计算
}

// 单件毛重变化时更新总毛重
function onWeightChange() {
  // 触发computed重新计算
}

// 保存编辑
function saveEditItem() {
  if (!editingItem.value.productName) {
    uni.showToast({ title: '请输入货名', icon: 'none' })
    return
  }
  if (!editingItem.value.quantity || editingItem.value.quantity <= 0) {
    uni.showToast({ title: '请输入有效的实收数量', icon: 'none' })
    return
  }

  // 计算总毛重
  const qty = parseFloat(editingItem.value.quantity) || 0
  const unitWeight = parseFloat(editingItem.value.unitGrossWeight) || 0
  editingItem.value.totalGrossWeight = qty * unitWeight

  // 判断是新增还是编辑
  if (editingIndex.value === -1) {
    // 新增明细
    localItems.value.push({ ...editingItem.value })
    uni.showToast({ title: '添加成功', icon: 'success' })
  } else {
    // 更新本地数据
    localItems.value[editingIndex.value] = { ...editingItem.value }
    uni.showToast({ title: '保存成功', icon: 'success' })
  }

  closeEditItem()
}

// 关闭弹窗
function handleClose() {
  emit('close')
}

// 确认操作
async function handleConfirm() {
  if (confirming.value) return

  // 校验必填项
  if (!actualQuantity.value || Number(actualQuantity.value) <= 0) {
    uni.showToast({ title: '请输入有效的实收数量', icon: 'none' })
    return
  }
  if (!locationCode.value || !locationCode.value.trim()) {
    uni.showToast({ title: '请输入库位', icon: 'none' })
    return
  }

  confirming.value = true

  try {
    // 更新所有明细的库位（使用基本信息中的库位）
    const updatedItems = localItems.value.map(item => ({
      ...item,
      locationCode: locationCode.value.trim(),
      quantity: item.quantity || 1
    }))

    const confirmData = {
      source: 'mobile' as const,
      remark: remark.value,
      images: uploadedImages.value,
      actualQuantity: Number(actualQuantity.value),
      locationCode: locationCode.value.trim(),
      items: updatedItems // 传递编辑后的明细
    }

    if (props.order.type === 'inbound') {
      await todoStore.confirmInbound(props.order.id, confirmData)
    } else {
      await todoStore.confirmOutbound(props.order.id, confirmData)
    }

    uni.showToast({
      title: '操作成功',
      icon: 'success'
    })

    emit('confirm')
  } catch (error: any) {
    uni.showToast({
      title: error.message || '操作失败',
      icon: 'none'
    })
  } finally {
    confirming.value = false
  }
}
</script>

<style lang="scss" scoped>
.popup-mask {
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

.popup-content {
  width: 100%;
  max-height: 90vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.popup-header {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.order-type-tag {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: 500;
  margin-right: 16rpx;

  &.inbound {
    background: #e6f7ff;
    color: #1890ff;
  }
  &.outbound {
    background: #fff7e6;
    color: #fa8c16;
  }
}

.order-no {
  flex: 1;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #999;

  &:active {
    color: #333;
  }
}

.popup-body {
  flex: 1;
  max-height: calc(90vh - 200rpx);
  padding: 0 32rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin: 32rpx 0 20rpx;
  display: flex;
  align-items: center;
}

.item-count {
  font-size: 26rpx;
  font-weight: normal;
  color: #999;
  margin-left: 8rpx;
}

.info-section {
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    padding: 16rpx;
    background: #f8f9fa;
    border-radius: 12rpx;
  }

  .info-label {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 8rpx;
  }

  .info-value {
    font-size: 28rpx;
    color: #333;

    &.highlight {
      color: #1890ff;
      font-weight: 600;
    }
  }

  .input-fields {
    display: flex;
    gap: 16rpx;
    margin-top: 20rpx;
  }

  .input-field {
    flex: 1;
  }

  .input-label {
    display: block;
    font-size: 26rpx;
    color: #666;
    margin-bottom: 8rpx;

    .required {
      color: #ff4d4f;
    }
  }

  .input-box {
    width: 100%;
    height: 80rpx;
    padding: 0 24rpx;
    background: #fff;
    border: 2rpx solid #d9d9d9;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #333;
    box-sizing: border-box;

    &:focus {
      border-color: #1890ff;
    }
  }
}

.items-section {
  width: 100%;
  box-sizing: border-box;

  .section-header {
    margin: 32rpx 0 20rpx;
  }

  .section-title {
    margin: 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8rpx;
  }

  .add-item-btn {
    padding: 4rpx 12rpx;
    font-size: 22rpx;
    color: #1890ff;
    background: #e6f7ff;
    border: none;
    border-radius: 6rpx;
    white-space: nowrap;
    line-height: 1.4;
    min-width: auto;
    margin-left: 8rpx;

    &::after {
      border: none;
    }

    &:active {
      background: #bae7ff;
    }
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  .item-card {
    background: #f8f9fa;
    border-radius: 12rpx;
    padding: 20rpx;
    position: relative;

    &:active {
      background: #f0f0f0;
    }
  }

  .item-header {
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

  .edit-icon {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1890ff;
    border-radius: 50%;
    color: #fff;
    font-size: 24rpx;
  }

  .item-qty-row {
    display: flex;
    gap: 32rpx;
    margin-bottom: 12rpx;
    padding: 12rpx 16rpx;
    background: #fff;
    border-radius: 8rpx;
  }

  .qty-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .qty-label {
    font-size: 24rpx;
    color: #999;
  }

  .qty-value {
    font-size: 28rpx;
    font-weight: 600;

    &.declared {
      color: #faad14;
    }
    &.actual {
      color: #52c41a;
    }
  }

  .item-details {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx 24rpx;
  }

  .detail-row {
    display: flex;
    align-items: center;
  }

  .detail-label {
    font-size: 24rpx;
    color: #999;
    margin-right: 8rpx;
  }

  .detail-value {
    font-size: 24rpx;
    color: #666;
  }
}

.upload-section {
  margin-bottom: 24rpx;
}

.remark-section {
  margin-bottom: 32rpx;

  .remark-input {
    width: 100%;
    height: 160rpx;
    padding: 20rpx;
    background: #f8f9fa;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #333;
    box-sizing: border-box;
  }
}

.popup-footer {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;
  background: #fff;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 500;
  border: none;

  &::after {
    border: none;
  }
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;

  &:active {
    background: #e8e8e8;
  }
}

.btn-confirm {
  color: #fff;

  &.inbound {
    background: linear-gradient(90deg, #1890ff 0%, #096dd9 100%);
  }
  &.outbound {
    background: linear-gradient(90deg, #fa8c16 0%, #d46b08 100%);
  }

  &:active {
    opacity: 0.9;
  }
}

/* 明细编辑弹窗样式 */
.edit-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  display: flex;
  align-items: flex-end;
}

.edit-content {
  width: 100%;
  max-height: 85vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.edit-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.edit-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #999;
}

.edit-body {
  flex: 1;
  max-height: calc(85vh - 200rpx);
  padding: 0 32rpx 32rpx;
}

.edit-section {
  margin-top: 24rpx;
}

.edit-section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  padding-left: 12rpx;
  border-left: 4rpx solid #1890ff;
}

.edit-field {
  margin-bottom: 20rpx;

  &.half {
    flex: 1;
  }

  &.third {
    flex: 1;
  }
}

.edit-row {
  display: flex;
  gap: 16rpx;
}

.field-label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.field-input {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;

  &[disabled] {
    background: #f0f0f0;
    color: #999;
  }
}

.field-textarea {
  width: 100%;
  height: 160rpx;
  padding: 20rpx 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.edit-footer {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;
  background: #fff;
}

.btn-save {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 500;
  border: none;
  background: linear-gradient(90deg, #1890ff 0%, #096dd9 100%);
  color: #fff;

  &::after {
    border: none;
  }

  &:active {
    opacity: 0.9;
  }
}
</style>
