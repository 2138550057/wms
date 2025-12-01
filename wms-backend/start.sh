#!/bin/bash

echo "========================================"
echo "  WMS 仓库管理系统 - 后端服务启动"
echo "========================================"
echo ""

# 检查是否在 wms-backend 目录
if [ ! -f "package.json" ]; then
  echo "错误: 请在 wms-backend 目录下运行此脚本"
  exit 1
fi

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
  echo "📦 首次运行,正在安装依赖..."
  npm install
  echo ""
fi

# 检查 .env 文件是否存在
if [ ! -f ".env" ]; then
  echo "⚙️  创建环境变量文件..."
  cp .env.example .env
  echo "✅ .env 文件已创建,使用默认配置"
  echo ""
fi

# 检查数据库是否已初始化
if [ ! -d "node_modules/.prisma" ]; then
  echo "🗄️  初始化数据库..."
  npm run prisma:generate
  npm run prisma:migrate
  echo ""
fi

echo "🚀 启动开发服务器..."
echo ""
npm run dev
