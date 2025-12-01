import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 生成单号
 * @param prefix 前缀 (WI=入库, WO=出库)
 * @returns 单号字符串
 */
export async function generateOrderNo(prefix: 'WI' | 'WO'): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const orderNoPrefix = `${prefix}${dateStr}`;

  // 添加重试机制，最多尝试10次
  for (let attempt = 0; attempt < 10; attempt++) {
    let maxOrderNo = '';

    if (prefix === 'WI') {
      const lastOrder = await prisma.inboundOrder.findFirst({
        where: {
          orderNo: {
            startsWith: orderNoPrefix
          }
        },
        orderBy: {
          orderNo: 'desc'
        },
        select: {
          orderNo: true
        }
      });
      maxOrderNo = lastOrder?.orderNo || '';
    } else {
      const lastOrder = await prisma.outboundOrder.findFirst({
        where: {
          orderNo: {
            startsWith: orderNoPrefix
          }
        },
        orderBy: {
          orderNo: 'desc'
        },
        select: {
          orderNo: true
        }
      });
      maxOrderNo = lastOrder?.orderNo || '';
    }

    let seq = 1;
    if (maxOrderNo && maxOrderNo.startsWith(orderNoPrefix)) {
      const lastSeq = parseInt(maxOrderNo.slice(-4));
      seq = lastSeq + 1;
    }

    const orderNo = `${orderNoPrefix}${String(seq).padStart(4, '0')}`;

    // 检查是否已存在
    const exists = prefix === 'WI'
      ? await prisma.inboundOrder.findUnique({ where: { orderNo } })
      : await prisma.outboundOrder.findUnique({ where: { orderNo } });

    if (!exists) {
      return orderNo;
    }

    // 如果存在，等待一小段时间后重试
    await new Promise(resolve => setTimeout(resolve, 10 * (attempt + 1)));
  }

  // 如果10次都失败，使用时间戳作为后缀
  const timestamp = Date.now().toString().slice(-4);
  return `${orderNoPrefix}${timestamp}`;
}

/**
 * 计算体积 (长*宽*高/1000000)
 */
export function calculateVolume(length?: number, width?: number, height?: number): number | undefined {
  if (length && width && height) {
    return (length * width * height) / 1000000;
  }
  return undefined;
}

/**
 * 计算总数量
 */
export function calculateTotalQuantity(items: Array<{ quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * 计算总体积
 */
export function calculateTotalVolume(items: Array<{ volume?: number }>): number | undefined {
  const volumes = items.filter(item => item.volume != null).map(item => item.volume!);
  if (volumes.length === 0) return undefined;
  return volumes.reduce((sum, volume) => sum + volume, 0);
}

/**
 * 计算总重量
 */
export function calculateTotalWeight(items: Array<{ totalGrossWeight?: number }>): number | undefined {
  const weights = items.filter(item => item.totalGrossWeight != null).map(item => item.totalGrossWeight!);
  if (weights.length === 0) return undefined;
  return weights.reduce((sum, weight) => sum + weight, 0);
}
