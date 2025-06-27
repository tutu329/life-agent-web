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

# 同步office_api.py到Collabora CODE容器
echo "🐍 同步office_api.py到Collabora CODE容器..."
if [ -f "./src/office_api/office_api.py" ]; then
  # 先上传到服务器临时目录
  scp -P $REMOTE_PORT ./src/office_api/office_api.py $REMOTE_USER@$REMOTE_HOST:/tmp/office_api.py
  echo "✅ office_api.py已上传到远程服务器临时目录"
  echo ""
else
  echo "⚠️ 警告: ./src/office_api/office_api.py 文件未找到，跳过Python脚本同步"
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

# 定义office_api.py同步函数
sync_office_api() {
  echo "🐍 同步office_api.py到Collabora CODE容器..."
  if [ -f "/tmp/office_api.py" ]; then
    # 等待容器完全启动
    sleep 3
    # 复制文件到容器
    sudo docker cp /tmp/office_api.py collabora-code-5102:/opt/collaboraoffice/share/Scripts/python/office_api.py
    # 设置正确的权限和所有者
    sudo docker exec collabora-code-5102 chown cool:cool /opt/collaboraoffice/share/Scripts/python/office_api.py
    sudo docker exec collabora-code-5102 chmod 755 /opt/collaboraoffice/share/Scripts/python/office_api.py
    echo "✅ office_api.py已成功同步到Collabora CODE容器"
    # 显示容器中的Python脚本文件
    echo "📋 容器中的Python脚本文件列表:"
    sudo docker exec collabora-code-5102 ls -la /opt/collaboraoffice/share/Scripts/python/
    # 清理临时文件
    rm -f /tmp/office_api.py
  else
    echo "⚠️ /tmp/office_api.py文件不存在，跳过同步"
  fi
}

# 1. 检查5112端口状态 (Office WebSocket服务器)
echo "🔍 检查5112端口状态..."
# 检查端口5112是否被占用
if sudo lsof -i:5112 > /dev/null 2>&1; then
  echo "📋 5112端口占用情况:"
  sudo lsof -i:5112
  echo "ℹ️ 注意: 如果是Agent FastAPI服务器占用5112端口，这是正常的"
  echo "🤔 如果需要重启Office WebSocket服务器，请先停止Agent FastAPI服务器"
else
  echo "✅ 5112端口无占用"
fi

# 2. 管理 Collabora CODE docker服务 (5102端口)
echo "🔄 管理 Collabora CODE 服务器..."

# 修复SSL证书权限 (确保容器内的cool用户和tutu用户都可以读取)
echo "🔧 修复SSL证书权限..."
# 创建ssl-cert组（如果不存在）
sudo groupadd ssl-cert 2>/dev/null || true
# 将tutu用户添加到ssl-cert组
sudo usermod -a -G ssl-cert tutu 2>/dev/null || true
# 设置证书文件的组为ssl-cert，并设置适当权限
sudo chown 1001:ssl-cert /home/tutu/ssl/powerai.key /home/tutu/ssl/powerai_public.crt /home/tutu/ssl/powerai_chain.crt
sudo chmod 644 /home/tutu/ssl/powerai.key  # 私钥：所有者和组可读
sudo chmod 644 /home/tutu/ssl/powerai_public.crt /home/tutu/ssl/powerai_chain.crt  # 公钥：所有人可读

# 检查容器是否存在
if sudo docker ps -a --format "table {{.Names}}" | grep -q "^collabora-code-5102$"; then
  echo "📦 发现已存在的 collabora-code-5102 容器"
  
  # 检查容器是否正在运行
  if sudo docker ps --format "table {{.Names}}" | grep -q "^collabora-code-5102$"; then
    echo "🔄 停止运行中的容器..."
    sudo docker stop collabora-code-5102 || true
  fi
  
  echo "🚀 启动已存在的 collabora-code-5102 容器..."
  sudo docker start collabora-code-5102
  echo "✅ Collabora CODE 服务器已启动 (复用已存在容器，保留自定义配置)"
  
  # 确保office_api.py文件存在于容器中
  echo "🐍 检查并同步office_api.py到容器..."
  sync_office_api
else
  echo "🆕 未发现已存在容器，创建新的 collabora-code-5102 容器..."
  # 启动 Collabora CODE 容器，使用 SSL 证书和中文语言支持
  sudo docker run --privileged -d \
    --name collabora-code-5102 \
    -p 5102:9980 \
    -e "PATH=/opt/collaboraoffice/program:$PATH" \
    -e "domain=.*" \
    -e "DONT_GEN_SSL_CERT=1" \
    -e "dictionaries=en_US zh_CN" \
    -e "extra_params=--o:ssl.enable=true --o:ssl.termination=false --o:ssl.cert_file_path=/opt/ssl/powerai_public.crt --o:ssl.key_file_path=/opt/ssl/powerai.key --o:ssl.ca_file_path=/opt/ssl/powerai_chain.crt --o:net.content_security_policy=frame-ancestors * --o:default_language=zh-CN" \
    -e "aliasgroup1=https://powerai.cc:5103,https://powerai.cc:7866" \
    -v /home/tutu/ssl:/opt/ssl:ro \
    --restart unless-stopped \
    collabora/code:latest
  echo "✅ Collabora CODE 服务器已创建并启动 (使用 powerai.cc SSL 证书和中文语言支持)"

    # -e "PYTHONHOME=/opt/collaboraoffice" \
    # -e "PYTHONPATH=/opt/collaboraoffice/program:/opt/collaboraoffice/share/Scripts/python" \
    
  # 等待容器完全启动
  echo "⏳ 等待容器完全启动..."
  sleep 5
  
  # 同步office_api.py到新容器
  echo "🐍 同步office_api.py到新容器..."
  sync_office_api
fi

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

# 4. 最终端口状态检查
echo "🔍 最终端口状态检查..."

# 检查5112端口状态（Office WebSocket服务器应该正在运行）
if sudo lsof -i:5112 > /dev/null 2>&1; then
  echo "✅ 5112端口正在使用中（Office WebSocket服务器）"
else
  echo "⚠️ 警告: 5112端口未被占用，Office WebSocket服务器可能未启动"
fi

# 清理5101端口应用
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