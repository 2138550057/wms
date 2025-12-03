import { http } from './request'

export interface Customer {
  id: number
  name: string
  code?: string
  contact?: string
  phone?: string
}

export const customerApi = {
  // 获取客户列表
  getList() {
    return http.get<Customer[]>('/customers', { page: 1, size: 999 }, { showLoading: false })
  }
}
