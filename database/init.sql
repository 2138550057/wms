-- ============================================
-- WMS 仓库管理系统 - 数据库初始化脚本
-- 版本: v2.1
-- 数据库: MySQL 5.7+
-- 日期: 2025-11-28
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `wms` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `wms`;

-- ============================================
-- 1. 用户表
-- ============================================
DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL COMMENT '密码（bcrypt加密）',
  `realName` VARCHAR(191) NULL COMMENT '真实姓名',
  `role` VARCHAR(191) NOT NULL DEFAULT 'operator' COMMENT '角色：admin/operator',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `User_username_key` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 客户表
-- ============================================
DROP TABLE IF EXISTS `Customer`;
CREATE TABLE `Customer` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(191) NOT NULL COMMENT '客户编码',
  `name` VARCHAR(191) NOT NULL COMMENT '客户名称',
  `contact` VARCHAR(191) NULL COMMENT '联系人',
  `phone` VARCHAR(191) NULL COMMENT '联系电话',
  `address` VARCHAR(191) NULL COMMENT '地址',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Customer_code_key` (`code`),
  INDEX `Customer_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户表';

-- ============================================
-- 3. 库位表
-- ============================================
DROP TABLE IF EXISTS `Location`;
CREATE TABLE `Location` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(191) NOT NULL COMMENT '库位编码',
  `name` VARCHAR(191) NOT NULL COMMENT '库位名称',
  `warehouse` VARCHAR(191) NULL COMMENT '仓库',
  `zone` VARCHAR(191) NULL COMMENT '区域',
  `aisle` VARCHAR(191) NULL COMMENT '巷道',
  `shelf` VARCHAR(191) NULL COMMENT '货架',
  `layer` VARCHAR(191) NULL COMMENT '层',
  `position` VARCHAR(191) NULL COMMENT '位',
  `status` VARCHAR(191) NOT NULL DEFAULT 'active' COMMENT '状态：active/disabled',
  `remark` VARCHAR(191) NULL COMMENT '备注',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Location_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库位表';

-- ============================================
-- 4. 入库单主表
-- ============================================
DROP TABLE IF EXISTS `InboundOrder`;
CREATE TABLE `InboundOrder` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `orderNo` VARCHAR(191) NOT NULL COMMENT '入库单号：WI+日期+序号',
  `warehouseEntryNo` VARCHAR(191) NULL COMMENT '进仓编号',
  `customerId` INT NOT NULL COMMENT '客户ID',
  `customerName` VARCHAR(191) NOT NULL COMMENT '客户名称',
  `contactPerson` VARCHAR(191) NULL COMMENT '联系人',
  `contactPhone` VARCHAR(191) NULL COMMENT '联系电话',
  `deliveryCompany` VARCHAR(191) NULL COMMENT '送货单位',
  `vehicleNumber` VARCHAR(191) NULL COMMENT '车牌号',
  `driverName` VARCHAR(191) NULL COMMENT '司机姓名',
  `actualQuantity` INT NULL COMMENT '实际到货数量',
  `businessType` VARCHAR(191) NOT NULL DEFAULT 'normal' COMMENT '业务类型：normal/return/transfer',
  `inboundDate` DATETIME(3) NOT NULL COMMENT '入库日期',
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending' COMMENT '状态：pending/completed',
  `totalQuantity` INT NOT NULL DEFAULT 0 COMMENT '总件数',
  `totalVolume` DOUBLE NULL COMMENT '总体积(m³)',
  `totalGrossWeight` DOUBLE NULL COMMENT '总重量(kg)',
  `remark` TEXT NULL COMMENT '备注',
  `createdBy` INT NULL COMMENT '创建人ID',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `InboundOrder_orderNo_key` (`orderNo`),
  INDEX `InboundOrder_customerId_idx` (`customerId`),
  INDEX `InboundOrder_status_idx` (`status`),
  INDEX `InboundOrder_inboundDate_idx` (`inboundDate`),
  INDEX `InboundOrder_createdAt_idx` (`createdAt`),
  CONSTRAINT `InboundOrder_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `InboundOrder_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='入库单主表';

-- ============================================
-- 5. 入库单明细表
-- ============================================
DROP TABLE IF EXISTS `InboundOrderItem`;
CREATE TABLE `InboundOrderItem` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `orderId` INT NOT NULL COMMENT '入库单ID',
  `productName` VARCHAR(191) NOT NULL COMMENT '货名',
  `productModel` VARCHAR(191) NULL COMMENT '型号',
  `sku` VARCHAR(191) NULL COMMENT 'CMD编号',
  `internalCode` VARCHAR(191) NULL COMMENT '内部货号',
  `productCode` VARCHAR(191) NULL COMMENT 'CMD料号',
  `shippingMark` VARCHAR(191) NULL COMMENT '唛头',
  `poNumber` VARCHAR(191) NULL COMMENT 'PO号',
  `locationCode` VARCHAR(191) NULL COMMENT '库位',
  `packageType` VARCHAR(191) NULL COMMENT '包装形式',
  `quantity` INT NOT NULL COMMENT '件数',
  `length` DOUBLE NULL COMMENT '长(cm)',
  `width` DOUBLE NULL COMMENT '宽(cm)',
  `height` DOUBLE NULL COMMENT '高(cm)',
  `unitGrossWeight` DOUBLE NULL COMMENT '单件毛重(kg)',
  `totalGrossWeight` DOUBLE NULL COMMENT '总毛重(kg)',
  `area` DOUBLE NULL COMMENT '平方(m²)',
  `volume` DOUBLE NULL COMMENT '体积(m³)',
  `remark` TEXT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  INDEX `InboundOrderItem_orderId_idx` (`orderId`),
  CONSTRAINT `InboundOrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `InboundOrder` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='入库单明细表';

-- ============================================
-- 6. 出库单主表
-- ============================================
DROP TABLE IF EXISTS `OutboundOrder`;
CREATE TABLE `OutboundOrder` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `orderNo` VARCHAR(191) NOT NULL COMMENT '出库单号：WO+日期+序号',
  `customerId` INT NOT NULL COMMENT '客户ID',
  `customerName` VARCHAR(191) NOT NULL COMMENT '客户名称',
  `contactPerson` VARCHAR(191) NULL COMMENT '联系人',
  `contactPhone` VARCHAR(191) NULL COMMENT '联系电话',
  `receivingCompany` VARCHAR(191) NULL COMMENT '收货单位',
  `receivingAddress` TEXT NULL COMMENT '收货地址',
  `vehicleNumber` VARCHAR(191) NULL COMMENT '车牌号',
  `driverName` VARCHAR(191) NULL COMMENT '司机姓名',
  `businessType` VARCHAR(191) NOT NULL DEFAULT 'sales' COMMENT '业务类型：sales/return/transfer',
  `outboundDate` DATETIME(3) NOT NULL COMMENT '出库日期',
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending' COMMENT '状态：pending/completed',
  `totalQuantity` INT NOT NULL DEFAULT 0 COMMENT '总件数',
  `totalVolume` DOUBLE NULL COMMENT '总体积(m³)',
  `totalGrossWeight` DOUBLE NULL COMMENT '总重量(kg)',
  `remark` TEXT NULL COMMENT '备注',
  `createdBy` INT NULL COMMENT '创建人ID',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `OutboundOrder_orderNo_key` (`orderNo`),
  INDEX `OutboundOrder_customerId_idx` (`customerId`),
  INDEX `OutboundOrder_status_idx` (`status`),
  INDEX `OutboundOrder_outboundDate_idx` (`outboundDate`),
  INDEX `OutboundOrder_createdAt_idx` (`createdAt`),
  CONSTRAINT `OutboundOrder_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `OutboundOrder_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='出库单主表';

-- ============================================
-- 7. 出库单明细表
-- ============================================
DROP TABLE IF EXISTS `OutboundOrderItem`;
CREATE TABLE `OutboundOrderItem` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `orderId` INT NOT NULL COMMENT '出库单ID',
  `warehouseEntryNo` VARCHAR(191) NULL COMMENT '进仓编号',
  `productName` VARCHAR(191) NOT NULL COMMENT '货名',
  `productModel` VARCHAR(191) NULL COMMENT '型号',
  `sku` VARCHAR(191) NULL COMMENT 'CMD编号',
  `internalCode` VARCHAR(191) NULL COMMENT '内部货号',
  `productCode` VARCHAR(191) NULL COMMENT 'CMD料号',
  `shippingMark` VARCHAR(191) NULL COMMENT '唛头',
  `poNumber` VARCHAR(191) NULL COMMENT 'PO号',
  `locationCode` VARCHAR(191) NULL COMMENT '库位',
  `packageType` VARCHAR(191) NULL COMMENT '包装形式',
  `quantity` INT NOT NULL COMMENT '件数',
  `length` DOUBLE NULL COMMENT '长(cm)',
  `width` DOUBLE NULL COMMENT '宽(cm)',
  `height` DOUBLE NULL COMMENT '高(cm)',
  `unitGrossWeight` DOUBLE NULL COMMENT '单件毛重(kg)',
  `totalGrossWeight` DOUBLE NULL COMMENT '总毛重(kg)',
  `area` DOUBLE NULL COMMENT '平方(m²)',
  `volume` DOUBLE NULL COMMENT '体积(m³)',
  `remark` TEXT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  INDEX `OutboundOrderItem_orderId_idx` (`orderId`),
  INDEX `OutboundOrderItem_warehouseEntryNo_idx` (`warehouseEntryNo`),
  CONSTRAINT `OutboundOrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `OutboundOrder` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='出库单明细表';

-- ============================================
-- 8. 库存表
-- ============================================
DROP TABLE IF EXISTS `Inventory`;
CREATE TABLE `Inventory` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sku` VARCHAR(191) NOT NULL COMMENT 'CMD编号',
  `productName` VARCHAR(191) NOT NULL COMMENT '货名',
  `productModel` VARCHAR(191) NULL COMMENT '型号',
  `internalCode` VARCHAR(191) NULL COMMENT '内部货号',
  `productCode` VARCHAR(191) NULL COMMENT 'CMD料号',
  `customerId` INT NOT NULL COMMENT '客户ID',
  `customerName` VARCHAR(191) NOT NULL COMMENT '客户名称',
  `locationCode` VARCHAR(191) NULL COMMENT '库位',
  `quantity` INT NOT NULL DEFAULT 0 COMMENT '总数量',
  `availableQuantity` INT NOT NULL DEFAULT 0 COMMENT '可用数量',
  `lockedQuantity` INT NOT NULL DEFAULT 0 COMMENT '锁定数量',
  `length` DOUBLE NULL COMMENT '长(cm)',
  `width` DOUBLE NULL COMMENT '宽(cm)',
  `height` DOUBLE NULL COMMENT '高(cm)',
  `unitGrossWeight` DOUBLE NULL COMMENT '单件毛重(kg)',
  `totalGrossWeight` DOUBLE NULL COMMENT '总毛重(kg)',
  `area` DOUBLE NULL COMMENT '平方(m²)',
  `volume` DOUBLE NULL COMMENT '体积(m³)',
  `warehouseEntryNo` VARCHAR(191) NULL COMMENT '进仓编号',
  `shippingMark` VARCHAR(191) NULL COMMENT '唛头',
  `poNumber` VARCHAR(191) NULL COMMENT 'PO号',
  `packageType` VARCHAR(191) NULL COMMENT '包装形式',
  `lastInboundDate` DATETIME(3) NULL COMMENT '最后入库时间',
  `lastOutboundDate` DATETIME(3) NULL COMMENT '最后出库时间',
  `remark` TEXT NULL COMMENT '备注',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Inventory_customerId_sku_locationCode_key` (`customerId`, `sku`, `locationCode`),
  INDEX `Inventory_customerId_idx` (`customerId`),
  INDEX `Inventory_sku_idx` (`sku`),
  INDEX `Inventory_warehouseEntryNo_idx` (`warehouseEntryNo`),
  INDEX `Inventory_lastInboundDate_idx` (`lastInboundDate`),
  CONSTRAINT `Inventory_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存表';

-- ============================================
-- 9. 附件表
-- ============================================
DROP TABLE IF EXISTS `Attachment`;
CREATE TABLE `Attachment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fileName` VARCHAR(191) NOT NULL COMMENT '文件名',
  `fileSize` INT NOT NULL COMMENT '文件大小(bytes)',
  `mimeType` VARCHAR(191) NOT NULL COMMENT 'MIME类型',
  `storageType` VARCHAR(191) NOT NULL DEFAULT 'local' COMMENT '存储类型：local/s3/qiniu/aliyun/tencent',
  `storagePath` VARCHAR(191) NOT NULL COMMENT '存储路径',
  `storageUrl` VARCHAR(500) NULL COMMENT '访问URL',
  `entityType` VARCHAR(191) NOT NULL COMMENT '关联实体类型：inbound/outbound/inventory/customer',
  `entityId` INT NOT NULL COMMENT '关联实体ID',
  `category` VARCHAR(191) NOT NULL DEFAULT 'default' COMMENT '分类：default/image/document/contract/other',
  `uploadedBy` INT NULL COMMENT '上传人ID',
  `uploadedByName` VARCHAR(191) NULL COMMENT '上传人姓名',
  `isShared` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已分享',
  `shareToken` VARCHAR(191) NULL COMMENT '分享令牌',
  `shareExpireAt` DATETIME(3) NULL COMMENT '分享过期时间',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Attachment_shareToken_key` (`shareToken`),
  INDEX `Attachment_entityType_entityId_idx` (`entityType`, `entityId`),
  INDEX `Attachment_category_idx` (`category`),
  INDEX `Attachment_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='附件表';

-- ============================================
-- 10. 系统设置表
-- ============================================
DROP TABLE IF EXISTS `SystemSetting`;
CREATE TABLE `SystemSetting` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `settingKey` VARCHAR(191) NOT NULL COMMENT '配置键',
  `settingValue` TEXT NOT NULL COMMENT '配置值(JSON格式)',
  `category` VARCHAR(191) NOT NULL DEFAULT 'basic' COMMENT '分类：basic/business/storage/notification',
  `description` VARCHAR(500) NULL COMMENT '说明',
  `isPublic` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否公开(前端可访问)',
  `updatedBy` INT NULL COMMENT '更新人ID',
  `updatedByName` VARCHAR(191) NULL COMMENT '更新人姓名',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `SystemSetting_settingKey_key` (`settingKey`),
  INDEX `SystemSetting_category_idx` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统设置表';

-- ============================================
-- 11. 业务类型表
-- ============================================
DROP TABLE IF EXISTS `BusinessType`;
CREATE TABLE `BusinessType` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(191) NOT NULL COMMENT '类型代码',
  `name` VARCHAR(191) NOT NULL COMMENT '类型名称',
  `category` VARCHAR(191) NOT NULL COMMENT '业务分类：inbound/outbound',
  `color` VARCHAR(191) NULL COMMENT '显示颜色',
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否启用',
  `sortOrder` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `BusinessType_code_key` (`code`),
  INDEX `BusinessType_category_idx` (`category`),
  INDEX `BusinessType_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='业务类型表';

-- ============================================
-- 12. 操作日志表
-- ============================================
DROP TABLE IF EXISTS `OperationLog`;
CREATE TABLE `OperationLog` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `operatorId` INT NOT NULL COMMENT '操作人ID',
  `operatorName` VARCHAR(191) NOT NULL COMMENT '操作人姓名',
  `module` VARCHAR(191) NOT NULL COMMENT '模块：inbound/outbound/inventory/customer/location',
  `action` VARCHAR(191) NOT NULL COMMENT '动作：create/update/delete/confirm/reverse/import/export',
  `targetId` INT NULL COMMENT '目标记录ID',
  `targetNo` VARCHAR(191) NULL COMMENT '目标单号',
  `description` TEXT NULL COMMENT '操作描述',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `OperationLog_operatorId_idx` (`operatorId`),
  INDEX `OperationLog_module_idx` (`module`),
  INDEX `OperationLog_action_idx` (`action`),
  INDEX `OperationLog_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ============================================
-- 初始数据插入
-- ============================================

-- 插入默认管理员用户 (密码: admin123)
-- 密码使用 bcrypt 加密，轮数为 10
INSERT INTO `User` (`username`, `password`, `realName`, `role`, `createdAt`, `updatedAt`) VALUES
('admin', '$2b$10$rY8kQm7lN5LJZxPvKvZ8G.YDhC8pVqz.Wf7wR5vN1gX2hL9mK3pQi', '系统管理员', 'admin', NOW(), NOW());

-- 插入系统设置 - 系统域名
INSERT INTO `SystemSetting` (`settingKey`, `settingValue`, `category`, `description`, `isPublic`, `createdAt`, `updatedAt`) VALUES
('system.domain', '"https://wmsapi.fexxo.cn"', 'basic', '系统API域名', TRUE, NOW(), NOW()),
('system.name', '"WMS仓库管理系统"', 'basic', '系统名称', TRUE, NOW(), NOW()),
('storage.default', '"local"', 'storage', '默认存储类型', FALSE, NOW(), NOW());

-- 插入默认业务类型 - 入库
INSERT INTO `BusinessType` (`code`, `name`, `category`, `color`, `isActive`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
('normal', '普通入库', 'inbound', 'blue', TRUE, 1, NOW(), NOW()),
('return', '退货入库', 'inbound', 'orange', TRUE, 2, NOW(), NOW()),
('transfer', '调拨入库', 'inbound', 'green', TRUE, 3, NOW(), NOW());

-- 插入默认业务类型 - 出库
INSERT INTO `BusinessType` (`code`, `name`, `category`, `color`, `isActive`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
('sales', '销售出库', 'outbound', 'blue', TRUE, 1, NOW(), NOW()),
('return_outbound', '退货出库', 'outbound', 'orange', TRUE, 2, NOW(), NOW()),
('transfer_outbound', '调拨出库', 'outbound', 'green', TRUE, 3, NOW(), NOW());

-- 插入示例客户数据（可选）
INSERT INTO `Customer` (`code`, `name`, `contact`, `phone`, `address`, `createdAt`, `updatedAt`) VALUES
('C001', '示例客户A', '张三', '13800138000', '广东省深圳市南山区', NOW(), NOW()),
('C002', '示例客户B', '李四', '13900139000', '广东省广州市天河区', NOW(), NOW());

-- 插入示例库位数据（可选）
INSERT INTO `Location` (`code`, `name`, `warehouse`, `zone`, `status`, `createdAt`, `updatedAt`) VALUES
('A01-01-01', 'A区1号货架1层1位', 'A仓', 'A01区', 'active', NOW(), NOW()),
('A01-01-02', 'A区1号货架1层2位', 'A仓', 'A01区', 'active', NOW(), NOW()),
('B01-01-01', 'B区1号货架1层1位', 'B仓', 'B01区', 'active', NOW(), NOW());

-- ============================================
-- 创建 Prisma 迁移历史表（如果使用 Prisma Migrate）
-- ============================================
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` VARCHAR(36) NOT NULL,
  `checksum` VARCHAR(64) NOT NULL,
  `finished_at` DATETIME(3) NULL,
  `migration_name` VARCHAR(255) NOT NULL,
  `logs` TEXT NULL,
  `rolled_back_at` DATETIME(3) NULL,
  `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 完成
-- ============================================
SELECT 'WMS数据库初始化完成！' AS message;
SELECT '默认管理员账号: admin' AS username;
SELECT '默认密码: admin123' AS password;
SELECT '请及时修改默认密码！' AS warning;
