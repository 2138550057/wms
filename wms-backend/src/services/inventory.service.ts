import prisma from '../utils/prisma';
import { InboundOrderItemData, OutboundOrderItemData } from '../types';

/**
 * 更新库存 - 入库
 */
export async function updateInventoryForInbound(
  item: InboundOrderItemData & { customerId: number; customerName: string }
) {
  const sku = item.sku || item.productName;
  const locationCode = item.locationCode || 'DEFAULT';

  // 查找现有库存
  const existing = await prisma.inventory.findFirst({
    where: {
      sku,
      customerId: item.customerId,
      locationCode,
    },
  });

  if (existing) {
    // 更新现有库存
    await prisma.inventory.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + item.quantity,
        availableQuantity: existing.availableQuantity + item.quantity,
        internalCode: item.internalCode || existing.internalCode,
        lastInboundDate: new Date(),
      },
    });
  } else {
    // 创建新库存记录
    await prisma.inventory.create({
      data: {
        sku,
        internalCode: item.internalCode,
        productName: item.productName,
        productModel: item.productModel,
        productCode: item.productCode,
        customerId: item.customerId,
        customerName: item.customerName,
        locationCode,
        quantity: item.quantity,
        availableQuantity: item.quantity,
        lockedQuantity: 0,
        length: item.length,
        width: item.width,
        height: item.height,
        unitGrossWeight: item.unitGrossWeight,
        totalGrossWeight: item.totalGrossWeight,
        area: item.area,
        lastInboundDate: new Date(),
      },
    });
  }
}

/**
 * 更新库存 - 出库
 */
export async function updateInventoryForOutbound(
  item: OutboundOrderItemData & { customerId: number; customerName: string }
) {
  const sku = item.sku || item.productName;
  const locationCode = item.locationCode || 'DEFAULT';

  // 查找现有库存
  const existing = await prisma.inventory.findFirst({
    where: {
      sku,
      customerId: item.customerId,
      locationCode,
    },
  });

  if (!existing) {
    throw new Error(`商品 ${item.productName} 不存在库存记录`);
  }

  if (existing.availableQuantity < item.quantity) {
    throw new Error(`商品 ${item.productName} 库存不足，当前可用: ${existing.availableQuantity}`);
  }

  // 更新库存
  await prisma.inventory.update({
    where: { id: existing.id },
    data: {
      quantity: existing.quantity - item.quantity,
      availableQuantity: existing.availableQuantity - item.quantity,
      lastOutboundDate: new Date(),
    },
  });
}

/**
 * 检查库存是否充足
 */
export async function checkInventoryAvailable(
  customerId: number,
  sku: string,
  locationCode: string | undefined,
  quantity: number
): Promise<{ sufficient: boolean; available: number }> {
  const loc = locationCode || 'DEFAULT';

  const inventory = await prisma.inventory.findFirst({
    where: {
      sku,
      customerId,
      locationCode: loc,
    },
  });

  if (!inventory) {
    return { sufficient: false, available: 0 };
  }

  return {
    sufficient: inventory.availableQuantity >= quantity,
    available: inventory.availableQuantity,
  };
}
