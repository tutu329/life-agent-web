# Hello World System Plugin

## 📖 插件说明

这是一个 OnlyOffice **system 类型插件**，用于自动向文档注入 "Hello World!" 文本。

## 🎯 功能特性

- ✅ **自动启动**: 文档加载后自动运行
- ✅ **后台运行**: 无界面，system类型插件
- ✅ **智能检测**: 避免重复注入相同内容
- ✅ **样式设置**: 红色粗体显示
- ✅ **错误处理**: 完善的异常处理机制

## 📁 文件结构

```
public/plugins/hello-world-system/
├── config.json     # 插件配置文件
├── index.html      # 插件入口页面
├── plugin.js       # 插件核心逻辑
├── icon.png        # 插件图标（占位）
└── README.md       # 使用说明
```

## ⚙️ 部署位置

插件文件部署在项目的 `public/plugins/hello-world-system/` 目录下，通过以下URL访问：

- **配置文件**: `http://powerai.cc:5101/plugins/hello-world-system/config.json`
- **插件目录**: `http://powerai.cc:5101/plugins/hello-world-system/`

## 🔧 配置说明

在 `EditorPanel.tsx` 中已添加插件配置：

```javascript
plugins: {
  autostart: [
    "http://powerai.cc:5101/plugins/hello-world-system/config.json"
  ],
  pluginsData: [
    "http://powerai.cc:5101/plugins/hello-world-system/"
  ]
}
```

## 🚀 使用方法

1. **启动应用**: `npm run dev`
2. **访问页面**: http://localhost:5173
3. **打开报告编制**: 点击"报告编制"标签页
4. **自动注入**: 插件会自动向 empty.docx 注入 "Hello World!" 文本

## 🔍 验证方法

1. 打开浏览器开发者工具 (F12)
2. 查看 Console 面板
3. 应该看到以下日志：
   - `🚀 Hello World System Plugin 启动`
   - `📝 开始注入 Hello World 文本`
   - `✅ Hello World 文本注入成功`

## 📋 配置详解

### config.json 关键配置

- `"isSystem": true` - 标记为系统插件
- `"autostart": true` - 自动启动
- `"isModal": false` - 非模态窗口
- `"isVisual": false` - 无可视界面

### 插件逻辑要点

- 使用 `setTimeout` 延迟执行，确保文档完全加载
- 通过 `callCommand` 调用 Document Builder API
- 智能检测避免重复注入
- 设置文本样式（红色粗体）

## 🐛 故障排除

### 插件未启动
- 检查 OnlyOffice 服务器是否运行：http://powerai.cc:5102
- 检查插件文件是否可访问：http://powerai.cc:5101/plugins/hello-world-system/config.json

### 文本未注入
- 查看浏览器控制台是否有错误信息
- 确认文档是否已完全加载
- 检查插件配置是否正确

### 开发调试
- 在 `plugin.js` 中添加更多 `console.log` 语句
- 使用浏览器开发者工具调试
- 检查网络请求是否成功

## 📚 相关文档

- [OnlyOffice 插件官方文档](https://api.onlyoffice.com/docs/plugin-and-macros/get-started/overview/)
- [Document Builder API](https://api.onlyoffice.com/docs/docs-api/)
- [插件类型说明](https://api.onlyoffice.com/docs/plugin-and-macros/structure/manifest/types/) 