#!/bin/bash

echo "🚀 启动Agent Listener3 WebSocket Mock Server"
echo "======================================"

# 检查Python是否安装
if command -v python3 &> /dev/null; then
    echo "✅ Python3 已安装"
else
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
fi

# 检查websockets库是否安装
python3 -c "import websockets" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ websockets库已安装"
else
    echo "⚠️ websockets库未安装，正在安装..."
    pip3 install websockets
    if [ $? -eq 0 ]; then
        echo "✅ websockets库安装成功"
    else
        echo "❌ websockets库安装失败"
        exit 1
    fi
fi

echo ""
echo "🔌 启动WebSocket服务器 (端口: 5112)"
echo "📨 每3秒发送指令: 'tell me your name.'"
echo "🛑 按Ctrl+C停止服务器"
echo ""

# 启动服务器
python3 agent_mock_server.py 