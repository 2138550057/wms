import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  DatePicker,
  Select,
  Table,
  InputNumber,
  Space,
  message,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { inboundAPI } from '../../services/inbound.service';
import { customerAPI } from '../../services/customer.service';
import { locationAPI } from '../../services/location.service';
import { settingsAPI } from '../../services/settings.service';
import type { Customer, Location, BusinessType } from '../../types';
import dayjs from 'dayjs';

interface InboundFormProps {
  onSuccess?: () => void;
}

const InboundForm: React.FC<InboundFormProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [items, setItems] = useState<any[]>([{ key: 0 }]);
  const navigate = useNavigate();

  useEffect(() => {
    loadLocations();
    loadCustomers();
    loadBusinessTypes();
  }, []);

  const loadLocations = async () => {
    try {
      const response: any = await locationAPI.getActive();
      if (response.success) {
        setLocations(response.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response: any = await customerAPI.list({ page: 1, size: 1000 });
      if (response.success) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadBusinessTypes = async () => {
    try {
      const response = await settingsAPI.getBusinessTypesByCategory('inbound', true);
      if (response.success) {
        setBusinessTypes(response.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        inboundDate: values.inboundDate.format('YYYY-MM-DD'),
      };

      const response: any = await inboundAPI.create(data);
      if (response.success) {
        message.success('入库单创建成功!');
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/inbound');
        }
      }
    } catch (error: any) {
      message.error(error.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { key: Date.now() }]);
  };

  const removeItem = (key: number) => {
    if (items.length <= 1) {
      message.warning('至少保留一条明细');
      return;
    }
    setItems(items.filter((item) => item.key !== key));
  };

  // 计算总毛重 = 单件毛重 × 件数
  const calculateTotalGrossWeight = (index: number) => {
    const formItems = form.getFieldValue('items') || [];
    const item = formItems[index];
    if (item && item.unitGrossWeight && item.quantity) {
      const totalGrossWeight = item.unitGrossWeight * item.quantity;
      form.setFieldValue(['items', index, 'totalGrossWeight'], totalGrossWeight);
    }
  };

  const itemColumns = [
    {
      title: '货名*',
      dataIndex: 'productName',
      width: 150,
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['items', index, 'productName']}
          rules={[{ required: true, message: '请输入货名' }]}
          style={{ marginBottom: 0 }}
        >
          <Input placeholder="货名" />
        </Form.Item>
      ),
    },
    {
      title: '工程编号',
      dataIndex: 'productModel',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'productModel']} style={{ marginBottom: 0 }}>
          <Input placeholder="工程编号" />
        </Form.Item>
      ),
    },
    {
      title: 'CMD编号',
      dataIndex: 'sku',
      width: 150,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'sku']} style={{ marginBottom: 0 }}>
          <Input placeholder="CMD编号" />
        </Form.Item>
      ),
    },
    {
      title: '内部货号',
      dataIndex: 'internalCode',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'internalCode']} style={{ marginBottom: 0 }}>
          <Input placeholder="内部货号" />
        </Form.Item>
      ),
    },
    {
      title: 'CMD料号',
      dataIndex: 'productCode',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'productCode']} style={{ marginBottom: 0 }}>
          <Input placeholder="CMD料号" />
        </Form.Item>
      ),
    },
    {
      title: '唛头',
      dataIndex: 'shippingMark',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'shippingMark']} style={{ marginBottom: 0 }}>
          <Input placeholder="唛头" />
        </Form.Item>
      ),
    },
    {
      title: 'PO号',
      dataIndex: 'poNumber',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'poNumber']} style={{ marginBottom: 0 }}>
          <Input placeholder="PO号" />
        </Form.Item>
      ),
    },
    {
      title: '申报数量*',
      dataIndex: 'quantity',
      width: 100,
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['items', index, 'quantity']}
          rules={[{ required: true, message: '请输入申报数量' }]}
          style={{ marginBottom: 0 }}
        >
          <InputNumber
            min={1}
            placeholder="申报数量"
            style={{ width: '100%' }}
            onChange={() => calculateTotalGrossWeight(index)}
          />
        </Form.Item>
      ),
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      width: 180,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'locationCode']} style={{ marginBottom: 0 }}>
          <Select
            showSearch
            allowClear
            placeholder="选择库位"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children?.toString().toLowerCase() ?? '').includes(input.toLowerCase())
            }
          >
            {locations.map((loc) => (
              <Select.Option key={loc.code} value={loc.code}>
                {loc.code}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      ),
    },
    {
      title: '包装形式',
      dataIndex: 'packageType',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'packageType']} style={{ marginBottom: 0 }}>
          <Input placeholder="包装形式" />
        </Form.Item>
      ),
    },
    {
      title: '长(cm)',
      dataIndex: 'length',
      width: 100,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'length']} style={{ marginBottom: 0 }}>
          <InputNumber min={0} placeholder="长" style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      title: '宽(cm)',
      dataIndex: 'width',
      width: 100,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'width']} style={{ marginBottom: 0 }}>
          <InputNumber min={0} placeholder="宽" style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      title: '高(cm)',
      dataIndex: 'height',
      width: 100,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'height']} style={{ marginBottom: 0 }}>
          <InputNumber min={0} placeholder="高" style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      title: '单件毛重(kg)',
      dataIndex: 'unitGrossWeight',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'unitGrossWeight']} style={{ marginBottom: 0 }}>
          <InputNumber
            min={0}
            placeholder="单件毛重"
            style={{ width: '100%' }}
            onChange={() => calculateTotalGrossWeight(index)}
          />
        </Form.Item>
      ),
    },
    {
      title: '总毛重(kg)',
      dataIndex: 'totalGrossWeight',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'totalGrossWeight']} style={{ marginBottom: 0 }}>
          <InputNumber min={0} placeholder="总毛重" style={{ width: '100%' }} disabled />
        </Form.Item>
      ),
    },
    {
      title: '平方(m²)',
      dataIndex: 'area',
      width: 100,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'area']} style={{ marginBottom: 0 }}>
          <InputNumber min={0} placeholder="平方" style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 150,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'remark']} style={{ marginBottom: 0 }}>
          <Input placeholder="备注" />
        </Form.Item>
      ),
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Button
          type="link"
          danger
          icon={<MinusCircleOutlined />}
          onClick={() => removeItem(record.key)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        inboundDate: dayjs(),
        businessType: 'normal',
      }}
    >
      {/* 基本信息 - 紧凑型4列布局 */}
      <Card
        title={<span style={{ fontSize: '16px', fontWeight: 600 }}>基本信息</span>}
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 12px' }}>
            <Form.Item
              label="客户"
              name="customerId"
              rules={[{ required: true, message: '请选择客户' }]}
              style={{ marginBottom: 0 }}
            >
              <Select
                showSearch
                placeholder="选择客户"
                onChange={(value, option: any) => {
                  form.setFieldValue('customerName', option.label);
                }}
                filterOption={(input, option) =>
                  (option?.label?.toString().toLowerCase() ?? '').includes(input.toLowerCase()) ||
                  (option?.children?.toString().toLowerCase() ?? '').includes(input.toLowerCase())
                }
              >
                {customers.map((c) => (
                  <Select.Option key={c.id} value={c.id} label={c.name}>
                    {c.name} ({c.code})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="customerName" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              label="入库日期"
              name="inboundDate"
              rules={[{ required: true, message: '请选择入库日期' }]}
              style={{ marginBottom: 0 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="进仓编号"
              name="warehouseEntryNo"
              rules={[{ required: true, message: '请输入进仓编号' }]}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="进仓编号" />
            </Form.Item>

            <Form.Item label="业务类型" name="businessType" style={{ marginBottom: 0 }}>
              <Select placeholder="请选择业务类型">
                {businessTypes.map((type) => (
                  <Select.Option key={type.id} value={type.code}>
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="实收件数" name="actualQuantity" style={{ marginBottom: 0 }}>
              <InputNumber min={0} placeholder="实收件数" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="车牌号" name="vehicleNumber" style={{ marginBottom: 0 }}>
              <Input placeholder="车牌号" />
            </Form.Item>

            <Form.Item label="司机姓名" name="driverName" style={{ marginBottom: 0 }}>
              <Input placeholder="司机姓名" />
            </Form.Item>

            <Form.Item label="联系人" name="contactPerson" style={{ marginBottom: 0 }}>
              <Input placeholder="联系人" />
            </Form.Item>

            <Form.Item label="联系电话" name="contactPhone" style={{ marginBottom: 0 }}>
              <Input placeholder="联系电话" />
            </Form.Item>
          </div>

          <Form.Item label="备注" name="remark" style={{ marginTop: 16, marginBottom: 0 }}>
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Card>

        {/* 入库明细 - 固定高度表格 */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>入库明细</span>
              <Button type="primary" icon={<PlusOutlined />} onClick={addItem} size="small">
                添加明细
              </Button>
            </div>
          }
          bodyStyle={{ padding: '0' }}
          style={{ marginBottom: 16 }}
        >
          <div style={{ maxHeight: '500px', overflow: 'auto' }}>
            <Table
              dataSource={items}
              columns={itemColumns}
              pagination={false}
              scroll={{ x: 2200 }}
              size="small"
              sticky
            />
          </div>
        </Card>

        {/* 底部操作按钮 */}
        <div style={{
          textAlign: 'center',
          padding: '16px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Space size="large">
            <Button size="large" onClick={() => navigate('/inbound')}>
              取消
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              保存入库单
            </Button>
          </Space>
      </div>
    </Form>
  );
};

export default InboundForm;
