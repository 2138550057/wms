import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Form, Input, Space, message, Popconfirm, Select, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface AttachmentCategory {
  value: string;
  label: string;
  color: string;
}

interface AttachmentCategoryManagerProps {
  visible: boolean;
  onCancel: () => void;
}

const COLOR_OPTIONS = [
  { value: 'default', label: '默认' },
  { value: 'blue', label: '蓝色' },
  { value: 'green', label: '绿色' },
  { value: 'orange', label: '橙色' },
  { value: 'purple', label: '紫色' },
  { value: 'red', label: '红色' },
  { value: 'cyan', label: '青色' },
  { value: 'magenta', label: '洋红' },
  { value: 'gold', label: '金色' },
];

const DEFAULT_CATEGORIES: AttachmentCategory[] = [
  { value: 'default', label: '默认', color: 'default' },
  { value: 'image', label: '图片', color: 'blue' },
  { value: 'document', label: '文档', color: 'green' },
  { value: 'contract', label: '合同', color: 'orange' },
  { value: 'other', label: '其他', color: 'purple' },
];

const AttachmentCategoryManager: React.FC<AttachmentCategoryManagerProps> = ({
  visible,
  onCancel,
}) => {
  const [categories, setCategories] = useState<AttachmentCategory[]>(DEFAULT_CATEGORIES);
  const [editingKey, setEditingKey] = useState<string>('');
  const [form] = Form.useForm();
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  // 加载分类（从 localStorage 读取）
  const loadCategories = () => {
    const savedCategories = localStorage.getItem('attachment_categories');
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        setCategories(parsed);
      } catch (error) {
        console.error('Failed to parse categories:', error);
        setCategories(DEFAULT_CATEGORIES);
      }
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  // 保存分类（到 localStorage）
  const saveCategories = (newCategories: AttachmentCategory[]) => {
    localStorage.setItem('attachment_categories', JSON.stringify(newCategories));
    setCategories(newCategories);
    message.success('保存成功');
  };

  // 开始编辑
  const startEdit = (record: AttachmentCategory) => {
    form.setFieldsValue(record);
    setEditingKey(record.value);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingKey('');
    setIsAdding(false);
    form.resetFields();
  };

  // 保存编辑
  const saveEdit = async (value: string) => {
    try {
      const row = await form.validateFields();
      const newCategories = categories.map((item) =>
        item.value === value ? { ...item, ...row } : item
      );
      saveCategories(newCategories);
      setEditingKey('');
    } catch (error) {
      console.error('Validate Failed:', error);
    }
  };

  // 添加新分类
  const handleAdd = () => {
    setIsAdding(true);
    form.setFieldsValue({ value: '', label: '', color: 'default' });
  };

  // 保存新分类
  const saveNew = async () => {
    try {
      const row = await form.validateFields();

      // 检查是否已存在
      if (categories.some((cat) => cat.value === row.value)) {
        message.error('分类代码已存在');
        return;
      }

      const newCategories = [...categories, row];
      saveCategories(newCategories);
      setIsAdding(false);
      form.resetFields();
    } catch (error) {
      console.error('Validate Failed:', error);
    }
  };

  // 删除分类
  const handleDelete = (value: string) => {
    // 防止删除默认分类
    if (value === 'default') {
      message.warning('默认分类不能删除');
      return;
    }

    const newCategories = categories.filter((item) => item.value !== value);
    saveCategories(newCategories);
  };

  // 重置为默认
  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: '确定要重置为默认分类吗？这将清除所有自定义分类。',
      onOk: () => {
        saveCategories(DEFAULT_CATEGORIES);
      },
    });
  };

  const columns = [
    {
      title: '分类代码',
      dataIndex: 'value',
      key: 'value',
      width: '25%',
      render: (text: string, record: AttachmentCategory) => {
        if (editingKey === record.value) {
          return (
            <Form.Item
              name="value"
              style={{ margin: 0 }}
              rules={[
                { required: true, message: '请输入分类代码' },
                { pattern: /^[a-z_]+$/, message: '只能包含小写字母和下划线' },
              ]}
            >
              <Input disabled={!isAdding} />
            </Form.Item>
          );
        }
        return <span>{text}</span>;
      },
    },
    {
      title: '分类名称',
      dataIndex: 'label',
      key: 'label',
      width: '30%',
      render: (text: string, record: AttachmentCategory) => {
        if (editingKey === record.value) {
          return (
            <Form.Item
              name="label"
              style={{ margin: 0 }}
              rules={[{ required: true, message: '请输入分类名称' }]}
            >
              <Input />
            </Form.Item>
          );
        }
        return <span>{text}</span>;
      },
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: '25%',
      render: (color: string, record: AttachmentCategory) => {
        if (editingKey === record.value) {
          return (
            <Form.Item
              name="color"
              style={{ margin: 0 }}
              rules={[{ required: true, message: '请选择颜色' }]}
            >
              <Select>
                {COLOR_OPTIONS.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    <Tag color={opt.value}>{opt.label}</Tag>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          );
        }
        return <Tag color={color}>{record.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: '20%',
      render: (_: any, record: AttachmentCategory) => {
        const editable = editingKey === record.value;
        return editable ? (
          <Space>
            <Button type="link" size="small" onClick={() => isAdding ? saveNew() : saveEdit(record.value)}>
              保存
            </Button>
            <Button type="link" size="small" onClick={cancelEdit}>
              取消
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => startEdit(record)}
              disabled={editingKey !== ''}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除此分类吗？"
              onConfirm={() => handleDelete(record.value)}
              disabled={record.value === 'default'}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={editingKey !== '' || record.value === 'default'}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Modal
      title="附件类型设置"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="reset" onClick={handleReset}>
          重置为默认
        </Button>,
        <Button key="close" type="primary" onClick={onCancel}>
          关闭
        </Button>,
      ]}
    >
      <Form form={form} component={false}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={editingKey !== ''}
          >
            添加分类
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={isAdding ? [...categories, { value: '', label: '', color: 'default' }] : categories}
          rowKey="value"
          pagination={false}
          size="small"
        />

        <div style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
          <p>提示：</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>分类代码只能包含小写字母和下划线</li>
            <li>默认分类不能删除</li>
            <li>修改分类不会影响已上传的附件</li>
          </ul>
        </div>
      </Form>
    </Modal>
  );
};

export default AttachmentCategoryManager;
