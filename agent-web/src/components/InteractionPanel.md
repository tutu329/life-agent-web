# InteractionPanel 组件说明

## 概述

InteractionPanel 是 agent-web 项目中的核心交互组件，提供了两种交互模式：
1. **LLM模式**：直接与大语言模型进行对话
2. **Agent模式**：与后台多级Agent系统进行交互

## 功能特性

### 双模式支持

- **LLM模式**：传统的AI助手对话模式，支持流式响应和thinking过程显示
- **Agent模式**：与后台多级Agent系统集成，支持复杂任务处理和实时流数据监听

### Agent模式核心功能

#### 1. 系统初始化
- 自动调用后台 `/api/start_2_level_agents_system` 接口
- 配置上级Agent和下级Agent的参数
- 获取并保存 `agent_id` 用于后续通信

#### 2. 实时流监听
- 支持5种不同类型的SSE流：
  - `output` 📄：输出流（绿色）
  - `thinking` 🤔：思考过程流（蓝色）
  - `final_answer` ✅：最终答案流（红色）
  - `log` 📋：日志流（灰色）
  - `tool_rtn_data` 🔧：工具返回数据流（橙色）

#### 3. 查询处理
- 发送用户查询到 `/api/query_2_level_agents_system`
- 获取 `stream_id` 和可用流列表
- 并行监听所有可用流并实时显示内容

#### 4. 状态管理
- 轮询检查Agent任务执行状态
- 管理流监听器的生命周期
- 处理Agent系统的初始化和清理

## 技术实现

### 核心服务类

#### AgentService
位于 `src/services/agentService.ts`，提供：
- `initializeAgentSystem()`: 初始化Agent系统
- `queryAgentSystem(query)`: 发送查询请求
- `listenToStream(streamId, streamName)`: 监听SSE流
- `checkAgentStatus()`: 检查任务状态

#### SSEClient
自定义SSE客户端，支持：
- 解析Server-Sent Events格式
- 异步生成器接口
- 自动重连和错误处理

### 数据流处理

```typescript
// 流数据处理流程
1. 用户输入查询 → handleAgentQuery()
2. 调用 agentService.queryAgentSystem() → 获取StreamResponse
3. 并行启动多个 listenToStream() → 监听不同类型的流
4. 每个流事件 → 更新对应消息内容
5. 定期检查Agent状态 → 更新完成状态
```

### 消息显示逻辑

- **颜色区分**：不同流类型使用不同颜色和图标
- **实时更新**：流数据实时追加到消息内容
- **格式化显示**：使用前缀标识不同流类型
- **状态指示**：显示流式处理状态和完成状态

## 使用方式

### 模式切换
1. 使用界面上的Switch组件切换模式
2. 切换到Agent模式时自动初始化系统
3. 切换回LLM模式时清理Agent状态

### Agent交互流程
1. 确保Agent系统已初始化（界面显示"Agent已就绪"）
2. 在输入框输入指令（如："我叫电力用户，请告诉./文件夹下有哪些文件"）
3. 系统自动：
   - 发送查询到后台Agent系统
   - 获取流ID和可用流列表
   - 开始监听所有流并实时显示内容
   - 检查执行状态直到完成

## 配置说明

### Agent系统配置
```typescript
// 上级Agent配置
upper_agent_config: {
  allowed_local_tool_names: ['Human_Console_Tool'],
  llm_model_id: 'deepseek-chat',
  temperature: 0.65
}

// 下级Agent配置
lower_agents_config: [{
  allowed_local_tool_names: ['Human_Console_Tool', 'Folder_Tool'],
  as_tool_name: 'Folder_Agent_As_Tool',
  llm_model_id: 'deepseek-chat',
  temperature: 0.70
}]
```

### 服务器配置
- 默认连接到 `powerai.cc:5110`
- 可通过 AgentService 构造函数修改服务器地址
- 支持的API端点：
  - `/api/start_2_level_agents_system`
  - `/api/query_2_level_agents_system`
  - `/api/query_2_level_agents_system/stream/{stream_id}/{stream_name}`
  - `/api/get_agent_status`

## 错误处理

- **初始化失败**：自动关闭Agent模式，显示错误信息
- **流连接失败**：单独处理每个流的错误，不影响其他流
- **查询失败**：显示错误消息，提供重试功能
- **网络异常**：自动重连和状态恢复

## 注意事项

1. **并发控制**：使用 `activeStreamsRef` 防止重复监听同一流
2. **内存管理**：组件卸载时清理所有活跃的流监听器
3. **状态同步**：Agent模式和LLM模式的状态完全隔离
4. **用户体验**：提供清晰的状态提示和加载指示器

## 扩展说明

### 添加新流类型
1. 在 `StreamType` 类型中添加新类型
2. 在 `getStreamStyle()` 方法中添加对应的样式配置
3. 更新流数据处理逻辑

### 自定义Agent配置
1. 修改 `initializeAgentSystem()` 中的配置参数
2. 根据需要调整工具列表和模型参数
3. 更新错误处理和状态管理逻辑

## 依赖关系

- **React Hooks**：useState, useRef, useEffect
- **Ant Design**：UI组件库
- **AgentService**：后台Agent系统交互服务
- **LLMService**：大语言模型交互服务（LLM模式） 