# Office 工具使用说明

## 概述

`from_server_office_tool.py` 是一个用于控制前端 Collabora CODE 文档编辑器的 Agent 工具。它通过 WebSocket 与前端 `EditorPanel.tsx` 进行通信，实现文档的自动化操作。

## 架构设计

```
Agent系统 → Office_Tool → WebSocket(5112) → EditorPanel → Collabora CODE
```

### 组件说明

1. **Office_Tool (Python)**
   - 继承自 `Base_Tool`
   - 启动 WebSocket 服务器 (端口 5112)
   - 接收 Agent 指令并转发给前端

2. **EditorPanel (React)**
   - 连接 WebSocket 客户端
   - 接收后台指令并解析
   - 调用 Collabora CODE API

3. **Collabora CODE**
   - 文档编辑器 iframe
   - 通过 PostMessage API 接收操作指令

## 支持的操作

### 当前已实现

- **insert_text**: 在当前光标位置插入文本

### 计划实现

- **find_section**: 查找章节内容
- **replace_section**: 替换章节内容  
- **search_highlight**: 搜索并高亮文字
- **format_text**: 格式化文字
- **find_table**: 查找表格
- **format_table**: 格式化表格

## 使用方法

### 1. 直接测试

运行测试脚本：

```bash
cd agent-web
python test_office_tool.py
```

### 2. 在 Agent 系统中使用

```python
from from_server_office_tool import Office_Tool

# 在 Agent 工具列表中添加
tools = [Office_Tool]

# Agent 会自动调用工具执行文档操作
query = "请在文档中插入一段介绍文字"
```

### 3. 通过 InteractionPanel 测试

1. 启动 agent-web 应用
2. 打开浏览器访问 `https://powerai.cc:5101`
3. 切换到 Agent 模式
4. 输入指令：`"请在文档中插入文字：Hello World"`

## 消息协议

### WebSocket 消息格式

```json
{
  "type": "office_operation",
  "operation": "insert_text",
  "data": {
    "text": "要插入的文本内容",
    "timestamp": 1706123456789
  }
}
```

### Collabora CODE API 格式

```json
{
  "MessageId": "Action_Paste",
  "SendTime": 1706123456789,
  "Values": {
    "Mimetype": "text/plain;charset=utf-8",
    "Data": "要插入的文本内容"
  }
}
```

## 网络配置

### 端口说明

- **5101**: agent-web 前端应用 (HTTPS)
- **5102**: Collabora CODE 服务 (HTTPS)
- **5103**: WOPI 服务器 (HTTPS)
- **5112**: WebSocket 服务器 (WSS)

### SSL 证书

使用 `/home/tutu/ssl/powerai.cc.crt` 和 `/home/tutu/ssl/powerai.cc.key`

### 防火墙

确保以下端口开放：
- 5101 (HTTPS)
- 5102 (HTTPS)
- 5103 (HTTPS)
- 5112 (WSS)

## 故障排除

### WebSocket 连接失败

1. 检查 SSL 证书权限
2. 确认端口 5112 未被占用
3. 查看防火墙设置

### Collabora CODE 无法插入文本

1. 确认文档已完全加载
2. 检查 PostMessage origin 配置
3. 查看浏览器控制台错误

### Agent 工具调用失败

1. 检查工具参数格式
2. 确认 WebSocket 连接状态
3. 查看后台日志输出

## 开发说明

### 添加新操作

1. 在 `Office_Tool.parameters` 中添加操作类型
2. 在 `Office_Tool.call()` 中添加处理逻辑
3. 在 `EditorPanel.handleOfficeCommand()` 中添加前端处理
4. 实现对应的 Collabora CODE API 调用

### 调试技巧

1. 使用 `test_office_tool.py` 进行单元测试
2. 查看浏览器控制台的 WebSocket 日志
3. 监控后台 Python 输出
4. 检查 Collabora CODE iframe 消息

## 注意事项

1. 必须使用 HTTPS/WSS 协议
2. 确保证书文件权限正确
3. WebSocket 连接需要稳定的网络
4. Collabora CODE 需要完全加载后才能操作

## 更新日志

- **v1.0**: 实现基本的文本插入功能
- **v1.1**: 添加 WebSocket 重连机制
- **v1.2**: 优化错误处理和日志输出 