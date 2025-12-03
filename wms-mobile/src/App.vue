<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'

onLaunch(() => {
  console.log('App Launch')
  // 检查登录状态
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
  }
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
@import '@/styles/global.scss';

/* #ifdef H5 */
/* 全局重置样式 - 仅H5平台 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
/* #endif */

/* uni-app 页面容器 */
uni-page-body {
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 全局样式 */
page {
  width: 100%;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

view, text {
  box-sizing: border-box;
}

/* 确保所有页面容器居中且无偏移 */
.uni-page-wrapper,
.uni-page-body {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* #ifdef H5 */
/* 隐藏滚动条 - 仅H5平台 */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
  color: transparent;
}
/* #endif */

/* 修复可能的 scroll-view 偏移问题 */
scroll-view {
  width: 100%;
}

/* 修复 input 等表单元素的默认样式 */
input, textarea, button {
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
}

button::after {
  border: none;
}
</style>
