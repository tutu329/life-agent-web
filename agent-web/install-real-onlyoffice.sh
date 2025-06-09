#!/bin/bash

echo "🚀 安装真正的 OnlyOffice Document Server (本地版本)"

# 检查 Homebrew
if ! command -v brew &> /dev/null; then
    echo "📦 安装 Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

echo "📦 安装依赖..."
brew update
brew install postgresql@14 redis node

echo "🗄️ 配置数据库..."
brew services start postgresql@14
sleep 3
createdb onlyoffice 2>/dev/null || echo "数据库已存在"
psql -d postgres -c "CREATE USER onlyoffice WITH PASSWORD 'onlyoffice';" 2>/dev/null || true

echo "🔧 启动 Redis..."
brew services start redis

# 创建真实 OnlyOffice 目录
REAL_DIR="$HOME/onlyoffice-real"
rm -rf "$REAL_DIR"
mkdir -p "$REAL_DIR"
cd "$REAL_DIR"

npm init -y
npm install express cors

echo "⚙️ 创建真实 OnlyOffice 服务器..."

# 立即写入并执行
./install-real-onlyoffice.sh 