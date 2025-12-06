import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './components/MainLayout';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import { InboundList, InboundForm, InboundDetail, InboundEdit } from './pages/inbound';
import { OutboundList, OutboundForm, OutboundDetail, OutboundEdit } from './pages/outbound';
import InventoryList from './pages/inventory';
import InventoryDetail from './pages/inventory/InventoryDetail';
import CustomerList from './pages/customer';
import LocationList from './pages/location';
import UserList from './pages/user/UserList';
import UserForm from './pages/user/UserForm';
import Profile from './pages/profile/Profile';
import ChangePassword from './pages/profile/ChangePassword';
import { InboundLogList, OutboundLogList, InventoryLogList, OperationLogList } from './pages/logs';
import Settings from './pages/settings';
import StocktakingPage from './pages/stocktaking';
import StocktakingTableView from './pages/stocktaking/TableView';
import { useAuthStore } from './stores/auth.store';

// 路由守卫
const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inbound" element={<InboundList />} />
            <Route path="inbound/create" element={<InboundForm />} />
            <Route path="inbound/edit/:id" element={<InboundEdit />} />
            <Route path="inbound/:id" element={<InboundDetail />} />
            <Route path="outbound" element={<OutboundList />} />
            <Route path="outbound/create" element={<OutboundForm />} />
            <Route path="outbound/edit/:id" element={<OutboundEdit />} />
            <Route path="outbound/:id" element={<OutboundDetail />} />
            <Route path="inventory" element={<InventoryList />} />
            <Route path="inventory/:id" element={<InventoryDetail />} />
            <Route path="logs/inbound" element={<InboundLogList />} />
            <Route path="logs/outbound" element={<OutboundLogList />} />
            <Route path="logs/inventory" element={<InventoryLogList />} />
            <Route path="logs/operations" element={<OperationLogList />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="locations" element={<LocationList />} />
            <Route path="stocktaking" element={<StocktakingPage />} />
            <Route path="stocktaking/table" element={<StocktakingTableView />} />
            <Route path="users" element={<UserList />} />
            <Route path="users/create" element={<UserForm />} />
            <Route path="users/edit/:id" element={<UserForm />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/change-password" element={<ChangePassword />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
