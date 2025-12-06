import { http } from './request'
import type { ApiResponse, Inventory, Location } from '@/types'

// 库位统计数据
export interface LocationWithStats extends Location {
  totalQuantity: number
  skuCount: number
}

// 库位汇总信息
export interface LocationSummary {
  location: Location
  locationCode: string
  totalQuantity: number
  totalSku: number
  inventory: LocationInventoryItem[]
}

// 库位库存项
export interface LocationInventoryItem {
  id: number
  warehouseEntryNo?: string
  productName: string
  productModel?: string
  sku: string
  internalCode?: string
  quantity: number
  availableQuantity: number
  lockedQuantity: number
  customerName: string
  customerId: number
  lastInboundDate?: string
}

// 库位统计响应
export interface LocationStatsResponse {
  data: LocationWithStats[]
  stats: {
    totalLocations: number
    occupiedLocations: number
    emptyLocations: number
    totalQuantity: number
  }
}

export const stocktakingApi = {
  // 获取所有库位统计
  getAllLocationsSummary: (params?: {
    zone?: string
    bonded?: string
    hasInventory?: string
  }) => http.get<LocationStatsResponse>('/stocktaking/locations/summary', params),

  // 获取库位详情
  getLocationSummary: (locationCode: string) =>
    http.get<LocationSummary>(`/stocktaking/location/${locationCode}/summary`),

  // 获取未分配库存
  getUnassignedInventory: (params?: {
    page?: number
    size?: number
    customerName?: string
    productName?: string
    sku?: string
  }) => http.get<Inventory[]>('/stocktaking/inventory/unassigned', params),

  // 更新单个库存的库位
  updateInventoryLocation: (inventoryId: number, locationCode: string | null) =>
    http.put<Inventory>(`/stocktaking/inventory/${inventoryId}/location`, { locationCode }),

  // 批量更新库存库位
  batchUpdateInventoryLocation: (inventoryIds: number[], locationCode: string | null) =>
    http.post<{ count: number }>('/stocktaking/inventory/batch-location', {
      inventoryIds,
      locationCode,
    }),
}
