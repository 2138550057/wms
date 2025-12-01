import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, DatePicker, message, Popconfirm, Select, Modal } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, DeleteOutlined, DownloadOutlined, CheckOutlined, RollbackOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { outboundAPI } from '../../services/outbound.service';
import { customerAPI } from '../../services/customer.service';
import type { OutboundOrder, Customer } from '../../types';
import dayjs from 'dayjs';
import { exportToExcelWithHeaders } from '../../utils/excel';
import OutboundForm from './OutboundForm';
import OutboundDetailModal from '@/components/OutboundDetailModal';

const { RangePicker } = DatePicker;

const OutboundList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OutboundOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [filters, setFilters] = useState<{
    customerName?: string;
    orderNo?: string;
    receivingCompany?: string;
    receivingAddress?: string;
    vehicleNumber?: string;
    dateFrom?: string;
    dateTo?: string;
    businessType?: string;
    status?: string;
  }>({});

  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const response: any = await outboundAPI.list({
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

  const handleDelete = async (id: number, force = false) => {
    try {
      const response: any = force ? await outboundAPI.forceDelete(id) : await outboundAPI.delete(id);
      if (response.success) {
        message.success(force ? '强制删除成功' : '删除成功');
        loadData();
      }
    } catch (error: any) {
      const errorMsg = error.message || '删除失败';
      // 如果错误消息中包含"强制删除"相关字样，提示用户可以强制删除
      if (!force && (errorMsg.includes('强制删除') || errorMsg.includes('反审核'))) {
        Modal.confirm({
          title: '删除失败',
          content: (
            <div>
              <p style={{ color: 'red' }}>{errorMsg}</p>
              <p style={{ marginTop: 12 }}>是否<strong style={{ color: 'red' }}>强制删除</strong>？</p>
              <p style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                警告：强制删除已完成的出库单将恢复库存，此操作不可恢复！
              </p>
            </div>
          ),
          okText: '强制删除',
          okButtonProps: { danger: true },
          cancelText: '取消',
          onOk: () => handleDelete(id, true),
        });
      } else {
        message.error(errorMsg);
      }
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的出库单');
      return;
    }

    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个出库单吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          let successCount = 0;
          let failCount = 0;

          for (const id of selectedRowKeys) {
            try {
              const response: any = await outboundAPI.delete(id as number);
              if (response.success) {
                successCount++;
              } else {
                failCount++;
              }
            } catch (error) {
              failCount++;
            }
          }

          if (successCount > 0) {
            message.success(`成功删除 ${successCount} 个出库单${failCount > 0 ? `，失败 ${failCount} 个` : ''}`);
            setSelectedRowKeys([]);
            loadData();
          } else {
            message.error('删除失败');
          }
        } catch (error: any) {
          message.error(error.message || '批量删除失败');
        }
      },
    });
  };

  const handleConfirm = async (id: number) => {
    try {
      const response: any = await outboundAPI.confirm(id);
      if (response.success) {
        message.success('确认出库成功');
        loadData();
      }
    } catch (error: any) {
      message.error(error.message || '确认出库失败');
    }
  };

  const handleBatchConfirm = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要确认出库的单据');
      return;
    }

    // 检查是否有非待处理状态的订单
    const selectedOrders = data.filter(item => selectedRowKeys.includes(item.id));
    const nonPendingOrders = selectedOrders.filter(item => item.status !== 'pending');

    if (nonPendingOrders.length > 0) {
      message.warning('只能确认待处理状态的出库单');
      return;
    }

    Modal.confirm({
      title: '批量确认出库',
      content: `确定要批量确认 ${selectedRowKeys.length} 个出库单吗？确认后将扣减库存。`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          let successCount = 0;
          let failCount = 0;
          const errors: string[] = [];

          for (const id of selectedRowKeys) {
            try {
              const response: any = await outboundAPI.confirm(id as number);
              if (response.success) {
                successCount++;
              } else {
                failCount++;
                errors.push(`单号${id}: ${response.message}`);
              }
            } catch (error: any) {
              failCount++;
              errors.push(`单号${id}: ${error.message}`);
            }
          }

          if (successCount > 0) {
            message.success(`成功确认 ${successCount} 个出库单${failCount > 0 ? `，失败 ${failCount} 个` : ''}`);
            setSelectedRowKeys([]);
            loadData();
          } else {
            message.error('批量确认失败');
          }

          // 如果有失败的，显示详细错误
          if (errors.length > 0) {
            Modal.error({
              title: '部分确认失败',
              content: (
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                  {errors.map((err, idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>{err}</div>
                  ))}
                </div>
              ),
            });
          }
        } catch (error: any) {
          message.error(error.message || '批量确认失败');
        }
      },
    });
  };

  const handleReverseAudit = async (id: number) => {
    try {
      const response: any = await outboundAPI.reverseAudit(id);
      if (response.success) {
        message.success('反出库成功');
        loadData();
      }
    } catch (error: any) {
      message.error(error.message || '反出库失败');
    }
  };

  const handleExport = () => {
    const headers = {
      orderNo: '出库单号',
      customerName: '客户名称',
      outboundDate: '出库日期',
      receivingCompany: '收货单位',
      receivingAddress: '收货地址',
      vehicleNumber: '车牌号',
      businessType: '业务类型',
      totalQuantity: '总件数',
      totalVolume: '总体积(m³)',
      totalWeight: '总重量(kg)',
      status: '状态',
      createdAt: '创建时间',
    };

    const exportData = data.map(item => ({
      ...item,
      outboundDate: dayjs(item.outboundDate).format('YYYY-MM-DD'),
      createdAt: dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      totalVolume: item.totalVolume?.toFixed(2),
      totalWeight: item.totalWeight?.toFixed(2),
      status: item.status === 'completed' ? '已完成' : '待处理',
      businessType: item.businessType === 'sales' ? '销售出库' : item.businessType === 'return' ? '退货出库' : '调拨出库',
    }));

    exportToExcelWithHeaders(exportData, headers, `出库单-${dayjs().format('YYYY-MM-DD')}.xlsx`, '出库单');
    message.success('导出成功');
  };

  // Calculate summary totals for current page only
  const summaryData = {
    totalQuantity: data.reduce((sum, item) => sum + (item.totalQuantity || 0), 0),
    totalVolume: data.reduce((sum, item) => sum + (item.totalVolume || 0), 0),
    totalWeight: data.reduce((sum, item) => sum + (item.totalWeight || 0), 0),
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(selectedRowKeys);
    },
  };

  const columns = [
    {
      title: '出库单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      fixed: 'left' as const,
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
    },
    {
      title: '出库日期',
      dataIndex: 'outboundDate',
      key: 'outboundDate',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '业务类型',
      dataIndex: 'businessType',
      key: 'businessType',
      width: 100,
      render: (type: string) => {
        const typeMap: any = {
          sales: '销售出库',
          return: '退货出库',
          transfer: '调拨出库',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '申报数量',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 80,
    },
    {
      title: '体积(m³)',
      dataIndex: 'totalVolume',
      key: 'totalVolume',
      width: 90,
      render: (val: number) => val?.toFixed(2) || '-',
    },
    {
      title: '重量(kg)',
      dataIndex: 'totalWeight',
      key: 'totalWeight',
      width: 90,
      render: (val: number) => val?.toFixed(2) || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => status === 'completed' ? '已完成' : '待处理',
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
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right' as const,
      render: (_: any, record: OutboundOrder) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Popconfirm
              title="确认出库后将扣减库存，确定要执行吗?"
              onConfirm={() => handleConfirm(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="primary" size="small" icon={<CheckOutlined />}>
                确认出库
              </Button>
            </Popconfirm>
          )}
          {record.status === 'completed' && (
            <Popconfirm
              title="反出库将恢复库存，确定要执行吗?"
              onConfirm={() => handleReverseAudit(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="default" size="small" icon={<RollbackOutlined />}>
                反出库
              </Button>
            </Popconfirm>
          )}
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/outbound/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedOrderId(record.id);
              setDetailVisible(true);
            }}
          >
            详情
          </Button>
          <Popconfirm
            title="确认删除?"
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
            placeholder="出库单号"
            value={filters.orderNo}
            onChange={(e) => setFilters({ ...filters, orderNo: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="收货单位"
            value={filters.receivingCompany}
            onChange={(e) => setFilters({ ...filters, receivingCompany: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Select
            placeholder="业务类型"
            value={filters.businessType}
            onChange={(value) => setFilters({ ...filters, businessType: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="sales">销售出库</Select.Option>
            <Select.Option value="return">退货出库</Select.Option>
            <Select.Option value="transfer">调拨出库</Select.Option>
          </Select>
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
          <Input
            placeholder="收货地址"
            value={filters.receivingAddress}
            onChange={(e) => setFilters({ ...filters, receivingAddress: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="车牌号"
            value={filters.vehicleNumber}
            onChange={(e) => setFilters({ ...filters, vehicleNumber: e.target.value })}
            style={{ width: 120 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出Excel
          </Button>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          新建出库单
        </Button>
      </div>

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#e6f7ff', borderRadius: 4 }}>
          <Space>
            <span>已选择 {selectedRowKeys.length} 项</span>
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={handleBatchConfirm}>
              批量确认出库
            </Button>
            <Button danger size="small" icon={<DeleteOutlined />} onClick={handleBatchDelete}>
              批量删除
            </Button>
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
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold', borderTop: '2px solid #e8e8e8' }}>
              <Table.Summary.Cell index={0}></Table.Summary.Cell>
              <Table.Summary.Cell index={1}>当前页合计:</Table.Summary.Cell>
              <Table.Summary.Cell index={2}></Table.Summary.Cell>
              <Table.Summary.Cell index={3}></Table.Summary.Cell>
              <Table.Summary.Cell index={4}></Table.Summary.Cell>
              <Table.Summary.Cell index={5}>{summaryData.totalQuantity}</Table.Summary.Cell>
              <Table.Summary.Cell index={6}>{summaryData.totalVolume.toFixed(2)}</Table.Summary.Cell>
              <Table.Summary.Cell index={7}>{summaryData.totalWeight.toFixed(2)}</Table.Summary.Cell>
              <Table.Summary.Cell index={8}></Table.Summary.Cell>
              <Table.Summary.Cell index={9}></Table.Summary.Cell>
              <Table.Summary.Cell index={10}></Table.Summary.Cell>
              <Table.Summary.Cell index={11}></Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      <Modal
        title="新建出库单"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={1400}
        destroyOnClose
      >
        <OutboundForm
          onSuccess={() => {
            setModalOpen(false);
            loadData();
          }}
        />
      </Modal>

      {/* 详情弹窗 */}
      <OutboundDetailModal
        visible={detailVisible}
        orderId={selectedOrderId}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedOrderId(null);
        }}
        onEdit={(id) => {
          setDetailVisible(false);
          navigate(`/outbound/edit/${id}`);
        }}
        onReload={loadData}
      />
    </div>
  );
};

export default OutboundList;
