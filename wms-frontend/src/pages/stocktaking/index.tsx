import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Select,
  Tooltip,
  message,
  Spin,
  Empty,
  Drawer,
  Table,
  Tag,
  Descriptions,
  Popover,
  Slider,
  Modal,
  Badge,
  Input,
  Collapse,
} from 'antd';
import {
  ReloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  TableOutlined,
  InboxOutlined,
  SwapOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { stocktakingAPI } from '@/services/stocktaking.service';
import { locationAPI } from '@/services/location.service';
import {
  WarehouseLayoutElement,
  LocationSummary,
  LocationFilterOptions,
  Inventory,
} from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { Panel } = Collapse;

const StocktakingPage: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 状态
  const [loading, setLoading] = useState(false);
  const [elements, setElements] = useState<WarehouseLayoutElement[]>([]);
  const [filterOptions, setFilterOptions] = useState<LocationFilterOptions | null>(null);

  // 筛选条件
  const [floor, setFloor] = useState(1);
  const [zoneFilter, setZoneFilter] = useState<string | undefined>();

  // 视图控制
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 选中的库位
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locationSummary, setLocationSummary] = useState<LocationSummary | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // 悬浮信息
  const [hoveredElement, setHoveredElement] = useState<WarehouseLayoutElement | null>(null);

  // 未分配库存
  const [unassignedInventory, setUnassignedInventory] = useState<Inventory[]>([]);
  const [unassignedLoading, setUnassignedLoading] = useState(false);
  const [unassignedTotal, setUnassignedTotal] = useState(0);
  const [showUnassignedPanel, setShowUnassignedPanel] = useState(true);
  const [selectedInventory, setSelectedInventory] = useState<Inventory[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');

  // 分配库位弹窗
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignTargetLocation, setAssignTargetLocation] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  // 切换库位弹窗
  const [switchModalVisible, setSwitchModalVisible] = useState(false);
  const [switchInventoryId, setSwitchInventoryId] = useState<number | null>(null);
  const [switchTargetLocation, setSwitchTargetLocation] = useState<string | undefined>();
  const [switching, setSwitching] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<any[]>([]);

  // 加载布局数据
  const loadLayout = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await stocktakingAPI.getLayout(floor);
      if (response.success) {
        let filteredElements = response.data.elements || [];

        // 按区域筛选
        if (zoneFilter) {
          filteredElements = filteredElements.filter(
            (e: WarehouseLayoutElement) =>
              e.type !== 'location' || e.location?.zone === zoneFilter
          );
        }

        setElements(filteredElements);

        // 如果没有布局数据，提示生成
        if (filteredElements.length === 0) {
          message.info('暂无布局数据，请点击"生成布局"按钮自动生成');
        }
      }
    } catch (error: any) {
      message.error(error.message || '加载布局失败');
    } finally {
      setLoading(false);
    }
  }, [floor, zoneFilter]);

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

  // 加载未分配库存
  const loadUnassignedInventory = useCallback(async () => {
    setUnassignedLoading(true);
    try {
      const response: any = await stocktakingAPI.getUnassignedInventory({
        page: 1,
        size: 100,
        productName: inventorySearch || undefined,
      });
      if (response.success) {
        setUnassignedInventory(response.data || []);
        setUnassignedTotal(response.total || 0);
      }
    } catch (error: any) {
      console.error('加载未分配库存失败', error);
    } finally {
      setUnassignedLoading(false);
    }
  }, [inventorySearch]);

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

  // 生成布局
  const handleGenerateLayout = async () => {
    try {
      setLoading(true);
      const response: any = await stocktakingAPI.generateLayout({
        floor,
        clearExisting: true,
      });
      if (response.success) {
        message.success(response.message);
        loadLayout();
      }
    } catch (error: any) {
      message.error(error.message || '生成布局失败');
    } finally {
      setLoading(false);
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

  // 点击库位
  const handleLocationClick = (element: WarehouseLayoutElement) => {
    if (element.type === 'location' && element.locationCode) {
      // 如果有选中的库存，弹出分配确认
      if (selectedInventory.length > 0) {
        setAssignTargetLocation(element.locationCode);
        setAssignModalVisible(true);
      } else {
        setSelectedLocation(element.locationCode);
        setDrawerVisible(true);
        loadLocationSummary(element.locationCode);
      }
    }
  };

  // 分配库位
  const handleAssignLocation = async () => {
    if (!assignTargetLocation || selectedInventory.length === 0) return;

    setAssigning(true);
    try {
      const response: any = await stocktakingAPI.batchUpdateInventoryLocation(
        selectedInventory.map((inv) => inv.id),
        assignTargetLocation
      );
      if (response.success) {
        message.success(`成功将 ${response.data.count} 条库存分配到库位 ${assignTargetLocation}`);
        setAssignModalVisible(false);
        setSelectedInventory([]);
        loadLayout();
        loadUnassignedInventory();
      }
    } catch (error: any) {
      message.error(error.message || '分配失败');
    } finally {
      setAssigning(false);
    }
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
        loadLayout();
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

  // 打开切换库位弹窗
  const openSwitchModal = (inventoryId: number) => {
    setSwitchInventoryId(inventoryId);
    setSwitchModalVisible(true);
    loadAvailableLocations();
  };

  // 缩放控制
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.3));
  const handleZoomReset = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  // 鼠标滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.min(Math.max(s + delta, 0.3), 3));
  };

  // 拖拽画布
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && selectedInventory.length === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setTranslate({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 获取库位颜色
  const getLocationColor = (element: WarehouseLayoutElement) => {
    if (element.type !== 'location') return element.bgColor || '#f5f5f5';

    // 如果正在分配模式，高亮可分配的库位
    if (selectedInventory.length > 0) {
      return '#e6f7ff'; // 淡蓝色表示可分配
    }

    const quantity = element.quantity || 0;
    if (quantity > 0) {
      return '#52c41a'; // 绿色 - 有货
    }
    return '#d9d9d9'; // 灰色 - 空置
  };

  // 获取库位边框颜色
  const getLocationBorderColor = (element: WarehouseLayoutElement) => {
    if (selectedInventory.length > 0) {
      return '#1890ff'; // 分配模式下所有库位蓝色边框
    }
    if (selectedLocation === element.locationCode) {
      return '#1890ff'; // 选中状态
    }
    return element.borderColor || '#999';
  };

  useEffect(() => {
    loadLayout();
    loadFilterOptions();
    loadUnassignedInventory();
  }, [loadLayout, loadUnassignedInventory]);

  // 计算画布大小
  const canvasWidth = Math.max(
    ...elements.map((e) => e.x + e.width),
    1200
  );
  const canvasHeight = Math.max(
    ...elements.map((e) => e.y + e.height),
    800
  );

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
      title: '操作',
      width: 80,
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<SwapOutlined />}
          onClick={() => openSwitchModal(record.id)}
        >
          切换
        </Button>
      ),
    },
  ];

  // 未分配库存表格列
  const unassignedColumns = [
    {
      title: '进仓编号',
      dataIndex: 'warehouseEntryNo',
      width: 120,
      ellipsis: true,
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
      width: 50,
    },
  ];

  // 未分配库存选择
  const rowSelection = {
    selectedRowKeys: selectedInventory.map((inv) => inv.id),
    onChange: (_: React.Key[], selectedRows: Inventory[]) => {
      setSelectedInventory(selectedRows);
    },
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <span>楼层:</span>
          <Select value={floor} onChange={setFloor} style={{ width: 100 }}>
            <Option value={1}>1层</Option>
            <Option value={2}>2层</Option>
            <Option value={3}>3层</Option>
          </Select>

          <span>区域:</span>
          <Select
            value={zoneFilter}
            onChange={setZoneFilter}
            placeholder="全部"
            allowClear
            style={{ width: 100 }}
          >
            {filterOptions?.zones.map((zone) => (
              <Option key={zone} value={zone}>
                {zone}区
              </Option>
            ))}
          </Select>

          <Button icon={<ReloadOutlined />} onClick={() => { loadLayout(); loadUnassignedInventory(); }}>
            刷新
          </Button>

          <Button onClick={handleGenerateLayout}>
            生成布局
          </Button>

          <div style={{ borderLeft: '1px solid #d9d9d9', height: 24, margin: '0 8px' }} />

          <Tooltip title="放大">
            <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} />
          </Tooltip>
          <Tooltip title="缩小">
            <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
          </Tooltip>
          <Tooltip title="重置视图">
            <Button icon={<FullscreenOutlined />} onClick={handleZoomReset} />
          </Tooltip>

          <span style={{ marginLeft: 8 }}>缩放: {Math.round(scale * 100)}%</span>
          <Slider
            value={scale}
            min={0.3}
            max={3}
            step={0.1}
            onChange={setScale}
            style={{ width: 100 }}
          />

          <div style={{ borderLeft: '1px solid #d9d9d9', height: 24, margin: '0 8px' }} />

          <Badge count={unassignedTotal} offset={[10, 0]}>
            <Button
              icon={<InboxOutlined />}
              type={showUnassignedPanel ? 'primary' : 'default'}
              onClick={() => setShowUnassignedPanel(!showUnassignedPanel)}
            >
              未分配库存
            </Button>
          </Badge>

          <Button icon={<TableOutlined />} onClick={() => navigate('/stocktaking/table')}>
            表格视图
          </Button>
        </Space>
      </Card>

      {/* 分配模式提示 */}
      {selectedInventory.length > 0 && (
        <Card
          size="small"
          style={{ marginBottom: 16, backgroundColor: '#e6f7ff', borderColor: '#1890ff' }}
        >
          <Space>
            <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
              已选择 {selectedInventory.length} 条库存，点击库位进行分配
            </span>
            <Button size="small" onClick={() => setSelectedInventory([])}>
              取消选择
            </Button>
          </Space>
        </Card>
      )}

      {/* 主内容区域 */}
      <div style={{ flex: 1, display: 'flex', gap: 16, overflow: 'hidden' }}>
        {/* 未分配库存面板 */}
        {showUnassignedPanel && (
          <Card
            size="small"
            title={
              <Space>
                <InboxOutlined />
                <span>未分配库存</span>
                <Tag color="orange">{unassignedTotal}</Tag>
              </Space>
            }
            style={{ width: 350, flexShrink: 0 }}
            bodyStyle={{ padding: 8, height: 'calc(100% - 45px)', overflow: 'auto' }}
          >
            <Input
              placeholder="搜索货名"
              prefix={<SearchOutlined />}
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              onPressEnter={() => loadUnassignedInventory()}
              style={{ marginBottom: 8 }}
              allowClear
            />
            <Spin spinning={unassignedLoading}>
              <Table
                columns={unassignedColumns}
                dataSource={unassignedInventory}
                rowKey="id"
                size="small"
                rowSelection={rowSelection}
                pagination={false}
                scroll={{ y: 'calc(100vh - 400px)' }}
              />
            </Spin>
            {unassignedInventory.length === 0 && !unassignedLoading && (
              <Empty description="暂无未分配库存" style={{ marginTop: 20 }} />
            )}
          </Card>
        )}

        {/* 地图区域 */}
        <Card
          size="small"
          style={{ flex: 1, overflow: 'hidden' }}
          bodyStyle={{ height: '100%', padding: 0, overflow: 'hidden' }}
        >
          {/* 图例 */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
            <Space size="large">
              <span>图例:</span>
              <Space>
                <span style={{ display: 'inline-block', width: 14, height: 14, backgroundColor: '#52c41a', border: '1px solid #389e0d' }} />
                <span>有货</span>
              </Space>
              <Space>
                <span style={{ display: 'inline-block', width: 14, height: 14, backgroundColor: '#d9d9d9', border: '1px solid #999' }} />
                <span>空置</span>
              </Space>
              <Space>
                <span style={{ display: 'inline-block', width: 14, height: 14, backgroundColor: '#e6f7ff', border: '2px solid #1890ff' }} />
                <span>可分配</span>
              </Space>
            </Space>
          </div>

          <Spin spinning={loading}>
            {elements.length === 0 && !loading ? (
              <Empty description="暂无布局数据" style={{ paddingTop: 100 }}>
                <Button type="primary" onClick={handleGenerateLayout}>
                  自动生成布局
                </Button>
              </Empty>
            ) : (
              <div
                ref={containerRef}
                style={{
                  width: '100%',
                  height: 'calc(100% - 45px)',
                  overflow: 'hidden',
                  cursor: selectedInventory.length > 0 ? 'crosshair' : isDragging ? 'grabbing' : 'grab',
                  backgroundColor: '#f0f2f5',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                <svg
                  ref={svgRef}
                  width={canvasWidth * scale}
                  height={canvasHeight * scale}
                  viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                  style={{
                    transform: `translate(${translate.x}px, ${translate.y}px)`,
                    transition: isDragging ? 'none' : 'transform 0.1s',
                  }}
                >
                  {/* 渲染区域标签 */}
                  {elements
                    .filter((e) => e.type === 'zone')
                    .map((element) => (
                      <g key={element.id}>
                        <rect
                          x={element.x}
                          y={element.y}
                          width={element.width}
                          height={element.height}
                          fill={element.bgColor || '#f0f5ff'}
                          stroke={element.borderColor || '#1890ff'}
                          strokeWidth={1}
                          rx={4}
                        />
                        <text
                          x={element.x + 10}
                          y={element.y + 20}
                          fontSize={element.fontSize || 14}
                          fill={element.textColor || '#333'}
                          fontWeight="bold"
                        >
                          {element.label}
                        </text>
                      </g>
                    ))}

                  {/* 渲染库位 */}
                  {elements
                    .filter((e) => e.type === 'location')
                    .map((element) => (
                      <Popover
                        key={element.id}
                        content={
                          <div style={{ minWidth: 150 }}>
                            <p style={{ margin: 0 }}>
                              <strong>库位:</strong> {element.locationCode}
                            </p>
                            <p style={{ margin: '4px 0 0' }}>
                              <strong>件数:</strong>{' '}
                              <span
                                style={{
                                  color: (element.quantity || 0) > 0 ? '#52c41a' : '#999',
                                  fontWeight: 'bold',
                                }}
                              >
                                {element.quantity || 0}
                              </span>
                            </p>
                            <p style={{ margin: '4px 0 0' }}>
                              <strong>SKU数:</strong> {element.skuCount || 0}
                            </p>
                            <p style={{ margin: '8px 0 0', color: '#1890ff', fontSize: 12 }}>
                              {selectedInventory.length > 0 ? '点击分配库存到此库位' : '点击查看详情'}
                            </p>
                          </div>
                        }
                        trigger="hover"
                      >
                        <g
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLocationClick(element);
                          }}
                          onMouseEnter={() => setHoveredElement(element)}
                          onMouseLeave={() => setHoveredElement(null)}
                        >
                          <rect
                            x={element.x}
                            y={element.y}
                            width={element.width}
                            height={element.height}
                            fill={getLocationColor(element)}
                            stroke={getLocationBorderColor(element)}
                            strokeWidth={
                              selectedLocation === element.locationCode ||
                              hoveredElement?.id === element.id ||
                              selectedInventory.length > 0
                                ? 3
                                : 1
                            }
                            rx={2}
                          />
                          {/* 库位编号 */}
                          <text
                            x={element.x + element.width / 2}
                            y={element.y + element.height / 2 - 5}
                            fontSize={11}
                            fill="#333"
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            {element.locationCode?.replace(/^[13]/, '')}
                          </text>
                          {/* 件数 */}
                          <text
                            x={element.x + element.width / 2}
                            y={element.y + element.height / 2 + 10}
                            fontSize={10}
                            fill={(element.quantity || 0) > 0 ? '#fff' : '#666'}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            ({element.quantity || 0})
                          </text>
                        </g>
                      </Popover>
                    ))}
                </svg>
              </div>
            )}
          </Spin>
        </Card>
      </div>

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
                  {locationSummary.location?.category === 'shelf'
                    ? '货架'
                    : locationSummary.location?.category === 'floor'
                    ? '地面'
                    : locationSummary.location?.category === 'large'
                    ? '大件'
                    : '小件'}
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
                scroll={{ y: 350 }}
              />
            </>
          )}
        </Spin>
      </Drawer>

      {/* 分配库位确认弹窗 */}
      <Modal
        title="确认分配库位"
        open={assignModalVisible}
        onOk={handleAssignLocation}
        onCancel={() => setAssignModalVisible(false)}
        confirmLoading={assigning}
        okText="确认分配"
      >
        <p>
          确定要将以下 <strong>{selectedInventory.length}</strong> 条库存分配到库位{' '}
          <Tag color="blue">{assignTargetLocation}</Tag> 吗？
        </p>
        <Table
          columns={[
            { title: '进仓编号', dataIndex: 'warehouseEntryNo', width: 140 },
            { title: '货名', dataIndex: 'productName', ellipsis: true },
            { title: '件数', dataIndex: 'quantity', width: 60 },
          ]}
          dataSource={selectedInventory}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ y: 200 }}
        />
      </Modal>

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
    </div>
  );
};

export default StocktakingPage;
