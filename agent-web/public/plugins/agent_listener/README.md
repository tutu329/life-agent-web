# Agent Listener Plugin

这是一个OnlyOffice插件，用于自动注入"i am agent listener"文本到文档中。

## 功能特性

- 🚀 自动启动：插件加载时自动执行
- 📝 文本注入：向文档中插入"i am agent listener"文本
- 🎨 格式设置：文本设置为粗体和斜体样式
- 🔍 调试友好：包含详细的控制台日志输出

## 插件结构

```
agent_listener/
├── config.json      # 插件配置文件
├── index.html       # 插件主页面
├── plugin.js        # 插件核心逻辑
├── icon.png         # 插件图标
└── README.md        # 说明文档
```

## 配置说明

- **插件名称**: agent_listener
- **GUID**: asc.{AGENT-LISTENER-2024-0612-001}
- **版本**: 1.0.0
- **支持编辑器**: Word文档编辑器

## 工作原理

1. 插件加载时自动调用 `init()` 方法
2. 执行 `insertAgentListenerText()` 函数
3. 通过OnlyOffice API创建新段落
4. 插入"i am agent listener"文本并设置格式
5. 将内容添加到文档开头

## 部署方式

将整个插件文件夹复制到OnlyOffice Server的插件目录：
```bash
/var/www/onlyoffice/documentserver/sdkjs-plugins/
```

## 开发者信息

- 创建时间: 2024-06-12
- 基于: OnlyOffice Plugin SDK
- 参考: Hello World插件示例

## 注意事项

- 这是一个系统插件，后台自动运行，无需用户界面
- 插件会在文档加载时自动执行
- 适用于Word文档编辑器环境 