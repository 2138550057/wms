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
  Alert,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined, SaveOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { outboundAPI } from '../../services/outbound.service';
import { customerAPI } from '../../services/customer.service';
import { inventoryAPI } from '../../services/inventory.service';
import { locationAPI } from '../../services/location.service';
import { settingsAPI } from '../../services/settings.service';
import type { Customer, Inventory, Location, BusinessType } from '../../types';
import dayjs from 'dayjs';

interface OutboundFormProps {
  onSuccess?: () => void;
}

const OutboundForm: React.FC<OutboundFormProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [items, setItems] = useState<any[]>([{ key: 0 }]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
  const [stockWarnings, setStockWarnings] = useState<Record<number, string>>({});
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
      const response = await settingsAPI.getBusinessTypesByCategory('outbound', true);
      if (response.success) {
        setBusinessTypes(response.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadInventory = async (customerId: number) => {
    try {
      const response: any = await inventoryAPI.list({ customerId, size: 1000 });
      if (response.success) {
        setInventoryList(response.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCustomerChange = (value: number, option: any) => {
    setSelectedCustomerId(value);
    form.setFieldValue('customerName', option.label);
    loadInventory(value);
  };

  const checkItemStock = (index: number, warehouseEntryNo: string, quantity: number) => {
    if (!warehouseEntryNo || !quantity) return;

    const inventory = inventoryList.find(inv => inv.warehouseEntryNo === warehouseEntryNo);
    if (!inventory) {
      setStockWarnings({
        ...stockWarnings,
        [index]: '该进仓编号不存在库存记录'
      });
    } else if (inventory.availableQuantity < quantity) {
      setStockWarnings({
        ...stockWarnings,
        [index]: `库存不足! 当前可用: ${inventory.availableQuantity}`
      });
    } else {
      const newWarnings = { ...stockWarnings };
      delete newWarnings[index];
      setStockWarnings(newWarnings);
    }
  };

  const onFinish = async (values: any) => {
    // 检查是否有库存警告
    if (Object.keys(stockWarnings).length > 0) {
      message.error('存在库存不足的商品,无法提交');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...values,
        outboundDate: values.outboundDate.format('YYYY-MM-DD'),
      };

      const response: any = await outboundAPI.create(data);
      if (response.success) {
        message.success('出库单创建成功!');
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/outbound');
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
      title: '进仓编号*',
      dataIndex: 'warehouseEntryNo',
      width: 150,
      render: (_: any, record: any, index: number) => (
        <div>
          <Form.Item
            name={['items', index, 'warehouseEntryNo']}
            rules={[{ required: true, message: '请选择进仓编号' }]}
            style={{ marginBottom: 0 }}
          >
            <Select
              showSearch
              placeholder="选择进仓编号"
              disabled={!selectedCustomerId}
              onChange={(value) => {
                const inv = inventoryList.find(i => i.warehouseEntryNo === value);
                if (inv) {
                  form.setFieldValue(['items', index, 'productName'], inv.productName);
                  form.setFieldValue(['items', index, 'productModel'], inv.productModel);
                  form.setFieldValue(['items', index, 'sku'], inv.sku);
                  form.setFieldValue(['items', index, 'shippingMark'], inv.shippingMark);
                  form.setFieldValue(['items', index, 'poNumber'], inv.poNumber);
                  form.setFieldValue(['items', index, 'locationCode'], inv.locationCode);
                  form.setFieldValue(['items', index, 'packageType'], inv.packageType);
                  form.setFieldValue(['items', index, 'length'], inv.length);
                  form.setFieldValue(['items', index, 'width'], inv.width);
                  form.setFieldValue(['items', index, 'height'], inv.height);
                  form.setFieldValue(['items', index, 'unitGrossWeight'], inv.unitGrossWeight);
                  form.setFieldValue(['items', index, 'area'], inv.area);
                }
                const quantity = form.getFieldValue(['items', index, 'quantity']);
                if (quantity) {
                  checkItemStock(index, value, quantity);
                }
              }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {inventoryList.map((inv) => (
                <Select.Option key={inv.id} value={inv.warehouseEntryNo} label={inv.warehouseEntryNo}>
                  {inv.warehouseEntryNo} (可用: {inv.availableQuantity})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {stockWarnings[index] && (
            <Alert
              message={stockWarnings[index]}
              type="error"
              icon={<WarningOutlined />}
              style={{ marginTop: 4, fontSize: 12 }}
            />
          )}
        </div>
      ),
    },
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
          <Input placeholder="货名" disabled />
        </Form.Item>
      ),
    },
    {
      title: '工程编号',
      dataIndex: 'productModel',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'productModel']} style={{ marginBottom: 0 }}>
          <Input placeholder="工程编号" disabled />
        </Form.Item>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'sku']} style={{ marginBottom: 0 }}>
          <Input placeholder="SKU" disabled />
        </Form.Item>
      ),
    },
    {
      title: '唛头',
      dataIndex: 'shippingMark',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'shippingMark']} style={{ marginBottom: 0 }}>
          <Input placeholder="唛头" disabled />
        </Form.Item>
      ),
    },
    {
      title: 'PO号',
      dataIndex: 'poNumber',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'poNumber']} style={{ marginBottom: 0 }}>
          <Input placeholder="PO号" disabled />
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
            onChange={(value) => {
              const warehouseEntryNo = form.getFieldValue(['items', index, 'warehouseEntryNo']);
              if (warehouseEntryNo && value) {
                checkItemStock(index, warehouseEntryNo, value);
              }
              calculateTotalGrossWeight(index);
            }}
          />
        </Form.Item>
      ),
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      width: 150,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'locationCode']} style={{ marginBottom: 0 }}>
          <Select
            showSearch
            placeholder="选择库位"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            disabled
          >
            {locations.map((loc) => (
              <Select.Option key={loc.code} value={loc.code} label={`${loc.code} ${loc.name}`}>
                {loc.code} - {loc.name}
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
          <Input placeholder="包装形式" disabled />
        </Form.Item>
      ),
    },
    {
      title: '长(cm)',
      dataIndex: 'length',
      width: 100,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'length']} style={{ marginBottom: 0 }}>
          <InputNumber min={0} placeholder="长" style={{ width: '100%' }} disabled />
        </Form.Item>
      ),
    },
    {
      title: '宽(cm)',
      dataIndex: 'width',
      width: 100,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'width']} style={{ marginBottom: 0 }}>
          <InputNumber min={0} placeholder="宽" style={{ width: '100%' }} disabled />
        </Form.Item>
      ),
    },
    {
      title: '高(cm)',
      dataIndex: 'height',
      width: 100,
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['items', index, 'height']} style={{ marginBottom: 0 }}>
          <InputNumber min={0} placeholder="高" style={{ width: '100%' }} disabled />
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
            disabled
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
          <InputNumber min={0} placeholder="平方" style={{ width: '100%' }} disabled />
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
        outboundDate: dayjs(),
        businessType: 'sales',
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
              onChange={handleCustomerChange}
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
            label="出库日期"
            name="outboundDate"
            rules={[{ required: true, message: '请选择出库日期' }]}
            style={{ marginBottom: 0 }}
          >
            <DatePicker style={{ width: '100%' }} />
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

          <Form.Item label="收货单位" name="receivingCompany" style={{ marginBottom: 0 }}>
            <Input placeholder="收货单位" />
          </Form.Item>

          <Form.Item label="收货地址" name="receivingAddress" style={{ marginBottom: 0 }}>
            <Input placeholder="收货地址" />
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

      {!selectedCustomerId && (
        <Alert
          message="请先选择客户,才能添加出库明细"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 出库明细 - 固定高度表格 */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 600 }}>出库明细</span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addItem}
              disabled={!selectedCustomerId}
              size="small"
            >
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
            scroll={{ x: 2300 }}
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
          {!onSuccess && (
            <Button size="large" onClick={() => navigate('/outbound')}>
              取消
            </Button>
          )}
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
            disabled={Object.keys(stockWarnings).length > 0}
          >
            保存出库单
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default OutboundForm;
