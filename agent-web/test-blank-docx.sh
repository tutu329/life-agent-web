#!/bin/bash

echo "📝 测试空白docx文件配置"
echo "====================="

echo "1. 检查空白docx文件..."
if [ -f "public/empty.docx" ]; then
    echo "✅ 空白docx文件存在"
    ls -la public/empty.docx
else
    echo "❌ 空白docx文件不存在，正在创建..."
    python3 create-empty-docx.py
fi

echo -e "\n2. 检查文件可访问性..."
if curl -s -I "http://localhost:5173/empty.docx" | grep -q "200 OK"; then
    echo "✅ docx文件可以通过Web服务器访问"
else
    echo "❌ docx文件无法访问"
fi

echo -e "\n3. 检查OnlyOffice服务器..."
if curl -s "http://localhost:8080/healthcheck" | grep -q "true"; then
    echo "✅ OnlyOffice服务器运行正常"
else
    echo "❌ OnlyOffice服务器异常"
fi

echo -e "\n4. 测试页面："
echo "   React应用: http://localhost:5173 → 报告编制"
echo "   HTML测试: http://localhost:5173/test-onlyoffice.html"

echo -e "\n�� 现在应该不会再有下载失败的错误了！" 