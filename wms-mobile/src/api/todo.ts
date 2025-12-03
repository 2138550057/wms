import { http } from './request'
import type { InboundOrder, OutboundOrder, PendingOrdersResponse, PendingCountResponse } from '@/types'

export const todoApi = {
  // 获取待办列表
  getPendingOrders(type?: 'inbound' | 'outbound') {
    return http.get<PendingOrdersResponse>('/todo/pending', type ? { type } : undefined)
  },

  // 获取待办数量
  getPendingCount() {
    return http.get<PendingCountResponse>('/todo/count', undefined, { showLoading: false })
  },

  // 获取入库单详情（按ID）
  getInboundDetail(id: number) {
    return http.get<InboundOrder>(`/todo/inbound/${id}`)
  },

  // 获取入库单详情（按订单号）
  getInboundDetailByNo(orderNo: string) {
    return http.get<InboundOrder>(`/todo/inbound/by-no/${orderNo}`)
  },

  // 获取出库单详情（按ID）
  getOutboundDetail(id: number) {
    return http.get<OutboundOrder>(`/todo/outbound/${id}`)
  },

  // 获取出库单详情（按订单号）
  getOutboundDetailByNo(orderNo: string) {
    return http.get<OutboundOrder>(`/todo/outbound/by-no/${orderNo}`)
  },

  // 更新入库单明细（库位、实到数量）
  updateInboundItems(orderId: number, items: Array<{
    id: number
    locationCode?: string
    quantity: number
    remark?: string
  }>) {
    return http.put<InboundOrder>(`/todo/inbound/${orderId}/items`, { items })
  },

  // 确认入库
  confirmInbound(orderId: number, data?: {
    attachmentIds?: number[]
    remark?: string
  }) {
    return http.post(`/todo/inbound/${orderId}/confirm`, {
      source: 'mobile',
      ...data
    })
  },

  // 确认出库
  confirmOutbound(orderId: number, data?: {
    attachmentIds?: number[]
    remark?: string
  }) {
    return http.post(`/todo/outbound/${orderId}/confirm`, {
      source: 'mobile',
      ...data
    })
  }
}
