import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

// 设置语言
dayjs.locale('zh-cn')

/**
 * 日期格式化
 */
export function formatDate(date: string | Date | undefined, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}

/**
 * 相对时间
 */
export function fromNow(date: string | Date): string {
  const diff = dayjs().diff(dayjs(date), 'minute')

  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`

  const hours = Math.floor(diff / 60)
  if (hours < 24) return `${hours}小时前`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`

  return formatDate(date, 'MM-DD HH:mm')
}

/**
 * 数字格式化（保留小数）
 */
export function formatNumber(num: number | undefined, decimals = 2): string {
  if (num === undefined || num === null) return '-'
  return num.toFixed(decimals)
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 复制文本到剪贴板
 */
export function copyText(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.setClipboardData({
      data: text,
      success: () => {
        uni.showToast({ title: '复制成功', icon: 'success' })
        resolve()
      },
      fail: reject
    })
  })
}

/**
 * 显示确认弹窗
 */
export function showConfirm(options: {
  title?: string
  content: string
  confirmText?: string
  cancelText?: string
}): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({
      title: options.title || '提示',
      content: options.content,
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      success: (res) => {
        resolve(res.confirm)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

/**
 * 显示 Toast
 */
export function showToast(title: string, icon: 'success' | 'error' | 'none' = 'none') {
  uni.showToast({
    title,
    icon,
    duration: 2000
  })
}

/**
 * 生成订单状态文本
 */
export function getStatusText(status: string, type: 'inbound' | 'outbound' = 'inbound'): string {
  if (status === 'pending') {
    return type === 'inbound' ? '待入库' : '待出库'
  }
  return '已完成'
}

/**
 * 生成订单状态样式类
 */
export function getStatusClass(status: string): string {
  return status === 'pending' ? 'status-pending' : 'status-completed'
}
