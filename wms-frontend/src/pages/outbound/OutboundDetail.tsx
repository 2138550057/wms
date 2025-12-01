import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Table, Button, Spin, message, Modal, Space } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { EditOutlined, RollbackOutlined } from '@ant-design/icons';
import { outboundAPI } from '../../services/outbound.service';
import type { OutboundOrder } from '../../types';
import dayjs from 'dayjs';
import AttachmentManager from '@/components/AttachmentManager';

const OutboundDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OutboundOrder | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response: any = await outboundAPI.getById(Number(id));
      if (response.success) {
        setOrder(response.data);
      }
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReverseAudit = () => {
    Modal.confirm({
      title: '确认反审核',
      content: '确定要反审核该出库单吗？反审核后订单状态将变为待处理。',
      onOk: async () => {
        try {
          const response: any = await outboundAPI.reverseAudit(Number(id));
          if (response.success) {
            message.success('反审核成功');
            loadData();
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '反审核失败');
        }
      },
    });
  };

  const handleEdit = () => {
    navigate(`/outbound/edit/${id}`);
  };

  const columns = [
    {
      title: '进仓编号',
      dataIndex: 'warehouseEntryNo',
      key: 'warehouseEntryNo',
    },
    {
      title: '货名',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '工程编号',
      dataIndex: 'productModel',
      key: 'productModel',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
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
      title: '申报数量',
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
        title="出库单详情"
        extra={
          <Space>
            {order.status === 'completed' && (
              <>
                <Button icon={<RollbackOutlined />} onClick={handleReverseAudit}>
                  反审核
                </Button>
                <Button icon={<EditOutlined />} onClick={handleEdit}>
                  编辑
                </Button>
              </>
            )}
            <Button onClick={() => navigate('/outbound')}>返回</Button>
          </Space>
        }
      >
        <Descriptions bordered column={3}>
          <Descriptions.Item label="出库单号">{order.orderNo}</Descriptions.Item>
          <Descriptions.Item label="客户名称">{order.customerName}</Descriptions.Item>
          <Descriptions.Item label="出库日期">
            {dayjs(order.outboundDate).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="收货单位">{order.receivingCompany}</Descriptions.Item>
          <Descriptions.Item label="收货地址" span={2}>
            {order.receivingAddress}
          </Descriptions.Item>
          <Descriptions.Item label="车牌号">{order.vehicleNumber}</Descriptions.Item>
          <Descriptions.Item label="司机姓名">{order.driverName}</Descriptions.Item>
          <Descriptions.Item label="业务类型">{order.businessType}</Descriptions.Item>
          <Descriptions.Item label="联系人">{order.contactPerson}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{order.contactPhone}</Descriptions.Item>
          <Descriptions.Item label="总申报数量">{order.totalQuantity}</Descriptions.Item>
          <Descriptions.Item label="总体积(m³)">
            {order.totalVolume?.toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="总重量(kg)">
            {order.totalWeight?.toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {order.status === 'completed' ? '已完成' : '待处理'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间" span={2}>
            {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={3}>
            {order.remark || '-'}
          </Descriptions.Item>
        </Descriptions>

        <Card title="出库明细" style={{ marginTop: 24 }}>
          <Table
            dataSource={order.items}
            columns={columns}
            rowKey="id"
            pagination={false}
            scroll={{ x: 2300 }}
          />
        </Card>

        <Card title="附件管理" style={{ marginTop: 24 }}>
          <AttachmentManager
            entityType="outbound"
            entityId={order.id}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
        </Card>
      </Card>
    </div>
  );
};

export default OutboundDetail;
