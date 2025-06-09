#!/bin/bash

echo "🧹 移除 Docker 版本的 OnlyOffice Document Server"
echo "=============================================="

# 检查Docker是否在运行
if ! docker info > /dev/null 2>&1; then
    echo "ℹ️  Docker 未运行，跳过 Docker 清理"
else
    echo "🔍 检查现有的 OnlyOffice Docker 容器..."
    
    # 停止并删除现有容器
    if docker ps -a | grep -q onlyoffice-server; then
        echo "🛑 停止 OnlyOffice Docker 容器..."
        docker stop onlyoffice-server 2>/dev/null || true
        
        echo "🗑️  删除 OnlyOffice Docker 容器..."
        docker rm onlyoffice-server 2>/dev/null || true
        
        echo "✅ Docker 容器已移除"
    else
        echo "ℹ️  未找到名为 'onlyoffice-server' 的容器"
    fi
    
    # 可选：删除 OnlyOffice 镜像
    read -p "是否删除 OnlyOffice Docker 镜像？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  删除 OnlyOffice Docker 镜像..."
        docker rmi onlyoffice/documentserver:latest 2>/dev/null || true
        docker rmi registry.cn-hangzhou.aliyuncs.com/onlyoffice/documentserver:latest 2>/dev/null || true
        echo "✅ Docker 镜像已删除"
    fi
fi

# 清理数据目录
if [ -d ~/onlyoffice-data ]; then
    read -p "是否删除 OnlyOffice 数据目录 (~/onlyoffice-data)？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  删除数据目录..."
        rm -rf ~/onlyoffice-data
        echo "✅ 数据目录已删除"
    fi
fi

# 清理旧的安装目录
if [ -d ~/onlyoffice-setup ]; then
    echo "🗑️  清理安装临时目录..."
    rm -rf ~/onlyoffice-setup
    echo "✅ 临时目录已清理"
fi

echo ""
echo "✅ Docker 版本的 OnlyOffice 清理完成！"
echo "💡 现在可以运行 ./install-onlyoffice-native.sh 来安装本地版本" 