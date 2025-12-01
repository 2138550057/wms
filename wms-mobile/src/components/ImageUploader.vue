<template>
  <view class="image-uploader">
    <!-- 已上传的图片列表 -->
    <view class="image-list">
      <view
        v-for="(image, index) in modelValue"
        :key="index"
        class="image-item"
      >
        <image
          :src="image"
          class="preview-image"
          mode="aspectFill"
          @click="previewImage(index)"
        />
        <view class="delete-btn" @click.stop="deleteImage(index)">
          <text>×</text>
        </view>
        <view class="uploading-mask" v-if="uploadingIndex === index">
          <text class="uploading-text">上传中...</text>
        </view>
      </view>

      <!-- 上传按钮 -->
      <view
        v-if="modelValue.length < maxCount"
        class="upload-btn"
        @click="chooseImage"
      >
        <text class="upload-icon">&#x1F4F7;</text>
        <text class="upload-text">拍照/相册</text>
        <text class="upload-count">{{ modelValue.length }}/{{ maxCount }}</text>
      </view>
    </view>

    <!-- 提示文字 -->
    <view class="upload-tips" v-if="tips">
      <text>{{ tips }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { attachmentAPI } from '@/api'

// Props
const props = withDefaults(defineProps<{
  modelValue: string[]
  maxCount?: number
  maxSize?: number // MB
  entityType?: string
  entityId?: number
  tips?: string
}>(), {
  maxCount: 9,
  maxSize: 10,
  tips: '支持拍照或从相册选择，最多上传9张'
})

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

// 状态
const uploadingIndex = ref<number | null>(null)

// 选择图片
function chooseImage() {
  const remainCount = props.maxCount - props.modelValue.length

  uni.chooseImage({
    count: remainCount,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFiles = res.tempFiles as any[]

      // 检查文件大小
      for (const file of tempFiles) {
        if (file.size > props.maxSize * 1024 * 1024) {
          uni.showToast({
            title: `图片大小不能超过${props.maxSize}MB`,
            icon: 'none'
          })
          return
        }
      }

      // 逐个上传
      for (const file of tempFiles) {
        await uploadImage(file.path)
      }
    }
  })
}

// 上传单张图片
async function uploadImage(filePath: string) {
  const newImages = [...props.modelValue, filePath]
  emit('update:modelValue', newImages)

  const index = newImages.length - 1
  uploadingIndex.value = index

  try {
    // 如果有实体类型和ID，上传到服务器
    if (props.entityType && props.entityId) {
      const result = await attachmentAPI.upload(
        filePath,
        props.entityType,
        props.entityId,
        'image'
      )

      // 替换为服务器返回的URL
      const updatedImages = [...newImages]
      updatedImages[index] = result.url || result.storageUrl
      emit('update:modelValue', updatedImages)
    }
  } catch (error: any) {
    console.error('图片上传失败:', error)
    uni.showToast({
      title: error.message || '图片上传失败',
      icon: 'none'
    })

    // 上传失败，移除图片
    const updatedImages = newImages.filter((_, i) => i !== index)
    emit('update:modelValue', updatedImages)
  } finally {
    uploadingIndex.value = null
  }
}

// 删除图片
function deleteImage(index: number) {
  uni.showModal({
    title: '提示',
    content: '确定要删除这张图片吗？',
    success: (res) => {
      if (res.confirm) {
        const newImages = props.modelValue.filter((_, i) => i !== index)
        emit('update:modelValue', newImages)
      }
    }
  })
}

// 预览图片
function previewImage(index: number) {
  uni.previewImage({
    current: index,
    urls: props.modelValue
  })
}
</script>

<style lang="scss" scoped>
.image-uploader {
  width: 100%;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32rpx;

  &:active {
    background: rgba(0, 0, 0, 0.7);
  }
}

.uploading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.uploading-text {
  color: #fff;
  font-size: 24rpx;
}

.upload-btn {
  width: 200rpx;
  height: 200rpx;
  background: #f8f9fa;
  border: 2rpx dashed #d9d9d9;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &:active {
    background: #f0f0f0;
    border-color: #1890ff;
  }
}

.upload-icon {
  font-size: 56rpx;
  margin-bottom: 8rpx;
}

.upload-text {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 4rpx;
}

.upload-count {
  font-size: 22rpx;
  color: #999;
}

.upload-tips {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #999;
}
</style>
