import { get, post } from './request'
import type { InboundOrder, PaginatedResponse, ConfirmRequest } from '@/types'

/**
 * 入库相关 API
 */
export const inboundAPI = {
  /**
   * 获取入库单列表
   */
  list(params?: {
    page?: number
    size?: number
    status?: string
    orderNo?: string
    customerName?: string
    search?: string
  }) {
    return get<PaginatedResponse<InboundOrder>>('/inbound/orders', params, { showLoading: false })
  },

  /**
   * 获取入库单详情
   */
  getById(id: number) {
    return get<InboundOrder>(`/inbound/orders/${id}`)
  },

  /**
   * 通过订单号获取入库单
   */
  getByOrderNo(orderNo: string) {
    return get<InboundOrder>('/inbound/orders', { orderNo })
  },

  /**
   * 确认入库
   */
  confirm(id: number, data?: ConfirmRequest) {
    return post(`/inbound/orders/${id}/confirm`, data)
  }
}
