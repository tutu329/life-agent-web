#!/bin/bash

echo "🔍 OnlyOffice 诊断脚本"
echo "======================"

# 1. 检查容器状态
echo "1. 检查 Docker 容器..."
docker ps | grep onlyoffice-server || echo "❌ OnlyOffice 容器未运行"

# 2. 检查端口占用
echo -e "\n2. 检查端口 8080..."
if lsof -i:8080 > /dev/null 2>&1; then
    echo "✅ 端口 8080 已被占用"
    lsof -i:8080
else
    echo "❌ 端口 8080 未被占用"
fi

# 3. 检查 OnlyOffice 健康状态
echo -e "\n3. 检查 OnlyOffice 健康状态..."
curl -s http://localhost:8080/healthcheck && echo " ✅ 健康检查通过" || echo "❌ 健康检查失败"

# 4. 检查 API 接口
echo -e "\n4. 检查 API 文件..."
if curl -s http://localhost:8080/web-apps/apps/api/documents/api.js | head -1 | grep -q "Copyright"; then
    echo "✅ API 文件可访问"
else
    echo "❌ API 文件不可访问"
fi

# 5. 检查欢迎页面
echo -e "\n5. 检查欢迎页面..."
if curl -s http://localhost:8080/welcome/ | grep -q "ONLYOFFICE"; then
    echo "✅ 欢迎页面正常"
else
    echo "❌ 欢迎页面异常"
fi

# 6. 检查最新日志
echo -e "\n6. 最新容器日志..."
docker logs onlyoffice-server --tail 5

echo -e "\n📋 诊断完成"
echo "如果所有检查都通过，但前端仍有问题，可能是："
echo "1. CORS 跨域问题"
echo "2. 前端配置参数问题"
echo "3. 浏览器缓存问题"
echo ""
echo "建议访问测试页面: http://localhost:5173/test-onlyoffice.html" 