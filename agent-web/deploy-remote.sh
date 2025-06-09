#!/bin/bash

# 远程开发部署脚本
# 用于将agent-web项目部署到powerai.cc服务器

set -e

# 配置变量
REMOTE_HOST="powerai.cc"
REMOTE_PORT="6000"
REMOTE_USER="tutu"
REMOTE_PATH="/home/tutu/server/life-agent-web"
LOCAL_PATH="$(pwd)"
PROJECT_NAME="agent-web"

echo "🚀 开始部署agent-web项目到远程服务器..."

# 1. 创建远程目录
echo "📁 创建远程目录..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH"

# 2. 同步项目文件（排除node_modules等）
echo "📦 同步项目文件到远程服务器..."
rsync -avz -e "ssh -p $REMOTE_PORT" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.DS_Store' \
  --exclude '*.log' \
  --exclude '.vscode' \
  --exclude '.idea' \
  "$LOCAL_PATH/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

# 3. 远程安装依赖并启动开发服务器
echo "🔧 在远程服务器上安装依赖并启动开发服务器..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'EOF'
# 加载nvm并使用Node.js 18
source ~/.nvm/nvm.sh
nvm use 18

cd /home/tutu/server/life-agent-web

echo "📌 使用Node.js版本: $(node --version)"
echo "📌 使用npm版本: $(npm --version)"

echo "📦 安装项目依赖..."
rm -rf node_modules package-lock.json
npm install

echo "🛠️ 启动开发服务器..."
echo "服务器将在 http://powerai.cc:5101 上运行"
echo "按 Ctrl+C 停止服务器"

# 启动开发服务器（使用端口5101）
npm run dev -- --port 5101 --host 0.0.0.0
EOF

echo "✅ 部署完成！"
echo "🌐 访问地址: http://powerai.cc:5101" 