import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { todoAPI } from '@/api'
import type { BaseOrder, TodoCounts, ConfirmRequest } from '@/types'

export const useTodoStore = defineStore('todo', () => {
  // State
  const pendingInbounds = ref<BaseOrder[]>([])
  const pendingOutbounds = ref<BaseOrder[]>([])
  const counts = ref<TodoCounts>({ inbound: 0, outbound: 0, total: 0 })
  const lastUpdated = ref<Date | null>(null)
  const pollingTimer = ref<number | null>(null)

  // Getters
  const allPendingOrders = computed(() => {
    const inbounds = pendingInbounds.value.map(o => ({
      ...o,
      type: 'inbound' as const
    }))
    const outbounds = pendingOutbounds.value.map(o => ({
      ...o,
      type: 'outbound' as const
    }))
    return [...inbounds, ...outbounds].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  })

  // Actions

  /**
   * 获取待办订单列表
   */
  async function fetchPendingOrders() {
    try {
      const data = await todoAPI.getPending()

      pendingInbounds.value = data.inbounds || []
      pendingOutbounds.value = data.outbounds || []
      counts.value = data.counts || { inbound: 0, outbound: 0, total: 0 }
      lastUpdated.value = new Date()

      // 更新 TabBar 角标
      updateTabBarBadge()
    } catch (error) {
      console.error('获取待办列表失败:', error)
    }
  }

  /**
   * 获取待办数量
   */
  async function fetchCounts() {
    try {
      const data = await todoAPI.getCount()
      counts.value = data

      // 更新 TabBar 角标
      updateTabBarBadge()
    } catch (error) {
      console.error('获取待办数量失败:', error)
    }
  }

  /**
   * 确认入库
   */
  async function confirmInbound(id: number, data?: ConfirmRequest) {
    await todoAPI.confirmInbound(id, data)
    await fetchPendingOrders()
  }

  /**
   * 确认出库
   */
  async function confirmOutbound(id: number, data?: ConfirmRequest) {
    await todoAPI.confirmOutbound(id, data)
    await fetchPendingOrders()
  }

  /**
   * 更新 TabBar 角标
   */
  function updateTabBarBadge() {
    try {
      if (counts.value.total > 0) {
        uni.setTabBarBadge({
          index: 1,
          text: String(counts.value.total > 99 ? '99+' : counts.value.total)
        })
      } else {
        uni.removeTabBarBadge({ index: 1 })
      }
    } catch (error) {
      console.error('更新TabBar角标失败:', error)
    }
  }

  /**
   * 开始轮询
   */
  function startPolling(interval = 30000) {
    stopPolling()
    fetchPendingOrders()

    pollingTimer.value = setInterval(() => {
      fetchPendingOrders()
    }, interval) as unknown as number
  }

  /**
   * 停止轮询
   */
  function stopPolling() {
    if (pollingTimer.value) {
      clearInterval(pollingTimer.value)
      pollingTimer.value = null
    }
  }

  return {
    pendingInbounds,
    pendingOutbounds,
    counts,
    lastUpdated,
    allPendingOrders,
    fetchPendingOrders,
    fetchCounts,
    confirmInbound,
    confirmOutbound,
    startPolling,
    stopPolling
  }
})
