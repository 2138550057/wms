import api from './api';

export interface SecondaryInventory {
  id: number;
  cmdUnifiedNo: string;
  rowNumber?: number;
  billOfLadingNo?: string;
  internalCode?: string;
  countryCode?: string;
  currencyCode?: string;
  declaredQuantity?: number;
  dutyFreeType?: string;
  customsDeclarationNo?: string;
  cmdPartNo?: string;
  projectNo?: string;
  packingListNo?: string;
  customsName?: string;
  importExportFlag?: string;
  purpose?: string;
  declaredValue?: number;
  legalQuantity?: number;
  secondQuantity?: number;
  bomStartDate?: string;
  writeOffCount?: number;
  exportFlag?: string;
  unitProject?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SecondaryInventoryListParams {
  page?: number;
  size?: number;
  cmdUnifiedNo?: string;
  billOfLadingNo?: string;
  internalCode?: string;
  customsDeclarationNo?: string;
  packingListNo?: string;
  customsName?: string;
}

export interface SecondaryInventoryStats {
  totalRecords: number;
  uniqueCmdNos: number;
}

const secondaryInventoryService = {
  // 获取列表
  list: (params: SecondaryInventoryListParams) =>
    api.get('/secondary-inventory', { params }),

  // 根据CMD统一编号获取
  getByUnifiedNo: (cmdUnifiedNo: string) =>
    api.get(`/secondary-inventory/by-unified-no/${encodeURIComponent(cmdUnifiedNo)}`),

  // 获取单条记录
  getById: (id: number) => api.get(`/secondary-inventory/${id}`),

  // 创建记录
  create: (data: Partial<SecondaryInventory>) =>
    api.post('/secondary-inventory', data),

  // 更新记录
  update: (id: number, data: Partial<SecondaryInventory>) =>
    api.put(`/secondary-inventory/${id}`, data),

  // 删除记录
  delete: (id: number) => api.delete(`/secondary-inventory/${id}`),

  // 批量删除
  batchDelete: (ids: number[]) =>
    api.post('/secondary-inventory/batch-delete', { ids }),

  // 按CMD统一编号删除
  deleteByUnifiedNo: (cmdUnifiedNo: string) =>
    api.delete(`/secondary-inventory/by-unified-no/${encodeURIComponent(cmdUnifiedNo)}`),

  // 预览导入（只解析不写入）
  previewImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/secondary-inventory/preview-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 确认导入（实际写入数据库）
  confirmImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/secondary-inventory/confirm-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 导入Excel（兼容旧接口）
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/secondary-inventory/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 导出Excel
  export: (params: SecondaryInventoryListParams) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return `${api.defaults.baseURL}/secondary-inventory/export${queryString ? `?${queryString}` : ''}`;
  },

  // 下载模板
  getTemplateUrl: () => `${api.defaults.baseURL}/secondary-inventory/template`,

  // 获取统计信息
  getStats: () => api.get('/secondary-inventory/stats'),
};

export default secondaryInventoryService;
