import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Space, Divider, Row, Col, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { settingsAPI } from '@/services/settings.service';

const BasicSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // 加载基础设置
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettingsByCategory('basic');
      if (response.success) {
        const settingsObj: any = {};
        response.data.forEach((setting) => {
          settingsObj[setting.settingKey] = setting.settingValue?.value || setting.settingValue;
        });
        form.setFieldsValue(settingsObj);
      }
    } catch (error: any) {
      message.error(error.message || '加载设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存设置
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaveLoading(true);

      console.log('提交的表单数据:', values);

      const settings = Object.keys(values).map((key) => ({
        settingKey: key,
        settingValue: { value: values[key] },
        category: 'basic',
        isPublic: key.startsWith('system.') ? true : false,
      }));

      console.log('发送到后端的设置:', settings);

      const response = await settingsAPI.batchUpdateSettings(settings);

      console.log('后端响应:', response);
      console.log('response.success 的值:', response.success, '类型:', typeof response.success);

      if (response.success === true) {
        message.success('保存成功');

        // 重新加载设置
        try {
          await loadSettings();
        } catch (loadError: any) {
          console.error('重新加载设置失败:', loadError);
          // 即使加载失败也不影响保存成功的提示
        }
      } else {
        message.error(response.message || '保存失败');
        console.error('保存失败，响应:', response);
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error('表单验证失败，请检查必填项');
        console.error('表单验证错误:', error.errorFields);
        return;
      }
      message.error(error.message || '保存失败');
      console.error('保存出错:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <div style={{ maxWidth: 800 }}>
        <Form form={form} layout="vertical">
        <Divider orientation="left">系统信息</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="system.name"
              label="系统名称"
              rules={[{ required: true, message: '请输入系统名称' }]}
              initialValue="WMS仓储管理系统"
            >
              <Input placeholder="请输入系统名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="system.version"
              label="系统版本"
              initialValue="1.0.0"
            >
              <Input placeholder="如: 1.0.0" disabled />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="system.domain"
          label="系统域名"
          rules={[
            { required: true, message: '请输入系统域名' },
            { type: 'url', message: '请输入有效的URL格式，如: http://example.com 或 https://example.com' }
          ]}
          initialValue="http://localhost:3001"
          tooltip="用于生成附件访问链接，生产环境请设置为实际域名，如: https://wms.yourdomain.com"
        >
          <Input placeholder="如: https://wms.yourdomain.com" />
        </Form.Item>

        <Form.Item
          name="system.description"
          label="系统描述"
          initialValue="专业的仓储管理解决方案"
        >
          <Input.TextArea rows={3} placeholder="请输入系统描述" />
        </Form.Item>

        <Divider orientation="left">公司信息</Divider>

        <Form.Item
          name="company.name"
          label="公司名称"
          rules={[{ required: true, message: '请输入公司名称' }]}
        >
          <Input placeholder="请输入公司名称" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="company.contact"
              label="联系人"
            >
              <Input placeholder="请输入联系人" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="company.phone"
              label="联系电话"
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="company.email"
          label="电子邮箱"
          rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
        >
          <Input placeholder="请输入电子邮箱" />
        </Form.Item>

        <Form.Item
          name="company.address"
          label="公司地址"
        >
          <Input.TextArea rows={2} placeholder="请输入公司地址" />
        </Form.Item>

        <Divider orientation="left">业务配置</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="business.workStartTime"
              label="营业开始时间"
              initialValue="08:00"
            >
              <Input placeholder="如: 08:00" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="business.workEndTime"
              label="营业结束时间"
              initialValue="18:00"
            >
              <Input placeholder="如: 18:00" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="business.defaultWarehouse"
          label="默认仓库"
          initialValue="主仓库"
        >
          <Input placeholder="请输入默认仓库名称" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saveLoading}
            >
              保存设置
            </Button>
            <Button onClick={loadSettings}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
    </Spin>
  );
};

export default BasicSettings;
