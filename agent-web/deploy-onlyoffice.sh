#!/bin/bash

echo "🚀 OnlyOffice Document Server 部署脚本"
echo "======================================"

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

echo "✅ Docker 已运行"

# 方法1：直接拉取官方镜像
echo "📦 正在拉取 OnlyOffice Document Server 镜像..."
docker pull onlyoffice/documentserver:latest

if [ $? -eq 0 ]; then
    echo "✅ 镜像拉取成功"
else
    echo "⚠️  官方镜像拉取失败，尝试使用阿里云镜像..."
    # 方法2：使用阿里云镜像
    docker pull registry.cn-hangzhou.aliyuncs.com/onlyoffice/documentserver:latest
    docker tag registry.cn-hangzhou.aliyuncs.com/onlyoffice/documentserver:latest onlyoffice/documentserver:latest
fi

# 停止并删除现有容器（如果存在）
echo "🧹 清理现有容器..."
docker stop onlyoffice-server 2>/dev/null || true
docker rm onlyoffice-server 2>/dev/null || true

# 创建数据目录
mkdir -p ~/onlyoffice-data/logs
mkdir -p ~/onlyoffice-data/data
mkdir -p ~/onlyoffice-data/lib

# 启动OnlyOffice服务器
echo "🚀 启动 OnlyOffice Document Server..."
docker run -d \
    --name onlyoffice-server \
    -p 8080:80 \
    -v ~/onlyoffice-data/logs:/var/log/onlyoffice \
    -v ~/onlyoffice-data/data:/var/www/onlyoffice/Data \
    -v ~/onlyoffice-data/lib:/var/lib/onlyoffice \
    -e JWT_ENABLED=false \
    --restart unless-stopped \
    onlyoffice/documentserver

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
if curl -s http://localhost:8080/healthcheck > /dev/null; then
    echo "✅ OnlyOffice Document Server 启动成功！"
    echo "🌐 访问地址: http://localhost:8080"
    echo "📝 现在可以在应用中使用 OnlyOffice 编辑器了"
else
    echo "❌ 服务启动失败，请检查 Docker 日志:"
    echo "   docker logs onlyoffice-server"
fi

echo ""
echo "📋 常用命令:"
echo "   查看日志: docker logs onlyoffice-server"
echo "   停止服务: docker stop onlyoffice-server"
echo "   启动服务: docker start onlyoffice-server"
echo "   重启服务: docker restart onlyoffice-server" 