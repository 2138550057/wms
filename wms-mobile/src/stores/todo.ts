import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { InboundOrder, OutboundOrder, PendingCountResponse } from '@/types'
import { todoApi } from '@/api/todo'

export const useTodoStore = defineStore('todo', () => {
  // 状态
  const inbounds = ref<InboundOrder[]>([])
  const outbounds = ref<OutboundOrder[]>([])
  const counts = ref<PendingCountResponse>({
    inbound: 0,
    outbound: 0,
    total: 0
  })
  const loading = ref(false)

  // 获取待办列表
  async function fetchPendingOrders(type?: 'inbound' | 'outbound') {
    loading.value = true
    try {
      const res = await todoApi.getPendingOrders(type)
      if (res.success && res.data) {
        inbounds.value = res.data.inbounds || []
        outbounds.value = res.data.outbounds || []
        counts.value = res.data.counts || { inbound: 0, outbound: 0, total: 0 }
      }
    } catch (error) {
      console.error('获取待办列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 获取待办数量
  async function fetchPendingCount() {
    try {
      const res = await todoApi.getPendingCount()
      if (res.success && res.data) {
        counts.value = res.data
      }
    } catch (error) {
      console.error('获取待办数量失败:', error)
    }
  }

  // 从列表中移除已完成的订单
  function removeInbound(orderId: number) {
    inbounds.value = inbounds.value.filter(o => o.id !== orderId)
    counts.value.inbound = Math.max(0, counts.value.inbound - 1)
    counts.value.total = Math.max(0, counts.value.total - 1)
  }

  function removeOutbound(orderId: number) {
    outbounds.value = outbounds.value.filter(o => o.id !== orderId)
    counts.value.outbound = Math.max(0, counts.value.outbound - 1)
    counts.value.total = Math.max(0, counts.value.total - 1)
  }

  return {
    inbounds,
    outbounds,
    counts,
    loading,
    fetchPendingOrders,
    fetchPendingCount,
    removeInbound,
    removeOutbound
  }
})
