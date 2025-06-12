#!/bin/bash

# 部署插件到OnlyOffice Server容器
# 作者: tutu
# 用途: 将public/plugins下的所有插件复制到only-office server容器中
# 注意: 此脚本需要在远程服务器上运行，负责将插件复制到容器中

set -e  # 遇到错误时退出

# 配置信息
REMOTE_PATH="/home/tutu/server/life-agent-web"
CONTAINER_NAME="onlyoffice-server-5102"
CONTAINER_PLUGINS_PATH="/var/www/onlyoffice/documentserver/sdkjs-plugins"

echo "🔌 开始部署插件到OnlyOffice容器..."

# 检查插件目录是否存在
if [ ! -d "$REMOTE_PATH/public/plugins" ]; then
    echo "❌ 错误: $REMOTE_PATH/public/plugins 目录不存在!"
    exit 1
fi

# 显示要部署的插件
echo "📦 检测到以下插件:"
ls -la $REMOTE_PATH/public/plugins/
echo ""

# 复制插件到容器中
echo "📋 将插件复制到OnlyOffice容器中..."
echo '清理容器中的旧插件...'
sudo docker exec $CONTAINER_NAME find $CONTAINER_PLUGINS_PATH -name 'asc.*' -type d -exec rm -rf {} + 2>/dev/null || true

echo '复制新插件到容器...'
for plugin_dir in $REMOTE_PATH/public/plugins/*/; do
    if [ -d "$plugin_dir" ]; then
        plugin_name=$(basename "$plugin_dir")
        echo "复制插件: $plugin_name"
        sudo docker cp "$plugin_dir" $CONTAINER_NAME:$CONTAINER_PLUGINS_PATH/
    fi
done

echo '验证插件是否复制成功:'
sudo docker exec $CONTAINER_NAME ls -la $CONTAINER_PLUGINS_PATH/ | grep asc || echo '未找到asc插件'

echo "✅ 插件部署完成!" 