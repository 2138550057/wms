import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Space, Divider, Row, Col, Select, Radio, InputNumber, Alert } from 'antd';
import { SaveOutlined, CloudServerOutlined } from '@ant-design/icons';
import { settingsAPI } from '@/services/settings.service';

const { Option } = Select;

const StorageSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [storageType, setStorageType] = useState<string>('local');

  useEffect(() => {
    loadSettings();
  }, []);

  // 加载存储设置
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettingsByCategory('storage');
      if (response.success) {
        const settingsObj: any = {};
        response.data.forEach((setting) => {
          if (setting.settingKey === 'storage.config') {
            // 展开配置对象
            Object.assign(settingsObj, setting.settingValue);
          } else {
            settingsObj[setting.settingKey] = setting.settingValue?.value || setting.settingValue;
          }
        });

        // 设置存储类型
        if (settingsObj['storage.default']) {
          setStorageType(settingsObj['storage.default'].type || 'local');
        }

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

      // 构建存储配置对象
      const storageConfig: any = {
        type: values['storage.default']?.type || storageType,
      };

      // 根据存储类型添加配置
      if (storageType === 'local') {
        storageConfig.local = {
          uploadDir: values.localUploadDir,
          baseUrl: values.localBaseUrl,
        };
      } else if (storageType === 's3') {
        storageConfig.s3 = {
          region: values.s3Region,
          bucket: values.s3Bucket,
          accessKeyId: values.s3AccessKeyId,
          secretAccessKey: values.s3SecretAccessKey,
          endpoint: values.s3Endpoint,
        };
      } else if (storageType === 'qiniu') {
        storageConfig.qiniu = {
          accessKey: values.qiniuAccessKey,
          secretKey: values.qiniuSecretKey,
          bucket: values.qiniuBucket,
          domain: values.qiniuDomain,
          zone: values.qiniuZone,
        };
      }

      const settings = [
        {
          settingKey: 'storage.default',
          settingValue: { type: storageType },
          category: 'storage',
          description: '默认存储方式',
          isPublic: false,
        },
        {
          settingKey: 'storage.config',
          settingValue: storageConfig,
          category: 'storage',
          description: '存储配置',
          isPublic: false,
        },
        {
          settingKey: 'storage.maxFileSize',
          settingValue: { value: values.maxFileSize || 52428800 },
          category: 'storage',
          description: '文件上传大小限制(bytes)',
          isPublic: false,
        },
      ];

      const response = await settingsAPI.batchUpdateSettings(settings);
      if (response.success) {
        message.success('保存成功，重启后端服务后生效');
        loadSettings();
      }
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(error.message || '保存失败');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <Alert
        message="存储配置说明"
        description="修改存储配置后需要重启后端服务才能生效。请确保配置正确，否则可能导致文件上传失败。"
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form form={form} layout="vertical" loading={loading}>
        <Divider orientation="left">基础配置</Divider>

        <Form.Item
          label="默认存储方式"
          tooltip="选择文件的默认存储位置"
        >
          <Radio.Group
            value={storageType}
            onChange={(e) => setStorageType(e.target.value)}
          >
            <Radio.Button value="local">
              <CloudServerOutlined /> 本地存储
            </Radio.Button>
            <Radio.Button value="s3">AWS S3 / MinIO</Radio.Button>
            <Radio.Button value="qiniu">七牛云</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="maxFileSize"
          label="文件大小限制(MB)"
          initialValue={50}
          tooltip="单个文件的最大上传大小"
        >
          <InputNumber
            min={1}
            max={1024}
            style={{ width: 200 }}
            addonAfter="MB"
          />
        </Form.Item>

        {/* 本地存储配置 */}
        {storageType === 'local' && (
          <>
            <Divider orientation="left">本地存储配置</Divider>
            <Form.Item
              name="localUploadDir"
              label="上传目录"
              initialValue="./uploads"
              rules={[{ required: true, message: '请输入上传目录' }]}
            >
              <Input placeholder="如: ./uploads" />
            </Form.Item>
            <Form.Item
              name="localBaseUrl"
              label="访问基础URL"
              initialValue="http://localhost:3001/uploads"
              rules={[{ required: true, message: '请输入访问URL' }]}
            >
              <Input placeholder="如: http://your-domain.com/uploads" />
            </Form.Item>
          </>
        )}

        {/* S3存储配置 */}
        {storageType === 's3' && (
          <>
            <Divider orientation="left">S3 / MinIO 配置</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="s3Region"
                  label="Region"
                  rules={[{ required: true, message: '请输入Region' }]}
                >
                  <Input placeholder="如: us-east-1" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="s3Bucket"
                  label="Bucket"
                  rules={[{ required: true, message: '请输入Bucket' }]}
                >
                  <Input placeholder="bucket名称" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="s3AccessKeyId"
              label="Access Key ID"
              rules={[{ required: true, message: '请输入Access Key ID' }]}
            >
              <Input.Password placeholder="Access Key ID" />
            </Form.Item>
            <Form.Item
              name="s3SecretAccessKey"
              label="Secret Access Key"
              rules={[{ required: true, message: '请输入Secret Access Key' }]}
            >
              <Input.Password placeholder="Secret Access Key" />
            </Form.Item>
            <Form.Item
              name="s3Endpoint"
              label="Endpoint (可选)"
              tooltip="用于MinIO等S3兼容服务"
            >
              <Input placeholder="如: https://s3.amazonaws.com" />
            </Form.Item>
          </>
        )}

        {/* 七牛云配置 */}
        {storageType === 'qiniu' && (
          <>
            <Divider orientation="left">七牛云配置</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="qiniuBucket"
                  label="Bucket"
                  rules={[{ required: true, message: '请输入Bucket' }]}
                >
                  <Input placeholder="存储空间名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="qiniuZone"
                  label="存储区域"
                  rules={[{ required: true, message: '请选择存储区域' }]}
                >
                  <Select placeholder="选择存储区域">
                    <Option value="Zone_z0">华东</Option>
                    <Option value="Zone_z1">华北</Option>
                    <Option value="Zone_z2">华南</Option>
                    <Option value="Zone_na0">北美</Option>
                    <Option value="Zone_as0">东南亚</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="qiniuAccessKey"
              label="Access Key"
              rules={[{ required: true, message: '请输入Access Key' }]}
            >
              <Input.Password placeholder="Access Key" />
            </Form.Item>
            <Form.Item
              name="qiniuSecretKey"
              label="Secret Key"
              rules={[{ required: true, message: '请输入Secret Key' }]}
            >
              <Input.Password placeholder="Secret Key" />
            </Form.Item>
            <Form.Item
              name="qiniuDomain"
              label="CDN域名"
              rules={[{ required: true, message: '请输入CDN域名' }]}
              tooltip="用于访问上传的文件"
            >
              <Input placeholder="如: cdn.yourdomain.com" />
            </Form.Item>
          </>
        )}

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
  );
};

export default StorageSettings;
