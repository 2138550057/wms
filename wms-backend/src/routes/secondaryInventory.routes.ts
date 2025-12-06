import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as controller from '../controllers/secondaryInventory.controller';
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
    cb(null, `import-${uniqueSuffix}${path.extname(file.originalname)}`);
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

// 所有路由需要认证
router.use(authMiddleware);

// 获取统计信息
router.get('/stats', controller.getStats);

// 下载导入模板
router.get('/template', controller.downloadTemplate);

// 导出Excel
router.get('/export', controller.exportExcel);

// 获取列表
router.get('/', controller.list);

// 根据CMD统一编号获取
router.get('/by-unified-no/:cmdUnifiedNo', controller.getByUnifiedNo);

// 获取单条记录
router.get('/:id', controller.getById);

// 创建记录
router.post('/', controller.create);

// 预览导入（只解析不写入）
router.post('/preview-import', upload.single('file'), controller.previewImport);

// 确认导入（实际写入数据库）
router.post('/confirm-import', upload.single('file'), controller.confirmImport);

// 导入Excel（兼容旧接口）
router.post('/import', upload.single('file'), controller.importExcel);

// 批量删除
router.post('/batch-delete', controller.batchRemove);

// 更新记录
router.put('/:id', controller.update);

// 删除记录
router.delete('/:id', controller.remove);

// 按CMD统一编号删除
router.delete('/by-unified-no/:cmdUnifiedNo', controller.removeByUnifiedNo);

export default router;
