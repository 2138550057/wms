import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { attachmentController, uploadMiddleware } from '../controllers/attachment.controller';

const router = Router();

// 通过分享链接访问（无需认证的公开路由，必须放在authMiddleware之前）
router.get('/shared/:token', attachmentController.accessShared);

// 所有其他路由都需要认证
router.use(authMiddleware);

// 上传单个文件
router.post('/upload', uploadMiddleware.single('file'), attachmentController.uploadSingle);

// 上传多个文件
router.post('/upload-multiple', uploadMiddleware.array('files', 10), attachmentController.uploadMultiple);

// 获取附件列表
router.get('/', attachmentController.list);

// 根据实体获取附件
router.get('/entity/:entityType/:entityId', attachmentController.getByEntity);

// 获取附件详情
router.get('/:id', attachmentController.getById);

// 获取访问URL
router.get('/:id/url', attachmentController.getUrl);

// 生成分享链接
router.post('/:id/share', attachmentController.generateShareLink);

// 下载文件（支持批量打包）
router.get('/download', attachmentController.download);

// 更新附件分类
router.patch('/:id/category', attachmentController.updateCategory);

// 批量删除附件
router.post('/batch-delete', attachmentController.deleteBatch);

// 删除附件
router.delete('/:id', attachmentController.delete);

export default router;
