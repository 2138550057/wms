import { http } from './request'
import type { Inventory } from '@/types'

interface InventoryListParams {
  page?: number
  size?: number
  keyword?: string
  customerId?: number
  customerName?: string
  sku?: string
  locationCode?: string
  warehouseEntryNo?: string
  internalCode?: string
  productCode?: string
  shippingMark?: string
  poNumber?: string
  productName?: string
  productModel?: string
}

export const inventoryApi = {
  // 获取库存列表
  getList(params?: InventoryListParams) {
    return http.get<Inventory[]>('/inventory', params)
  },

  // 获取库存详情
  getDetail(id: number) {
    return http.get<Inventory>(`/inventory/${id}`)
  },

  // 更新库存
  update(id: number, data: Partial<Inventory>) {
    return http.put<Inventory>(`/inventory/${id}`, data)
  },

  // 删除库存
  delete(id: number) {
    return http.delete(`/inventory/${id}`)
  },

  // 批量删除库存
  batchDelete(ids: number[]) {
    return http.post('/inventory/batch-delete', { ids })
  },

  // 库存调整
  adjust(id: number, adjustQuantity: number, remark?: string) {
    return http.post('/inventory/adjust', { id, adjustQuantity, remark })
  },

  // 搜索库存（按关键词）
  search(keyword: string, page = 1, size = 20) {
    return http.get<Inventory[]>('/inventory', { keyword, page, size })
  }
}
