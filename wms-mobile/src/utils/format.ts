import dayjs from 'dayjs'

// 格式化日期
export function formatDate(date: string | Date | undefined, format = 'YYYY-MM-DD'): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}

// 格式化日期时间
export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 格式化相对时间
export function formatRelativeTime(date: string | Date | undefined): string {
  if (!date) return '-'
  const now = dayjs()
  const target = dayjs(date)
  const diffMinutes = now.diff(target, 'minute')

  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`

  const diffHours = now.diff(target, 'hour')
  if (diffHours < 24) return `${diffHours}小时前`

  const diffDays = now.diff(target, 'day')
  if (diffDays < 7) return `${diffDays}天前`

  return formatDate(date)
}

// 格式化数字（千分位）
export function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '-'
  return num.toLocaleString('zh-CN')
}

// 格式化金额
export function formatMoney(num: number | undefined): string {
  if (num === undefined || num === null) return '-'
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化业务类型
export function formatBusinessType(type: string, category: 'inbound' | 'outbound' = 'inbound'): string {
  const inboundTypes: Record<string, string> = {
    normal: '普通入库',
    return: '退货入库',
    transfer: '调拨入库'
  }
  const outboundTypes: Record<string, string> = {
    sales: '普通出库',
    return: '退货出库',
    transfer: '调拨出库'
  }
  const types = category === 'inbound' ? inboundTypes : outboundTypes
  return types[type] || type
}

// 格式化订单状态
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    completed: '已完成'
  }
  return statusMap[status] || status
}
