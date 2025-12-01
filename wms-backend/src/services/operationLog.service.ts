import prisma from '../utils/prisma';

export interface LogParams {
  operatorId?: number;
  operatorName: string;
  module: 'inbound' | 'outbound' | 'inventory' | 'customer' | 'location' | 'user' | 'system_setting' | 'business_type';
  action: 'create' | 'update' | 'delete' | 'confirm' | 'reverse' | 'import' | 'export';
  targetId?: number | null;
  targetNo?: string | null;
  description: string;
  detail?: any;
  source?: string;      // 操作来源: pc/mobile/h5/miniprogram
  ipAddress?: string;
  userAgent?: string;   // 用户代理
}

const moduleNameMap: Record<string, string> = {
  inbound: '入库管理',
  outbound: '出库管理',
  inventory: '库存管理',
  customer: '客户管理',
  location: '库位管理',
  user: '用户管理',
  system_setting: '系统设置',
  business_type: '业务类型',
};

const actionNameMap: Record<string, string> = {
  create: '新建',
  update: '编辑',
  delete: '删除',
  confirm: '确认',
  reverse: '反审核',
  import: '导入',
  export: '导出',
};

export async function createOperationLog(params: LogParams) {
  try {
    await prisma.operationLog.create({
      data: {
        operatorId: params.operatorId,
        operatorName: params.operatorName,
        module: params.module,
        action: params.action,
        targetId: params.targetId,
        targetNo: params.targetNo,
        description: params.description,
        detail: params.detail ? JSON.stringify(params.detail) : null,
        source: params.source,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
}

export function getModuleName(module: string): string {
  return moduleNameMap[module] || module;
}

export function getActionName(action: string): string {
  return actionNameMap[action] || action;
}
