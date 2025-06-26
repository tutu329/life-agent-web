#!/bin/bash

echo "=== 测试Collabora容器中的Python脚本 ==="

# 检查Python脚本是否存在
echo "1. 检查Python脚本文件..."
ssh -p 6000 tutu@powerai.cc "sudo docker exec collabora-code-5102 ls -la /opt/collaboraoffice/share/Scripts/python/office_api.py"

# 检查Python脚本语法
echo ""
echo "2. 检查Python脚本语法..."
ssh -p 6000 tutu@powerai.cc "sudo docker exec collabora-code-5102 python3 -m py_compile /opt/collaboraoffice/share/Scripts/python/office_api.py && echo '✅ Python语法检查通过' || echo '❌ Python语法错误'"

# 尝试导入脚本
echo ""
echo "3. 测试导入office_api模块..."
ssh -p 6000 tutu@powerai.cc "sudo docker exec collabora-code-5102 bash -c 'cd /opt/collaboraoffice/share/Scripts/python && python3 -c \"import office_api; print(\\\"✅ 模块导入成功\\\"); print(\\\"导出的函数:\\\", getattr(office_api, \\\"g_exportedScripts\\\", \\\"未找到g_exportedScripts\\\"))\"'"

# 创建临时日志文件并设置权限
echo ""
echo "4. 创建日志文件并设置权限..."
ssh -p 6000 tutu@powerai.cc "sudo docker exec collabora-code-5102 touch /tmp/office_api.log"
ssh -p 6000 tutu@powerai.cc "sudo docker exec collabora-code-5102 chmod 666 /tmp/office_api.log"
ssh -p 6000 tutu@powerai.cc "sudo docker exec collabora-code-5102 chown cool:cool /tmp/office_api.log"

# 检查UNO是否可用
echo ""
echo "5. 检查UNO库..."
ssh -p 6000 tutu@powerai.cc "sudo docker exec collabora-code-5102 python3 -c 'import uno; print(\"✅ UNO库可用\")'"

# 检查libreoffice-script-provider-python包
echo ""
echo "6. 检查Python脚本提供程序..."
ssh -p 6000 tutu@powerai.cc "sudo docker exec collabora-code-5102 dpkg -l | grep python | grep script"

echo ""
echo "=== 测试完成 ==="
echo "接下来请:"
echo "1. 运行 ./remote-dev.sh 部署前端更新"
echo "2. 访问 https://powerai.cc:5101 并测试按钮"
echo "3. 查看浏览器控制台的详细日志" 