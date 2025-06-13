#!/bin/bash

# 远程开发部署脚本
# 用于将agent-web项目部署到powerai.cc服务器

set -e

# 配置变量
REMOTE_HOST="powerai.cc"
REMOTE_PORT="6000"
REMOTE_USER="tutu"
REMOTE_PATH="/home/tutu/server/life-agent-web"
LOCAL_PATH="$(pwd)"
PROJECT_NAME="agent-web"

echo "🚀 开始部署agent-web项目到远程服务器..."
echo "📄 Collabora CODE 地址: https://powerai.cc:5102"

# 测试SSH连接
echo "🔗 测试SSH连接..."
if ! ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "echo 'SSH连接正常'" > /dev/null 2>&1; then
    echo "❌ SSH连接失败，请检查网络和SSH配置"
    exit 1
fi
echo "✅ SSH连接正常"

# 1. 创建远程目录
echo "📁 创建远程目录..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH"

# 2. 同步项目文件（排除node_modules等）
echo "📦 同步项目文件到远程服务器..."
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "🔄 尝试同步 (第 $((RETRY_COUNT + 1)) 次)..."
    
    # 使用更简单的rsync命令格式
    if rsync -avz -e "ssh -p $REMOTE_PORT" \
        --exclude node_modules \
        --exclude .git \
        --exclude dist \
        --exclude .DS_Store \
        --exclude "*.log" \
        --exclude .vscode \
        --exclude .idea \
        --exclude package-lock.json \
        "$LOCAL_PATH/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"; then
        echo "✅ 文件同步成功！"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⚠️ 同步失败，等待 5 秒后重试..."
            sleep 5
        else
            echo "❌ 文件同步失败，已尝试 $MAX_RETRIES 次"
            echo "💡 建议："
            echo "   1. 检查网络连接"
            echo "   2. 尝试手动同步：rsync -avz -e 'ssh -p 6000' ./ tutu@powerai.cc:/home/tutu/server/life-agent-web/"
            exit 1
        fi
    fi
done

# 3. 远程安装依赖
echo "🔧 在远程服务器上安装依赖..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'EOF'
# 加载nvm并使用Node.js 18
source ~/.nvm/nvm.sh
nvm use 18

cd /home/tutu/server/life-agent-web

echo "📌 使用Node.js版本: $(node --version)"
echo "📌 使用npm版本: $(npm --version)"

echo "📦 安装项目依赖..."
rm -rf node_modules package-lock.json
npm install

echo "✅ 依赖安装完成！"
EOF

echo "✅ 部署完成！"
echo "🌐 访问地址: http://powerai.cc:5101"
echo "📄 Collabora CODE: https://powerai.cc:5102"
echo ""
echo "💡 提示："
echo "   1. 运行 ./remote-dev.sh 启动开发服务器"
echo "   2. 或者手动启动：ssh -p 6000 tutu@powerai.cc 'cd /home/tutu/server/life-agent-web && npm run dev -- --port 5101 --host 0.0.0.0'" 