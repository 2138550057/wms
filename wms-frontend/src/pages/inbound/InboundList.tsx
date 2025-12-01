import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, DatePicker, message, Popconfirm, Select, Modal, Upload } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, DeleteOutlined, DownloadOutlined, CheckOutlined, RollbackOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { inboundAPI } from '../../services/inbound.service';
import { customerAPI } from '../../services/customer.service';
import type { InboundOrder, Customer } from '../../types';
import dayjs from 'dayjs';
import { exportToExcelWithHeaders } from '../../utils/excel';
import InboundForm from './InboundForm';
import InboundDetailModal from '@/components/InboundDetailModal';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;

const InboundList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InboundOrder[]>([]);
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
    warehouseEntryNo?: string;
    deliveryCompany?: string;
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
      const response: any = await inboundAPI.list({
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
      const response: any = force ? await inboundAPI.forceDelete(id) : await inboundAPI.delete(id);
      if (response.success) {
        message.success(force ? '强制删除成功' : '删除成功');
        loadData();
      }
    } catch (error: any) {
      const errorMsg = error.message || '删除失败';
      // 如果错误消息中包含"强制删除"相关字样，提示用户可以强制删除
      if (!force && (errorMsg.includes('强制删除') || errorMsg.includes('库存') || errorMsg.includes('出库记录'))) {
        Modal.confirm({
          title: '删除失败',
          content: (
            <div>
              <p style={{ color: 'red' }}>{errorMsg}</p>
              <p style={{ marginTop: 12 }}>是否<strong style={{ color: 'red' }}>强制删除</strong>？</p>
              <p style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                警告：强制删除将同时删除相关的库存记录，此操作不可恢复！
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
      message.warning('请选择要删除的入库单');
      return;
    }

    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个入库单吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          let successCount = 0;
          let failCount = 0;
          const errors: string[] = [];

          for (const id of selectedRowKeys) {
            try {
              const response: any = await inboundAPI.delete(id as number);
              if (response.success) {
                successCount++;
              } else {
                failCount++;
                if (response.message) {
                  errors.push(`订单ID ${id}: ${response.message}`);
                }
              }
            } catch (error: any) {
              failCount++;
              const errorMsg = error.response?.data?.message || error.message || '未知错误';
              errors.push(`订单ID ${id}: ${errorMsg}`);
            }
          }

          if (successCount > 0) {
            message.success(`成功删除 ${successCount} 个入库单${failCount > 0 ? `，失败 ${failCount} 个` : ''}`);
            setSelectedRowKeys([]);
            loadData();
          }

          if (errors.length > 0) {
            Modal.error({
              title: '删除失败详情',
              content: (
                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                  {errors.map((err, index) => (
                    <div key={index} style={{ marginBottom: '8px' }}>
                      {err}
                    </div>
                  ))}
                </div>
              ),
              width: 600,
            });
          }
        } catch (error: any) {
          message.error(error.message || '批量删除失败');
        }
      },
    });
  };

  const handleConfirm = async (id: number) => {
    try {
      const response: any = await inboundAPI.confirm(id);
      if (response.success) {
        message.success('确认入库成功');
        loadData();
      }
    } catch (error: any) {
      message.error(error.message || '确认入库失败');
    }
  };

  const handleBatchConfirm = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要确认入库的单据');
      return;
    }

    // 自动过滤出待处理状态的订单
    const selectedOrders = data.filter(item => selectedRowKeys.includes(item.id));
    const pendingOrders = selectedOrders.filter(item => item.status === 'pending');
    const skippedCount = selectedRowKeys.length - pendingOrders.length;

    if (pendingOrders.length === 0) {
      message.warning('选中的订单中没有待处理状态的入库单');
      return;
    }

    const pendingOrderIds = pendingOrders.map(order => order.id);

    Modal.confirm({
      title: '批量确认入库',
      content: (
        <div>
          <p>确定要批量确认 {pendingOrders.length} 个入库单吗？确认后将更新库存。</p>
          {skippedCount > 0 && (
            <p style={{ color: '#faad14', marginTop: 8 }}>
              提示：已自动跳过 {skippedCount} 个非待处理状态的订单
            </p>
          )}
        </div>
      ),
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          let successCount = 0;
          let failCount = 0;
          const errors: string[] = [];

          for (const id of pendingOrderIds) {
            try {
              const response: any = await inboundAPI.confirm(id as number);
              if (response.success) {
                successCount++;
              } else {
                failCount++;
                errors.push(`订单ID ${id}: ${response.message}`);
              }
            } catch (error: any) {
              failCount++;
              const errorMsg = error.response?.data?.message || error.message || '未知错误';
              errors.push(`订单ID ${id}: ${errorMsg}`);
            }
          }

          if (successCount > 0) {
            message.success(`成功确认 ${successCount} 个入库单${failCount > 0 ? `，失败 ${failCount} 个` : ''}`);
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
      const response: any = await inboundAPI.reverseAudit(id);
      if (response.success) {
        message.success('反入库成功');
        loadData();
      }
    } catch (error: any) {
      message.error(error.message || '反入库失败');
    }
  };

  const handleBatchReverseAudit = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要反入库的入库单');
      return;
    }

    // 自动过滤出已完成状态的订单
    const selectedOrders = data.filter(item => selectedRowKeys.includes(item.id));
    const completedOrders = selectedOrders.filter(item => item.status === 'completed');
    const skippedCount = selectedRowKeys.length - completedOrders.length;

    if (completedOrders.length === 0) {
      message.warning('选中的订单中没有已完成状态的入库单');
      return;
    }

    const completedOrderIds = completedOrders.map(order => order.id);

    Modal.confirm({
      title: '批量反入库确认',
      content: (
        <div>
          <p>反入库将扣减库存，确定要对 {completedOrders.length} 个入库单执行反入库操作吗？</p>
          {skippedCount > 0 && (
            <p style={{ color: '#faad14', marginTop: 8 }}>
              提示：已自动跳过 {skippedCount} 个非已完成状态的订单
            </p>
          )}
        </div>
      ),
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          let successCount = 0;
          let failCount = 0;
          const errors: string[] = [];

          for (const id of completedOrderIds) {
            try {
              const response: any = await inboundAPI.reverseAudit(id as number);
              if (response.success) {
                successCount++;
              } else {
                failCount++;
                if (response.message) {
                  errors.push(`订单ID ${id}: ${response.message}`);
                }
              }
            } catch (error: any) {
              failCount++;
              const errorMsg = error.response?.data?.message || error.message || '未知错误';
              errors.push(`订单ID ${id}: ${errorMsg}`);
            }
          }

          if (successCount > 0) {
            message.success(`成功反入库 ${successCount} 个订单${failCount > 0 ? `，失败 ${failCount} 个` : ''}`);
            setSelectedRowKeys([]);
            loadData();
          }

          if (errors.length > 0) {
            Modal.error({
              title: '反入库失败详情',
              content: (
                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                  {errors.map((err, index) => (
                    <div key={index} style={{ marginBottom: '8px' }}>
                      {err}
                    </div>
                  ))}
                </div>
              ),
              width: 600,
            });
          }
        } catch (error: any) {
          message.error(error.message || '批量反入库失败');
        }
      },
    });
  };

  const handleExport = () => {
    const headers = {
      orderNo: '入库单号',
      customerName: '客户名称',
      inboundDate: '入库日期',
      deliveryCompany: '送货单位',
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
      inboundDate: dayjs(item.inboundDate).format('YYYY-MM-DD'),
      createdAt: dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      totalVolume: item.totalVolume?.toFixed(2),
      totalWeight: item.totalWeight?.toFixed(2),
      status: item.status === 'completed' ? '已完成' : '待处理',
      businessType: item.businessType === 'normal' ? '普通入库' : item.businessType === 'return' ? '退货入库' : '调拨入库',
    }));

    exportToExcelWithHeaders(exportData, headers, `入库单-${dayjs().format('YYYY-MM-DD')}.xlsx`, '入库单');
    message.success('导出成功');
  };

  const handleDownloadTemplate = () => {
    // 创建导入模板（包含明细数据）
    const templateData = [
      {
        '客户名称': '示例客户',
        '进仓编号': 'WE20251112001',
        '入库日期': '2025/11/10',
        '业务类型': '普通入库',
        '送货单位': '示例物流',
        '车牌号': '粤A12345',
        '司机姓名': '张三',
        '联系人': '李四',
        '联系电话': '13800138000',
        '备注': '入库单备注',
        // 明细字段
        '货名': 'iPhone 15 Pro',
        '型号': '256GB',
        'CMD编号': 'IP15P-256-BLK',
        '内部货号': 'INT001',
        'CMD料号': 'P001',
        '唛头': 'APPLE',
        'PO号': 'PO2025001',
        '库位': 'A01-01-01',
        '包装形式': '纸箱',
        '件数': 100,
        '长(cm)': 50,
        '宽(cm)': 40,
        '高(cm)': 30,
        '单件毛重(kg)': 0.5,
        '平方(m²)': 0.2,
        '明细备注': '货物完好',
      },
      {
        '客户名称': '示例客户',
        '进仓编号': 'WE20251112001',
        '入库日期': '2025/11/10',
        '业务类型': '普通入库',
        '送货单位': '示例物流',
        '车牌号': '粤A12345',
        '司机姓名': '张三',
        '联系人': '李四',
        '联系电话': '13800138000',
        '备注': '入库单备注',
        // 第二个明细
        '货名': 'iPhone 15',
        '型号': '128GB',
        'CMD编号': 'IP15-128-WHT',
        '内部货号': 'INT002',
        'CMD料号': 'P002',
        '唛头': 'APPLE',
        'PO号': 'PO2025001',
        '库位': 'A01-01-02',
        '包装形式': '纸箱',
        '件数': 50,
        '长(cm)': 45,
        '宽(cm)': 35,
        '高(cm)': 25,
        '单件毛重(kg)': 0.4,
        '平方(m²)': 0.15,
        '明细备注': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '入库单导入模板');

    // 设置列宽
    ws['!cols'] = [
      { wch: 15 }, // 客户名称
      { wch: 18 }, // 进仓编号
      { wch: 12 }, // 入库日期
      { wch: 12 }, // 业务类型
      { wch: 15 }, // 送货单位
      { wch: 12 }, // 车牌号
      { wch: 12 }, // 司机姓名
      { wch: 12 }, // 联系人
      { wch: 15 }, // 联系电话
      { wch: 20 }, // 备注
      { wch: 20 }, // 货名
      { wch: 15 }, // 型号
      { wch: 18 }, // SKU
      { wch: 12 }, // 编号
      { wch: 12 }, // 唛头
      { wch: 15 }, // PO号
      { wch: 12 }, // 库位
      { wch: 12 }, // 包装形式
      { wch: 10 }, // 件数
      { wch: 10 }, // 长
      { wch: 10 }, // 宽
      { wch: 10 }, // 高
      { wch: 15 }, // 单件毛重
      { wch: 12 }, // 平方
      { wch: 20 }, // 明细备注
    ];

    XLSX.writeFile(wb, `入库单导入模板_${dayjs().format('YYYYMMDD')}.xlsx`);
    message.success('模板下载成功');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          message.warning('Excel文件中没有数据');
          return;
        }

        message.loading({ content: '正在导入数据...', key: 'import', duration: 0 });

        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        // 按进仓编号分组数据
        const groupedData: any = {};
        jsonData.forEach((row, index) => {
          const entryNo = row['进仓编号'];
          if (!entryNo) {
            errors.push(`第${index + 2}行：进仓编号不能为空`);
            return;
          }

          if (!groupedData[entryNo]) {
            groupedData[entryNo] = {
              header: row,
              items: [],
              startRow: index + 2,
            };
          }

          // 添加明细数据
          if (row['货名']) {
            groupedData[entryNo].items.push({
              row,
              rowNum: index + 2,
            });
          }
        });

        // 批量导入每个入库单
        for (const entryNo in groupedData) {
          const group = groupedData[entryNo];
          const headerRow = group.header;

          try {
            // 验证必填字段
            if (!headerRow['客户名称']) {
              errors.push(`进仓编号"${entryNo}"：客户名称不能为空`);
              failCount++;
              continue;
            }

            if (!headerRow['入库日期']) {
              errors.push(`进仓编号"${entryNo}"：入库日期不能为空`);
              failCount++;
              continue;
            }

            if (group.items.length === 0) {
              errors.push(`进仓编号"${entryNo}"：至少需要一条明细数据`);
              failCount++;
              continue;
            }

            // 查找客户ID
            const customer = customers.find(c => c.name === headerRow['客户名称']);
            if (!customer) {
              errors.push(`进仓编号"${entryNo}"：客户"${headerRow['客户名称']}"不存在`);
              failCount++;
              continue;
            }

            // 业务类型映射
            const businessTypeMap: any = {
              '普通入库': 'normal',
              '退货入库': 'return',
              '调拨入库': 'transfer',
            };
            const businessType = businessTypeMap[headerRow['业务类型']] || 'normal';

            // 构建明细数据
            const items = group.items.map((item: any) => {
              const row = item.row;
              const quantity = Number(row['件数']) || 0;
              const unitGrossWeight = Number(row['单件毛重(kg)']) || 0;
              const length = Number(row['长(cm)']) || 0;
              const width = Number(row['宽(cm)']) || 0;
              const height = Number(row['高(cm)']) || 0;
              const area = Number(row['平方(m²)']) || 0;

              // 验证明细必填字段
              if (!row['货名']) {
                errors.push(`第${item.rowNum}行：货名不能为空`);
                return null;
              }
              if (quantity <= 0) {
                errors.push(`第${item.rowNum}行：件数必须大于0`);
                return null;
              }

              return {
                productName: String(row['货名'] || ''),
                productModel: String(row['型号'] || ''),
                sku: String(row['CMD编号'] || row['SKU'] || ''),
                internalCode: String(row['内部货号'] || ''),
                productCode: String(row['CMD料号'] || row['编号'] || ''),
                shippingMark: String(row['唛头'] || ''),
                poNumber: String(row['PO号'] || ''),
                locationCode: String(row['库位'] || ''),
                packageType: String(row['包装形式'] || ''),
                quantity,
                length,
                width,
                height,
                unitGrossWeight,
                totalGrossWeight: unitGrossWeight * quantity,
                area,
                remark: String(row['明细备注'] || ''),
              };
            }).filter((item: any) => item !== null);

            if (items.length === 0) {
              errors.push(`进仓编号"${entryNo}"：没有有效的明细数据`);
              failCount++;
              continue;
            }

            // 构建入库单数据
            // 处理日期格式，兼容 / 和 - 和纯数字(20251120)格式
            let dateStr = String(headerRow['入库日期']).trim();
            // 如果是纯数字格式如20251120，转换为2025-11-20
            if (/^\d{8}$/.test(dateStr)) {
              dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
            } else {
              dateStr = dateStr.replace(/\//g, '-');
            }
            const inboundData = {
              customerId: customer.id,
              customerName: customer.name,
              warehouseEntryNo: entryNo,
              inboundDate: dayjs(dateStr).format('YYYY-MM-DD'),
              businessType,
              deliveryCompany: headerRow['送货单位'] || '',
              vehicleNumber: headerRow['车牌号'] || '',
              driverName: headerRow['司机姓名'] || '',
              contactPerson: headerRow['联系人'] || '',
              contactPhone: headerRow['联系电话'] ? String(headerRow['联系电话']) : '',
              remark: headerRow['备注'] || '',
              items,
            };

            // 调用API创建入库单
            const response: any = await inboundAPI.create(inboundData);
            if (response.success) {
              successCount++;
            } else {
              errors.push(`进仓编号"${entryNo}"：${response.message}`);
              failCount++;
            }
          } catch (error: any) {
            errors.push(`进仓编号"${entryNo}"：${error.message}`);
            failCount++;
          }
        }

        message.destroy('import');

        // 显示导入结果
        if (successCount > 0) {
          message.success(`成功导入 ${successCount} 个入库单${failCount > 0 ? `，失败 ${failCount} 个` : ''}`);
          loadData(); // 刷新列表
        } else {
          message.error('导入失败');
        }

        // 如果有错误，显示详细信息
        if (errors.length > 0) {
          Modal.error({
            title: '导入错误详情',
            content: (
              <div style={{ maxHeight: 400, overflow: 'auto' }}>
                {errors.map((err, idx) => (
                  <div key={idx} style={{ marginBottom: 8 }}>{err}</div>
                ))}
              </div>
            ),
            width: 700,
          });
        }
      } catch (error: any) {
        message.destroy('import');
        message.error(error.message || '导入失败');
      }
    };
    reader.readAsArrayBuffer(file);
    return false; // 阻止自动上传
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
      render: (val: string) => val || '-',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
    },
    {
      title: '入库日期',
      dataIndex: 'inboundDate',
      key: 'inboundDate',
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
          normal: '普通入库',
          return: '退货入库',
          transfer: '调拨入库',
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
      render: (_: any, record: InboundOrder) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Popconfirm
              title="确认入库后将更新库存，确定要执行吗?"
              onConfirm={() => handleConfirm(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="primary" size="small" icon={<CheckOutlined />}>
                确认入库
              </Button>
            </Popconfirm>
          )}
          {record.status === 'completed' && (
            <Popconfirm
              title="反入库将扣减库存，确定要执行吗?"
              onConfirm={() => handleReverseAudit(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="default" size="small" icon={<RollbackOutlined />}>
                反入库
              </Button>
            </Popconfirm>
          )}
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/inbound/edit/${record.id}`)}
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
          <Select
            placeholder="业务类型"
            value={filters.businessType}
            onChange={(value) => setFilters({ ...filters, businessType: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="normal">普通入库</Select.Option>
            <Select.Option value="return">退货入库</Select.Option>
            <Select.Option value="transfer">调拨入库</Select.Option>
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
            placeholder="送货单位"
            value={filters.deliveryCompany}
            onChange={(e) => setFilters({ ...filters, deliveryCompany: e.target.value })}
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
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            下载导入模板
          </Button>
          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleImport}
          >
            <Button icon={<UploadOutlined />}>批量导入</Button>
          </Upload>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          新建入库单
        </Button>
      </div>

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#e6f7ff', borderRadius: 4 }}>
          <Space>
            <span>已选择 {selectedRowKeys.length} 项</span>
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={handleBatchConfirm}>
              批量确认入库
            </Button>
            <Button type="default" size="small" icon={<RollbackOutlined />} onClick={handleBatchReverseAudit}>
              批量反入库
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
        scroll={{ x: 1500 }}
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
              <Table.Summary.Cell index={6}>{summaryData.totalQuantity}</Table.Summary.Cell>
              <Table.Summary.Cell index={7}>{summaryData.totalVolume.toFixed(2)}</Table.Summary.Cell>
              <Table.Summary.Cell index={8}>{summaryData.totalWeight.toFixed(2)}</Table.Summary.Cell>
              <Table.Summary.Cell index={9}></Table.Summary.Cell>
              <Table.Summary.Cell index={10}></Table.Summary.Cell>
              <Table.Summary.Cell index={11}></Table.Summary.Cell>
              <Table.Summary.Cell index={12}></Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      <Modal
        title="新建入库单"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={1400}
        destroyOnClose
      >
        <InboundForm
          onSuccess={() => {
            setModalOpen(false);
            loadData();
          }}
        />
      </Modal>

      {/* 详情弹窗 */}
      <InboundDetailModal
        visible={detailVisible}
        orderId={selectedOrderId}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedOrderId(null);
        }}
        onEdit={(id) => {
          setDetailVisible(false);
          navigate(`/inbound/edit/${id}`);
        }}
        onReload={loadData}
      />
    </div>
  );
};

export default InboundList;
