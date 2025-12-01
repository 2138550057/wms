import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Select, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { userAPI } from '../../services/user.service';

const UserForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const navigate = useNavigate();
  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    setInitialLoading(true);
    try {
      const response: any = await userAPI.getById(Number(id));
      if (response.success) {
        form.setFieldsValue({
          username: response.data.username,
          realName: response.data.realName,
          email: response.data.email,
          phone: response.data.phone,
          role: response.data.role,
        });
      }
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setInitialLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (isEdit) {
        const response: any = await userAPI.update(Number(id), values);
        if (response.success) {
          message.success('用户更新成功!');
          navigate('/users');
        }
      } else {
        const response: any = await userAPI.create(values);
        if (response.success) {
          message.success('用户创建成功!');
          navigate('/users');
        }
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card title={isEdit ? '编辑用户' : '新建用户'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            role: 'operator',
          }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
            ]}
          >
            <Input placeholder="用户名" disabled={isEdit} />
          </Form.Item>

          {!isEdit && (
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password placeholder="密码" />
            </Form.Item>
          )}

          {isEdit && (
            <Form.Item
              label="新密码"
              name="password"
              extra="不填写则不修改密码"
            >
              <Input.Password placeholder="新密码(可选)" />
            </Form.Item>
          )}

          <Form.Item
            label="真实姓名"
            name="realName"
          >
            <Input placeholder="真实姓名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="邮箱" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="手机号" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="operator">操作员</Select.Option>
              <Select.Option value="viewer">查看员</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              {isEdit ? '保存' : '创建'}
            </Button>
            <Button onClick={() => navigate('/users')} style={{ marginLeft: 8 }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default UserForm;
