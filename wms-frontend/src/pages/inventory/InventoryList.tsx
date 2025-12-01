import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, message, Tag } from 'antd';
import { SearchOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { inventoryAPI } from '../../services/inventory.service';
import type { Inventory } from '../../types';
import dayjs from 'dayjs';
import { exportToExcelWithHeaders } from '../../utils/excel';

const InventoryList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Inventory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [filters, setFilters] = useState<{
    customerName?: string;
    sku?: string;
    productName?: string;
    locationCode?: string;
  }>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const response: any = await inventoryAPI.list({
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

  const handleExport = () => {
    const headers = {
      sku: 'SKU',
      productName: '货名',
      productModel: '型号',
      productCode: '编号',
      shippingMark: '唛头',
      poNumber: 'PO号',
      customerName: '客户名称',
      locationCode: '库位',
      packageType: '包装形式',
      quantity: '总数量',
      availableQuantity: '可用数量',
      lockedQuantity: '锁定数量',
      length: '长(cm)',
      width: '宽(cm)',
      height: '高(cm)',
      weight: '重量(kg)',
      volume: '体积(m³)',
      lastInboundDate: '最后入库日期',
      lastOutboundDate: '最后出库日期',
      age: '库龄(天)',
      createdAt: '创建时间',
      remark: '备注',
    };

    const exportData = data.map(item => {
      const age = item.lastInboundDate
        ? dayjs().diff(dayjs(item.lastInboundDate), 'day')
        : null;

      return {
        ...item,
        lastInboundDate: item.lastInboundDate
          ? dayjs(item.lastInboundDate).format('YYYY-MM-DD HH:mm:ss')
          : '',
        lastOutboundDate: item.lastOutboundDate
          ? dayjs(item.lastOutboundDate).format('YYYY-MM-DD HH:mm:ss')
          : '',
        createdAt: dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        volume: item.volume ? item.volume.toFixed(4) : '',
        age: age !== null ? age : '',
      };
    });

    exportToExcelWithHeaders(exportData, headers, `库存清单-${dayjs().format('YYYY-MM-DD')}.xlsx`, '库存清单');
    message.success('导出成功');
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 150,
      fixed: 'left' as const,
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
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      key: 'locationCode',
      width: 100,
    },
    {
      title: '总数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (val: number) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: '可用数量',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 100,
      render: (val: number) => <Tag color="green">{val}</Tag>,
    },
    {
      title: '锁定数量',
      dataIndex: 'lockedQuantity',
      key: 'lockedQuantity',
      width: 100,
      render: (val: number) => val > 0 ? <Tag color="red">{val}</Tag> : <Tag>{val}</Tag>,
    },
    {
      title: '长宽高(cm)',
      key: 'dimensions',
      width: 120,
      render: (_: any, record: Inventory) =>
        record.length && record.width && record.height
          ? `${record.length}×${record.width}×${record.height}`
          : '-',
    },
    {
      title: '重量(kg)',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
    },
    {
      title: '最后入库',
      dataIndex: 'lastInboundDate',
      key: 'lastInboundDate',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '最后出库',
      dataIndex: 'lastOutboundDate',
      key: 'lastOutboundDate',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '库龄(天)',
      key: 'age',
      width: 100,
      render: (_: any, record: Inventory) => {
        if (!record.lastInboundDate) return '-';
        const days = dayjs().diff(dayjs(record.lastInboundDate), 'day');
        return days;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: Inventory) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/inventory/${record.id}`)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2>库存管理</h2>

      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="客户名称"
            value={filters.customerName}
            onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
            style={{ width: 200 }}
            allowClear
          />
          <Input
            placeholder="SKU"
            value={filters.sku}
            onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
            style={{ width: 200 }}
            allowClear
          />
          <Input
            placeholder="货名"
            value={filters.productName}
            onChange={(e) => setFilters({ ...filters, productName: e.target.value })}
            style={{ width: 200 }}
            allowClear
          />
          <Input
            placeholder="库位"
            value={filters.locationCode}
            onChange={(e) => setFilters({ ...filters, locationCode: e.target.value })}
            style={{ width: 150 }}
            allowClear
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
        scroll={{ x: 1700 }}
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

export default InventoryList;
