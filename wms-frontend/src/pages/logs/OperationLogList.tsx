import React, { useState, useEffect } from 'react';
import { Table, Space, Input, DatePicker, Button, message, Select, Tag } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { logAPI, OperationLog } from '../../services/log.service';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;

const moduleOptions = [
  { value: 'inbound', label: '入库管理' },
  { value: 'outbound', label: '出库管理' },
  { value: 'inventory', label: '库存管理' },
  { value: 'customer', label: '客户管理' },
  { value: 'location', label: '库位管理' },
  { value: 'user', label: '用户管理' },
];

const actionOptions = [
  { value: 'create', label: '新建' },
  { value: 'update', label: '编辑' },
  { value: 'delete', label: '删除' },
  { value: 'confirm', label: '确认' },
  { value: 'reverse', label: '反审核' },
  { value: 'import', label: '导入' },
  { value: 'export', label: '导出' },
];

const actionColorMap: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  confirm: 'cyan',
  reverse: 'orange',
  import: 'purple',
  export: 'geekblue',
};

const OperationLogList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [filters, setFilters] = useState<{
    module?: string;
    action?: string;
    operatorName?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const response: any = await logAPI.getOperationLogs({
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

  const handleExport = async () => {
    try {
      message.loading('正在导出...', 0);
      const response: any = await logAPI.getOperationLogs({
        page: 1,
        size: 999999,
        ...filters,
      });

      if (response.success) {
        const excelData = response.data.map((item: OperationLog) => ({
          '发生时间': dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
          '操作人': item.operatorName,
          '模块': item.moduleName,
          '操作类型': item.actionName,
          '操作对象': item.targetNo || '-',
          '具体操作': item.description,
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        ws['!cols'] = [
          { wch: 20 },
          { wch: 12 },
          { wch: 12 },
          { wch: 10 },
          { wch: 18 },
          { wch: 50 },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '操作日志');
        XLSX.writeFile(wb, `操作日志_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);

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
      title: '发生时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      fixed: 'left' as const,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 120,
    },
    {
      title: '模块',
      dataIndex: 'moduleName',
      key: 'moduleName',
      width: 100,
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string, record: OperationLog) => (
        <Tag color={actionColorMap[action] || 'default'}>{record.actionName}</Tag>
      ),
    },
    {
      title: '操作对象',
      dataIndex: 'targetNo',
      key: 'targetNo',
      width: 150,
      render: (val: string) => val || '-',
    },
    {
      title: '具体操作',
      dataIndex: 'description',
      key: 'description',
      width: 400,
    },
  ];

  return (
    <div>
      <h2>操作日志</h2>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="模块"
            value={filters.module}
            onChange={(value) => setFilters({ ...filters, module: value })}
            style={{ width: 120 }}
            allowClear
            options={moduleOptions}
          />
          <Select
            placeholder="操作类型"
            value={filters.action}
            onChange={(value) => setFilters({ ...filters, action: value })}
            style={{ width: 120 }}
            allowClear
            options={actionOptions}
          />
          <Input
            placeholder="操作人"
            value={filters.operatorName}
            onChange={(e) => setFilters({ ...filters, operatorName: e.target.value })}
            style={{ width: 120 }}
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
        scroll={{ x: 1100 }}
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

export default OperationLogList;
