import { http } from './request'
import type { DashboardStats } from '@/types'

export const dashboardApi = {
  // 获取仪表板统计数据
  getStats() {
    return http.get<DashboardStats>('/dashboard/stats', undefined, { showLoading: false })
  }
}
