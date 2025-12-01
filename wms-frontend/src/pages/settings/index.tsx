import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { SettingOutlined, DatabaseOutlined, CloudServerOutlined } from '@ant-design/icons';
import BasicSettings from './BasicSettings';
import StorageSettings from './StorageSettings';
import BusinessTypeSettings from './BusinessTypeSettings';

const { TabPane } = Tabs;

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <Card title={<><SettingOutlined /> 系统设置</>}>
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        <TabPane
          tab={
            <span>
              <SettingOutlined />
              基础设置
            </span>
          }
          key="basic"
        >
          <BasicSettings />
        </TabPane>

        <TabPane
          tab={
            <span>
              <DatabaseOutlined />
              业务类型管理
            </span>
          }
          key="business-types"
        >
          <BusinessTypeSettings />
        </TabPane>

        <TabPane
          tab={
            <span>
              <CloudServerOutlined />
              存储配置
            </span>
          }
          key="storage"
        >
          <StorageSettings />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default Settings;
