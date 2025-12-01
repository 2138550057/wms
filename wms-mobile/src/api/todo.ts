import { get, post } from './request'
import type { TodoData, TodoCounts, ConfirmRequest, BaseOrder } from '@/types'

/**
 * 待办相关 API
 */
export const todoAPI = {
  /**
   * 获取待办订单列表
   */
  getPending(type?: 'inbound' | 'outbound') {
    return get<TodoData>('/todo/pending', type ? { type } : undefined, {
      showLoading: false,
      showError: false
    })
  },

  /**
   * 获取待办数量
   */
  getCount() {
    return get<TodoCounts>('/todo/count', undefined, {
      showLoading: false,
      showError: false
    })
  },

  /**
   * 确认入库
   */
  confirmInbound(id: number, data?: ConfirmRequest) {
    return post<BaseOrder>(`/todo/inbound/${id}/confirm`, {
      source: 'mobile',
      ...data
    })
  },

  /**
   * 确认出库
   */
  confirmOutbound(id: number, data?: ConfirmRequest) {
    return post<BaseOrder>(`/todo/outbound/${id}/confirm`, {
      source: 'mobile',
      ...data
    })
  }
}
