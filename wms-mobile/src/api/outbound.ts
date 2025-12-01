import { get, post } from './request'
import type { OutboundOrder, PaginatedResponse, ConfirmRequest } from '@/types'

/**
 * 出库相关 API
 */
export const outboundAPI = {
  /**
   * 获取出库单列表
   */
  list(params?: {
    page?: number
    size?: number
    status?: string
    orderNo?: string
    customerName?: string
    search?: string
  }) {
    return get<PaginatedResponse<OutboundOrder>>('/outbound/orders', params, { showLoading: false })
  },

  /**
   * 获取出库单详情
   */
  getById(id: number) {
    return get<OutboundOrder>(`/outbound/orders/${id}`)
  },

  /**
   * 通过订单号获取出库单
   */
  getByOrderNo(orderNo: string) {
    return get<OutboundOrder>('/outbound/orders', { orderNo })
  },

  /**
   * 确认出库
   */
  confirm(id: number, data?: ConfirmRequest) {
    return post(`/outbound/orders/${id}/confirm`, data)
  }
}
