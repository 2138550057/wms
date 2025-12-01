import { Response } from 'express';
import multer from 'multer';
import { attachmentService } from '../services/attachment.service';
import { StorageType } from '../services/storage';
import { AuthRequest } from '../middlewares/auth';

// 配置multer使用内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB限制
  },
});

// 导出multer中间件
export const uploadMiddleware = upload;

export const attachmentController = {
  /**
   * 上传单个文件
   */
  uploadSingle: async (req: AuthRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const { entityType, entityId, storageType, category } = req.body;

      if (!entityType || !entityId) {
        return res.status(400).json({
          success: false,
          message: 'entityType and entityId are required',
        });
      }

      const attachment = await attachmentService.create({
        file: {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer,
        },
        entityType,
        entityId: parseInt(entityId),
        uploadedBy: req.userId,
        uploadedByName: req.username,
        storageType: storageType as StorageType,
        category: category || 'default',
      });

      res.json({
        success: true,
        data: attachment,
        message: 'File uploaded successfully',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Upload failed',
      });
    }
  },

  /**
   * 上传多个文件
   */
  uploadMultiple: async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
      }

      const { entityType, entityId, storageType } = req.body;

      if (!entityType || !entityId) {
        return res.status(400).json({
          success: false,
          message: 'entityType and entityId are required',
        });
      }

      const uploadFiles = files.map(file => ({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      }));

      const attachments = await attachmentService.createBatch(
        uploadFiles,
        entityType,
        parseInt(entityId),
        req.userId,
        req.username,
        storageType as StorageType
      );

      res.json({
        success: true,
        data: attachments,
        message: `${attachments.length} files uploaded successfully`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Upload failed',
      });
    }
  },

  /**
   * 获取附件列表
   */
  list: async (req: AuthRequest, res: Response) => {
    try {
      const { entityType, entityId, page, size } = req.query;

      const result = await attachmentService.list({
        entityType: entityType as string,
        entityId: entityId ? parseInt(entityId as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        size: size ? parseInt(size as string) : 20,
      });

      res.json({
        success: true,
        ...result,
        message: 'Query successful',
      });
    } catch (error: any) {
      console.error('Query error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Query failed',
      });
    }
  },

  /**
   * 获取附件详情
   */
  getById: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const attachment = await attachmentService.getById(parseInt(id));

      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found',
        });
      }

      res.json({
        success: true,
        data: attachment,
        message: 'Query successful',
      });
    } catch (error: any) {
      console.error('Query error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Query failed',
      });
    }
  },

  /**
   * 根据实体获取附件
   */
  getByEntity: async (req: AuthRequest, res: Response) => {
    try {
      const { entityType, entityId } = req.params;
      const attachments = await attachmentService.getByEntity(
        entityType,
        parseInt(entityId)
      );

      res.json({
        success: true,
        data: attachments,
        message: 'Query successful',
      });
    } catch (error: any) {
      console.error('Query error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Query failed',
      });
    }
  },

  /**
   * 删除附件
   */
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await attachmentService.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Attachment deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Delete failed',
      });
    }
  },

  /**
   * 获取访问URL
   */
  getUrl: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { expiresIn } = req.query;

      const url = await attachmentService.getAccessUrl(
        parseInt(id),
        expiresIn ? parseInt(expiresIn as string) : undefined
      );

      res.json({
        success: true,
        data: { url },
        message: 'URL generated successfully',
      });
    } catch (error: any) {
      console.error('Get URL error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Get URL failed',
      });
    }
  },

  /**
   * 生成分享链接
   */
  generateShareLink: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { expiresInDays } = req.body;

      const shareData = await attachmentService.generateShareLink(
        parseInt(id),
        expiresInDays || 7
      );

      res.json({
        success: true,
        data: shareData,
        message: 'Share link generated successfully',
      });
    } catch (error: any) {
      console.error('Generate share link error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Generate share link failed',
      });
    }
  },

  /**
   * 通过分享链接访问文件
   */
  accessShared: async (req: AuthRequest, res: Response) => {
    try {
      const { token } = req.params;

      const attachment = await attachmentService.getByShareToken(token);

      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'Share link not found or expired',
        });
      }

      // 获取文件访问URL
      const url = await attachmentService.getAccessUrl(attachment.id);

      res.json({
        success: true,
        data: {
          ...attachment,
          url,
        },
        message: 'Access granted',
      });
    } catch (error: any) {
      console.error('Access shared error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Access failed',
      });
    }
  },

  /**
   * 批量删除附件
   */
  deleteBatch: async (req: AuthRequest, res: Response) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ids must be a non-empty array',
        });
      }

      await attachmentService.deleteBatch(ids);

      res.json({
        success: true,
        message: `${ids.length} attachments deleted successfully`,
      });
    } catch (error: any) {
      console.error('Batch delete error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Batch delete failed',
      });
    }
  },

  /**
   * 更新附件分类
   */
  updateCategory: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { category } = req.body;

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'category is required',
        });
      }

      const attachment = await attachmentService.updateCategory(
        parseInt(id),
        category
      );

      res.json({
        success: true,
        data: attachment,
        message: 'Category updated successfully',
      });
    } catch (error: any) {
      console.error('Update category error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Update category failed',
      });
    }
  },

  /**
   * 下载文件（支持批量打包）
   */
  download: async (req: AuthRequest, res: Response) => {
    try {
      const { ids } = req.query;

      if (!ids) {
        return res.status(400).json({
          success: false,
          message: 'ids parameter is required',
        });
      }

      const idArray = (ids as string).split(',').map(id => parseInt(id));

      if (idArray.length === 1) {
        // 单文件下载
        const attachment = await attachmentService.getById(idArray[0]);
        if (!attachment) {
          return res.status(404).json({
            success: false,
            message: 'Attachment not found',
          });
        }

        const url = await attachmentService.getAccessUrl(attachment.id);
        res.json({
          success: true,
          data: { url, fileName: attachment.fileName },
          message: 'Download link generated',
        });
      } else {
        // 批量下载 - 返回压缩包URL
        const zipUrl = await attachmentService.createZipArchive(idArray);
        res.json({
          success: true,
          data: { url: zipUrl, fileName: `attachments_${Date.now()}.zip` },
          message: 'Zip archive created',
        });
      }
    } catch (error: any) {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Download failed',
      });
    }
  },
};
