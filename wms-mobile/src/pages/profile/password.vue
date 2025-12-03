<template>
  <view class="password-page">
    <view class="navbar">
      <view class="navbar-back" @click="handleBack">← 返回</view>
      <view class="navbar-title">修改密码</view>
      <view class="navbar-action"></view>
    </view>

    <view class="form-section">
      <view class="form-item">
        <text class="form-label">当前密码</text>
        <input
          class="form-input"
          type="password"
          v-model="form.oldPassword"
          placeholder="请输入当前密码"
        />
      </view>

      <view class="form-item">
        <text class="form-label">新密码</text>
        <input
          class="form-input"
          type="password"
          v-model="form.newPassword"
          placeholder="请输入新密码（6-20位）"
        />
      </view>

      <view class="form-item">
        <text class="form-label">确认密码</text>
        <input
          class="form-input"
          type="password"
          v-model="form.confirmPassword"
          placeholder="请再次输入新密码"
        />
      </view>
    </view>

    <view class="tips-section">
      <text class="tips-title">密码要求：</text>
      <view class="tips-list">
        <text class="tips-item" :class="{ valid: passwordLength }">• 长度6-20个字符</text>
        <text class="tips-item" :class="{ valid: passwordMatch }">• 两次输入密码一致</text>
      </view>
    </view>

    <view class="submit-section">
      <view
        class="submit-btn"
        :class="{ disabled: !canSubmit || loading }"
        @click="handleSubmit"
      >
        {{ loading ? '提交中...' : '确认修改' }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码长度验证
const passwordLength = computed(() => {
  return form.newPassword.length >= 6 && form.newPassword.length <= 20
})

// 密码匹配验证
const passwordMatch = computed(() => {
  return form.newPassword === form.confirmPassword && form.confirmPassword.length > 0
})

// 是否可以提交
const canSubmit = computed(() => {
  return form.oldPassword.length > 0 && passwordLength.value && passwordMatch.value
})

// 提交修改
async function handleSubmit() {
  if (!canSubmit.value || loading.value) return

  if (!form.oldPassword) {
    uni.showToast({ title: '请输入当前密码', icon: 'none' })
    return
  }

  if (!passwordLength.value) {
    uni.showToast({ title: '新密码长度应为6-20位', icon: 'none' })
    return
  }

  if (!passwordMatch.value) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const res = await authApi.changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword
    })

    if (res.success) {
      uni.showModal({
        title: '修改成功',
        content: '密码已修改，请重新登录',
        showCancel: false,
        success: async () => {
          await userStore.logout()
          uni.reLaunch({ url: '/pages/login/index' })
        }
      })
    } else {
      uni.showToast({ title: res.message || '修改失败', icon: 'none' })
    }
  } catch (error: any) {
    uni.showToast({ title: error.message || '修改失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function handleBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.password-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  background: #ffffff;
  padding: 0 32rpx;
  padding-top: var(--status-bar-height);
}

.navbar-back {
  font-size: 28rpx;
  color: #1890ff;
}

.navbar-title {
  font-size: 34rpx;
  font-weight: bold;
}

.navbar-action {
  width: 100rpx;
}

.form-section {
  margin: 24rpx 32rpx;
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.form-label {
  width: 160rpx;
  font-size: 30rpx;
  color: #333333;
}

.form-input {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}

.tips-section {
  margin: 24rpx 32rpx;
  padding: 24rpx;
  background: #fffbe6;
  border-radius: 12rpx;
}

.tips-title {
  display: block;
  font-size: 26rpx;
  color: #d48806;
  margin-bottom: 12rpx;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.tips-item {
  font-size: 24rpx;
  color: #999999;

  &.valid {
    color: #52c41a;
  }
}

.submit-section {
  padding: 48rpx 32rpx;
}

.submit-btn {
  background: #1890ff;
  color: #ffffff;
  height: 96rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 500;

  &:active {
    background: #40a9ff;
  }

  &.disabled {
    background: #d9d9d9;
    color: #ffffff;
  }
}
</style>
