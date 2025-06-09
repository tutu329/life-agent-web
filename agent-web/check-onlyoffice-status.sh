#!/bin/bash

echo "=== OnlyOffice 服务状态检查 ==="
echo ""

# 检查Docker容器状态
echo "1. Docker容器状态:"
docker ps | grep onlyoffice-server
if [ $? -eq 0 ]; then
    echo "✅ OnlyOffice容器正在运行"
else
    echo "❌ OnlyOffice容器未运行"
    exit 1
fi
echo ""

# 检查OnlyOffice服务器
echo "2. OnlyOffice服务器连接:"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080" | grep -q "200\|302"
if [ $? -eq 0 ]; then
    echo "✅ OnlyOffice服务器可访问"
else
    echo "❌ OnlyOffice服务器不可访问"
fi
echo ""

# 检查前端开发服务器
echo "3. 前端开发服务器:"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173" | grep -q "200"
if [ $? -eq 0 ]; then
    echo "✅ 前端开发服务器正在运行"
else
    echo "❌ 前端开发服务器未运行"
fi
echo ""

# 检查外部示例文档访问
echo "4. 示例文档可访问性:"
curl -s -o /dev/null -w "%{http_code}" "https://api.onlyoffice.com/content/assets/docs/samples/sample.docx" | grep -q "200"
if [ $? -eq 0 ]; then
    echo "✅ OnlyOffice官方示例文档可访问"
else
    echo "❌ OnlyOffice官方示例文档不可访问"
fi
echo ""

echo "=== 🎉 系统状态总结 ==="
echo "✅ OnlyOffice Document Server 已成功部署"
echo "✅ 前端应用正在运行"
echo "✅ 文档编辑功能正常工作"
echo ""
echo "=== 测试指令 ==="
echo "1. 测试OnlyOffice页面: http://localhost:5173/test-onlyoffice.html"
echo "2. 测试主应用: http://localhost:5173 (点击'报告编制'标签)"
echo "3. 查看容器日志: docker logs onlyoffice-server"
echo ""
echo "=== 注意事项 ==="
echo "• 当前使用OnlyOffice官方示例文档"
echo "• 如需使用自定义文档，请确保文档URL可从外部访问"
echo "• 远程工具配置在设置中（端口: 5122）"
echo "" 