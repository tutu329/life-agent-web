#!/bin/bash

echo "🔧 OnlyOffice 编辑器调试脚本"
echo "============================"

echo "1. 检查服务状态..."
./check-status.sh

echo -e "\n2. 检查测试页面..."
echo "在浏览器中打开以下页面进行对比测试："
echo "   React应用: http://localhost:5173 (点击'报告编制')"
echo "   测试页面: http://localhost:5173/test-onlyoffice.html"

echo -e "\n3. 调试步骤："
echo "   a) 首先测试独立的HTML页面是否正常工作"
echo "   b) 如果HTML页面正常，问题可能在React组件"
echo "   c) 如果HTML页面也有问题，检查OnlyOffice服务器配置"

echo -e "\n4. 常见问题检查："
echo "   - 查看浏览器控制台是否有错误信息"
echo "   - 检查网络选项卡中文档URL是否能正常下载"
echo "   - 确认OnlyOffice iframe是否正确加载"

echo -e "\n5. 如果编辑区域仍然不显示："
echo "   - 可能是CSS高度问题"
echo "   - 可能是文档URL无法访问"
echo "   - 可能是OnlyOffice配置参数问题"

echo -e "\n6. 日志检查："
echo "   Docker日志: docker logs onlyoffice-server"
echo "   浏览器控制台: F12 -> Console"

echo -e "\n�� 现在请在浏览器中测试页面..." 