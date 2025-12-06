import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  message,
  Popconfirm,
  Modal,
  Form,
  InputNumber,
  Upload,
  Statistic,
  Row,
  Col,
  Tooltip,
  Tag,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import secondaryInventoryService, {
  SecondaryInventory,
  SecondaryInventoryStats,
} from '../../services/secondaryInventory.service';

const SecondaryInventoryList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SecondaryInventory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [stats, setStats] = useState<SecondaryInventoryStats | null>(null);

  // 筛选条件
  const [filters, setFilters] = useState({
    cmdUnifiedNo: '',
    billOfLadingNo: '',
    internalCode: '',
    customsDeclarationNo: '',
    packingListNo: '',
    customsName: '',
  });

  // 编辑弹窗
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SecondaryInventory | null>(null);
  const [editForm] = Form.useForm();

  // 导入弹窗
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [importStep, setImportStep] = useState<1 | 2>(1); // 1=选择文件, 2=预览确认
  const [previewData, setPreviewData] = useState<{
    records: any[];
    totalCount: number;
    cmdNoCount: number;
    errors: { row: number; message: string }[];
    hasMore: boolean;
  } | null>(null);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await secondaryInventoryService.list({
        page,
        size: pageSize,
        ...filters,
      });
      if (res.success) {
        setData(res.data);
        setTotal(res.total);
      }
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计
  const loadStats = async () => {
    try {
      const res: any = await secondaryInventoryService.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  useEffect(() => {
    loadStats();
  }, []);

  // 搜索
  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({
      cmdUnifiedNo: '',
      billOfLadingNo: '',
      internalCode: '',
      customsDeclarationNo: '',
      packingListNo: '',
      customsName: '',
    });
    setPage(1);
    setTimeout(loadData, 0);
  };

  // 编辑
  const handleEdit = (record: SecondaryInventory) => {
    setEditingRecord(record);
    editForm.setFieldsValue(record);
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      if (editingRecord) {
        await secondaryInventoryService.update(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await secondaryInventoryService.create(values);
        message.success('创建成功');
      }
      setEditModalVisible(false);
      setEditingRecord(null);
      editForm.resetFields();
      loadData();
      loadStats();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 删除
  const handleDelete = async (id: number) => {
    try {
      await secondaryInventoryService.delete(id);
      message.success('删除成功');
      loadData();
      loadStats();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的记录');
      return;
    }
    try {
      await secondaryInventoryService.batchDelete(selectedRowKeys as number[]);
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      loadData();
      loadStats();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 预览导入
  const handlePreview = async () => {
    if (fileList.length === 0) {
      message.warning('请选择文件');
      return;
    }
    setImportLoading(true);
    try {
      const file = fileList[0].originFileObj as File;
      const res: any = await secondaryInventoryService.previewImport(file);
      if (res.success) {
        setPreviewData(res.data);
        setImportStep(2);
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      message.error(error.message || '解析失败');
    } finally {
      setImportLoading(false);
    }
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (fileList.length === 0) {
      message.warning('请选择文件');
      return;
    }
    setImportLoading(true);
    try {
      const file = fileList[0].originFileObj as File;
      const res: any = await secondaryInventoryService.confirmImport(file);
      if (res.success) {
        message.success(res.message);
        setImportModalVisible(false);
        setFileList([]);
        setImportStep(1);
        setPreviewData(null);
        loadData();
        loadStats();
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      message.error(error.message || '导入失败');
    } finally {
      setImportLoading(false);
    }
  };

  // 重置导入状态
  const resetImport = () => {
    setImportModalVisible(false);
    setFileList([]);
    setImportStep(1);
    setPreviewData(null);
  };

  // 导出
  const handleExport = () => {
    const token = localStorage.getItem('token');
    const url = secondaryInventoryService.export(filters);
    // 检查URL是否已有参数，决定用 ? 或 &
    const separator = url.includes('?') ? '&' : '?';
    window.open(`${url}${separator}token=${token}`, '_blank');
  };

  // 下载模板
  const handleDownloadTemplate = () => {
    const token = localStorage.getItem('token');
    const url = secondaryInventoryService.getTemplateUrl();
    window.open(`${url}?token=${token}`, '_blank');
  };

  // 表格列
  const columns: ColumnsType<SecondaryInventory> = [
    {
      title: 'CMD统一编号',
      dataIndex: 'cmdUnifiedNo',
      key: 'cmdUnifiedNo',
      width: 150,
      fixed: 'left',
      render: (text) => (
        <Tooltip title={text}>
          <Tag color="blue">{text}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '行号',
      dataIndex: 'rowNumber',
      key: 'rowNumber',
      width: 70,
    },
    {
      title: '提单号',
      dataIndex: 'billOfLadingNo',
      key: 'billOfLadingNo',
      width: 130,
      ellipsis: true,
    },
    {
      title: '内部货号',
      dataIndex: 'internalCode',
      key: 'internalCode',
      width: 120,
      ellipsis: true,
    },
    {
      title: '报关单号',
      dataIndex: 'customsDeclarationNo',
      key: 'customsDeclarationNo',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'CMD料号',
      dataIndex: 'cmdPartNo',
      key: 'cmdPartNo',
      width: 150,
      ellipsis: true,
    },
    {
      title: '装箱单号',
      dataIndex: 'packingListNo',
      key: 'packingListNo',
      width: 180,
      ellipsis: true,
    },
    {
      title: '报关名称',
      dataIndex: 'customsName',
      key: 'customsName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '申报数量',
      dataIndex: 'declaredQuantity',
      key: 'declaredQuantity',
      width: 100,
      align: 'right',
    },
    {
      title: '申报总价',
      dataIndex: 'declaredValue',
      key: 'declaredValue',
      width: 120,
      align: 'right',
      render: (val) => val?.toLocaleString(),
    },
    {
      title: '产销国',
      dataIndex: 'countryCode',
      key: 'countryCode',
      width: 80,
    },
    {
      title: '币种',
      dataIndex: 'currencyCode',
      key: 'currencyCode',
      width: 80,
    },
    {
      title: '进出口',
      dataIndex: 'importExportFlag',
      key: 'importExportFlag',
      width: 70,
      render: (val) => (val === 'I' ? '进口' : val === 'E' ? '出口' : val),
    },
    {
      title: '用途',
      dataIndex: 'purpose',
      key: 'purpose',
      width: 80,
    },
    {
      title: '工程编号',
      dataIndex: 'projectNo',
      key: 'projectNo',
      width: 140,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
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
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总记录数"
              value={stats?.totalRecords || 0}
              prefix={<FileExcelOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="关联进仓编号数"
              value={stats?.uniqueCmdNos || 0}
              prefix={<LinkOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索区域 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="CMD统一编号"
            value={filters.cmdUnifiedNo}
            onChange={(e) => setFilters({ ...filters, cmdUnifiedNo: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="提单号"
            value={filters.billOfLadingNo}
            onChange={(e) => setFilters({ ...filters, billOfLadingNo: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="内部货号"
            value={filters.internalCode}
            onChange={(e) => setFilters({ ...filters, internalCode: e.target.value })}
            style={{ width: 130 }}
            allowClear
          />
          <Input
            placeholder="报关单号"
            value={filters.customsDeclarationNo}
            onChange={(e) =>
              setFilters({ ...filters, customsDeclarationNo: e.target.value })
            }
            style={{ width: 180 }}
            allowClear
          />
          <Input
            placeholder="装箱单号"
            value={filters.packingListNo}
            onChange={(e) => setFilters({ ...filters, packingListNo: e.target.value })}
            style={{ width: 180 }}
            allowClear
          />
          <Input
            placeholder="报关名称"
            value={filters.customsName}
            onChange={(e) => setFilters({ ...filters, customsName: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>

      {/* 操作按钮 */}
      <Card
        size="small"
        title="二级库存（箱内明细）"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRecord(null);
                editForm.resetFields();
                setEditModalVisible(true);
              }}
            >
              新增
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
              导入
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={handleDownloadTemplate}>
              下载模板
            </Button>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`确定删除选中的 ${selectedRowKeys.length} 条记录吗？`}
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />}>
                  批量删除 ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 2000 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, s) => {
              setPage(p);
              setPageSize(s);
            },
          }}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑记录' : '新增记录'}
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingRecord(null);
          editForm.resetFields();
        }}
        width={800}
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="cmdUnifiedNo"
                label="CMD统一编号"
                rules={[{ required: true, message: '请输入CMD统一编号' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="rowNumber" label="行号">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="billOfLadingNo" label="提单号">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="internalCode" label="内部货号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cmdPartNo" label="CMD料号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="customsDeclarationNo" label="报关单号">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="packingListNo" label="装箱单号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customsName" label="报关名称">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="declaredQuantity" label="申报数量">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="declaredValue" label="申报总价">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="countryCode" label="产销国">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="currencyCode" label="币种">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="importExportFlag" label="进出口标记">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="purpose" label="用途">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="dutyFreeType" label="征免方式">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="projectNo" label="工程编号">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="legalQuantity" label="法定数量">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="secondQuantity" label="第二数量">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="writeOffCount" label="核销次数">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="exportFlag" label="导出标志">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bomStartDate" label="BOM开始有效期">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitProject" label="单位工程">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入弹窗 */}
      <Modal
        title={importStep === 1 ? '导入Excel - 选择文件' : '导入Excel - 预览确认'}
        open={importModalVisible}
        onCancel={resetImport}
        width={importStep === 2 ? 1000 : 520}
        footer={
          importStep === 1 ? (
            <>
              <Button onClick={resetImport}>取消</Button>
              <Button
                type="primary"
                onClick={handlePreview}
                loading={importLoading}
                disabled={fileList.length === 0}
              >
                下一步：预览数据
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => { setImportStep(1); setPreviewData(null); }}>
                上一步
              </Button>
              <Button onClick={resetImport}>取消</Button>
              <Button
                type="primary"
                onClick={handleConfirmImport}
                loading={importLoading}
              >
                确认导入
              </Button>
            </>
          )
        }
      >
        {importStep === 1 ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <p>请上传符合模板格式的Excel文件（.xlsx 或 .xls）</p>
              <p>
                <Button type="link" onClick={handleDownloadTemplate} style={{ padding: 0 }}>
                  点击下载导入模板
                </Button>
              </p>
            </div>
            <Upload
              accept=".xlsx,.xls"
              maxCount={1}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </>
        ) : (
          previewData && (
            <div>
              {/* 统计信息 */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Card size="small">
                    <Statistic title="总记录数" value={previewData.totalCount} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic title="CMD统一编号数" value={previewData.cmdNoCount} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="解析错误数"
                      value={previewData.errors.length}
                      valueStyle={{ color: previewData.errors.length > 0 ? '#ff4d4f' : '#52c41a' }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 错误提示 */}
              {previewData.errors.length > 0 && (
                <div style={{ marginBottom: 16, padding: 12, background: '#fff2f0', borderRadius: 4 }}>
                  <div style={{ color: '#ff4d4f', marginBottom: 8 }}>以下行数据有问题（已跳过）：</div>
                  {previewData.errors.slice(0, 5).map((err, i) => (
                    <div key={i} style={{ color: '#666' }}>
                      第 {err.row} 行: {err.message}
                    </div>
                  ))}
                  {previewData.errors.length > 5 && (
                    <div style={{ color: '#999' }}>...还有 {previewData.errors.length - 5} 条错误</div>
                  )}
                </div>
              )}

              {/* 预览提示 */}
              {previewData.hasMore && (
                <div style={{ marginBottom: 8, color: '#faad14' }}>
                  仅显示前 100 条记录预览，实际导入将包含全部 {previewData.totalCount} 条记录
                </div>
              )}

              {/* 预览表格 */}
              <Table
                size="small"
                dataSource={previewData.records}
                rowKey="_rowIndex"
                scroll={{ x: 1200, y: 300 }}
                pagination={false}
                columns={[
                  { title: '行号', dataIndex: '_rowIndex', width: 60, fixed: 'left' },
                  { title: 'CMD统一编号', dataIndex: 'cmdUnifiedNo', width: 140 },
                  { title: '提单号', dataIndex: 'billOfLadingNo', width: 130, ellipsis: true },
                  { title: '内部货号', dataIndex: 'internalCode', width: 100, ellipsis: true },
                  { title: '报关单号', dataIndex: 'customsDeclarationNo', width: 160, ellipsis: true },
                  { title: 'CMD料号', dataIndex: 'cmdPartNo', width: 120, ellipsis: true },
                  { title: '装箱单号', dataIndex: 'packingListNo', width: 160, ellipsis: true },
                  { title: '报关名称', dataIndex: 'customsName', width: 180, ellipsis: true },
                  { title: '申报数量', dataIndex: 'declaredQuantity', width: 80, align: 'right' },
                ]}
              />
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

export default SecondaryInventoryList;
