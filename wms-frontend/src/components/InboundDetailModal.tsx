import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Table, Button, Spin, message, Space, Tag, Card } from 'antd';
import { FileOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { inboundAPI } from '@/services/inbound.service';
import type { InboundOrder } from '@/types';
import dayjs from 'dayjs';
import AttachmentViewer from './AttachmentViewer';

interface InboundDetailModalProps {
  visible: boolean;
  orderId: number | null;
  onCancel: () => void;
  onEdit?: (id: number) => void;
  onConfirm?: (id: number) => void;
  onReload?: () => void;
}

const InboundDetailModal: React.FC<InboundDetailModalProps> = ({
  visible,
  orderId,
  onCancel,
  onEdit,
  onConfirm,
  onReload,
}) => {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<InboundOrder | null>(null);
  const [attachmentViewerVisible, setAttachmentViewerVisible] = useState(false);

  useEffect(() => {
    if (visible && orderId) {
      loadData();
    }
  }, [visible, orderId]);

  const loadData = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const response: any = await inboundAPI.getById(orderId);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 确认入库
  const handleConfirm = async () => {
    if (!order) return;

    try {
      const response: any = await inboundAPI.confirm(order.id);
      if (response.success) {
        message.success('确认成功');
        loadData();
        onReload?.();
      }
    } catch (error: any) {
      message.error(error.message || '确认失败');
    }
  };

  // 反审核
  const handleReverseAudit = async () => {
    if (!order) return;

    Modal.confirm({
      title: '确认反审核',
      content: '反审核后将恢复为待审核状态，是否继续？',
      onOk: async () => {
        try {
          const response: any = await inboundAPI.reverseAudit(order.id);
          if (response.success) {
            message.success('反审核成功');
            loadData();
            onReload?.();
          }
        } catch (error: any) {
          message.error(error.message || '反审核失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '货名',
      dataIndex: 'productName',
      key: 'productName',
      width: 120,
    },
    {
      title: '工程编号',
      dataIndex: 'productModel',
      key: 'productModel',
      width: 100,
    },
    {
      title: 'CMD编号',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
    },
    {
      title: '内部货号',
      dataIndex: 'internalCode',
      key: 'internalCode',
      width: 120,
    },
    {
      title: 'CMD料号',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120,
    },
    {
      title: '唛头',
      dataIndex: 'shippingMark',
      key: 'shippingMark',
      width: 100,
    },
    {
      title: 'PO号',
      dataIndex: 'poNumber',
      key: 'poNumber',
      width: 100,
    },
    {
      title: '包装形式',
      dataIndex: 'packageType',
      key: 'packageType',
      width: 100,
    },
    {
      title: '申报数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      key: 'locationCode',
      width: 100,
    },
    {
      title: '长(cm)',
      dataIndex: 'length',
      key: 'length',
      width: 80,
    },
    {
      title: '宽(cm)',
      dataIndex: 'width',
      key: 'width',
      width: 80,
    },
    {
      title: '高(cm)',
      dataIndex: 'height',
      key: 'height',
      width: 80,
    },
    {
      title: '单件毛重(kg)',
      dataIndex: 'unitGrossWeight',
      key: 'unitGrossWeight',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
    },
  ];

  if (!order) return null;

  return (
    <>
      <Modal
        title={
          <Space>
            <span>入库单详情 - {order.orderNo}</span>
            <Tag color={order.status === 'completed' ? 'success' : 'processing'}>
              {order.status === 'completed' ? '已完成' : '待审核'}
            </Tag>
          </Space>
        }
        open={visible}
        onCancel={onCancel}
        width={1400}
        style={{ top: 20 }}
        footer={[
          <Button key="attachment" icon={<FileOutlined />} onClick={() => setAttachmentViewerVisible(true)}>
            查看附件
          </Button>,
          order.status === 'pending' && onEdit && (
            <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => onEdit(order.id)}>
              编辑
            </Button>
          ),
          order.status === 'pending' && (
            <Button
              key="confirm"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleConfirm}
            >
              确认入库
            </Button>
          ),
          order.status === 'completed' && (
            <Button key="reverse" onClick={handleReverseAudit}>
              反审核
            </Button>
          ),
          <Button key="close" onClick={onCancel}>
            关闭
          </Button>,
        ]}
      >
        <Spin spinning={loading}>
          <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
            {/* 基本信息 */}
            <Card
              title={<span style={{ fontSize: '14px', fontWeight: 600 }}>基本信息</span>}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions bordered column={3} size="small">
                <Descriptions.Item label="入库单号">{order.orderNo}</Descriptions.Item>
                <Descriptions.Item label="客户名称">{order.customerName}</Descriptions.Item>
                <Descriptions.Item label="业务类型">
                  {order.businessType === 'normal' && '普通入库'}
                  {order.businessType === 'return' && '退货入库'}
                  {order.businessType === 'transfer' && '调拨入库'}
                </Descriptions.Item>
                <Descriptions.Item label="入库日期">
                  {dayjs(order.inboundDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={order.status === 'completed' ? 'success' : 'processing'}>
                    {order.status === 'completed' ? '已完成' : '待审核'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="总申报数量" span={3}>
                  <strong style={{ fontSize: 16, color: '#1890ff' }}>{order.totalQuantity}</strong> 件
                </Descriptions.Item>
                <Descriptions.Item label="总体积" span={3}>
                  <strong style={{ fontSize: 16, color: '#52c41a' }}>
                    {order.totalVolume?.toFixed(3)}
                  </strong>{' '}
                  m³
                </Descriptions.Item>
                <Descriptions.Item label="总重量" span={3}>
                  <strong style={{ fontSize: 16, color: '#fa8c16' }}>
                    {order.totalGrossWeight?.toFixed(2)}
                  </strong>{' '}
                  kg
                </Descriptions.Item>
                {order.remark && (
                  <Descriptions.Item label="备注" span={3}>
                    {order.remark}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* 入库明细 */}
            <Card
              title={<span style={{ fontSize: '14px', fontWeight: 600 }}>入库明细 ({order.items?.length || 0}条)</span>}
              size="small"
            >
              <Table
                columns={columns}
                dataSource={order.items}
                rowKey="id"
                pagination={false}
                scroll={{ x: 1500, y: 350 }}
                size="small"
              />
            </Card>
          </div>
        </Spin>
      </Modal>

      {/* 附件查看器 */}
      {order && (
        <AttachmentViewer
          visible={attachmentViewerVisible}
          onCancel={() => setAttachmentViewerVisible(false)}
          entityType="inbound"
          entityId={order.id}
          title={`入库单附件 - ${order.orderNo}`}
          orderNo={order.orderNo}
          warehouseEntryNo={order.warehouseEntryNo}
          actualQuantity={order.actualQuantity}
          vehicleNumber={order.vehicleNumber}
        />
      )}
    </>
  );
};

export default InboundDetailModal;
