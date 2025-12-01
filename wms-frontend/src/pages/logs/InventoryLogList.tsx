import React, { useState, useEffect } from 'react';
import { Table, Space, Input, DatePicker, Button, message, Select, Tag } from 'antd';
import { SearchOutlined, DownloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { logAPI, InventoryLog } from '../../services/log.service';
import { customerAPI } from '../../services/customer.service';
import type { Customer } from '../../types';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;

const InventoryLogList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InventoryLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filters, setFilters] = useState<{
    customerName?: string;
    orderNo?: string;
    warehouseEntryNo?: string;
    dateFrom?: string;
    dateTo?: string;
    operationType?: 'inbound' | 'outbound' | 'all';
  }>({ operationType: 'all' });

  const loadData = async () => {
    setLoading(true);
    try {
      const response: any = await logAPI.getInventoryLogs({
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

  useEffect(() => {
    loadData();
  }, [page, size]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleExport = async () => {
    try {
      message.loading('正在导出...', 0);
      const response: any = await logAPI.getInventoryLogs({
        page: 1,
        size: 999999,
        ...filters,
      });

      if (response.success) {
        const excelData = response.data.map((item: InventoryLog) => ({
          '操作时间': dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
          '操作类型': item.operationTypeName,
          '单号': item.orderNo,
          '客户名称': item.customerName,
          '业务类型': item.businessTypeName,
          '进仓编号': item.warehouseEntryNo || '',
          '货名': item.productName || '',
          '型号': item.productModel || '',
          'SKU': item.sku || '',
          '编号': item.productCode || '',
          '库位': item.locationCode || '',
          '数量变更': item.quantityChange,
          '体积(m³)': item.volume?.toFixed(2) || '',
          '重量(kg)': item.weight?.toFixed(2) || '',
          '状态': item.statusName,
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        ws['!cols'] = [
          { wch: 18 },
          { wch: 12 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 15 },
          { wch: 20 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 },
          { wch: 10 },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '库存日志');
        XLSX.writeFile(wb, `库存日志_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);

        message.destroy();
        message.success('导出成功');
      }
    } catch (error: any) {
      message.destroy();
      message.error(error.message || '导出失败');
    }
  };

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      fixed: 'left' as const,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      key: 'operationType',
      width: 100,
      fixed: 'left' as const,
      render: (type: string, record: InventoryLog) => (
        <Tag
          icon={type === 'inbound' ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
          color={type === 'inbound' ? 'success' : 'warning'}
        >
          {record.operationTypeName}
        </Tag>
      ),
    },
    {
      title: '单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
    },
    {
      title: '业务类型',
      dataIndex: 'businessTypeName',
      key: 'businessTypeName',
      width: 100,
    },
    {
      title: '进仓编号',
      dataIndex: 'warehouseEntryNo',
      key: 'warehouseEntryNo',
      width: 140,
      render: (val: string) => val || '-',
    },
    {
      title: '货名',
      dataIndex: 'productName',
      key: 'productName',
      width: 150,
    },
    {
      title: '型号',
      dataIndex: 'productModel',
      key: 'productModel',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: '编号',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      key: 'locationCode',
      width: 100,
      render: (val: string) => val || '-',
    },
    {
      title: '数量变更',
      dataIndex: 'quantityChange',
      key: 'quantityChange',
      width: 100,
      render: (val: string, record: InventoryLog) => (
        <span style={{ color: record.operationType === 'inbound' ? '#52c41a' : '#faad14', fontWeight: 'bold' }}>
          {val}
        </span>
      ),
    },
    {
      title: '体积(m³)',
      dataIndex: 'volume',
      key: 'volume',
      width: 90,
      render: (val: number) => val?.toFixed(2) || '-',
    },
    {
      title: '重量(kg)',
      dataIndex: 'weight',
      key: 'weight',
      width: 90,
      render: (val: number) => val?.toFixed(2) || '-',
    },
    {
      title: '状态',
      dataIndex: 'statusName',
      key: 'statusName',
      width: 80,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="操作类型"
            value={filters.operationType}
            onChange={(value) => setFilters({ ...filters, operationType: value })}
            style={{ width: 120 }}
          >
            <Select.Option value="all">全部</Select.Option>
            <Select.Option value="inbound">入库</Select.Option>
            <Select.Option value="outbound">出库</Select.Option>
          </Select>
          <Select
            showSearch
            placeholder="客户名称"
            value={filters.customerName}
            onChange={(value) => setFilters({ ...filters, customerName: value })}
            style={{ width: 150 }}
            allowClear
            filterOption={(input, option) =>
              (option?.children?.toString().toLowerCase() ?? '').includes(input.toLowerCase())
            }
          >
            {customers.map((c) => (
              <Select.Option key={c.id} value={c.name}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
          <Input
            placeholder="单号"
            value={filters.orderNo}
            onChange={(e) => setFilters({ ...filters, orderNo: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="进仓编号"
            value={filters.warehouseEntryNo}
            onChange={(e) => setFilters({ ...filters, warehouseEntryNo: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            onChange={(dates) => {
              if (dates) {
                setFilters({
                  ...filters,
                  dateFrom: dates[0]?.format('YYYY-MM-DD'),
                  dateTo: dates[1]?.format('YYYY-MM-DD'),
                });
              } else {
                setFilters({ ...filters, dateFrom: undefined, dateTo: undefined });
              }
            }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出Excel
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1800 }}
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

export default InventoryLogList;
