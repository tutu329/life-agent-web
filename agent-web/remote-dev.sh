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
echo "🌐 服务器地址: https://powerai.cc:5101"
echo "📄 Collabora CODE 地址: https://powerai.cc:5102"
echo "🔗 WOPI 服务器地址: https://powerai.cc:5103"
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

# 1. 启动Agent Mock Server (端口5112)
echo "🤖 启动Agent Mock Server..."
# 检查端口5112是否被占用
if sudo lsof -i:5112 > /dev/null 2>&1; then
  echo "🛑 停止已有的5112端口应用..."
  sudo pkill -f "agent_mock_server.py" || true
  sudo lsof -ti:5112 | xargs sudo kill -9 || true
  sleep 2
fi

# 启动Mock Server
if [ -f "public/plugins/agent_listener3/agent_mock_server.py" ]; then
  echo "🚀 在后台启动Agent Mock Server (端口5112)..."
  cd public/plugins/agent_listener3
  # 激活conda环境
  source /home/tutu/anaconda3/etc/profile.d/conda.sh
  conda activate client
  # 检查websockets库是否安装
  python -c "import websockets" 2>/dev/null || pip install websockets
  # 在后台启动
  nohup python agent_mock_server.py > /tmp/agent_mock_server.log 2>&1 &
  cd ../../..
  sleep 1
  # 检查是否启动成功
  if sudo lsof -i:5112 > /dev/null 2>&1; then
    echo "✅ Agent Mock Server 已启动 (端口5112)"
    echo "📄 日志文件: /tmp/agent_mock_server.log"
  else
    echo "❌ Agent Mock Server 启动失败"
  fi
else
  echo "⚠️ 警告: agent_mock_server.py 文件未找到，跳过Mock Server启动"
fi

# 2. 重启 Collabora CODE docker服务 (5102端口)
echo "🔄 重启 Collabora CODE 服务器..."
sudo docker stop collabora-code-5102 || true
sudo docker rm collabora-code-5102 || true

# 修复SSL证书权限 (确保容器内的cool用户和tutu用户都可以读取)
echo "🔧 修复SSL证书权限..."
# 创建ssl-cert组（如果不存在）
sudo groupadd ssl-cert 2>/dev/null || true
# 将tutu用户添加到ssl-cert组
sudo usermod -a -G ssl-cert tutu 2>/dev/null || true
# 设置证书文件的组为ssl-cert，并设置适当权限
sudo chown 1001:ssl-cert /home/tutu/ssl/powerai.key /home/tutu/ssl/powerai_public.crt /home/tutu/ssl/powerai_chain.crt
sudo chmod 640 /home/tutu/ssl/powerai.key  # 私钥：所有者和组可读
sudo chmod 644 /home/tutu/ssl/powerai_public.crt /home/tutu/ssl/powerai_chain.crt  # 公钥：所有人可读

# 启动 Collabora CODE 容器，使用 SSL 证书
echo "🚀 启动 Collabora CODE 服务器 (使用 SSL 证书)..."
sudo docker run -d \
  --name collabora-code-5102 \
  -p 5102:9980 \
  -e "domain=.*" \
  -e "DONT_GEN_SSL_CERT=1" \
  -e "extra_params=--o:ssl.enable=true --o:ssl.termination=false --o:ssl.cert_file_path=/opt/ssl/powerai_public.crt --o:ssl.key_file_path=/opt/ssl/powerai.key --o:ssl.ca_file_path=/opt/ssl/powerai_chain.crt" \
  -v /home/tutu/ssl:/opt/ssl:ro \
  --restart unless-stopped \
  collabora/code:latest

echo "✅ Collabora CODE 服务器已重启 (使用 powerai.cc SSL 证书)"

# 3. 启动 WOPI 服务器 (5103端口)
echo "🔗 启动 WOPI 服务器..."
# 检查端口5103是否被占用
if sudo lsof -i:5103 > /dev/null 2>&1; then
  echo "🛑 停止已有的5103端口应用..."
  sudo lsof -ti:5103 | xargs sudo kill -9 || true
  sleep 2
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ] || ! npm list express &> /dev/null; then
  echo "📦 安装WOPI服务器依赖..."
  npm install express cors @types/express @types/cors @types/node tsx
fi

# 在后台启动WOPI服务器
echo "🚀 在后台启动WOPI服务器 (端口5103)..."
# 确保使用Node.js 18并使用ssl-cert组权限
source ~/.nvm/nvm.sh
nvm use 18
nohup sg ssl-cert -c "npm run wopi-server" > /tmp/wopi_server.log 2>&1 &
sleep 2

# 检查是否启动成功
if sudo lsof -i:5103 > /dev/null 2>&1; then
  echo "✅ WOPI 服务器已启动 (端口5103)"
  echo "📄 日志文件: /tmp/wopi_server.log"
  echo "🔗 健康检查: https://powerai.cc:5103/health"
else
  echo "❌ WOPI 服务器启动失败"
  echo "📄 查看日志: tail -f /tmp/wopi_server.log"
fi

# 4. kill掉已有的5101端口应用
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
echo "访问地址: https://powerai.cc:5101"
echo "Collabora CODE: https://powerai.cc:5102"
echo "WOPI 服务器: https://powerai.cc:5103"

# 启动开发服务器 (使用HTTPS)
export VITE_HTTPS=true
npm run dev -- --port 5101 --host 0.0.0.0
EOF 