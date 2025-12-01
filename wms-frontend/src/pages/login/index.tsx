import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Space } from 'antd';
import { UserOutlined, LockOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth.store';
import './login.css';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();

  // 加载验证码
  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const response: any = await authAPI.getCaptcha();
      if (response.success) {
        setCaptchaId(response.data.captchaId);
        setCaptchaSvg(response.data.captchaSvg);
      }
    } catch (error: any) {
      message.error(error.message || '获取验证码失败');
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const onFinish = async (values: { username: string; password: string; captchaCode: string }) => {
    setLoading(true);
    try {
      const response: any = await authAPI.login({
        username: values.username,
        password: values.password,
        captchaId,
        captchaCode: values.captchaCode,
      });

      if (response.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(response.message || '登录失败');
        loadCaptcha();
      }
    } catch (error: any) {
      message.error(error.message || '登录失败，请检查用户名和密码');
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* 左侧品牌区域 */}
      <div className="login-brand">
        <div className="brand-content">
          <div className="brand-logo">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="12" fill="url(#gradient)" />
              <path
                d="M20 24H44V28H20V24Z M20 30H44V34H20V30Z M20 36H36V40H20V36Z"
                fill="white"
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="64" y2="64">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="brand-title">上海鑫慧昀</h1>
          <p className="brand-subtitle">智能仓储系统</p>
          <div className="brand-description">
            <p>智能化仓储管理解决方案</p>
            <p>提升效率，精准管控，数据驱动</p>
          </div>
        </div>

        {/* 装饰性图形 */}
        <div className="decorative-circles">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="login-form-wrapper">
        <div className="login-form-container">
          <div className="login-header">
            <h2>欢迎回来</h2>
            <p>请登录您的账户以继续</p>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            className="login-form"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined className="input-icon" />}
                placeholder="用户名"
                className="login-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="input-icon" />}
                placeholder="密码"
                className="login-input"
              />
            </Form.Item>

            <Form.Item>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  name="captchaCode"
                  noStyle
                  rules={[{ required: true, message: '请输入验证码' }]}
                >
                  <Input
                    placeholder="验证码"
                    className="login-input captcha-input"
                    maxLength={4}
                  />
                </Form.Item>
                <div
                  className="captcha-display"
                  onClick={loadCaptcha}
                  dangerouslySetInnerHTML={{ __html: captchaSvg }}
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadCaptcha}
                  loading={captchaLoading}
                  className="captcha-refresh-btn"
                />
              </Space.Compact>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-button"
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer">
            <p>© 上海鑫慧昀仓储服务有限公司</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
