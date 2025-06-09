#!/bin/bash

# 快速同步脚本 - 用于开发过程中快速同步代码到远程服务器
# 适合在开发过程中频繁使用

set -e

# 配置变量
REMOTE_HOST="powerai.cc"
REMOTE_PORT="6000"
REMOTE_USER="tutu"
REMOTE_PATH="/home/tutu/server/life-agent-web"
LOCAL_PATH="$(pwd)"

echo "🔄 快速同步代码到远程服务器..."

# 同步项目文件（排除node_modules等）
rsync -avz -e "ssh -p $REMOTE_PORT" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.DS_Store' \
  --exclude '*.log' \
  --exclude '.vscode' \
  --exclude '.idea' \
  --exclude '*.swp' \
  --exclude '*.tmp' \
  "$LOCAL_PATH/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

echo "✅ 代码同步完成！"
echo "💡 提示：如果开发服务器正在运行，更改应该会自动生效（热重载）" 