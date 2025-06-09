#!/bin/bash

echo "🧪 本地空白文档完整测试"
echo "======================="

# 1. 基础环境检查
echo "1. 🔍 环境检查..."
HOST_IP=$(ifconfig | grep -E "inet.*broadcast" | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "   宿主机IP: $HOST_IP"

# 2. 检查空白文档
echo -e "\n2. 📄 检查空白文档..."
if [ -f "public/empty.docx" ]; then
    FILE_SIZE=$(ls -lh public/empty.docx | awk '{print $5}')
    echo "   ✅ empty.docx 存在 (大小: $FILE_SIZE)"
else
    echo "   ❌ empty.docx 不存在，正在创建..."
    python3 create-empty-docx.py
fi

# 3. 检查Vite配置
echo -e "\n3. ⚙️ 检查Vite配置..."
if grep -q "host: '0.0.0.0'" vite.config.ts; then
    echo "   ✅ Vite已配置监听所有网络接口"
else
    echo "   ❌ Vite配置有误"
fi

# 4. 检查前端服务器
echo -e "\n4. 🌐 检查前端服务器..."
if lsof -i:5173 > /dev/null 2>&1; then
    echo "   ✅ 前端服务器运行中 (端口5173)"
    
    # 测试localhost访问
    LOCALHOST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/empty.docx")
    echo "   localhost访问: HTTP $LOCALHOST_STATUS"
    
    # 测试IP访问
    IP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$HOST_IP:5173/empty.docx")
    echo "   IP地址访问: HTTP $IP_STATUS"
    
    if [ "$IP_STATUS" = "200" ]; then
        echo "   ✅ 文档可通过宿主机IP访问"
    else
        echo "   ❌ 文档无法通过宿主机IP访问"
    fi
else
    echo "   ❌ 前端服务器未运行，请启动: npm run dev"
fi

# 5. 检查OnlyOffice
echo -e "\n5. 🏢 检查OnlyOffice服务器..."
if docker ps | grep -q onlyoffice-server; then
    echo "   ✅ OnlyOffice容器运行中"
    
    if curl -s "http://localhost:8080/healthcheck" | grep -q "true"; then
        echo "   ✅ OnlyOffice服务健康"
    else
        echo "   ⚠️ OnlyOffice服务可能还在启动中..."
    fi
else
    echo "   ❌ OnlyOffice容器未运行"
fi

# 6. 检查配置文件
echo -e "\n6. 📝 检查配置文件..."
REACT_URL=$(grep -o "http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:5173/empty.docx" src/components/EditorPanel.tsx)
TEST_URL=$(grep -o "http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:5173/empty.docx" public/test-onlyoffice.html)

echo "   React组件URL: $REACT_URL"
echo "   测试页面URL: $TEST_URL"

if [ "$REACT_URL" = "http://$HOST_IP:5173/empty.docx" ] && [ "$TEST_URL" = "http://$HOST_IP:5173/empty.docx" ]; then
    echo "   ✅ 配置文件URL正确"
else
    echo "   ⚠️ 配置文件URL可能需要更新"
    echo "   💡 运行 ./update-host-ip.sh 来更新IP地址"
fi

# 7. 测试结果总结
echo -e "\n🎯 测试结果总结"
echo "===================="

if [ "$IP_STATUS" = "200" ] && docker ps | grep -q onlyoffice-server; then
    echo "✅ 所有组件正常，OnlyOffice应该能正常加载本地空白文档"
    echo ""
    echo "🔗 测试链接:"
    echo "   主应用: http://localhost:5173 → 点击'报告编制'标签"
    echo "   测试页面: http://localhost:5173/test-onlyoffice.html"
    echo ""
    echo "📋 使用说明:"
    echo "   1. 打开上述任一链接"
    echo "   2. 等待OnlyOffice加载完成"
    echo "   3. 开始编辑空白文档"
    echo "   4. 内容会自动保存"
else
    echo "❌ 存在问题，请检查上述输出中的错误项"
    echo ""
    echo "🛠️ 常见解决方案:"
    echo "   1. 重启前端服务器: npm run dev"
    echo "   2. 重启OnlyOffice: docker restart onlyoffice-server"
    echo "   3. 更新IP配置: ./update-host-ip.sh"
    echo "   4. 重新创建空白文档: python3 create-empty-docx.py"
fi 