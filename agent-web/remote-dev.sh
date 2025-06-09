#!/bin/bash

# 远程开发环境启动脚本
# 直接在powerai.cc服务器上启动开发环境

set -e

# 配置变量
REMOTE_HOST="powerai.cc"
REMOTE_PORT="6000"
REMOTE_USER="tutu"
REMOTE_PATH="/home/tutu/server/life-agent-web"

echo "🚀 启动远程开发环境..."
echo "🌐 服务器地址: http://powerai.cc:5101"
echo "⚡ 使用热重载，代码更改会自动生效"
echo "🛑 按 Ctrl+C 停止服务器"
echo ""

# 连接到远程服务器并启动开发环境
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'EOF'
# 加载nvm并使用Node.js 18
source ~/.nvm/nvm.sh
nvm use 18

cd /home/tutu/server/life-agent-web

echo "📌 使用Node.js版本: $(node --version)"
echo "📌 使用npm版本: $(npm --version)"

# 检查是否存在package.json
if [ ! -f "package.json" ]; then
  echo "❌ 项目未找到，请先运行 ./deploy-remote.sh 部署项目"
  exit 1
fi

# 检查node_modules是否存在，如果不存在或者Node版本不匹配则重新安装
if [ ! -d "node_modules" ] || ! npm list &> /dev/null; then
  echo "📦 安装项目依赖..."
  rm -rf node_modules package-lock.json
  npm install
fi

echo "🛠️ 启动开发服务器..."
echo "访问地址: http://powerai.cc:5101"

# 启动开发服务器
npm run dev -- --port 5101 --host 0.0.0.0
EOF 