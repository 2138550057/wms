import React, { useState, useEffect } from 'react';
import { Table, Space, Input, DatePicker, Button, message, Select } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { logAPI, InboundLog } from '../../services/log.service';
import { customerAPI } from '../../services/customer.service';
import type { Customer } from '../../types';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;

const InboundLogList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InboundLog[]>([]);
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
  }>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const response: any = await logAPI.getInboundLogs({
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
      const response: any = await logAPI.getInboundLogs({
        page: 1,
        size: 999999,
        ...filters,
      });

      if (response.success) {
        const excelData = response.data.map((item: InboundLog) => ({
          '入库日期': dayjs(item.inboundDate).format('YYYY-MM-DD'),
          '入库单号': item.orderNo,
          '进仓编号': item.warehouseEntryNo || '',
          '客户名称': item.customerName,
          '业务类型':
            item.businessType === 'normal'
              ? '正常入库'
              : item.businessType === 'return'
              ? '退货入库'
              : '调拨入库',
          '货名': item.productName || '',
          '型号': item.productModel || '',
          'SKU': item.sku || '',
          '编号': item.productCode || '',
          '唛头': item.shippingMark || '',
          'PO号': item.poNumber || '',
          '库位': item.locationCode || '',
          '包装形式': item.packageType || '',
          '件数': item.quantity,
          '长(cm)': item.length || '',
          '宽(cm)': item.width || '',
          '高(cm)': item.height || '',
          '体积(m³)': item.volume?.toFixed(2) || '',
          '重量(kg)': item.weight?.toFixed(2) || '',
          '状态': item.status === 'completed' ? '已完成' : '待处理',
          '创建时间': dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
          '备注': item.remark || '',
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        ws['!cols'] = [
          { wch: 12 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 20 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 12 },
          { wch: 10 },
          { wch: 10 },
          { wch: 10 },
          { wch: 10 },
          { wch: 12 },
          { wch: 12 },
          { wch: 10 },
          { wch: 18 },
          { wch: 20 },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '入库日志');
        XLSX.writeFile(wb, `入库日志_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);

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
      title: '入库日期',
      dataIndex: 'inboundDate',
      key: 'inboundDate',
      width: 110,
      fixed: 'left' as const,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '入库单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      fixed: 'left' as const,
    },
    {
      title: '进仓编号',
      dataIndex: 'warehouseEntryNo',
      key: 'warehouseEntryNo',
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
      dataIndex: 'businessType',
      key: 'businessType',
      width: 100,
      render: (type: string) => {
        const typeMap: any = {
          normal: '正常入库',
          return: '退货入库',
          transfer: '调拨入库',
        };
        return typeMap[type] || type;
      },
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
      title: '唛头',
      dataIndex: 'shippingMark',
      key: 'shippingMark',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: 'PO号',
      dataIndex: 'poNumber',
      key: 'poNumber',
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
      title: '包装形式',
      dataIndex: 'packageType',
      key: 'packageType',
      width: 100,
      render: (val: string) => val || '-',
    },
    {
      title: '件数',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '长(cm)',
      dataIndex: 'length',
      key: 'length',
      width: 80,
      render: (val: number) => val || '-',
    },
    {
      title: '宽(cm)',
      dataIndex: 'width',
      key: 'width',
      width: 80,
      render: (val: number) => val || '-',
    },
    {
      title: '高(cm)',
      dataIndex: 'height',
      key: 'height',
      width: 80,
      render: (val: number) => val || '-',
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
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (status === 'completed' ? '已完成' : '待处理'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      render: (val: string) => val || '-',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
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
            placeholder="入库单号"
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
        scroll={{ x: 2400 }}
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

export default InboundLogList;
