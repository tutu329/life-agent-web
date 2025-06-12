# Agent Listener2 Plugin

基于OnlyOffice插件系统开发的自动文本注入插件。

## 功能特性

- 📄 **自动启动**: 文档打开后自动运行
- ⏰ **定时注入**: 每3秒钟自动向文档注入文本
- 🎯 **系统插件**: 后台运行，无需用户界面
- 📝 **文本内容**: 注入"大家好啊！\n"字符串

## 技术特点

- **插件类型**: System Plugin (非可视化，系统级)
- **支持编辑器**: Word文档
- **事件监听**: onDocumentContentReady
- **自动清理**: 插件销毁时自动清理定时器

## 文件结构

```
agent_listener2/
├── config.json      # 插件配置文件
├── index.html       # 插件HTML页面
├── plugin.js        # 核心JavaScript代码
├── icon.png         # 插件图标
└── README.md        # 说明文档
```

## 使用方法

1. 将插件复制到OnlyOffice服务器的插件目录
2. 重启OnlyOffice服务
3. 打开docx文档，插件会自动开始工作
4. 每3秒钟会在文档中添加"大家好啊！"文本

## 配置说明

- **isSystem**: true - 系统插件，后台运行
- **isVisual**: false - 非可视化插件
- **events**: ["onDocumentContentReady"] - 监听文档内容准备完成事件

## 部署

参考项目根目录的部署脚本进行远程部署。

## 注意事项

- 插件会持续运行直到文档关闭
- 每3秒添加一次文本，请注意文档内容增长
- 适用于测试和演示场景 