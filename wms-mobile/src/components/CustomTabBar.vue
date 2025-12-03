<template>
  <view class="custom-tabbar" v-if="visible">
    <view
      v-for="item in tabList"
      :key="item.path"
      class="tabbar-item"
      :class="{ active: currentPath === item.path }"
      @click="switchTab(item.path)"
    >
      <view class="tabbar-icon">{{ item.icon }}</view>
      <text class="tabbar-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface TabItem {
  path: string
  icon: string
  text: string
}

const tabList: TabItem[] = [
  { path: '/pages/home/index', icon: '🏠', text: '首页' },
  { path: '/pages/todo/index', icon: '📋', text: '待办' },
  { path: '/pages/inventory/index', icon: '📦', text: '库存' },
  { path: '/pages/profile/index', icon: '👤', text: '我的' }
]

const currentPath = ref('')
const visible = ref(true)

// 获取当前页面路径
function getCurrentPath() {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const page = pages[pages.length - 1]
    currentPath.value = '/' + page.route
  }
}

// 切换 Tab
function switchTab(path: string) {
  if (currentPath.value === path) return

  uni.switchTab({
    url: path,
    success: () => {
      currentPath.value = path
    }
  })
}

// 检查是否显示 TabBar
function checkVisible() {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const page = pages[pages.length - 1]
    const pagePath = '/' + page.route
    visible.value = tabList.some(item => item.path === pagePath)
  }
}

onMounted(() => {
  getCurrentPath()
  checkVisible()

  // 监听页面显示事件
  uni.$on('tabbarUpdate', () => {
    getCurrentPath()
    checkVisible()
  })
})

onUnmounted(() => {
  uni.$off('tabbarUpdate')
})
</script>

<style lang="scss" scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 999;
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  transition: all 0.2s;

  &.active {
    .tabbar-icon {
      transform: scale(1.1);
    }

    .tabbar-text {
      color: #1890ff;
    }
  }
}

.tabbar-icon {
  font-size: 44rpx;
  margin-bottom: 4rpx;
  transition: transform 0.2s;
}

.tabbar-text {
  font-size: 22rpx;
  color: #999999;
  transition: color 0.2s;
}
</style>
