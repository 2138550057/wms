<template>
  <view class="custom-tabbar" v-if="show">
    <view
      v-for="(item, index) in tabList"
      :key="index"
      class="tabbar-item"
      :class="{ active: currentIndex === index }"
      @click="switchTab(index)"
    >
      <view class="tabbar-icon">
        <text class="icon-text">{{ item.icon }}</text>
        <view class="badge" v-if="item.badge && item.badge > 0">
          {{ item.badge > 99 ? '99+' : item.badge }}
        </view>
      </view>
      <text class="tabbar-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTodoStore } from '@/stores/todo'

// Store
const todoStore = useTodoStore()

// Props
const props = withDefaults(defineProps<{
  current?: number
  show?: boolean
}>(), {
  current: 0,
  show: true
})

// 当前选中索引
const currentIndex = ref(props.current)

// Tab列表配置
const tabList = computed(() => [
  {
    pagePath: '/pages/home/index',
    text: '首页',
    icon: '🏠',
    badge: 0
  },
  {
    pagePath: '/pages/todo/index',
    text: '待办',
    icon: '📋',
    badge: todoStore.counts.total
  },
  {
    pagePath: '/pages/scan/index',
    text: '盘库',
    icon: '📦',
    badge: 0
  },
  {
    pagePath: '/pages/profile/index',
    text: '我的',
    icon: '👤',
    badge: 0
  }
])

// 监听props变化
watch(() => props.current, (val) => {
  currentIndex.value = val
})

// 切换Tab - 使用 reLaunch 确保跳转成功
function switchTab(index: number) {
  if (currentIndex.value === index) return

  const item = tabList.value[index]

  // 立即更新视觉状态
  currentIndex.value = index

  // 使用 switchTab，如果失败则用 reLaunch
  uni.switchTab({
    url: item.pagePath,
    fail: () => {
      // switchTab 失败时使用 reLaunch
      uni.reLaunch({ url: item.pagePath })
    }
  })
}

// 获取当前页面路径
function getCurrentPage() {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    return '/' + currentPage.route
  }
  return ''
}

// 更新当前选中状态
function updateCurrentIndex() {
  const currentPath = getCurrentPage()
  const index = tabList.value.findIndex(item => item.pagePath === currentPath)
  if (index >= 0) {
    currentIndex.value = index
  }
}

// 页面加载时更新状态
onMounted(() => {
  updateCurrentIndex()
})
</script>

<style lang="scss" scoped>
.custom-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 999;
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;

  &.active {
    .icon-text {
      transform: scale(1.1);
    }
    .tabbar-text {
      color: #1890ff;
      font-weight: 500;
    }
  }
}

.tabbar-icon {
  position: relative;
  margin-bottom: 4rpx;
}

.icon-text {
  font-size: 40rpx;
  transition: transform 0.2s;
}

.badge {
  position: absolute;
  top: -10rpx;
  right: -20rpx;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  background: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabbar-text {
  font-size: 22rpx;
  color: #999;
  transition: color 0.2s;
}
</style>
