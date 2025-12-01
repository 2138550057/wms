import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Modal, Form, message, Tag, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { locationAPI } from '../../services/location.service';
import type { Location } from '../../types';

const LocationList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Location[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, keyword]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response: any = await locationAPI.list({ page, size, keyword });
      if (response.success) {
        setData(response.data);
        setTotal(response.total);
      }
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setEditingId(null);
    setModalVisible(true);
  };

  const handleEdit = async (record: Location) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该库位吗？',
      onOk: async () => {
        try {
          const response: any = await locationAPI.delete(id);
          if (response.success) {
            message.success('删除成功');
            loadData();
          }
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const response: any = editingId
        ? await locationAPI.update(editingId, values)
        : await locationAPI.create(values);

      if (response.success) {
        message.success(editingId ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadData();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '库位编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '库位名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '所属仓库',
      dataIndex: 'warehouse',
      key: 'warehouse',
      width: 120,
    },
    {
      title: '区域',
      dataIndex: 'zone',
      key: 'zone',
      width: 100,
    },
    {
      title: '通道',
      dataIndex: 'aisle',
      key: 'aisle',
      width: 80,
    },
    {
      title: '货架',
      dataIndex: 'shelf',
      key: 'shelf',
      width: 80,
    },
    {
      title: '层',
      dataIndex: 'layer',
      key: 'layer',
      width: 60,
    },
    {
      title: '位',
      dataIndex: 'position',
      key: 'position',
      width: 60,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Location) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索库位编码/名称/仓库"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建库位
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize: size,
            total,
            onChange: setPage,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑库位' : '新建库位'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Form.Item
              label="库位编码"
              name="code"
              rules={[{ required: true, message: '请输入库位编码' }]}
            >
              <Input placeholder="如: A01-001" />
            </Form.Item>
            <Form.Item
              label="库位名称"
              name="name"
              rules={[{ required: true, message: '请输入库位名称' }]}
            >
              <Input placeholder="如: A区1号货架1层1位" />
            </Form.Item>
            <Form.Item label="所属仓库" name="warehouse">
              <Input placeholder="如: 主仓库" />
            </Form.Item>
            <Form.Item label="区域" name="zone">
              <Input placeholder="如: A区" />
            </Form.Item>
            <Form.Item label="通道" name="aisle">
              <Input placeholder="如: 01" />
            </Form.Item>
            <Form.Item label="货架" name="shelf">
              <Input placeholder="如: 001" />
            </Form.Item>
            <Form.Item label="层" name="layer">
              <Input placeholder="如: 01" />
            </Form.Item>
            <Form.Item label="位" name="position">
              <Input placeholder="如: 01" />
            </Form.Item>
            <Form.Item label="状态" name="status" initialValue="active">
              <Input placeholder="active/disabled" />
            </Form.Item>
          </div>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LocationList;
