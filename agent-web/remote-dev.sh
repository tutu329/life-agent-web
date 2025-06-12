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

# 先同步代码到远程服务器
echo "🔄 同步代码到远程服务器..."
if [ -f "./sync-to-remote.sh" ]; then
  ./sync-to-remote.sh
  echo ""
else
  echo "⚠️ 警告: sync-to-remote.sh 文件未找到，跳过代码同步"
  echo ""
fi

# 连接到远程服务器并启动开发环境
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'EOF'
# 加载nvm并使用Node.js 18
source ~/.nvm/nvm.sh
nvm use 18

cd /home/tutu/server/life-agent-web

echo "📌 使用Node.js版本: $(node --version)"
echo "📌 使用npm版本: $(npm --version)"

# 1. 重启only-office-server docker服务 (5102端口)
echo "🔄 重启OnlyOffice服务器..."
sudo docker stop onlyoffice-server-5102 || true
sudo docker start onlyoffice-server-5102
echo "✅ OnlyOffice服务器已重启"

# 2. kill掉已有的5101端口应用
echo "🛑 停止已有的5101端口应用..."
sudo pkill -f "port.*5101" || true
sudo lsof -ti:5101 | xargs sudo kill -9 || true
echo "✅ 5101端口已清理"

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