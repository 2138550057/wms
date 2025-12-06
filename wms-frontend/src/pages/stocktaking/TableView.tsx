import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  Tag,
  message,
  Drawer,
  Descriptions,
  Spin,
  Statistic,
  Row,
  Col,
  Modal,
} from 'antd';
import {
  ReloadOutlined,
  AppstoreOutlined,
  SearchOutlined,
  ExportOutlined,
  SwapOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { stocktakingAPI } from '@/services/stocktaking.service';
import { locationAPI } from '@/services/location.service';
import {
  LocationWithStats,
  LocationFilterOptions,
  LocationSummary,
} from '@/types';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Option } = Select;

const StocktakingTableView: React.FC = () => {
  const navigate = useNavigate();

  // 数据状态
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<LocationWithStats[]>([]);
  const [stats, setStats] = useState({
    totalLocations: 0,
    occupiedLocations: 0,
    emptyLocations: 0,
    totalQuantity: 0,
  });
  const [filterOptions, setFilterOptions] = useState<LocationFilterOptions | null>(null);

  // 筛选条件
  const [zoneFilter, setZoneFilter] = useState<string | undefined>();
  const [bondedFilter, setBondedFilter] = useState<string | undefined>();
  const [hasInventoryFilter, setHasInventoryFilter] = useState<string | undefined>();
  const [searchKeyword, setSearchKeyword] = useState('');

  // 详情抽屉
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locationSummary, setLocationSummary] = useState<LocationSummary | null>(null);

  // 切换库位弹窗
  const [switchModalVisible, setSwitchModalVisible] = useState(false);
  const [switchInventoryId, setSwitchInventoryId] = useState<number | null>(null);
  const [switchTargetLocation, setSwitchTargetLocation] = useState<string | undefined>();
  const [switching, setSwitching] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<any[]>([]);

  // 移除库位确认弹窗
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [removeInventoryId, setRemoveInventoryId] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);

  // 分类映射
  const categoryMap: Record<string, string> = {
    shelf: '货架',
    floor: '地面',
    large: '大件',
    small: '小件',
  };

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await stocktakingAPI.getAllLocationsSummary({
        zone: zoneFilter,
        bonded: bondedFilter,
        hasInventory: hasInventoryFilter,
      });
      if (response.success) {
        let data = response.data || [];

        // 本地搜索过滤
        if (searchKeyword) {
          const keyword = searchKeyword.toLowerCase();
          data = data.filter(
            (loc: LocationWithStats) =>
              loc.code.toLowerCase().includes(keyword) ||
              loc.zone.toLowerCase().includes(keyword)
          );
        }

        setLocations(data);
        setStats(response.stats || {
          totalLocations: data.length,
          occupiedLocations: data.filter((l: LocationWithStats) => l.totalQuantity > 0).length,
          emptyLocations: data.filter((l: LocationWithStats) => l.totalQuantity === 0).length,
          totalQuantity: data.reduce((sum: number, l: LocationWithStats) => sum + l.totalQuantity, 0),
        });
      }
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [zoneFilter, bondedFilter, hasInventoryFilter, searchKeyword]);

  // 加载筛选选项
  const loadFilterOptions = async () => {
    try {
      const response: any = await locationAPI.getFilterOptions();
      if (response.success) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error('加载筛选选项失败', error);
    }
  };

  // 加载库位详情
  const loadLocationSummary = async (locationCode: string) => {
    setDrawerLoading(true);
    try {
      const response: any = await stocktakingAPI.getLocationSummary(locationCode);
      if (response.success) {
        setLocationSummary(response.data);
      }
    } catch (error: any) {
      message.error(error.message || '加载库位详情失败');
    } finally {
      setDrawerLoading(false);
    }
  };

  // 查看详情
  const handleViewDetail = (record: LocationWithStats) => {
    setSelectedLocation(record.code);
    setDrawerVisible(true);
    loadLocationSummary(record.code);
  };

  // 加载可用库位
  const loadAvailableLocations = async () => {
    try {
      const response: any = await locationAPI.getActive({});
      if (response.success) {
        setAvailableLocations(response.data || []);
      }
    } catch (error) {
      console.error('加载库位失败', error);
    }
  };

  // 打开切换库位弹窗
  const openSwitchModal = (inventoryId: number) => {
    setSwitchInventoryId(inventoryId);
    setSwitchModalVisible(true);
    loadAvailableLocations();
  };

  // 切换库位
  const handleSwitchLocation = async () => {
    if (!switchInventoryId || !switchTargetLocation) return;

    setSwitching(true);
    try {
      const response: any = await stocktakingAPI.updateInventoryLocation(
        switchInventoryId,
        switchTargetLocation
      );
      if (response.success) {
        message.success(response.message);
        setSwitchModalVisible(false);
        setSwitchInventoryId(null);
        setSwitchTargetLocation(undefined);
        loadData();
        if (selectedLocation) {
          loadLocationSummary(selectedLocation);
        }
      }
    } catch (error: any) {
      message.error(error.message || '切换库位失败');
    } finally {
      setSwitching(false);
    }
  };

  // 打开移除库位确认弹窗
  const openRemoveModal = (inventoryId: number) => {
    setRemoveInventoryId(inventoryId);
    setRemoveModalVisible(true);
  };

  // 移除库位
  const handleRemoveLocation = async () => {
    if (!removeInventoryId) return;

    setRemoving(true);
    try {
      const response: any = await stocktakingAPI.updateInventoryLocation(
        removeInventoryId,
        null
      );
      if (response.success) {
        message.success('已移除库位');
        setRemoveModalVisible(false);
        setRemoveInventoryId(null);
        loadData();
        if (selectedLocation) {
          loadLocationSummary(selectedLocation);
        }
      }
    } catch (error: any) {
      message.error(error.message || '移除库位失败');
    } finally {
      setRemoving(false);
    }
  };

  // 导出Excel
  const handleExport = () => {
    const excelData = locations.map((loc) => ({
      '库位编码': loc.code,
      '保税': loc.bonded ? '是' : '否',
      '区域': loc.zone + '区',
      '分号': loc.number,
      '层数': loc.level,
      '分类': categoryMap[loc.category] || loc.category,
      '状态': loc.status === 'active' ? '启用' : '禁用',
      '库存件数': loc.totalQuantity,
      'SKU种类': loc.skuCount,
      '备注': loc.remark || '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 12 },
      { wch: 6 },
      { wch: 6 },
      { wch: 6 },
      { wch: 6 },
      { wch: 8 },
      { wch: 6 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '库位统计');
    XLSX.writeFile(wb, `库位统计_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
    message.success('导出成功');
  };

  useEffect(() => {
    loadData();
    loadFilterOptions();
  }, [loadData]);

  // 表格列
  const columns = [
    {
      title: '库位编码',
      dataIndex: 'code',
      width: 120,
      render: (code: string, record: LocationWithStats) => (
        <span
          style={{
            fontWeight: 'bold',
            color: record.bonded ? '#1890ff' : '#fa8c16',
          }}
        >
          {code}
        </span>
      ),
    },
    {
      title: '保税',
      dataIndex: 'bonded',
      width: 80,
      render: (bonded: boolean) => (
        <Tag color={bonded ? 'red' : 'green'}>{bonded ? '保税' : '非保税'}</Tag>
      ),
    },
    {
      title: '区域',
      dataIndex: 'zone',
      width: 80,
      render: (zone: string) => `${zone}区`,
    },
    {
      title: '分号',
      dataIndex: 'number',
      width: 60,
    },
    {
      title: '层数',
      dataIndex: 'level',
      width: 60,
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 80,
      render: (category: string) => (
        <Tag color="default">{categoryMap[category] || category}</Tag>
      ),
    },
    {
      title: '库存件数',
      dataIndex: 'totalQuantity',
      width: 100,
      sorter: (a: LocationWithStats, b: LocationWithStats) =>
        a.totalQuantity - b.totalQuantity,
      render: (quantity: number) => (
        <span
          style={{
            fontWeight: 'bold',
            color: quantity > 0 ? '#52c41a' : '#999',
          }}
        >
          {quantity}
        </span>
      ),
    },
    {
      title: 'SKU种类',
      dataIndex: 'skuCount',
      width: 100,
      sorter: (a: LocationWithStats, b: LocationWithStats) =>
        a.skuCount - b.skuCount,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 100,
      render: (_: any, record: LocationWithStats) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleViewDetail(record)}
            disabled={record.totalQuantity === 0}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  // 库存详情表格列
  const inventoryColumns = [
    {
      title: '进仓编号',
      dataIndex: 'warehouseEntryNo',
      width: 130,
    },
    {
      title: '货名',
      dataIndex: 'productName',
      ellipsis: true,
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      width: 80,
      ellipsis: true,
    },
    {
      title: '件数',
      dataIndex: 'quantity',
      width: 60,
      render: (val: number) => <span style={{ fontWeight: 'bold' }}>{val}</span>,
    },
    {
      title: '入库日期',
      dataIndex: 'lastInboundDate',
      width: 90,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '操作',
      width: 100,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<SwapOutlined />}
            onClick={() => openSwitchModal(record.id)}
          >
            切换
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => openRemoveModal(record.id)}
          >
            移除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="库位总数"
              value={stats.totalLocations}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已占用库位"
              value={stats.occupiedLocations}
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="空置库位"
              value={stats.emptyLocations}
              suffix="个"
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="库存总件数"
              value={stats.totalQuantity}
              suffix="件"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选区域 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索库位编码"
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 150 }}
            allowClear
          />

          <Select
            value={zoneFilter}
            onChange={setZoneFilter}
            placeholder="区域"
            allowClear
            style={{ width: 100 }}
          >
            {filterOptions?.zones.map((zone) => (
              <Option key={zone} value={zone}>
                {zone}区
              </Option>
            ))}
          </Select>

          <Select
            value={bondedFilter}
            onChange={setBondedFilter}
            placeholder="保税"
            allowClear
            style={{ width: 100 }}
          >
            <Option value="true">保税</Option>
            <Option value="false">非保税</Option>
          </Select>

          <Select
            value={hasInventoryFilter}
            onChange={setHasInventoryFilter}
            placeholder="库存状态"
            allowClear
            style={{ width: 120 }}
          >
            <Option value="true">有库存</Option>
            <Option value="false">无库存</Option>
          </Select>

          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>

          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出Excel
          </Button>

          <div style={{ borderLeft: '1px solid #d9d9d9', height: 24, margin: '0 8px' }} />

          <Button
            icon={<AppstoreOutlined />}
            onClick={() => navigate('/stocktaking')}
          >
            图形视图
          </Button>
        </Space>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={locations}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            defaultPageSize: 20,
          }}
        />
      </Card>

      {/* 库位详情抽屉 */}
      <Drawer
        title={`库位详情 - ${selectedLocation}`}
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedLocation(null);
          setLocationSummary(null);
        }}
      >
        <Spin spinning={drawerLoading}>
          {locationSummary && (
            <>
              {/* 库位信息 */}
              <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="库位编码">
                  <Tag color="blue">{locationSummary.locationCode}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="保税">
                  <Tag color={locationSummary.location?.bonded ? 'red' : 'green'}>
                    {locationSummary.location?.bonded ? '保税' : '非保税'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="区域">
                  {locationSummary.location?.zone}区
                </Descriptions.Item>
                <Descriptions.Item label="分类">
                  {categoryMap[locationSummary.location?.category || 'shelf']}
                </Descriptions.Item>
              </Descriptions>

              {/* 统计信息 */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space size="large">
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>总件数</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                      {locationSummary.totalQuantity}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>SKU种类</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                      {locationSummary.totalSku}
                    </div>
                  </div>
                </Space>
              </Card>

              {/* 库存列表 */}
              <Table
                columns={inventoryColumns}
                dataSource={locationSummary.inventory}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ y: 400 }}
              />
            </>
          )}
        </Spin>
      </Drawer>

      {/* 切换库位弹窗 */}
      <Modal
        title="切换库位"
        open={switchModalVisible}
        onOk={handleSwitchLocation}
        onCancel={() => {
          setSwitchModalVisible(false);
          setSwitchInventoryId(null);
          setSwitchTargetLocation(undefined);
        }}
        confirmLoading={switching}
        okText="确认切换"
        okButtonProps={{ disabled: !switchTargetLocation }}
      >
        <p>请选择目标库位：</p>
        <Select
          placeholder="选择目标库位"
          value={switchTargetLocation}
          onChange={setSwitchTargetLocation}
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="children"
        >
          {availableLocations.map((loc) => (
            <Option key={loc.code} value={loc.code}>
              {loc.code} - {loc.bonded ? '保税' : '非保税'} {loc.zone}区
            </Option>
          ))}
        </Select>
      </Modal>

      {/* 移除库位确认弹窗 */}
      <Modal
        title="确认移除库位"
        open={removeModalVisible}
        onOk={handleRemoveLocation}
        onCancel={() => {
          setRemoveModalVisible(false);
          setRemoveInventoryId(null);
        }}
        confirmLoading={removing}
        okText="确认移除"
        okButtonProps={{ danger: true }}
      >
        <p>确定要将此库存从当前库位移除吗？</p>
        <p style={{ color: '#999' }}>移除后该库存将变为未分配状态，可以重新分配到其他库位。</p>
      </Modal>
    </div>
  );
};

export default StocktakingTableView;
