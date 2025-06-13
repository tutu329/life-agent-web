#!/bin/bash

echo "🚀 启动远程Agent Mock Server..."
echo "📡 WSS服务器地址: wss://powerai.cc:5112"
echo "🔄 每3秒发送一次指令: 'tell me your name.'"
echo ""

# SSH到远程服务器并启动agent mock server
ssh -p 6000 tutu@powerai.cc << 'EOF'
    echo "🔧 激活Python环境..."
    source /home/tutu/anaconda3/etc/profile.d/conda.sh
    conda activate client
    
    echo "📂 进入工作目录..."
    cd /home/tutu/agent-web/public/plugins/agent_listener3
    
    echo "🎯 启动Agent Mock Server..."
    python3 agent_mock_server.py
EOF

echo "📊 Agent Mock Server已启动完成" 