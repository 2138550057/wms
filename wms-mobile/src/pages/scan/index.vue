<template>
  <view class="scan-page">
    <view class="navbar">
      <view class="navbar-back" @click="handleBack">← 返回</view>
      <view class="navbar-title">扫码</view>
      <view class="navbar-action"></view>
    </view>

    <view class="scan-area">
      <view class="scan-frame">
        <view class="corner top-left"></view>
        <view class="corner top-right"></view>
        <view class="corner bottom-left"></view>
        <view class="corner bottom-right"></view>
        <view class="scan-line"></view>
      </view>
      <text class="scan-tip">将条码/二维码放入框内，即可自动扫描</text>
    </view>

    <view class="action-buttons">
      <view class="action-btn" @click="startScan">
        <view class="btn-icon">📷</view>
        <text class="btn-text">扫一扫</text>
      </view>
      <view class="action-btn" @click="chooseFromAlbum">
        <view class="btn-icon">🖼️</view>
        <text class="btn-text">相册</text>
      </view>
      <view class="action-btn" @click="inputManually">
        <view class="btn-icon">⌨️</view>
        <text class="btn-text">手动输入</text>
      </view>
    </view>

    <!-- 手动输入弹窗 -->
    <view class="modal-mask" v-if="showManualInput" @click="showManualInput = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">手动输入编号</text>
          <text class="modal-close" @click="showManualInput = false">×</text>
        </view>
        <view class="modal-body">
          <input
            class="manual-input"
            v-model="manualCode"
            placeholder="请输入订单号或SKU"
            @confirm="handleManualSubmit"
          />
        </view>
        <view class="modal-footer">
          <view class="modal-btn cancel" @click="showManualInput = false">取消</view>
          <view class="modal-btn confirm" @click="handleManualSubmit">确定</view>
        </view>
      </view>
    </view>

    <!-- 最近扫码记录 -->
    <view class="history-section" v-if="scanHistory.length > 0">
      <view class="section-header">
        <text class="section-title">最近扫码</text>
        <text class="section-action" @click="clearHistory">清空</text>
      </view>
      <view class="history-list">
        <view
          v-for="(item, index) in scanHistory"
          :key="index"
          class="history-item"
          @click="handleHistoryClick(item)"
        >
          <text class="history-code">{{ item.code }}</text>
          <text class="history-time">{{ item.time }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'

interface ScanHistoryItem {
  code: string
  time: string
  type: 'inbound' | 'outbound' | 'inventory'
}

const showManualInput = ref(false)
const manualCode = ref('')
const scanHistory = ref<ScanHistoryItem[]>([])

// 加载扫码历史
function loadHistory() {
  try {
    const history = uni.getStorageSync('scanHistory')
    if (history) {
      scanHistory.value = JSON.parse(history)
    }
  } catch (e) {
    console.error('加载扫码历史失败:', e)
  }
}

// 保存扫码历史
function saveHistory(code: string, type: 'inbound' | 'outbound' | 'inventory') {
  const newItem: ScanHistoryItem = {
    code,
    time: dayjs().format('MM-DD HH:mm'),
    type
  }

  // 去重并限制数量
  const filtered = scanHistory.value.filter(item => item.code !== code)
  scanHistory.value = [newItem, ...filtered].slice(0, 10)

  try {
    uni.setStorageSync('scanHistory', JSON.stringify(scanHistory.value))
  } catch (e) {
    console.error('保存扫码历史失败:', e)
  }
}

// 清空历史
function clearHistory() {
  uni.showModal({
    title: '确认',
    content: '确定要清空扫码历史吗？',
    success: (res) => {
      if (res.confirm) {
        scanHistory.value = []
        uni.removeStorageSync('scanHistory')
      }
    }
  })
}

// 开始扫码
function startScan() {
  uni.scanCode({
    scanType: ['barCode', 'qrCode'],
    success: (res) => {
      handleScanResult(res.result)
    },
    fail: (err) => {
      if (err.errMsg !== 'scanCode:fail cancel') {
        uni.showToast({ title: '扫码失败', icon: 'none' })
      }
    }
  })
}

// 从相册选择
function chooseFromAlbum() {
  // #ifdef H5
  uni.showToast({ title: 'H5暂不支持相册识别', icon: 'none' })
  // #endif

  // #ifndef H5
  uni.chooseImage({
    count: 1,
    sourceType: ['album'],
    success: (chooseRes) => {
      // 小程序端可以识别图片中的二维码
      // #ifdef MP-WEIXIN
      uni.scanCode({
        path: chooseRes.tempFilePaths[0],
        success: (scanRes) => {
          handleScanResult(scanRes.result)
        },
        fail: () => {
          uni.showToast({ title: '未识别到二维码', icon: 'none' })
        }
      })
      // #endif

      // #ifdef APP-PLUS
      // App端需要使用其他方式识别
      uni.showToast({ title: '请使用扫一扫功能', icon: 'none' })
      // #endif
    }
  })
  // #endif
}

// 手动输入
function inputManually() {
  manualCode.value = ''
  showManualInput.value = true
}

// 手动提交
function handleManualSubmit() {
  const code = manualCode.value.trim()
  if (!code) {
    uni.showToast({ title: '请输入编号', icon: 'none' })
    return
  }
  showManualInput.value = false
  handleScanResult(code)
}

// 处理扫码结果
function handleScanResult(code: string) {
  if (!code) return

  // 根据编号前缀判断类型并跳转
  if (code.startsWith('WI')) {
    // 入库单
    saveHistory(code, 'inbound')
    uni.navigateTo({
      url: `/pages/todo/inbound-detail?orderNo=${code}`
    })
  } else if (code.startsWith('WO')) {
    // 出库单
    saveHistory(code, 'outbound')
    uni.navigateTo({
      url: `/pages/todo/outbound-detail?orderNo=${code}`
    })
  } else {
    // 可能是SKU，跳转库存搜索
    saveHistory(code, 'inventory')
    uni.switchTab({
      url: '/pages/inventory/index'
    })
    // 延迟设置搜索关键词
    setTimeout(() => {
      uni.$emit('searchInventory', code)
    }, 300)
  }
}

// 点击历史记录
function handleHistoryClick(item: ScanHistoryItem) {
  handleScanResult(item.code)
}

// 返回
function handleBack() {
  uni.navigateBack({
    fail: () => {
      uni.switchTab({ url: '/pages/home/index' })
    }
  })
}

onMounted(() => {
  loadHistory()
})
</script>

<style lang="scss" scoped>
.scan-page {
  min-height: 100vh;
  background: #1a1a1a;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  background: #1a1a1a;
  padding: 0 32rpx;
  padding-top: var(--status-bar-height);
}

.navbar-back {
  font-size: 28rpx;
  color: #ffffff;
}

.navbar-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #ffffff;
}

.navbar-action {
  width: 100rpx;
}

.scan-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
}

.scan-frame {
  position: relative;
  width: 500rpx;
  height: 500rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.corner {
  position: absolute;
  width: 40rpx;
  height: 40rpx;
  border-color: #1890ff;
  border-style: solid;
  border-width: 0;

  &.top-left {
    top: -2rpx;
    left: -2rpx;
    border-top-width: 6rpx;
    border-left-width: 6rpx;
  }

  &.top-right {
    top: -2rpx;
    right: -2rpx;
    border-top-width: 6rpx;
    border-right-width: 6rpx;
  }

  &.bottom-left {
    bottom: -2rpx;
    left: -2rpx;
    border-bottom-width: 6rpx;
    border-left-width: 6rpx;
  }

  &.bottom-right {
    bottom: -2rpx;
    right: -2rpx;
    border-bottom-width: 6rpx;
    border-right-width: 6rpx;
  }
}

.scan-line {
  position: absolute;
  left: 10rpx;
  right: 10rpx;
  height: 4rpx;
  background: linear-gradient(90deg, transparent, #1890ff, transparent);
  animation: scanMove 2s linear infinite;
}

@keyframes scanMove {
  0% {
    top: 10rpx;
  }
  100% {
    top: calc(100% - 14rpx);
  }
}

.scan-tip {
  margin-top: 40rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 80rpx;
  padding: 40rpx 0;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.btn-icon {
  width: 100rpx;
  height: 100rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  margin-bottom: 16rpx;
}

.btn-text {
  font-size: 26rpx;
  color: #ffffff;
}

.history-section {
  margin: 40rpx 32rpx;
  background: #2a2a2a;
  border-radius: 16rpx;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #3a3a3a;
}

.section-title {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 500;
}

.section-action {
  font-size: 26rpx;
  color: #1890ff;
}

.history-list {
  // styles
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #3a3a3a;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: rgba(255, 255, 255, 0.05);
  }
}

.history-code {
  font-size: 28rpx;
  color: #ffffff;
}

.history-time {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

// 弹窗样式
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 600rpx;
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  line-height: 1;
}

.modal-body {
  padding: 32rpx;
}

.manual-input {
  width: 100%;
  height: 88rpx;
  border: 1rpx solid #d9d9d9;
  border-radius: 8rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  height: 96rpx;
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
    font-weight: 500;
  }
}
</style>
