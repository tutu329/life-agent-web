#!/bin/bash

echo "🔄 OnlyOffice Document Server 迁移脚本"
echo "从 Docker 版本迁移到本地版本"
echo "======================================"

# 确认操作
read -p "确定要从 Docker 版本迁移到本地版本吗？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 操作已取消"
    exit 0
fi

echo ""
echo "🚀 开始迁移过程..."
echo ""

# 第一步：移除 Docker 版本
echo "📋 步骤 1/3: 移除 Docker 版本"
echo "=============================="
if [ -f "./remove-docker-onlyoffice.sh" ]; then
    ./remove-docker-onlyoffice.sh
else
    echo "⚠️  未找到移除脚本，手动清理 Docker..."
    
    # 手动清理 Docker
    if docker info > /dev/null 2>&1; then
        echo "🛑 停止 Docker 容器..."
        docker stop onlyoffice-server 2>/dev/null || true
        docker rm onlyoffice-server 2>/dev/null || true
        echo "✅ Docker 容器已清理"
    fi
fi

echo ""
echo "📋 步骤 2/3: 安装本地版本"
echo "=========================="
if [ -f "./install-onlyoffice-native.sh" ]; then
    ./install-onlyoffice-native.sh
else
    echo "❌ 未找到安装脚本，请手动运行 ./install-onlyoffice-native.sh"
    exit 1
fi

echo ""
echo "📋 步骤 3/3: 验证安装"
echo "===================="

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
if curl -s "http://localhost:8080/healthcheck" | grep -q "true"; then
    echo "✅ 本地版本启动成功！"
    
    # 运行状态检查
    if [ -f "./check-onlyoffice-status-native.sh" ]; then
        echo ""
        echo "📊 运行完整状态检查:"
        ./check-onlyoffice-status-native.sh
    fi
    
    echo ""
    echo "🎉 迁移完成！"
    echo ""
    echo "=== 重要变化 ==="
    echo "• ❌ 不再需要 Docker Desktop"
    echo "• ✅ 使用本地 Node.js 服务"
    echo "• ✅ 开机自动启动"
    echo "• ✅ 更快的启动速度"
    echo "• ✅ 更低的资源占用"
    echo ""
    echo "=== 访问地址 ==="
    echo "• 前端应用: http://localhost:5173"
    echo "• OnlyOffice 服务: http://localhost:8080"
    echo "• 健康检查: http://localhost:8080/healthcheck"
    echo "• 欢迎页面: http://localhost:8080/welcome/"
    echo ""
    echo "=== 管理命令 ==="
    echo "• 查看状态: ./check-onlyoffice-status-native.sh"
    echo "• 手动启动: ~/onlyoffice-documentserver/start.sh"
    echo "• 手动停止: ~/onlyoffice-documentserver/stop.sh"
    echo "• 查看日志: tail -f ~/Library/Logs/onlyoffice-documentserver.log"
    
else
    echo "❌ 本地版本启动失败"
    echo "🔧 故障排除："
    echo "1. 检查 Node.js 是否正确安装: node --version"
    echo "2. 手动启动: ~/onlyoffice-documentserver/start.sh"
    echo "3. 查看日志: tail -f ~/Library/Logs/onlyoffice-documentserver.log"
    echo "4. 重新安装: ./install-onlyoffice-native.sh"
fi

echo ""
echo "📚 更多信息请查看 README.md 文件" 