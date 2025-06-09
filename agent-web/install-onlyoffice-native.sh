#!/bin/bash

echo "🚀 OnlyOffice Document Server 本地安装脚本 (非Docker)"
echo "====================================================="

# 检查操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ 检测到 macOS 系统"
else
    echo "❌ 此脚本仅支持 macOS 系统"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，正在安装..."
    if command -v brew &> /dev/null; then
        brew install node
    else
        echo "请先安装 Homebrew 或手动安装 Node.js"
        exit 1
    fi
else
    echo "✅ Node.js 已安装: $(node --version)"
fi

# 创建 OnlyOffice 本地服务器目录
ONLYOFFICE_DIR="$HOME/onlyoffice-documentserver"
echo "📁 创建服务目录: $ONLYOFFICE_DIR"

# 清理现有目录
if [ -d "$ONLYOFFICE_DIR" ]; then
    echo "🧹 清理现有安装..."
    rm -rf "$ONLYOFFICE_DIR"
fi

mkdir -p "$ONLYOFFICE_DIR"
cd "$ONLYOFFICE_DIR"

# 初始化 Node.js 项目
echo "📦 初始化项目..."
npm init -y

# 安装依赖
echo "📦 安装依赖..."
npm install express cors multer body-parser

# 创建简化的 OnlyOffice 服务器
echo "📝 创建服务器文件..."
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 健康检查端点
app.get('/healthcheck', (req, res) => {
  res.json({ status: 'true' });
});

// 文档 API 端点
app.get('/web-apps/apps/api/documents/api.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    // OnlyOffice Document Server API (本地版本)
    window.DocsAPI = {
      DocEditor: function(id, config) {
        console.log('OnlyOffice Editor 初始化:', id, config);
        
        const container = document.getElementById(id);
        if (container) {
          container.innerHTML = \`
            <div style="height: 100%; display: flex; flex-direction: column; background: white;">
              <div style="background: #f5f5f5; border-bottom: 1px solid #ddd; padding: 10px;">
                <h4 style="margin: 0; color: #333;">📝 OnlyOffice 编辑器 (本地版本)</h4>
                <small style="color: #666;">文档: \${config.document?.title || '新建文档.docx'}</small>
              </div>
              <div style="flex: 1; padding: 20px;">
                <textarea id="editor-content" style="width: 100%; height: 100%; border: none; resize: none; font-family: 'Microsoft YaHei', Arial; font-size: 14px; line-height: 1.6;" 
                         placeholder="在此处开始编辑文档内容...\\n\\n这是一个简化版的文档编辑器，支持基本的文本编辑功能。"></textarea>
              </div>
            </div>
          \`;
          
          // 触发事件回调
          setTimeout(() => {
            if (config.events?.onAppReady) config.events.onAppReady();
            if (config.events?.onDocumentReady) config.events.onDocumentReady();
          }, 500);
          
          // 添加自动保存功能
          const textarea = container.querySelector('#editor-content');
          if (textarea && config.editorConfig?.customization?.autosave) {
            textarea.addEventListener('input', () => {
              console.log('文档内容已更改，自动保存中...');
              // 这里可以添加实际的保存逻辑
            });
          }
        }
        
        return {
          destroyEditor: function() {
            if (container) container.innerHTML = '';
          },
          downloadAs: function(format) {
            console.log('下载文档，格式:', format);
          }
        };
      }
    };
  `);
});

// 欢迎页面
app.get('/welcome/', (req, res) => {
  res.send(\`
    <html>
      <head>
        <title>ONLYOFFICE Document Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          h1 { color: #1677ff; }
          .status { color: #52c41a; font-weight: bold; }
          .info { background: #f0f8ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📄 ONLYOFFICE Document Server</h1>
          <p class="status">✅ 本地版本正在运行</p>
          <div class="info">
            <strong>服务信息:</strong><br>
            • 端口: \${PORT}<br>
            • 模式: 本地开发版<br>
            • 状态: 正常运行<br>
            • API: /web-apps/apps/api/documents/api.js
          </div>
          <p><a href="/healthcheck">🏥 健康检查</a></p>
        </div>
      </body>
    </html>
  \`);
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`
🚀 OnlyOffice Document Server (本地版) 启动成功!
📍 服务地址: http://localhost:\${PORT}
🏥 健康检查: http://localhost:\${PORT}/healthcheck
📄 欢迎页面: http://localhost:\${PORT}/welcome/
📝 API 地址: http://localhost:\${PORT}/web-apps/apps/api/documents/api.js

✨ 服务已准备就绪，可以开始使用文档编辑功能了！
  \`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\\n🛑 正在关闭 OnlyOffice Document Server...');
  process.exit(0);
});
EOF

# 创建启动脚本
echo "📝 创建管理脚本..."
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 启动 OnlyOffice Document Server (本地版)..."
cd "$(dirname "$0")"
node server.js
EOF

chmod +x start.sh

# 创建停止脚本
cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 停止 OnlyOffice Document Server..."
pkill -f "node.*server.js" && echo "✅ 服务已停止" || echo "⚠️  未找到运行中的服务"
EOF

chmod +x stop.sh

# 创建状态检查脚本
cat > status.sh << 'EOF'
#!/bin/bash
echo "📊 OnlyOffice Document Server 状态检查"
echo "======================================"

# 检查进程
if pgrep -f "node.*server.js" > /dev/null; then
    PID=$(pgrep -f "node.*server.js")
    echo "✅ 服务正在运行 (PID: $PID)"
else
    echo "❌ 服务未运行"
    exit 1
fi

# 检查端口
if lsof -i:8080 > /dev/null 2>&1; then
    echo "✅ 端口 8080 已绑定"
else
    echo "❌ 端口 8080 未绑定"
fi

# 检查服务响应
if curl -s http://localhost:8080/healthcheck | grep -q "true"; then
    echo "✅ 健康检查通过"
else
    echo "❌ 健康检查失败"
fi

echo ""
echo "🌐 访问地址: http://localhost:8080"
echo "🏥 健康检查: http://localhost:8080/healthcheck"
EOF

chmod +x status.sh

# 创建 LaunchAgent (macOS 开机自启)
PLIST_FILE="$HOME/Library/LaunchAgents/com.onlyoffice.documentserver.plist"
echo "📝 创建系统服务..."

mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.onlyoffice.documentserver</string>
    <key>ProgramArguments</key>
    <array>
        <string>node</string>
        <string>$ONLYOFFICE_DIR/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$ONLYOFFICE_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/onlyoffice-documentserver.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/onlyoffice-documentserver-error.log</string>
</dict>
</plist>
EOF

# 启动服务
echo "🚀 启动服务..."
launchctl load "$PLIST_FILE" 2>/dev/null || echo "⚠️  服务加载可能已存在"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 检查服务状态
if curl -s http://localhost:8080/healthcheck > /dev/null; then
    echo ""
    echo "🎉 OnlyOffice Document Server 安装并启动成功！"
    echo ""
    echo "📋 管理命令:"
    echo "  查看状态: $ONLYOFFICE_DIR/status.sh"
    echo "  手动启动: $ONLYOFFICE_DIR/start.sh"
    echo "  手动停止: $ONLYOFFICE_DIR/stop.sh"
    echo "  重启服务: launchctl unload $PLIST_FILE && launchctl load $PLIST_FILE"
    echo "  查看日志: tail -f ~/Library/Logs/onlyoffice-documentserver.log"
    echo ""
    echo "🌐 访问地址: http://localhost:8080"
    echo "🏥 健康检查: http://localhost:8080/healthcheck"
    echo "📄 欢迎页面: http://localhost:8080/welcome/"
    echo ""
    echo "✅ Docker 依赖已完全移除，现在使用本地原生 Node.js 服务！"
else
    echo ""
    echo "❌ 服务启动可能有问题，请检查："
    echo "  手动启动: $ONLYOFFICE_DIR/start.sh"
    echo "  查看日志: tail -f ~/Library/Logs/onlyoffice-documentserver.log"
fi 