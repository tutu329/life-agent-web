# 多Agent Office工具使用说明

## 概述

新版本的Office工具支持多Agent并发操作，每个Agent都有独立的agent_id，可以同时控制不同的前端Collabora CODE实例。

## 架构设计

```
多个Agent实例 → Office_Tool实例 → 全局WebSocket管理器 → 多个前端连接
     ↓                    ↓              ↓              ↓
  agent_id_1         Office_Tool_1    agent_connections   EditorPanel_1
  agent_id_2         Office_Tool_2         ↓              EditorPanel_2
  agent_id_3         Office_Tool_3    {agent_id: ws}      EditorPanel_3
```

## 关键特性

### 1. 单例WebSocket服务器
- 全局只有一个WebSocket服务器实例（端口5112）
- 避免端口冲突问题
- 支持多个客户端同时连接

### 2. Agent ID映射机制
- 每个前端连接注册时提供agent_id
- 后台维护 agent_id ↔ WebSocket连接 的双向映射
- 指令精确路由到对应的前端

### 3. 连接管理
- 自动清理断开的连接
- 连接状态实时更新
- 错误重连机制

## 工作流程

### 后台Agent调用流程

1. **Agent系统启动**
   ```python
   # Agent系统为每个会话分配唯一的agent_id
   agent_id = "agent_12345"
   ```

2. **Office_Tool调用**
   ```python
   # tool_call_paras.callback_agent_id 包含当前agent的ID
   office_tool.call(tool_call_paras)
   ```

3. **WebSocket路由**
   ```python
   # Office_Tool根据agent_id发送指令到对应前端
   ws_manager.send_to_agent(agent_id, command)
   ```

### 前端连接流程

1. **WebSocket连接建立**
   ```javascript
   const ws = new WebSocket('wss://powerai.cc:5112')
   ```

2. **Agent注册**
   ```javascript
   ws.send(JSON.stringify({
     type: 'register',
     agent_id: 'agent_web_default_' + Date.now()
   }))
   ```

3. **接收操作指令**
   ```javascript
   // 收到office_operation类型的消息
   {
     type: 'office_operation',
     operation: 'insert_text',
     agent_id: 'agent_12345',
     data: { text: '要插入的内容' }
   }
   ```

## 测试步骤

### 1. 启动后台服务

```bash
cd ~/server/life-agent
python -m agent.agent_web_server.agent_fastapi_server
```

**预期输出：**
```
🚀 全局WebSocket服务器启动中... (端口:5112)
✅ WebSocket服务器已启动 (WSS端口:5112)
tool_id: xxx name: Office_Tool
```

### 2. 测试前端连接

```bash
# 打开浏览器访问
https://powerai.cc:5101
```

**前端操作：**
1. 切换到"报告编制"标签页
2. 检查WebSocket连接状态
3. 观察浏览器控制台输出

**预期日志：**
```
🔗 Office WebSocket连接已建立
📝 发送Agent注册消息: {type: 'register', agent_id: 'agent_web_default_xxx'}
✅ Agent注册成功: {type: 'register_success', ...}
Office服务状态: 已连接
```

**预期后台日志：**
```
📱 新的WebSocket连接: ('前端IP', 端口)
✅ Agent agent_web_default_xxx 已注册WebSocket连接
```

### 3. 测试Agent指令

在InteractionPanel中：
1. 切换到Agent模式
2. 等待Agent系统初始化
3. 输入测试指令：
   ```
   请在文档中插入测试文本：Hello from Agent System!
   ```

**预期流程：**
1. Agent系统接收指令
2. 调用Office_Tool
3. WebSocket发送到对应前端
4. Collabora CODE显示插入的文本

**预期后台日志：**
```
🔧 Office_Tool 调用参数: {'operation': 'insert_text', 'content': 'Hello from Agent System!'}
🎯 目标Agent ID: agent_12345
✅ 成功向Agent agent_12345 的Collabora CODE插入文本: "Hello from Agent System!"
```

**预期前端日志：**
```
🔧 收到Office操作指令: {type: 'office_operation', operation: 'insert_text', ...}
📋 操作: insert_text, Agent ID: agent_12345
📝 使用官方API插入文本: Hello from Agent System!
```

## 多Agent测试

### 1. 同时打开多个前端标签页

每个标签页都会：
- 建立独立的WebSocket连接
- 注册不同的agent_id
- 接收各自的指令

### 2. 启动多个Agent会话

通过API或InteractionPanel启动多个Agent：
```python
# Agent 1
agent_id_1 = start_agent_system()
query_agent_system(agent_id_1, "在文档中插入：Agent 1 的内容")

# Agent 2  
agent_id_2 = start_agent_system()
query_agent_system(agent_id_2, "在文档中插入：Agent 2 的内容")
```

### 3. 验证指令路由

- Agent 1的指令只发送到对应的前端标签页
- Agent 2的指令只发送到另一个前端标签页
- 两者互不干扰

## 故障排除

### WebSocket连接问题

**现象：** 前端显示"Office服务状态: 已断开"

**解决：**
1. 检查后台WebSocket服务器是否启动
2. 确认SSL证书配置正确
3. 检查防火墙端口5112

### Agent ID映射问题

**现象：** 后台日志显示"Agent xxx 没有WebSocket连接"

**解决：**
1. 确认前端已发送注册消息
2. 检查agent_id是否匹配
3. 重新刷新前端页面

### 指令路由错误

**现象：** 指令发送到错误的前端

**解决：**
1. 检查agent_id生成逻辑
2. 确认WebSocket映射表正确
3. 重启后台服务清理状态

## 开发注意事项

1. **Agent ID生成**：确保每个Agent会话有唯一的ID
2. **连接清理**：及时清理断开的WebSocket连接
3. **错误处理**：处理网络断开、重连等异常情况
4. **性能优化**：避免频繁的WebSocket消息发送

## 扩展功能

- [ ] 支持Agent间的协作操作
- [ ] 实现文档内容同步
- [ ] 添加操作权限控制
- [ ] 支持操作历史记录 