#!/bin/bash

echo "🚀 在 powerai.cc 上安装 OnlyOffice Document Server"
echo "==============================================="
echo "目标服务器: powerai.cc:6000"
echo "OnlyOffice 端口: 5102"
echo ""

# 检查SSH连接
echo "🔐 检查SSH连接..."
if ! ssh -p 6000 -o ConnectTimeout=10 tutu@powerai.cc "echo '连接成功'" 2>/dev/null; then
    echo "❌ 无法连接到 powerai.cc:6000"
    echo "请检查："
    echo "1. SSH密钥是否正确配置"
    echo "2. 服务器是否可访问"
    echo "3. 端口6000是否开放"
    exit 1
fi

echo "✅ SSH连接正常"

# 在远程服务器上执行安装
echo "📦 在远程服务器上安装 OnlyOffice Document Server..."

ssh -p 6000 tutu@powerai.cc << 'REMOTE_SCRIPT'
#!/bin/bash

echo "🖥️  在远程服务器上开始安装 OnlyOffice Document Server"
echo "服务器信息: $(hostname)"
echo "用户: $(whoami)"
echo "当前目录: $(pwd)"
echo ""

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    
    # 更新包管理器
    sudo apt-get update
    
    # 安装必要的包
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # 添加Docker官方GPG密钥
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # 添加Docker仓库
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # 安装Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # 启动Docker服务
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # 将当前用户添加到docker组
    sudo usermod -aG docker $USER
    
    echo "✅ Docker 安装完成"
else
    echo "✅ Docker 已安装"
fi

# 检查Docker是否运行
if ! sudo docker info > /dev/null 2>&1; then
    echo "🔧 启动 Docker 服务..."
    sudo systemctl start docker
    sleep 5
fi

echo "✅ Docker 服务正常"

# 停止并删除现有的OnlyOffice容器（如果存在）
echo "🧹 清理现有容器..."
sudo docker stop onlyoffice-server-5102 2>/dev/null || true
sudo docker rm onlyoffice-server-5102 2>/dev/null || true

# 创建数据目录
ONLYOFFICE_DATA_DIR="$HOME/onlyoffice-data-5102"
echo "📁 创建数据目录: $ONLYOFFICE_DATA_DIR"
mkdir -p "$ONLYOFFICE_DATA_DIR"/{logs,data,lib,cache}

# 拉取OnlyOffice Docker镜像
echo "📦 拉取 OnlyOffice Document Server 镜像..."
sudo docker pull onlyoffice/documentserver:latest

if [ $? -ne 0 ]; then
    echo "⚠️  官方镜像拉取失败，尝试使用阿里云镜像..."
    sudo docker pull registry.cn-hangzhou.aliyuncs.com/onlyoffice/documentserver:latest
    sudo docker tag registry.cn-hangzhou.aliyuncs.com/onlyoffice/documentserver:latest onlyoffice/documentserver:latest
fi

# 启动OnlyOffice服务器，端口映射到5102
echo "🚀 启动 OnlyOffice Document Server (端口: 5102)..."
sudo docker run -d \
    --name onlyoffice-server-5102 \
    -p 5102:80 \
    -v "$ONLYOFFICE_DATA_DIR/logs":/var/log/onlyoffice \
    -v "$ONLYOFFICE_DATA_DIR/data":/var/www/onlyoffice/Data \
    -v "$ONLYOFFICE_DATA_DIR/lib":/var/lib/onlyoffice \
    -v "$ONLYOFFICE_DATA_DIR/cache":/var/lib/onlyoffice/documentserver/App_Data/cache/files \
    -e JWT_ENABLED=false \
    -e JWT_SECRET="" \
    --restart unless-stopped \
    onlyoffice/documentserver:latest

if [ $? -eq 0 ]; then
    echo "✅ OnlyOffice 容器启动成功"
else
    echo "❌ OnlyOffice 容器启动失败"
    exit 1
fi

# 等待服务启动
echo "⏳ 等待服务启动完成 (大约需要30-60秒)..."
for i in {1..12}; do
    echo "   检查第 $i 次..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5102/healthcheck | grep -q "200"; then
        break
    fi
    sleep 5
done

# 最终检查服务状态
echo "🔍 检查服务状态..."
if curl -s http://localhost:5102/healthcheck > /dev/null; then
    echo ""
    echo "🎉 OnlyOffice Document Server 安装并启动成功！"
    echo "==============================================="
    echo "📍 服务地址: http://powerai.cc:5102"
    echo "🏥 健康检查: http://powerai.cc:5102/healthcheck"
    echo "📄 欢迎页面: http://powerai.cc:5102/welcome/"
    echo "📝 API 地址: http://powerai.cc:5102/web-apps/apps/api/documents/api.js"
    echo ""
    echo "📋 管理命令:"
    echo "   查看容器状态: sudo docker ps | grep onlyoffice-server-5102"
    echo "   查看日志: sudo docker logs onlyoffice-server-5102"
    echo "   停止服务: sudo docker stop onlyoffice-server-5102"
    echo "   启动服务: sudo docker start onlyoffice-server-5102"
    echo "   重启服务: sudo docker restart onlyoffice-server-5102"
    echo "   删除容器: sudo docker rm -f onlyoffice-server-5102"
    echo ""
    echo "🗂️  数据目录: $ONLYOFFICE_DATA_DIR"
    echo "📊 系统资源使用情况:"
    sudo docker stats onlyoffice-server-5102 --no-stream
else
    echo "❌ 服务启动失败，请检查日志:"
    echo "   sudo docker logs onlyoffice-server-5102"
fi

REMOTE_SCRIPT

echo ""
echo "🎉 远程安装完成！"
echo "您现在可以访问 http://powerai.cc:5102 来使用 OnlyOffice Document Server" 