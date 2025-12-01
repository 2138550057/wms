import api from './api';
import { ApiResponse } from '../types';

export interface DashboardStats {
  // 基础统计
  todayInbound: number;
  todayOutbound: number;
  totalSku: number;
  totalCustomer: number;

  // 待处理数据
  pendingInbound: number;
  pendingOutbound: number;

  // 库存汇总
  totalInventoryQuantity: number;
  totalInventoryVolume: number;

  // 趋势数据
  trendData: Array<{
    date: string;
    inbound: number;
    outbound: number;
  }>;

  // 最近操作
  recentInbound: Array<{
    id: number;
    orderNo: string;
    customerName: string;
    totalQuantity: number;
    status: string;
    createdAt: string;
  }>;
  recentOutbound: Array<{
    id: number;
    orderNo: string;
    customerName: string;
    totalQuantity: number;
    status: string;
    createdAt: string;
  }>;

  // 客户统计
  topCustomers: Array<{
    customerName: string;
    quantity: number;
    volume: number;
  }>;

  // 库存预警
  lowStock: Array<{
    id: number;
    productName: string;
    sku: string;
    customerName: string;
    quantity: number;
    availableQuantity: number;
    locationCode: string;
  }>;
}

export const dashboardAPI = {
  // 获取仪表盘统计数据
  getStats: () =>
    api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
};
