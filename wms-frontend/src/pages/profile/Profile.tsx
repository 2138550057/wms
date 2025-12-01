import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Spin, Descriptions, Tag, Space } from 'antd';
import { SaveOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userAPI, UserData } from '../../services/user.service';
import dayjs from 'dayjs';

const Profile: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setInitialLoading(true);
    try {
      const response: any = await userAPI.getProfile();
      if (response.success) {
        setProfile(response.data);
        form.setFieldsValue({
          realName: response.data.realName,
          email: response.data.email,
          phone: response.data.phone,
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
      const response: any = await userAPI.updateProfile(values);
      if (response.success) {
        message.success('个人信息更新成功!');
        setProfile(response.data);
        setIsEditing(false);
        loadProfile();
      }
    } catch (error: any) {
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
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

  if (initialLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div>
      <Card
        title="个人信息"
        extra={
          <Space>
            <Button
              type="primary"
              onClick={() => navigate('/profile/change-password')}
            >
              修改密码
            </Button>
            {!isEditing && (
              <Button
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
              >
                编辑资料
              </Button>
            )}
          </Space>
        }
      >
        {!isEditing ? (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="用户名">{profile.username}</Descriptions.Item>
            <Descriptions.Item label="角色">{getRoleTag(profile.role)}</Descriptions.Item>
            <Descriptions.Item label="真实姓名">{profile.realName || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{profile.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="手机号">{profile.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {profile.createdAt ? dayjs(profile.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={2}>
              {profile.updatedAt ? dayjs(profile.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ maxWidth: 600 }}
          >
            <Form.Item label="用户名">
              <Input value={profile.username} disabled />
            </Form.Item>

            <Form.Item label="角色">
              <div>{getRoleTag(profile.role)}</div>
            </Form.Item>

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

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                保存
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  form.setFieldsValue({
                    realName: profile.realName,
                    email: profile.email,
                    phone: profile.phone,
                  });
                }}
                style={{ marginLeft: 8 }}
              >
                取消
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default Profile;
