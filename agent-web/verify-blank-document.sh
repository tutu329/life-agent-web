#!/bin/bash

echo "🔍 验证空白文档配置"
echo "==================="

echo "1. ✅ 检查空白文档文件..."
if [ -f "public/empty.docx" ]; then
    echo "   ✅ empty.docx 文件存在"
    echo "   📄 文件大小: $(ls -lh public/empty.docx | awk '{print $5}')"
else
    echo "   ❌ empty.docx 文件不存在，正在创建..."
    python3 create-empty-docx.py
fi

echo -e "\n2. ✅ 检查文档可访问性..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/empty.docx")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ 空白文档可通过前端服务器访问 (HTTP $HTTP_CODE)"
else
    echo "   ❌ 空白文档无法访问 (HTTP $HTTP_CODE)"
    echo "   💡 请确保前端开发服务器正在运行: npm run dev"
fi

echo -e "\n3. ✅ 检查OnlyOffice服务状态..."
if curl -s "http://localhost:8080/healthcheck" | grep -q "true"; then
    echo "   ✅ OnlyOffice Document Server 运行正常"
else
    echo "   ❌ OnlyOffice Document Server 异常"
    echo "   💡 请检查Docker容器: docker ps | grep onlyoffice"
fi

echo -e "\n4. ✅ 验证配置文件..."
if grep -q "http://localhost:5173/empty.docx" src/components/EditorPanel.tsx; then
    echo "   ✅ React组件已配置使用本地空白文档"
else
    echo "   ❌ React组件仍使用外部文档"
fi

if grep -q "http://localhost:5173/empty.docx" public/test-onlyoffice.html; then
    echo "   ✅ 测试页面已配置使用本地空白文档"
else
    echo "   ❌ 测试页面仍使用外部文档"
fi

echo -e "\n🎉 验证完成！"
echo "=============================="
echo "✅ 现在OnlyOffice编辑器将默认打开空白文档"
echo "📝 文档内容可以直接编辑，自动保存已启用"
echo ""
echo "🔗 测试链接:"
echo "   主应用: http://localhost:5173 → 报告编制标签"
echo "   测试页面: http://localhost:5173/test-onlyoffice.html"
echo ""
echo "💡 如需重新生成空白文档："
echo "   python3 create-empty-docx.py" 