import { http } from './request'
import type { ApiResponse } from '@/types'

// 库位类型
export interface Location {
  id: number
  code: string           // 库位编码(自动生成)，如: 3F16-1
  bonded: boolean        // 是否保税: true=保税(3), false=非保税(1)
  zone: string           // 库位地区: A-Z
  number: string         // 库位分号: 01-99
  level: number          // 库位层数: 1, 2, 3...
  category: string       // 库位分类: shelf(货架)/floor(地面)/large(大件)/small(small件)
  status: string         // 状态: active/disabled
  remark?: string
}

// 库位筛选选项
export interface LocationFilterOptions {
  zones: string[]
  categories: string[]
  bondedOptions: { value: string; label: string }[]
  categoryOptions: { value: string; label: string }[]
}

export const locationApi = {
  // 获取可用库位列表(用于下拉选择)
  getActive: (params?: {
    bonded?: string
    zone?: string
    category?: string
    keyword?: string
  }) => http.get<Location[]>('/locations/active', params),

  // 获取库位筛选选项
  getFilterOptions: () => http.get<LocationFilterOptions>('/locations/filter-options'),
}
