# Agent Listener3 Plugin

Agent Listener3是一个OnlyOffice系统插件，用于通过WebSocket接收后台Agent的指令，并将指令内容注入到docx文档中。

## 功能特点

1. **自动启动**: docx文档打开后自动启动插件
2. **WebSocket通信**: 与后台Agent建立WebSocket连接
3. **实时注入**: 收到指令后立即注入到文档中
4. **自动重连**: 连接断开后自动重新连接
5. **时间戳**: 每次注入的内容都带有时间戳

## 文件结构

```
agent_listener3/
├── config.json           # 插件配置文件
├── index.html            # 插件HTML入口
├── plugin.js             # 插件主要逻辑
├── icon.png              # 插件图标
├── agent_mock_server.py  # 模拟WebSocket服务器
└── README.md             # 说明文档
```

## 使用方法

### 1. 启动模拟服务器

```bash
cd agent-web/public/plugins/agent_listener3
python3 agent_mock_server.py
```

服务器将在 `0.0.0.0:5112` 启动，每3秒发送一次指令 "tell me your name."

### 2. 部署插件和启动服务

使用remote-dev.sh脚本会自动部署插件并启动Mock Server：

```bash
# 部署到远程服务器并启动所有服务（包括Mock Server）
./remote-dev.sh
```

或者手动部署插件：

```bash
# 只部署插件
./deploy-plugins.sh
```

### 3. 测试

1. 在OnlyOffice中打开一个docx文档
2. 插件会自动启动并尝试连接WebSocket服务器
3. 收到指令后会自动注入到文档中，格式为：`[时间戳] Agent指令: 指令内容`

## 技术实现

- **WebSocket连接**: 使用原生WebSocket API
- **自动重连**: 连接断开后3秒后自动重连
- **错误处理**: 完整的错误处理和日志记录
- **文档注入**: 使用OnlyOffice API将内容注入到文档

## 配置说明

### WebSocket服务器地址
默认连接地址为 `ws://powerai.cc:5112`，可以在 `plugin.js` 中修改 `wsUrl` 变量。服务器监听在 `0.0.0.0:5112`，支持远程连接。

### 重连间隔
连接断开后3秒重连，连接失败后5秒重试，可以在代码中修改相应的时间间隔。

## 依赖项

### Python服务器
- Python 3.7+
- websockets 库

安装依赖：
```bash
pip install websockets
```

### OnlyOffice插件
- OnlyOffice DocumentServer
- 插件API支持

## 日志输出

插件会在浏览器控制台输出详细的运行日志，包括：
- 插件加载状态
- WebSocket连接状态
- 消息接收情况
- 文档注入结果

## 故障排除

1. **WebSocket连接失败**: 检查服务器是否启动，端口是否正确
2. **文档注入失败**: 检查文档是否正确加载，OnlyOffice API是否可用
3. **自动重连不工作**: 检查浏览器控制台是否有错误信息 