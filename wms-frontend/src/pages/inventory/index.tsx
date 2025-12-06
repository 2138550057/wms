import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, message, Tag, Select, Popconfirm, Modal, Descriptions, DatePicker, Upload, Card, Row, Col, Statistic } from 'antd';
import { SearchOutlined, DownloadOutlined, DeleteOutlined, EyeOutlined, UploadOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { inventoryAPI } from '../../services/inventory.service';
import { customerAPI } from '../../services/customer.service';
import type { Inventory, Customer } from '../../types';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;

const InventoryList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Inventory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [filters, setFilters] = useState<{
    customerName?: string;
    sku?: string;
    productName?: string;
    locationCode?: string;
    warehouseEntryNo?: string;
    productModel?: string;
    internalCode?: string;
    productCode?: string;
    shippingMark?: string;
    poNumber?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});

  // 库位导入相关状态
  const [locationImportModalVisible, setLocationImportModalVisible] = useState(false);
  const [locationImportStep, setLocationImportStep] = useState<1 | 2>(1);
  const [locationImportLoading, setLocationImportLoading] = useState(false);
  const [locationImportFileList, setLocationImportFileList] = useState<UploadFile[]>([]);
  const [locationPreviewData, setLocationPreviewData] = useState<{
    records: any[];
    totalCount: number;
    matchedCount: number;
    notFoundCount: number;
    notFound: string[];
    duplicates: { warehouseEntryNo: string; count: number }[];
    hasMore: boolean;
  } | null>(null);

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
    loadCustomers();
  }, [page, size]);

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleViewDetail = (record: Inventory) => {
    setSelectedInventory(record);
    setDetailModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response: any = await inventoryAPI.delete(id);
      if (response.success) {
        message.success('删除成功');
        loadData();
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的库存记录');
      return;
    }

    try {
      const response: any = await inventoryAPI.batchDelete(selectedRowKeys as number[]);
      if (response.success) {
        message.success(response.message || '批量删除成功');
        setSelectedRowKeys([]);
        loadData();
      }
    } catch (error: any) {
      message.error(error.message || '批量删除失败');
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      message.loading('正在导出数据...', 0);

      // 获取所有数据（不分页）
      const response: any = await inventoryAPI.list({
        page: 1,
        size: 999999,
        ...filters,
      });

      if (!response.success || !response.data || response.data.length === 0) {
        message.destroy();
        message.warning('没有数据可以导出');
        return;
      }

      // 准备Excel数据
      const excelData = response.data.map((item: Inventory) => ({
        '进仓日期': item.lastInboundDate ? dayjs(item.lastInboundDate).format('YYYY-MM-DD') : '',
        '客户': item.customerName || '',
        '进仓编号': item.warehouseEntryNo || '',
        '货名': item.productName || '',
        '工程编号': item.productModel || '',
        'CMD编号': item.sku || '',
        '内部货号': item.internalCode || '',
        'CMD料号': item.productCode || '',
        '唛头': item.shippingMark || '',
        'PO号': item.poNumber || '',
        '包装形式': item.packageType || '',
        '实收数量': item.availableQuantity || 0,
        '申报数量': item.quantity || 0,
        '库位': item.locationCode || '',
        '长(cm)': item.length || '',
        '宽(cm)': item.width || '',
        '高(cm)': item.height || '',
        '总毛重(kg)': item.totalGrossWeight || '',
        '平方(m²)': item.area ? item.area.toFixed(2) : '',
        '体积(m³)': item.volume ? item.volume.toFixed(3) : '',
        '出库日期': item.lastOutboundDate ? dayjs(item.lastOutboundDate).format('YYYY-MM-DD') : '',
        '备注': item.remark || '',
      }));

      // 创建工作簿
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '库存数据');

      // 设置列宽
      const colWidths = [
        { wch: 12 }, // 进仓日期
        { wch: 15 }, // 客户
        { wch: 15 }, // 进仓编号
        { wch: 20 }, // 货名
        { wch: 15 }, // 工程编号
        { wch: 15 }, // CMD编号
        { wch: 15 }, // 内部货号
        { wch: 15 }, // CMD料号
        { wch: 15 }, // 唛头
        { wch: 15 }, // PO号
        { wch: 12 }, // 包装形式
        { wch: 10 }, // 实收数量
        { wch: 10 }, // 申报数量
        { wch: 12 }, // 库位
        { wch: 10 }, // 长
        { wch: 10 }, // 宽
        { wch: 10 }, // 高
        { wch: 12 }, // 总毛重
        { wch: 12 }, // 平方
        { wch: 12 }, // 体积
        { wch: 12 }, // 出库日期
        { wch: 20 }, // 备注
      ];
      ws['!cols'] = colWidths;

      // 生成文件名
      const fileName = `库存数据_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;

      // 导出文件
      XLSX.writeFile(wb, fileName);

      message.destroy();
      message.success(`成功导出 ${response.data.length} 条数据`);
    } catch (error: any) {
      message.destroy();
      message.error(error.message || '导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 库位导入 - 预览
  const handleLocationPreview = async () => {
    if (locationImportFileList.length === 0) {
      message.warning('请选择文件');
      return;
    }
    setLocationImportLoading(true);
    try {
      const file = locationImportFileList[0].originFileObj as File;
      const res: any = await inventoryAPI.previewLocationImport(file);
      if (res.success) {
        setLocationPreviewData(res.data);
        setLocationImportStep(2);
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      message.error(error.message || '解析失败');
    } finally {
      setLocationImportLoading(false);
    }
  };

  // 库位导入 - 确认
  const handleLocationConfirmImport = async () => {
    if (locationImportFileList.length === 0) {
      message.warning('请选择文件');
      return;
    }
    setLocationImportLoading(true);
    try {
      const file = locationImportFileList[0].originFileObj as File;
      const res: any = await inventoryAPI.confirmLocationImport(file);
      if (res.success) {
        message.success(res.message);
        resetLocationImport();
        loadData();
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      message.error(error.message || '导入失败');
    } finally {
      setLocationImportLoading(false);
    }
  };

  // 重置库位导入状态
  const resetLocationImport = () => {
    setLocationImportModalVisible(false);
    setLocationImportStep(1);
    setLocationImportFileList([]);
    setLocationPreviewData(null);
  };

  // 下载库位导入模板
  const handleDownloadLocationTemplate = () => {
    const token = localStorage.getItem('token');
    const url = inventoryAPI.getLocationTemplateUrl();
    window.open(`${url}?token=${token}`, '_blank');
  };

  // Calculate summary totals for current page only
  const summaryData = {
    totalQuantity: data.reduce((sum, item) => sum + (item.quantity || 0), 0),
    totalVolume: data.reduce((sum, item) => sum + (item.volume || 0), 0),
    totalWeight: data.reduce((sum, item) => sum + (item.totalGrossWeight || 0), 0),
    totalArea: data.reduce((sum, item) => sum + (item.area || 0), 0),
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  const columns = [
    {
      title: '进仓日期',
      dataIndex: 'lastInboundDate',
      key: 'lastInboundDate',
      width: 110,
      fixed: 'left' as const,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '进仓编号',
      dataIndex: 'warehouseEntryNo',
      key: 'warehouseEntryNo',
      width: 140,
      fixed: 'left' as const,
      render: (val: string) => val || '-',
    },
    {
      title: '货名',
      dataIndex: 'productName',
      key: 'productName',
      width: 150,
    },
    {
      title: '工程编号',
      dataIndex: 'productModel',
      key: 'productModel',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: 'CMD编号',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
    },
    {
      title: '内部货号',
      dataIndex: 'internalCode',
      key: 'internalCode',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: 'CMD料号',
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
      title: '包装形式',
      dataIndex: 'packageType',
      key: 'packageType',
      width: 100,
      render: (val: string) => val || '-',
    },
    {
      title: '实收数量',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 90,
      render: (val: number) => <Tag color="green">{val}</Tag>,
    },
    {
      title: '申报数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      render: (val: number) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      key: 'locationCode',
      width: 100,
    },
    {
      title: '长(cm)',
      dataIndex: 'length',
      key: 'length',
      width: 90,
      render: (val: number) => val || '-',
    },
    {
      title: '宽(cm)',
      dataIndex: 'width',
      key: 'width',
      width: 90,
      render: (val: number) => val || '-',
    },
    {
      title: '高(cm)',
      dataIndex: 'height',
      key: 'height',
      width: 90,
      render: (val: number) => val || '-',
    },
    {
      title: '总毛重(kg)',
      dataIndex: 'totalGrossWeight',
      key: 'totalGrossWeight',
      width: 110,
      render: (val: number) => val || '-',
    },
    {
      title: '平方(m²)',
      dataIndex: 'area',
      key: 'area',
      width: 100,
      render: (val: number) => val ? val.toFixed(2) : '-',
    },
    {
      title: '体积(m³)',
      dataIndex: 'volume',
      key: 'volume',
      width: 100,
      render: (val: number) => val ? val.toFixed(3) : '-',
    },
    {
      title: '出库日期',
      dataIndex: 'lastOutboundDate',
      key: 'lastOutboundDate',
      width: 110,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      render: (val: string) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Inventory) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Popconfirm
            title="确认删除该库存记录?"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>库存管理</h2>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
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
            placeholder="进仓编号"
            value={filters.warehouseEntryNo}
            onChange={(e) => setFilters({ ...filters, warehouseEntryNo: e.target.value })}
            style={{ width: 140 }}
            allowClear
          />
          <Input
            placeholder="货名"
            value={filters.productName}
            onChange={(e) => setFilters({ ...filters, productName: e.target.value })}
            style={{ width: 140 }}
            allowClear
          />
          <Input
            placeholder="工程编号"
            value={filters.productModel}
            onChange={(e) => setFilters({ ...filters, productModel: e.target.value })}
            style={{ width: 120 }}
            allowClear
          />
          <Input
            placeholder="CMD编号"
            value={filters.sku}
            onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
            style={{ width: 140 }}
            allowClear
          />
          <Input
            placeholder="内部货号"
            value={filters.internalCode}
            onChange={(e) => setFilters({ ...filters, internalCode: e.target.value })}
            style={{ width: 120 }}
            allowClear
          />
          <Input
            placeholder="CMD料号"
            value={filters.productCode}
            onChange={(e) => setFilters({ ...filters, productCode: e.target.value })}
            style={{ width: 120 }}
            allowClear
          />
          <Input
            placeholder="唛头"
            value={filters.shippingMark}
            onChange={(e) => setFilters({ ...filters, shippingMark: e.target.value })}
            style={{ width: 120 }}
            allowClear
          />
          <Input
            placeholder="PO号"
            value={filters.poNumber}
            onChange={(e) => setFilters({ ...filters, poNumber: e.target.value })}
            style={{ width: 120 }}
            allowClear
          />
          <Input
            placeholder="库位"
            value={filters.locationCode}
            onChange={(e) => setFilters({ ...filters, locationCode: e.target.value })}
            style={{ width: 100 }}
            allowClear
          />
          <RangePicker
            placeholder={['进仓开始', '进仓结束']}
            style={{ width: 220 }}
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
        </Space>
        <Space>
          <Button
            type="default"
            icon={<UploadOutlined />}
            onClick={() => setLocationImportModalVisible(true)}
          >
            导入库位
          </Button>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={loading}
          >
            导出Excel
          </Button>
        </Space>
      </div>

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#e6f7ff', borderRadius: 4 }}>
          <Space>
            <span>已选择 {selectedRowKeys.length} 项</span>
            <Popconfirm
              title={`确认删除选中的 ${selectedRowKeys.length} 条库存记录?`}
              onConfirm={handleBatchDelete}
              okText="确认"
              cancelText="取消"
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                批量删除
              </Button>
            </Popconfirm>
            <Button size="small" onClick={() => setSelectedRowKeys([])}>
              取消选择
            </Button>
          </Space>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        rowSelection={rowSelection}
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
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold', borderTop: '2px solid #e8e8e8' }}>
              <Table.Summary.Cell index={0}></Table.Summary.Cell>
              <Table.Summary.Cell index={1}>当前页合计:</Table.Summary.Cell>
              <Table.Summary.Cell index={2}></Table.Summary.Cell>
              <Table.Summary.Cell index={3}></Table.Summary.Cell>
              <Table.Summary.Cell index={4}></Table.Summary.Cell>
              <Table.Summary.Cell index={5}></Table.Summary.Cell>
              <Table.Summary.Cell index={6}></Table.Summary.Cell>
              <Table.Summary.Cell index={7}></Table.Summary.Cell>
              <Table.Summary.Cell index={8}></Table.Summary.Cell>
              <Table.Summary.Cell index={9}></Table.Summary.Cell>
              <Table.Summary.Cell index={10}></Table.Summary.Cell>
              <Table.Summary.Cell index={11}></Table.Summary.Cell>
              <Table.Summary.Cell index={12}>{summaryData.totalQuantity}</Table.Summary.Cell>
              <Table.Summary.Cell index={13}></Table.Summary.Cell>
              <Table.Summary.Cell index={14}></Table.Summary.Cell>
              <Table.Summary.Cell index={15}></Table.Summary.Cell>
              <Table.Summary.Cell index={16}></Table.Summary.Cell>
              <Table.Summary.Cell index={17}>{summaryData.totalWeight.toFixed(2)}</Table.Summary.Cell>
              <Table.Summary.Cell index={18}>{summaryData.totalArea.toFixed(2)}</Table.Summary.Cell>
              <Table.Summary.Cell index={19}>{summaryData.totalVolume.toFixed(3)}</Table.Summary.Cell>
              <Table.Summary.Cell index={20}></Table.Summary.Cell>
              <Table.Summary.Cell index={21}></Table.Summary.Cell>
              <Table.Summary.Cell index={22}></Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      <Modal
        title="库存详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={800}
      >
        {selectedInventory && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="进仓日期">
              {selectedInventory.lastInboundDate ? dayjs(selectedInventory.lastInboundDate).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="进仓编号">
              {selectedInventory.warehouseEntryNo || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="客户名称">
              {selectedInventory.customerName}
            </Descriptions.Item>
            <Descriptions.Item label="货名">
              {selectedInventory.productName}
            </Descriptions.Item>
            <Descriptions.Item label="工程编号">
              {selectedInventory.productModel || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="CMD编号">
              {selectedInventory.sku}
            </Descriptions.Item>
            <Descriptions.Item label="内部货号">
              {selectedInventory.internalCode || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="CMD料号">
              {selectedInventory.productCode || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="唛头">
              {selectedInventory.shippingMark || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="PO号">
              {selectedInventory.poNumber || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="包装形式">
              {selectedInventory.packageType || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="库位">
              {selectedInventory.locationCode}
            </Descriptions.Item>
            <Descriptions.Item label="实收数量">
              <Tag color="green">{selectedInventory.availableQuantity}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="申报数量">
              <Tag color="blue">{selectedInventory.quantity}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="可用数量">
              {selectedInventory.availableQuantity}
            </Descriptions.Item>
            <Descriptions.Item label="锁定数量">
              {selectedInventory.lockedQuantity}
            </Descriptions.Item>
            <Descriptions.Item label="长(cm)">
              {selectedInventory.length || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="宽(cm)">
              {selectedInventory.width || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="高(cm)">
              {selectedInventory.height || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="单件毛重(kg)">
              {selectedInventory.unitGrossWeight || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="总毛重(kg)">
              {selectedInventory.totalGrossWeight || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="平方(m²)">
              {selectedInventory.area ? selectedInventory.area.toFixed(2) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="体积(m³)">
              {selectedInventory.volume ? selectedInventory.volume.toFixed(3) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="出库日期">
              {selectedInventory.lastOutboundDate ? dayjs(selectedInventory.lastOutboundDate).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {selectedInventory.remark || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 库位导入弹窗 */}
      <Modal
        title={locationImportStep === 1 ? '导入库位 - 选择文件' : '导入库位 - 预览确认'}
        open={locationImportModalVisible}
        onCancel={resetLocationImport}
        width={locationImportStep === 2 ? 1000 : 520}
        footer={
          locationImportStep === 1 ? (
            <>
              <Button onClick={resetLocationImport}>取消</Button>
              <Button
                type="primary"
                onClick={handleLocationPreview}
                loading={locationImportLoading}
                disabled={locationImportFileList.length === 0}
              >
                下一步：预览数据
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => { setLocationImportStep(1); setLocationPreviewData(null); }}>
                上一步
              </Button>
              <Button onClick={resetLocationImport}>取消</Button>
              <Button
                type="primary"
                onClick={handleLocationConfirmImport}
                loading={locationImportLoading}
              >
                确认导入
              </Button>
            </>
          )
        }
      >
        {locationImportStep === 1 ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <p>请上传包含【进仓编号】和【库位】列的Excel文件（.xlsx 或 .xls）</p>
              <p>导入将根据进仓编号匹配库存记录并更新库位信息</p>
              <p>
                <Button type="link" onClick={handleDownloadLocationTemplate} style={{ padding: 0 }}>
                  点击下载导入模板
                </Button>
              </p>
            </div>
            <Upload
              accept=".xlsx,.xls"
              maxCount={1}
              fileList={locationImportFileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setLocationImportFileList(fileList)}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </>
        ) : (
          locationPreviewData && (
            <div>
              {/* 统计信息 */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="总记录数" value={locationPreviewData.totalCount} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="可匹配记录"
                      value={locationPreviewData.matchedCount}
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="未找到进仓编号"
                      value={locationPreviewData.notFoundCount}
                      valueStyle={{ color: locationPreviewData.notFoundCount > 0 ? '#faad14' : '#52c41a' }}
                      prefix={locationPreviewData.notFoundCount > 0 ? <WarningOutlined /> : null}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="重复进仓编号"
                      value={locationPreviewData.duplicates.length}
                      valueStyle={{ color: locationPreviewData.duplicates.length > 0 ? '#faad14' : '#52c41a' }}
                      prefix={locationPreviewData.duplicates.length > 0 ? <WarningOutlined /> : null}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 重复提醒 */}
              {locationPreviewData.duplicates.length > 0 && (
                <div style={{ marginBottom: 16, padding: 12, background: '#fffbe6', borderRadius: 4, border: '1px solid #ffe58f' }}>
                  <div style={{ color: '#d48806', marginBottom: 8 }}>
                    <WarningOutlined /> 以下进仓编号在文件中重复出现（后面的值会覆盖前面的）：
                  </div>
                  {locationPreviewData.duplicates.slice(0, 5).map((d, i) => (
                    <div key={i} style={{ color: '#666' }}>
                      {d.warehouseEntryNo} (出现 {d.count} 次)
                    </div>
                  ))}
                  {locationPreviewData.duplicates.length > 5 && (
                    <div style={{ color: '#999' }}>...还有 {locationPreviewData.duplicates.length - 5} 个重复</div>
                  )}
                </div>
              )}

              {/* 未找到提醒 */}
              {locationPreviewData.notFoundCount > 0 && (
                <div style={{ marginBottom: 16, padding: 12, background: '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
                  <div style={{ color: '#d46b08', marginBottom: 8 }}>
                    <WarningOutlined /> 以下进仓编号在库存中不存在（将跳过）：
                  </div>
                  {locationPreviewData.notFound.slice(0, 10).map((no, i) => (
                    <Tag key={i} color="orange" style={{ marginBottom: 4 }}>{no}</Tag>
                  ))}
                  {locationPreviewData.notFoundCount > 10 && (
                    <div style={{ color: '#999', marginTop: 4 }}>...还有 {locationPreviewData.notFoundCount - 10} 个未找到</div>
                  )}
                </div>
              )}

              {/* 预览提示 */}
              {locationPreviewData.hasMore && (
                <div style={{ marginBottom: 8, color: '#faad14' }}>
                  仅显示前 100 条记录预览，实际导入将处理全部 {locationPreviewData.totalCount} 条记录
                </div>
              )}

              {/* 预览表格 */}
              <Table
                size="small"
                dataSource={locationPreviewData.records}
                rowKey="_rowIndex"
                scroll={{ y: 300 }}
                pagination={false}
                columns={[
                  { title: '行号', dataIndex: '_rowIndex', width: 60 },
                  { title: '进仓编号', dataIndex: 'warehouseEntryNo', width: 140 },
                  { title: '新库位', dataIndex: 'locationCode', width: 100 },
                  {
                    title: '匹配状态',
                    dataIndex: 'matchCount',
                    width: 100,
                    render: (count: number) => count > 0 ? (
                      <Tag color="green">匹配 {count} 条</Tag>
                    ) : (
                      <Tag color="orange">未找到</Tag>
                    ),
                  },
                  { title: '当前库位', dataIndex: 'currentLocation', width: 100, render: (v: string) => v || '-' },
                  { title: '货名', dataIndex: 'productName', width: 150, ellipsis: true, render: (v: string) => v || '-' },
                  { title: '客户', dataIndex: 'customerName', width: 120, ellipsis: true, render: (v: string) => v || '-' },
                ]}
              />
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

export default InventoryList;
