import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, message, Popconfirm, Tag, Select } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userAPI, UserData } from '../../services/user.service';
import dayjs from 'dayjs';

const UserList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [filters, setFilters] = useState<{
    username?: string;
    realName?: string;
    role?: string;
  }>({});

  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const response: any = await userAPI.list({
        page,
        size,
        ...filters,
      });

      if (response.success) {
        setData(response.data);
        setTotal(response.total);
      }
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, size]);

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleDelete = async (id: number) => {
    try {
      const response: any = await userAPI.delete(id);
      if (response.success) {
        message.success('删除成功');
        loadData();
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const getRoleTag = (role: string) => {
    const roleMap: Record<string, { color: string; text: string }> = {
      admin: { color: 'red', text: '管理员' },
      operator: { color: 'blue', text: '操作员' },
      viewer: { color: 'default', text: '查看员' },
    };
    const roleInfo = roleMap[role] || { color: 'default', text: role };
    return <Tag color={roleInfo.color}>{roleInfo.text}</Tag>;
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (text: string) => text || '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (text: string) => text || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => getRoleTag(role),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: UserData) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/users/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除?"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space wrap>
          <Input
            placeholder="用户名"
            value={filters.username}
            onChange={(e) => setFilters({ ...filters, username: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="真实姓名"
            value={filters.realName}
            onChange={(e) => setFilters({ ...filters, realName: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Select
            placeholder="角色"
            value={filters.role}
            onChange={(value) => setFilters({ ...filters, role: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="admin">管理员</Select.Option>
            <Select.Option value="operator">操作员</Select.Option>
            <Select.Option value="viewer">查看员</Select.Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/users/create')}
        >
          新建用户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize: size,
          total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPage(page);
            setSize(pageSize);
          },
        }}
      />
    </div>
  );
};

export default UserList;
