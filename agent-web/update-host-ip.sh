#!/bin/bash

echo "🔄 更新宿主机IP地址配置"
echo "======================"

# 获取当前宿主机IP地址
HOST_IP=$(ifconfig | grep -E "inet.*broadcast" | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$HOST_IP" ]; then
    echo "❌ 无法获取宿主机IP地址"
    exit 1
fi

echo "🌐 检测到宿主机IP: $HOST_IP"

# 备份原文件
cp src/components/EditorPanel.tsx src/components/EditorPanel.tsx.backup
cp public/test-onlyoffice.html public/test-onlyoffice.html.backup

echo "💾 已备份原配置文件"

# 更新React组件中的IP地址
sed -i.temp "s|http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:5173/empty.docx|http://$HOST_IP:5173/empty.docx|g" src/components/EditorPanel.tsx
rm src/components/EditorPanel.tsx.temp

# 更新测试页面中的IP地址
sed -i.temp "s|http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:5173/empty.docx|http://$HOST_IP:5173/empty.docx|g" public/test-onlyoffice.html
rm public/test-onlyoffice.html.temp

echo "✅ 已更新配置文件中的IP地址"

# 验证更新
echo ""
echo "🔍 验证更新结果:"
echo "React组件: $(grep -o "http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:5173/empty.docx" src/components/EditorPanel.tsx)"
echo "测试页面: $(grep -o "http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:5173/empty.docx" public/test-onlyoffice.html)"

# 测试文档访问
echo ""
echo "📡 测试文档访问..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$HOST_IP:5173/empty.docx")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 空白文档可通过 $HOST_IP:5173 访问"
else
    echo "❌ 空白文档无法访问 (HTTP $HTTP_CODE)"
    echo "💡 请确保前端开发服务器正在运行: npm run dev"
fi

echo ""
echo "🎉 IP地址更新完成！"
echo "🔗 现在可以测试:"
echo "   主应用: http://localhost:5173 → 报告编制"
echo "   测试页面: http://localhost:5173/test-onlyoffice.html" 