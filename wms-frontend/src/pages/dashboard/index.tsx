import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Table, Badge, Progress, Empty } from 'antd';
import {
  InboxOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { dashboardAPI, DashboardStats } from '../../services/dashboard.service';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response: any = await dashboardAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      message.error(error.message || '加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 计算最大值用于趋势图比例
  const maxTrend = Math.max(
    ...stats.trendData.map((d) => Math.max(d.inbound, d.outbound)),
    1
  );

  const recentInboundColumns = [
    {
      title: '单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text: string, record: any) => (
        <a onClick={() => navigate(`/inbound/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      ellipsis: true,
    },
    {
      title: '件数',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Badge
          status={status === 'completed' ? 'success' : 'processing'}
          text={status === 'completed' ? '已完成' : '待处理'}
        />
      ),
    },
  ];

  const recentOutboundColumns = [
    {
      title: '单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text: string, record: any) => (
        <a onClick={() => navigate(`/outbound/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      ellipsis: true,
    },
    {
      title: '件数',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Badge
          status={status === 'completed' ? 'success' : 'processing'}
          text={status === 'completed' ? '已完成' : '待处理'}
        />
      ),
    },
  ];

  const lowStockColumns = [
    {
      title: '货名',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      key: 'locationCode',
    },
    {
      title: '剩余',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number) => (
        <span style={{ color: val < 5 ? '#ff4d4f' : '#faad14', fontWeight: 'bold' }}>
          {val}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>数据概览</h2>
        <p style={{ color: '#666', marginBottom: 0 }}>
          欢迎回来，查看今日的运营数据和库存状态
        </p>
      </div>

      <Spin spinning={loading}>
        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
              }}
            >
              <Statistic
                title={<span style={{ color: '#fff', opacity: 0.9 }}>今日入库</span>}
                value={stats.todayInbound}
                prefix={<InboxOutlined />}
                suffix="单"
                valueStyle={{ color: '#fff', fontSize: 28 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: '#fff',
              }}
            >
              <Statistic
                title={<span style={{ color: '#fff', opacity: 0.9 }}>今日出库</span>}
                value={stats.todayOutbound}
                prefix={<ShoppingOutlined />}
                suffix="单"
                valueStyle={{ color: '#fff', fontSize: 28 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: '#fff',
              }}
            >
              <Statistic
                title={<span style={{ color: '#fff', opacity: 0.9 }}>待处理入库</span>}
                value={stats.pendingInbound}
                prefix={<ClockCircleOutlined />}
                suffix="单"
                valueStyle={{ color: '#fff', fontSize: 28 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              style={{
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: '#fff',
              }}
            >
              <Statistic
                title={<span style={{ color: '#fff', opacity: 0.9 }}>待处理出库</span>}
                value={stats.pendingOutbound}
                prefix={<ClockCircleOutlined />}
                suffix="单"
                valueStyle={{ color: '#fff', fontSize: 28 }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="库存SKU"
                value={stats.totalSku}
                prefix={<AppstoreOutlined style={{ color: '#1890ff' }} />}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="库存总件数"
                value={stats.totalInventoryQuantity}
                prefix={<DatabaseOutlined style={{ color: '#52c41a' }} />}
                suffix="件"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="库存总体积"
                value={stats.totalInventoryVolume.toFixed(2)}
                prefix={<DatabaseOutlined style={{ color: '#722ed1' }} />}
                suffix="m³"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="客户数量"
                value={stats.totalCustomer}
                prefix={<TeamOutlined style={{ color: '#fa8c16' }} />}
                suffix="个"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 趋势图表 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card title="近7日出入库趋势" bordered={false}>
              <div style={{ height: 280 }}>
                {stats.trendData.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: 12,
                      height: 32,
                    }}
                  >
                    <div style={{ width: 80, fontSize: 12, color: '#666' }}>
                      {dayjs(item.date).format('MM-DD')}
                    </div>
                    <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <RiseOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                        <Progress
                          percent={(item.inbound / maxTrend) * 100}
                          showInfo={false}
                          strokeColor="#52c41a"
                          style={{ flex: 1 }}
                        />
                        <span
                          style={{
                            marginLeft: 8,
                            minWidth: 30,
                            textAlign: 'right',
                            fontSize: 12,
                            color: '#52c41a',
                            fontWeight: 'bold',
                          }}
                        >
                          {item.inbound}
                        </span>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <FallOutlined style={{ color: '#f5222d', marginRight: 4 }} />
                        <Progress
                          percent={(item.outbound / maxTrend) * 100}
                          showInfo={false}
                          strokeColor="#f5222d"
                          style={{ flex: 1 }}
                        />
                        <span
                          style={{
                            marginLeft: 8,
                            minWidth: 30,
                            textAlign: 'right',
                            fontSize: 12,
                            color: '#f5222d',
                            fontWeight: 'bold',
                          }}
                        >
                          {item.outbound}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 24, marginTop: 16, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      background: '#52c41a',
                      borderRadius: 2,
                      marginRight: 8,
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#666' }}>入库</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      background: '#f5222d',
                      borderRadius: 2,
                      marginRight: 8,
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#666' }}>出库</span>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="客户库存排名 TOP5" bordered={false}>
              <div style={{ height: 280, overflowY: 'auto' }}>
                {stats.topCustomers.length > 0 ? (
                  stats.topCustomers.map((customer, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: 16,
                        padding: '12px',
                        background: '#fafafa',
                        borderRadius: 4,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 'bold' }}>
                          {index + 1}. {customer.customerName}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                        件数: {customer.quantity} 件
                      </div>
                      <Progress
                        percent={
                          (customer.volume /
                            Math.max(...stats.topCustomers.map((c) => c.volume), 1)) *
                          100
                        }
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                        format={() => `${customer.volume.toFixed(2)} m³`}
                      />
                    </div>
                  ))
                ) : (
                  <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 最近操作 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="最近入库记录" bordered={false}>
              <Table
                columns={recentInboundColumns}
                dataSource={stats.recentInbound}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="最近出库记录" bordered={false}>
              <Table
                columns={recentOutboundColumns}
                dataSource={stats.recentOutbound}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>

        {/* 库存预警 */}
        {stats.lowStock.length > 0 && (
          <Card
            title={
              <span>
                <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                库存预警（库存量 &lt; 10）
              </span>
            }
            bordered={false}
          >
            <Table
              columns={lowStockColumns}
              dataSource={stats.lowStock}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        )}
      </Spin>
    </div>
  );
};

export default Dashboard;
