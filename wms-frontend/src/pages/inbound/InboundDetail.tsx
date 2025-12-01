import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Table, Button, Spin, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { inboundAPI } from '../../services/inbound.service';
import type { InboundOrder } from '../../types';
import dayjs from 'dayjs';
import AttachmentManager from '@/components/AttachmentManager';

const InboundDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<InboundOrder | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response: any = await inboundAPI.getById(Number(id));
      if (response.success) {
        setOrder(response.data);
      }
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '货名',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '型号',
      dataIndex: 'productModel',
      key: 'productModel',
    },
    {
      title: 'CMD编号',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: '内部货号',
      dataIndex: 'internalCode',
      key: 'internalCode',
    },
    {
      title: 'CMD料号',
      dataIndex: 'productCode',
      key: 'productCode',
    },
    {
      title: '唛头',
      dataIndex: 'shippingMark',
      key: 'shippingMark',
    },
    {
      title: 'PO号',
      dataIndex: 'poNumber',
      key: 'poNumber',
    },
    {
      title: '包装形式',
      dataIndex: 'packageType',
      key: 'packageType',
    },
    {
      title: '件数',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      key: 'locationCode',
    },
    {
      title: '长(cm)',
      dataIndex: 'length',
      key: 'length',
    },
    {
      title: '宽(cm)',
      dataIndex: 'width',
      key: 'width',
    },
    {
      title: '高(cm)',
      dataIndex: 'height',
      key: 'height',
    },
    {
      title: '单件毛重(kg)',
      dataIndex: 'unitGrossWeight',
      key: 'unitGrossWeight',
    },
    {
      title: '总毛重(kg)',
      dataIndex: 'totalGrossWeight',
      key: 'totalGrossWeight',
    },
    {
      title: '平方(m²)',
      dataIndex: 'area',
      key: 'area',
    },
    {
      title: '体积(m³)',
      dataIndex: 'volume',
      key: 'volume',
      render: (val: number) => val?.toFixed(4),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div>
      <Card
        title="入库单详情"
        extra={
          <Button onClick={() => navigate('/inbound')}>返回</Button>
        }
      >
        <Descriptions bordered column={3}>
          <Descriptions.Item label="入库单号">{order.orderNo}</Descriptions.Item>
          <Descriptions.Item label="进仓编号">{order.warehouseEntryNo || '-'}</Descriptions.Item>
          <Descriptions.Item label="客户名称">{order.customerName}</Descriptions.Item>
          <Descriptions.Item label="入库日期">
            {dayjs(order.inboundDate).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="送货单位">{order.deliveryCompany}</Descriptions.Item>
          <Descriptions.Item label="车牌号">{order.vehicleNumber}</Descriptions.Item>
          <Descriptions.Item label="司机姓名">{order.driverName}</Descriptions.Item>
          <Descriptions.Item label="联系人">{order.contactPerson}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{order.contactPhone}</Descriptions.Item>
          <Descriptions.Item label="业务类型">{order.businessType}</Descriptions.Item>
          <Descriptions.Item label="总件数">{order.totalQuantity}</Descriptions.Item>
          <Descriptions.Item label="总体积(m³)">
            {order.totalVolume?.toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="总重量(kg)">
            {order.totalWeight?.toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {order.status === 'completed' ? '已完成' : '待处理'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={3}>
            {order.remark || '-'}
          </Descriptions.Item>
        </Descriptions>

        <Card title="入库明细" style={{ marginTop: 24 }}>
          <Table
            dataSource={order.items}
            columns={columns}
            rowKey="id"
            pagination={false}
            scroll={{ x: 2100 }}
          />
        </Card>

        <Card title="附件管理" style={{ marginTop: 24 }}>
          <AttachmentManager
            entityType="inbound"
            entityId={order.id}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
        </Card>
      </Card>
    </div>
  );
};

export default InboundDetail;
