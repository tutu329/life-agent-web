#!/bin/bash

echo "=== OnlyOffice 本地服务状态检查 ==="
echo ""

# 检查本地 Node.js 进程
echo "1. OnlyOffice 本地服务状态:"
if pgrep -f "node.*server.js" > /dev/null; then
    PID=$(pgrep -f "node.*server.js")
    echo "✅ OnlyOffice 本地服务正在运行 (PID: $PID)"
else
    echo "❌ OnlyOffice 本地服务未运行"
    echo "💡 启动命令: ~/onlyoffice-documentserver/start.sh"
fi
echo ""

# 检查端口占用
echo "2. 端口占用检查 (8080):"
if lsof -i:8080 > /dev/null 2>&1; then
    echo "✅ 端口 8080 已被占用"
    lsof -i:8080 | head -2
else
    echo "❌ 端口 8080 未被占用"
fi
echo ""

# 检查 OnlyOffice 服务器响应
echo "3. OnlyOffice 服务器连接:"
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080" | grep -q "200\|302"; then
    echo "✅ OnlyOffice 服务器可访问"
else
    echo "❌ OnlyOffice 服务器不可访问"
fi
echo ""

# 检查健康状态
echo "4. 健康检查:"
if curl -s "http://localhost:8080/healthcheck" | grep -q "true"; then
    echo "✅ OnlyOffice 健康检查通过"
else
    echo "❌ OnlyOffice 健康检查失败"
fi
echo ""

# 检查 API 端点
echo "5. API 端点检查:"
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/web-apps/apps/api/documents/api.js" | grep -q "200"; then
    echo "✅ OnlyOffice API 端点可访问"
else
    echo "❌ OnlyOffice API 端点不可访问"
fi
echo ""

# 检查前端开发服务器
echo "6. 前端开发服务器:"
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173" | grep -q "200"; then
    echo "✅ 前端开发服务器正在运行"
else
    echo "❌ 前端开发服务器未运行"
    echo "💡 启动命令: npm run dev"
fi
echo ""

# 检查 LaunchAgent 状态
echo "7. 系统服务状态:"
if launchctl list | grep -q "com.onlyoffice.documentserver"; then
    echo "✅ OnlyOffice 系统服务已注册"
else
    echo "❌ OnlyOffice 系统服务未注册"
    echo "💡 注册命令: launchctl load ~/Library/LaunchAgents/com.onlyoffice.documentserver.plist"
fi
echo ""

echo "=== 🎉 系统状态总结 ==="
if pgrep -f "node.*server.js" > /dev/null && curl -s "http://localhost:8080/healthcheck" | grep -q "true"; then
    echo "✅ OnlyOffice Document Server (本地版) 运行正常"
    echo "✅ 所有核心功能可用"
    echo ""
    echo "=== 📋 访问地址 ==="
    echo "• 主页面: http://localhost:5173"
    echo "• OnlyOffice 欢迎页: http://localhost:8080/welcome/"
    echo "• 健康检查: http://localhost:8080/healthcheck"
    echo "• API 端点: http://localhost:8080/web-apps/apps/api/documents/api.js"
else
    echo "❌ OnlyOffice Document Server 未正常运行"
    echo ""
    echo "=== 🔧 故障排除 ==="
    echo "1. 手动启动: ~/onlyoffice-documentserver/start.sh"
    echo "2. 查看日志: tail -f ~/Library/Logs/onlyoffice-documentserver.log"
    echo "3. 检查状态: ~/onlyoffice-documentserver/status.sh"
    echo "4. 重新安装: ./install-onlyoffice-native.sh"
fi
echo ""

echo "=== 💡 管理命令 ==="
echo "• 启动服务: ~/onlyoffice-documentserver/start.sh"
echo "• 停止服务: ~/onlyoffice-documentserver/stop.sh"
echo "• 查看状态: ~/onlyoffice-documentserver/status.sh"
echo "• 查看日志: tail -f ~/Library/Logs/onlyoffice-documentserver.log"
echo "• 重启服务: launchctl unload ~/Library/LaunchAgents/com.onlyoffice.documentserver.plist && launchctl load ~/Library/LaunchAgents/com.onlyoffice.documentserver.plist"
echo "" 