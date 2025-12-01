import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Spin, message, Space, Tag } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { inventoryAPI } from '../../services/inventory.service';
import type { Inventory } from '../../types';
import dayjs from 'dayjs';

const InventoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response: any = await inventoryAPI.getById(Number(id));
      if (response.success) {
        setInventory(response.data);
      }
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!inventory) {
    return null;
  }

  const age = inventory.lastInboundDate
    ? dayjs().diff(dayjs(inventory.lastInboundDate), 'day')
    : null;

  return (
    <div>
      <Card
        title="库存详情"
        extra={
          <Space>
            <Button onClick={() => navigate('/inventory')}>返回</Button>
          </Space>
        }
      >
        <Descriptions bordered column={3}>
          <Descriptions.Item label="SKU">{inventory.sku}</Descriptions.Item>
          <Descriptions.Item label="货名">{inventory.productName}</Descriptions.Item>
          <Descriptions.Item label="型号">{inventory.productModel || '-'}</Descriptions.Item>

          <Descriptions.Item label="编号">{inventory.productCode || '-'}</Descriptions.Item>
          <Descriptions.Item label="唛头">{inventory.shippingMark || '-'}</Descriptions.Item>
          <Descriptions.Item label="PO号">{inventory.poNumber || '-'}</Descriptions.Item>

          <Descriptions.Item label="客户名称">{inventory.customerName}</Descriptions.Item>
          <Descriptions.Item label="库位">{inventory.locationCode}</Descriptions.Item>
          <Descriptions.Item label="包装形式">{inventory.packageType || '-'}</Descriptions.Item>

          <Descriptions.Item label="总数量">
            <Tag color="blue" style={{ fontSize: 16 }}>{inventory.quantity}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="可用数量">
            <Tag color="green" style={{ fontSize: 16 }}>{inventory.availableQuantity}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="锁定数量">
            <Tag color={inventory.lockedQuantity > 0 ? 'red' : 'default'} style={{ fontSize: 16 }}>
              {inventory.lockedQuantity}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="长(cm)">{inventory.length || '-'}</Descriptions.Item>
          <Descriptions.Item label="宽(cm)">{inventory.width || '-'}</Descriptions.Item>
          <Descriptions.Item label="高(cm)">{inventory.height || '-'}</Descriptions.Item>

          <Descriptions.Item label="单件毛重(kg)">{inventory.unitGrossWeight || '-'}</Descriptions.Item>
          <Descriptions.Item label="总毛重(kg)">{inventory.totalGrossWeight || '-'}</Descriptions.Item>
          <Descriptions.Item label="平方(m²)">{inventory.area || '-'}</Descriptions.Item>

          <Descriptions.Item label="体积(m³)">
            {inventory.volume ? inventory.volume.toFixed(4) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="库龄(天)">
            {age !== null ? <Tag color={age > 90 ? 'red' : age > 30 ? 'orange' : 'green'}>{age}</Tag> : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="最后入库日期">
            {inventory.lastInboundDate
              ? dayjs(inventory.lastInboundDate).format('YYYY-MM-DD HH:mm:ss')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="最后出库日期">
            {inventory.lastOutboundDate
              ? dayjs(inventory.lastOutboundDate).format('YYYY-MM-DD HH:mm:ss')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(inventory.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>

          <Descriptions.Item label="备注" span={3}>
            {inventory.remark || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default InventoryDetail;
