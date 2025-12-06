import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as inventoryController from '../controllers/inventory.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// 配置文件上传
const uploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `location-import-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel文件(.xlsx, .xls)'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// 所有库存路由都需要认证
router.use(authMiddleware);

// 库位导入模板下载
router.get('/location/template', inventoryController.downloadLocationTemplate);

// 预览库位导入
router.post('/location/preview-import', upload.single('file'), inventoryController.previewLocationImport);

// 确认库位导入
router.post('/location/confirm-import', upload.single('file'), inventoryController.confirmLocationImport);

// 查询库存列表
router.get('/', inventoryController.getInventoryList);

// 获取库存详情
router.get('/:id', inventoryController.getInventoryById);

// 库存调整
router.post('/adjust', inventoryController.adjustInventory);

// 冻结库存
router.post('/lock', inventoryController.lockInventory);

// 解冻库存
router.post('/unlock', inventoryController.unlockInventory);

// 获取客户库存汇总
router.get('/summary/customer/:customerId', inventoryController.getInventorySummaryByCustomer);

// 批量删除库存记录
router.post('/batch-delete', inventoryController.batchDeleteInventory);

// 更新库存记录
router.put('/:id', inventoryController.updateInventory);

// 删除库存记录
router.delete('/:id', inventoryController.deleteInventory);

export default router;
