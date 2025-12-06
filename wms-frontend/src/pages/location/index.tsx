import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Modal, Form, message, Tag, Card, Select, InputNumber, Switch, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, AppstoreAddOutlined } from '@ant-design/icons';
import { locationAPI } from '../../services/location.service';
import type { Location } from '../../types';

const { Option } = Select;

// 分类映射
const categoryMap: Record<string, string> = {
  shelf: '货架',
  floor: '地面',
  large: '大件',
  small: '小件',
};

// 分类颜色
const categoryColorMap: Record<string, string> = {
  shelf: 'blue',
  floor: 'green',
  large: 'orange',
  small: 'purple',
};

const LocationList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Location[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 筛选条件
  const [filters, setFilters] = useState<{
    keyword?: string;
    bonded?: string;
    zone?: string;
    category?: string;
  }>({});

  // 弹窗控制
  const [modalVisible, setModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response: any = await locationAPI.list({ page, size, ...filters });
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

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({
      bonded: false,
      level: 1,
      category: 'shelf',
      status: 'active',
    });
    setEditingId(null);
    setModalVisible(true);
  };

  const handleBatchAdd = () => {
    batchForm.resetFields();
    batchForm.setFieldsValue({
      bonded: false,
      levelStart: 1,
      levelEnd: 1,
      category: 'shelf',
    });
    setBatchModalVisible(true);
  };

  const handleEdit = async (record: Location) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      number: parseInt(record.number),
    });
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

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的库位');
      return;
    }

    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个库位吗？`,
      onOk: async () => {
        try {
          const response: any = await locationAPI.batchDelete(selectedRowKeys as number[]);
          if (response.success) {
            message.success(response.message);
            setSelectedRowKeys([]);
            loadData();
          }
        } catch (error: any) {
          message.error(error.message || '批量删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        number: values.number.toString(),
      };

      const response: any = editingId
        ? await locationAPI.update(editingId, submitData)
        : await locationAPI.create(submitData);

      if (response.success) {
        message.success(editingId ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadData();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleBatchSubmit = async () => {
    try {
      const values = await batchForm.validateFields();
      const response: any = await locationAPI.batchCreate(values);

      if (response.success) {
        message.success(response.message);
        setBatchModalVisible(false);
        loadData();
      }
    } catch (error: any) {
      message.error(error.message || '批量创建失败');
    }
  };

  const columns = [
    {
      title: '库位编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string, record: Location) => (
        <span style={{ fontWeight: 'bold', color: record.bonded ? '#108ee9' : '#f50' }}>
          {code}
        </span>
      ),
    },
    {
      title: '保税/非保税',
      dataIndex: 'bonded',
      key: 'bonded',
      width: 100,
      render: (bonded: boolean) => (
        <Tag color={bonded ? 'blue' : 'red'}>
          {bonded ? '保税' : '非保税'}
        </Tag>
      ),
    },
    {
      title: '地区',
      dataIndex: 'zone',
      key: 'zone',
      width: 80,
      render: (zone: string) => <span style={{ fontWeight: 'bold' }}>{zone}区</span>,
    },
    {
      title: '分号',
      dataIndex: 'number',
      key: 'number',
      width: 80,
    },
    {
      title: '层数',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: number) => `${level}层`,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color={categoryColorMap[category] || 'default'}>
          {categoryMap[category] || category}
        </Tag>
      ),
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
      render: (val: string) => val || '-',
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <Card>
        {/* 筛选栏 */}
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索库位编码"
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            style={{ width: 200 }}
            allowClear
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="保税/非保税"
            value={filters.bonded}
            onChange={(value) => setFilters({ ...filters, bonded: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="true">保税</Option>
            <Option value="false">非保税</Option>
          </Select>
          <Select
            placeholder="地区"
            value={filters.zone}
            onChange={(value) => setFilters({ ...filters, zone: value })}
            style={{ width: 100 }}
            allowClear
          >
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(z => (
              <Option key={z} value={z}>{z}区</Option>
            ))}
          </Select>
          <Select
            placeholder="分类"
            value={filters.category}
            onChange={(value) => setFilters({ ...filters, category: value })}
            style={{ width: 100 }}
            allowClear
          >
            <Option value="shelf">货架</Option>
            <Option value="floor">地面</Option>
            <Option value="large">大件</Option>
            <Option value="small">小件</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建库位
          </Button>
          <Button type="default" icon={<AppstoreAddOutlined />} onClick={handleBatchAdd}>
            批量创建
          </Button>
        </Space>

        {/* 批量操作栏 */}
        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#e6f7ff', borderRadius: 4 }}>
            <Space>
              <span>已选择 {selectedRowKeys.length} 项</span>
              <Button danger size="small" icon={<DeleteOutlined />} onClick={handleBatchDelete}>
                批量删除
              </Button>
              <Button size="small" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            </Space>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize: size,
            total,
            onChange: setPage,
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: false,
          }}
        />
      </Card>

      {/* 新建/编辑库位弹窗 */}
      <Modal
        title={editingId ? '编辑库位' : '新建库位'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="保税/非保税"
                name="bonded"
                valuePropName="checked"
              >
                <Switch checkedChildren="保税" unCheckedChildren="非保税" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="地区"
                name="zone"
                rules={[{ required: true, message: '请选择地区' }]}
              >
                <Select placeholder="选择地区 A-Z">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(z => (
                    <Option key={z} value={z}>{z}区</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="分号"
                name="number"
                rules={[{ required: true, message: '请输入分号' }]}
              >
                <InputNumber min={1} max={99} placeholder="1-99" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="层数"
                name="level"
                rules={[{ required: true, message: '请输入层数' }]}
              >
                <InputNumber min={1} max={10} placeholder="1-10" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="分类"
                name="category"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="选择分类">
                  <Option value="shelf">货架</Option>
                  <Option value="floor">地面</Option>
                  <Option value="large">大件</Option>
                  <Option value="small">小件</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
              >
                <Select placeholder="选择状态">
                  <Option value="active">启用</Option>
                  <Option value="disabled">禁用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量创建库位弹窗 */}
      <Modal
        title="批量创建库位"
        open={batchModalVisible}
        onOk={handleBatchSubmit}
        onCancel={() => setBatchModalVisible(false)}
        width={600}
      >
        <Form form={batchForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="保税/非保税"
                name="bonded"
                valuePropName="checked"
              >
                <Switch checkedChildren="保税" unCheckedChildren="非保税" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="地区"
                name="zone"
                rules={[{ required: true, message: '请选择地区' }]}
              >
                <Select placeholder="选择地区 A-Z">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(z => (
                    <Option key={z} value={z}>{z}区</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="分号起始"
                name="numberStart"
                rules={[{ required: true, message: '请输入起始分号' }]}
              >
                <InputNumber min={1} max={99} placeholder="1" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="分号结束"
                name="numberEnd"
                rules={[{ required: true, message: '请输入结束分号' }]}
              >
                <InputNumber min={1} max={99} placeholder="20" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="层数起始"
                name="levelStart"
                rules={[{ required: true, message: '请输入起始层数' }]}
              >
                <InputNumber min={1} max={10} placeholder="1" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="层数结束"
                name="levelEnd"
                rules={[{ required: true, message: '请输入结束层数' }]}
              >
                <InputNumber min={1} max={10} placeholder="3" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="选择分类">
              <Option value="shelf">货架</Option>
              <Option value="floor">地面</Option>
              <Option value="large">大件</Option>
              <Option value="small">小件</Option>
            </Select>
          </Form.Item>
          <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, marginTop: 8 }}>
            <p style={{ margin: 0, color: '#666' }}>
              <strong>说明：</strong>将批量创建库位，编码格式为：[保税标识][地区][分号]-[层数]
            </p>
            <p style={{ margin: '8px 0 0', color: '#666' }}>
              例如：保税 + F区 + 16号 + 1层 = <strong style={{ color: '#108ee9' }}>3F16-1</strong>
            </p>
            <p style={{ margin: '4px 0 0', color: '#666' }}>
              非保税 + A区 + 1号 + 2层 = <strong style={{ color: '#f50' }}>1A01-2</strong>
            </p>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default LocationList;
