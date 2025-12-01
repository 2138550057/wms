import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// 所有客户路由都需要认证
router.use(authMiddleware);

// 创建客户
router.post('/', customerController.createCustomer);

// 获取客户列表
router.get('/', customerController.getCustomers);

// 搜索客户（用于下拉选择）
router.get('/search', customerController.searchCustomers);

// 获取客户详情
router.get('/:id', customerController.getCustomerById);

// 更新客户
router.put('/:id', customerController.updateCustomer);

// 删除客户
router.delete('/:id', customerController.deleteCustomer);

export default router;
