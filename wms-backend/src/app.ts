import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middlewares/errorHandler';
import { StorageFactory } from './services/storage';
import { tempFileCleanup } from './services/tempFileCleanup.service';

// 导入路由
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import inboundRoutes from './routes/inbound.routes';
import outboundRoutes from './routes/outbound.routes';
import inventoryRoutes from './routes/inventory.routes';
import locationRoutes from './routes/location.routes';
import userRoutes from './routes/user.routes';
import dashboardRoutes from './routes/dashboard.routes';
import logRoutes from './routes/log.routes';
import attachmentRoutes from './routes/attachment.routes';
import settingsRoutes from './routes/settings.routes';
import todoRoutes from './routes/todo.routes';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 初始化存储配置
const uploadDir = path.join(__dirname, '../uploads');
const baseUrl = process.env.STORAGE_BASE_URL || `http://localhost:${PORT}/uploads`;

StorageFactory.init(
  {
    local: {
      uploadDir,
      baseUrl,
    },
    // S3配置（如果需要，从环境变量读取）
    s3: process.env.S3_BUCKET
      ? {
          region: process.env.S3_REGION || 'us-east-1',
          bucket: process.env.S3_BUCKET,
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
          endpoint: process.env.S3_ENDPOINT,
          forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        }
      : undefined,
    // 七牛云配置（如果需要，从环境变量读取）
    qiniu: process.env.QINIU_BUCKET
      ? {
          accessKey: process.env.QINIU_ACCESS_KEY || '',
          secretKey: process.env.QINIU_SECRET_KEY || '',
          bucket: process.env.QINIU_BUCKET,
          domain: process.env.QINIU_DOMAIN || '',
          zone: process.env.QINIU_ZONE,
        }
      : undefined,
  },
  (process.env.STORAGE_TYPE as any) || 'local'
);

// CORS 配置 - 允许多个来源（包括移动端）
const allowedOrigins = [
  'https://wms.fexxo.cn',          // PC端
  'https://m.wms.fexxo.cn',        // 移动端H5
  'https://servicewechat.com',     // 微信小程序
  'http://localhost:3000',         // 本地开发 - PC
  'http://localhost:5173',         // 本地开发 - Vite
  'http://localhost:8080',         // 本地开发 - 移动端
];

app.use(
  cors({
    origin: (origin, callback) => {
      // 允许无origin的请求（如移动APP）
      if (!origin) {
        return callback(null, true);
      }
      // 检查是否在允许列表中
      if (allowedOrigins.some(o => origin.startsWith(o))) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(null, true); // 暂时允许所有来源，生产环境应该严格限制
      }
    },
    credentials: true,
  })
);

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（用于本地存储的文件访问）
app.use('/uploads', express.static(uploadDir));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'WMS Backend is running' });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inbound', inboundRoutes);
app.use('/api/outbound', outboundRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/system', settingsRoutes);
app.use('/api/todo', todoRoutes);

// 错误处理中间件
app.use(errorHandler);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
    ╔═══════════════════════════════════════╗
    ║   WMS Backend Server is running      ║
    ║   Port: ${PORT}                        ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}            ║
    ╚═══════════════════════════════════════╝
  `);

  // 启动临时文件清理服务
  tempFileCleanup.start();
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  tempFileCleanup.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  tempFileCleanup.stop();
  process.exit(0);
});

export default app;
