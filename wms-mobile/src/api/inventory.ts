import { get, post } from './request'
import type { Inventory, PaginatedResponse } from '@/types'

/**
 * 库存相关 API
 */
export const inventoryAPI = {
  /**
   * 获取库存列表
   */
  list(params?: {
    page?: number
    size?: number
    customerName?: string
    sku?: string
    productName?: string
    locationCode?: string
    warehouseEntryNo?: string
    search?: string
    sortBy?: string
    sortOrder?: string
  }) {
    return get<PaginatedResponse<Inventory>>('/inventory', params, { showLoading: false })
  },

  /**
   * 获取库存详情
   */
  getById(id: number) {
    return get<Inventory>(`/inventory/${id}`)
  },

  /**
   * 库存调整（盘盈盘亏）
   */
  adjust(data: { id: number; adjustQuantity: number; remark?: string }) {
    return post<Inventory>('/inventory/adjust', data)
  }
}
