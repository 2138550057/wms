import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, message, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { BusinessType, BusinessTypeFormData } from '@/types';
import { settingsAPI } from '@/services/settings.service';

const { Option } = Select;

const BusinessTypeSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<BusinessType | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadBusinessTypes();
  }, []);

  // 加载业务类型
  const loadBusinessTypes = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAllBusinessTypes({ activeOnly: false });
      if (response.success) {
        setBusinessTypes(response.data);
      }
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开新建/编辑对话框
  const handleOpenModal = (type?: BusinessType) => {
    if (type) {
      setEditingType(type);
      form.setFieldsValue(type);
    } else {
      setEditingType(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 保存业务类型
  const handleSaveBusinessType = async () => {
    try {
      const values = await form.validateFields();

      if (editingType) {
        // 更新
        const response = await settingsAPI.updateBusinessType(editingType.id, values);
        if (response.success) {
          message.success('更新成功');
          loadBusinessTypes();
          setModalVisible(false);
        }
      } else {
        // 新建
        const response = await settingsAPI.createBusinessType(values);
        if (response.success) {
          message.success('创建成功');
          loadBusinessTypes();
          setModalVisible(false);
        }
      }
    } catch (error: any) {
      if (error.errorFields) {
        return; // 表单验证失败
      }
      message.error(error.message || '保存失败');
    }
  };

  // 切换启用状态
  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const response = await settingsAPI.toggleBusinessType(id, !isActive);
      if (response.success) {
        message.success(isActive ? '已禁用' : '已启用');
        loadBusinessTypes();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 删除业务类型
  const handleDelete = async (id: number) => {
    try {
      const response = await settingsAPI.deleteBusinessType(id);
      if (response.success) {
        message.success('删除成功');
        loadBusinessTypes();
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 业务类型表格列
  const columns = [
    {
      title: '类型代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '类型名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '业务分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color={category === 'inbound' ? 'green' : 'blue'}>
          {category === 'inbound' ? '入库' : '出库'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '显示颜色',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color?: string) =>
        color ? <Tag color={color}>{color}</Tag> : '-',
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: BusinessType) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record.id, isActive)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: BusinessType) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此业务类型？"
            description="删除后无法恢复，请确认！"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          新建业务类型
        </Button>
        <span style={{ marginLeft: 16, color: '#999' }}>
          已有 {businessTypes.length} 个业务类型
        </span>
      </div>

      <Table
        dataSource={businessTypes}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        scroll={{ x: 1000 }}
      />

      {/* 业务类型编辑对话框 */}
      <Modal
        title={editingType ? '编辑业务类型' : '新建业务类型'}
        open={modalVisible}
        onOk={handleSaveBusinessType}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="类型代码"
            rules={[
              { required: true, message: '请输入类型代码' },
              { pattern: /^[a-z_]+$/, message: '只能使用小写字母和下划线' },
            ]}
            extra="用于系统识别，只能使用小写字母和下划线，创建后不可修改"
          >
            <Input placeholder="如: normal, return, transfer" disabled={!!editingType} />
          </Form.Item>

          <Form.Item
            name="name"
            label="类型名称"
            rules={[{ required: true, message: '请输入类型名称' }]}
          >
            <Input placeholder="如: 普通入库" />
          </Form.Item>

          <Form.Item
            name="category"
            label="业务分类"
            rules={[{ required: true, message: '请选择业务分类' }]}
            extra="业务分类创建后不可修改"
          >
            <Select placeholder="请选择" disabled={!!editingType}>
              <Option value="inbound">入库</Option>
              <Option value="outbound">出库</Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入业务类型的描述信息" />
          </Form.Item>

          <Form.Item name="color" label="显示颜色" extra="用于在界面上区分不同的业务类型">
            <Select placeholder="请选择颜色">
              <Option value="blue"><Tag color="blue">蓝色</Tag></Option>
              <Option value="green"><Tag color="green">绿色</Tag></Option>
              <Option value="orange"><Tag color="orange">橙色</Tag></Option>
              <Option value="red"><Tag color="red">红色</Tag></Option>
              <Option value="purple"><Tag color="purple">紫色</Tag></Option>
              <Option value="cyan"><Tag color="cyan">青色</Tag></Option>
              <Option value="gold"><Tag color="gold">金色</Tag></Option>
              <Option value="magenta"><Tag color="magenta">洋红</Tag></Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label="排序"
            initialValue={0}
            extra="数字越小越靠前"
          >
            <Input type="number" placeholder="0" />
          </Form.Item>

          <Form.Item name="isActive" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BusinessTypeSettings;
