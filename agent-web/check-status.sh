#!/bin/bash

echo "📊 服务状态检查"
echo "================"

# 检查前端应用
echo -n "🌐 前端应用 (http://localhost:5173): "
if curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo "✅ 运行正常"
else
    echo "❌ 未运行"
fi

# 检查OnlyOffice服务器
echo -n "📝 OnlyOffice服务器 (http://localhost:8080): "
if curl -s http://localhost:8080/healthcheck >/dev/null 2>&1; then
    echo "✅ 运行正常"
else
    echo "❌ 未运行或启动中"
fi

# 检查Docker容器状态
echo -n "🐳 OnlyOffice容器状态: "
if docker ps | grep -q onlyoffice-server; then
    STATUS=$(docker ps --format "table {{.Status}}" | grep -A1 "STATUS" | tail -1)
    echo "✅ 运行中 ($STATUS)"
else
    echo "❌ 未运行"
fi

echo ""
echo "🔗 访问链接:"
echo "   前端应用: http://localhost:5173"
echo "   OnlyOffice管理: http://localhost:8080"
echo ""
echo "💡 如果OnlyOffice未运行，请执行:"
echo "   docker start onlyoffice-server" 