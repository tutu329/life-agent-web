import React, { useState, useRef, useEffect } from 'react'
import { Input, List, Avatar, Typography, Divider, Spin, Button, message, Collapse, Switch, Card } from 'antd'
import { UserOutlined, RobotOutlined, SendOutlined, ReloadOutlined, CaretRightOutlined, ApiOutlined, LoadingOutlined } from '@ant-design/icons'
import { useLLMConfig, useAgentContext, useFileSelection } from '../App'
import { LLMService, ChatMessage } from '../services/llmService'
import { AgentService, StreamType } from '../services/agentService'

const { Search } = Input
const { Title, Text, Paragraph } = Typography

interface Message {
  id: number
  content: string
  thinking?: string
  isUser: boolean
  timestamp: Date
  isStreaming?: boolean
  hasError?: boolean
  canRetry?: boolean
  hasThinking?: boolean
  streamType?: StreamType
  isAgentMode?: boolean
  // Agent模式下的流数据存储
  streamData?: {
    output: string
    thinking: string
    log: string
    tool_rtn_data: string
    final_answer: string
  }
}



const InteractionPanel: React.FC = () => {
  const llmConfig = useLLMConfig()
  const { agentId, setAgentId, agentInitialized, setAgentInitialized } = useAgentContext()
  const { selectedTemplateFile, selectedSharedFile } = useFileSelection()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: '您好！我是您的智能助手，有什么可以帮助您的吗？',
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'system', content: '你是一个有用的AI助手，请用中文回答用户的问题。' }
  ])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const llmServiceRef = useRef<LLMService | null>(null)
  
  // Agent相关的状态
  const [useAgentMode, setUseAgentMode] = useState(false)
  const [agentService] = useState(() => new AgentService())
  const [isInitializingAgent, setIsInitializingAgent] = useState(false)
  
  // 当前活跃的流监听器
  const activeStreamsRef = useRef<Set<string>>(new Set())
  const streamsInitializedRef = useRef(false) // 标志位，跟踪流是否已初始化
  const currentAgentMessageIdRef = useRef<number | null>(null) // 跟踪当前Agent消息ID
  
  // Agent状态检查相关
  const [currentTaskMessageId, setCurrentTaskMessageId] = useState<number | null>(null)
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isCheckingStatusRef = useRef(false)
  
  // 初始化LLM服务
  useEffect(() => {
    llmServiceRef.current = new LLMService(llmConfig)
  }, [llmConfig])

  // 初始化Agent系统
  useEffect(() => {
    if (useAgentMode && !agentInitialized && !isInitializingAgent) {
      initializeAgent()
    }
  }, [useAgentMode])

  const initializeAgent = async () => {
    setIsInitializingAgent(true)
    try {
      console.log('🚀 开始初始化Agent系统...')
      const id = await agentService.initializeAgentSystem()
      setAgentId(id)
      setAgentInitialized(true)
      console.log('✅ Agent系统初始化完成，ID:', id)
      
      // 添加系统消息
      const systemMessage: Message = {
        id: Date.now(),
        content: `✅ Agent系统已初始化完成！\nAgent ID: ${id}\n现在可以开始与后台Agent系统进行交互了。`,
        isUser: false,
        timestamp: new Date(),
        isAgentMode: true
      }
      setMessages(prev => [...prev, systemMessage])
      
    } catch (error) {
      console.error('❌ Agent系统初始化失败:', error)
      message.error(`Agent系统初始化失败: ${error instanceof Error ? error.message : '未知错误'}`)
      setUseAgentMode(false) // 初始化失败时关闭Agent模式
    } finally {
      setIsInitializingAgent(false)
    }
  }

  // 获取流类型对应的颜色和图标
  const getStreamStyle = (streamType: StreamType): { color: string; backgroundColor: string; icon: string } => {
    switch (streamType) {
      case 'output':
        return { color: '#52c41a', backgroundColor: '#f6ffed', icon: '📄' }
      case 'thinking':
        return { color: '#1890ff', backgroundColor: '#f0f8ff', icon: '🤔' }
      case 'final_answer':
        return { color: '#f5222d', backgroundColor: '#fff2f0', icon: '✅' }
      case 'log':
        return { color: '#8c8c8c', backgroundColor: '#f5f5f5', icon: '📋' }
      case 'tool_rtn_data':
        return { color: '#fa8c16', backgroundColor: '#fff7e6', icon: '🔧' }
      default:
        return { color: '#595959', backgroundColor: '#fafafa', icon: '💬' }
    }
  }

  // 监听单个SSE流
  const listenToStream = async (streamId: string, streamName: StreamType) => {
    const streamKey = `${streamId}-${streamName}` // key不应包含可变部分
    if (activeStreamsRef.current.has(streamKey)) {
      console.log(`流 ${streamName} 已在监听中，跳过重复监听`)
      return
    }
    
    activeStreamsRef.current.add(streamKey)
    console.log(`🔗 开始永久监听流: ${streamName}`)
    
    try {
      for await (const event of agentService.listenToStream(streamId, streamName)) {
        // console.log(`📨 收到流 ${streamName} 数据:`, event.data.substring(0, 100) + (event.data.length > 100 ? '...' : ''))
        
        // 更新当前活跃的Agent消息
        setMessages(prev => {
          const activeMessageId = currentAgentMessageIdRef.current
          if (!activeMessageId) return prev

          return prev.map(msg => {
            if (msg.id === activeMessageId && msg.isAgentMode) {
              // 确保初始化streamData，避免复用之前的数据
              const currentStreamData = msg.streamData || {
                output: '',
                thinking: '',
                log: '',
                tool_rtn_data: '',
                final_answer: ''
              }
              
              // 累积叠加流数据
              const updatedStreamData = {
                ...currentStreamData,
                [streamName]: currentStreamData[streamName] + event.data
              }
              
              // console.log(`📊 更新流数据 ${streamName} for message ${activeMessageId}:`, updatedStreamData[streamName].substring(0, 50) + (updatedStreamData[streamName].length > 50 ? '...' : ''))
              
              return {
                ...msg,
                streamData: updatedStreamData,
                streamType: streamName
              }
            }
            return msg
          })
        })
      }
    } catch (error) {
      console.error(`❌ 流 ${streamName} 监听出错:`, error)
      // 流断开后，允许在下次查询时重建
      streamsInitializedRef.current = false
      activeStreamsRef.current.delete(streamKey)
    } finally {
      console.log(`📡 流 ${streamName} 监听结束。`)
    }
  }

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (value: string, isRetry: boolean = false) => {
    if (!value.trim() || isLoading) return

    // Agent模式下检查初始化状态
    if (useAgentMode && !agentInitialized) {
      message.warning('Agent系统尚未初始化完成，请稍后再试')
      return
    }

    let userMessage: Message | null = null

    // 如果不是重试，添加用户消息
    if (!isRetry) {
      userMessage = {
        id: Date.now(),
        content: value,
        isUser: true,
        timestamp: new Date(),
        isAgentMode: useAgentMode
      }
      setMessages(prev => [...prev, userMessage!])
    }

    setIsLoading(true)
    setInputValue('')

    if (useAgentMode) {
      // Agent模式：调用后台Agent系统
      await handleAgentQuery(value)
    } else {
      // 原有的LLM模式
      await handleLLMChat(value, isRetry)
    }
  }

  const handleAgentQuery = async (query: string) => {
    try {
      console.log('🚀 发送查询到Agent系统:', query)
      
      // 清理之前的状态检查
      stopStatusCheck()
      
      // 创建Agent响应消息 - 确保每次都是全新的消息ID和初始化状态
      const agentMessageId = Date.now() + Math.floor(Math.random() * 10000) // 更好的唯一性保证
      currentAgentMessageIdRef.current = agentMessageId // 更新当前活跃的Agent消息ID

      const initialAgentMessage: Message = {
        id: agentMessageId,
        content: '🤖 Agent系统正在处理您的请求...\n\n',
        isUser: false,
        timestamp: new Date(),
        isStreaming: true,
        isAgentMode: true,
        streamData: {
          output: '',
          thinking: '',
          log: '',
          tool_rtn_data: '',
          final_answer: ''
        } // 明确初始化空的streamData
      }
      setMessages(prev => [...prev, initialAgentMessage])

      // 发送查询请求，包含文件上下文
      const context = {
        template_filename: selectedTemplateFile,
        shared_filename: selectedSharedFile
      }
      console.log('🔍 当前Agent ID:', agentService.getAgentId())
      console.log('📁 文件上下文:', context)
      console.log('📤 准备发送查询:', query)
      
      const streamResponse = await agentService.queryAgentSystem(query, context)
      console.log('📡 获得流响应:', streamResponse)

      // 只有在流尚未初始化时，才启动新的监听器
      if (!streamsInitializedRef.current) {
        console.log('🔄 可用流列表:', streamResponse.streams)
        
        // 更新消息显示流信息
        setMessages(prev => prev.map(msg => 
          msg.id === agentMessageId 
            ? { 
                ...msg, 
                content: `🤖 Agent系统正在处理您的请求...\n\n📡 获得流ID: ${streamResponse.id}\n🔄 可用流: ${streamResponse.streams.join(', ')}\n📊 共${streamResponse.streams.length}个流`
              }
            : msg
        ))

        // 开始监听所有可用的流
        console.log('🚀 开始监听流，数量:', streamResponse.streams.length)
        const streamPromises = streamResponse.streams.map(streamName => {
          console.log(`🎯 准备监听流: ${streamName}`)
          return listenToStream(streamResponse.id, streamName as StreamType)
        })

        // 等待所有流完成或开始监听Agent状态
        Promise.all(streamPromises).then(() => {
          console.log('📡 所有流监听已开始')
        })

        // 标记流已初始化
        streamsInitializedRef.current = true
      } else {
        console.log('♻️ 复用现有流连接，仅发送新查询。')
        // 对于已经存在的流，我们假设它们会接收到新查询的数据。
        // 我们需要用新的查询信息来更新UI
        setMessages(prev => prev.map(msg => 
          msg.id === agentMessageId 
            ? { 
                ...msg, 
                content: `🤖 Agent系统正在处理您的请求...\n\n♻️ 复用流ID: ${streamResponse.id}`
              }
            : msg
        ))
      }

      // 持久的Agent状态检查函数
      startStatusCheck(agentMessageId)

    } catch (error) {
      console.error('❌ Agent查询错误:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      
      // 检查是否是agent_id失效的错误
      if (errorMessage.includes('KeyError') || errorMessage.includes('agent_id')) {
        message.error('Agent系统可能已失效，请重新初始化Agent系统')
        
        // 重置Agent状态
        setAgentId(null)
        setAgentInitialized(false)
        agentService.resetAgentId()
        
        // 显示特殊错误消息
        const errorMessageObj: Message = {
          id: Date.now() + Math.floor(Math.random() * 10000),
          content: `❌ Agent系统已失效，请重新初始化\n\n可能原因：\n- 后台Agent系统重启\n- Agent会话超时\n- 网络连接问题\n\n请切换到LLM模式再切换回Agent模式以重新初始化。`,
          isUser: false,
          timestamp: new Date(),
          hasError: true,
          canRetry: false,
          isAgentMode: true
        }
        setMessages(prev => [...prev, errorMessageObj])
      } else {
        message.error(`Agent查询失败: ${errorMessage}`)
        
        // 显示常规错误消息
        const errorMessageObj: Message = {
          id: Date.now() + Math.floor(Math.random() * 10000),
          content: `❌ Agent查询失败: ${errorMessage}`,
          isUser: false,
          timestamp: new Date(),
          hasError: true,
          canRetry: true,
          isAgentMode: true
        }
        setMessages(prev => [...prev, errorMessageObj])
      }
    }
  }

  const handleLLMChat = async (value: string, isRetry: boolean) => {
    // 更新聊天历史
    let updatedHistory = chatHistory
    if (!isRetry) {
      const newUserMessage: ChatMessage = { role: 'user', content: value }
      updatedHistory = [...chatHistory, newUserMessage]
      setChatHistory(updatedHistory)
    }

    // 创建助手消息（用于流式更新）
    const assistantMessageId = Date.now() + (isRetry ? 0 : 1)
    const llmService = llmServiceRef.current
    const isThinkingModel = llmService?.isThinkingModel() || false
    
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      thinking: isThinkingModel ? '' : undefined,
      isUser: false,
      timestamp: new Date(),
      isStreaming: true,
      hasThinking: isThinkingModel,
    }

    setMessages(prev => [...prev, initialAssistantMessage])

    try {
      const llmService = llmServiceRef.current
      if (!llmService) {
        throw new Error('LLM服务未初始化')
      }

      let finalContent = ''
      let finalThinking = ''
      let hasReceivedData = false

      // 使用流式聊天
      for await (const response of llmService.streamChat(updatedHistory)) {
        hasReceivedData = true
        finalContent = response.content
        finalThinking = response.thinking || ''

        // 更新消息内容
        setMessages(prev => {
          const updatedMessages = prev.map(msg => 
            msg.id === assistantMessageId 
              ? { 
                  ...msg, 
                  content: response.content, 
                  thinking: isThinkingModel ? response.thinking : undefined,
                  isStreaming: !response.done,
                  hasThinking: isThinkingModel
                }
              : msg
          )
          return updatedMessages
        })

        if (response.done) {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { 
                  ...msg, 
                  content: finalContent, 
                  thinking: isThinkingModel ? finalThinking : undefined,
                  isStreaming: false,
                  hasThinking: isThinkingModel
                }
              : msg
          ))
          break
        }
      }

      // 如果没有收到任何数据，尝试同步方式
      if (!hasReceivedData || (!finalContent && !finalThinking)) {
        console.log('流式响应失败，尝试同步方式...')
        message.warning('流式响应失败，尝试同步方式...')
        const syncResponse = await llmService.chatSync(updatedHistory)
        finalContent = syncResponse.content
        finalThinking = syncResponse.thinking || ''

        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { 
                ...msg, 
                content: finalContent, 
                thinking: isThinkingModel ? finalThinking : undefined,
                isStreaming: false,
                hasThinking: isThinkingModel
              }
            : msg
        ))
      }

      // 更新聊天历史
      if (!isRetry) {
        const assistantMessage: ChatMessage = { role: 'assistant', content: finalContent }
        setChatHistory(prev => [...prev, assistantMessage])
      }

    } catch (error) {
      console.error('聊天错误:', error)
      
      const errorContent = `抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}`
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              content: errorContent,
              isStreaming: false,
              hasError: true,
              canRetry: true,
              hasThinking: isThinkingModel
            }
          : msg
      ))

      message.error('聊天请求失败，请检查网络连接和API配置')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = (value: string) => {
    sendMessage(value, false)
  }

  const handleRetry = (originalMessage: string) => {
    sendMessage(originalMessage, true)
  }

  const handleAgentModeChange = (checked: boolean) => {
    setUseAgentMode(checked)
    if (!checked) {
      // 从Agent模式切换走时，只停止状态检查，不重置Agent或流的状态
      stopStatusCheck()
    }
  }

  const renderThinkingBox = (thinking: string | undefined, isStreaming?: boolean, hasThinkingContent?: boolean, messageId?: number) => {
    const llmService = llmServiceRef.current
    const isThinkingModel = llmService?.isThinkingModel() || false
    
    if (!isThinkingModel) return null
    if (!hasThinkingContent) return null
    
    let displayContent = ''
    
    if (thinking && thinking.trim()) {
      displayContent = thinking
    } else if (isStreaming) {
      displayContent = '正在思考中...'
    } else if (hasThinkingContent) {
      displayContent = '思考过程已完成'
    } else {
      displayContent = ''
    }

    const thinkingItems = [
      {
        key: `thinking-${messageId}`, // 使用messageId确保唯一性
        label: (
          <span style={{ fontSize: '12px', color: '#6a737d' }}>
            思考过程
          </span>
        ),
        children: (
          <Paragraph 
            style={{ 
              margin: 0, 
              fontSize: '12px', 
              color: '#586069',
              whiteSpace: 'pre-wrap',
              maxHeight: '200px',
              overflow: 'auto',
              backgroundColor: '#f8f9fa',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #e9ecef'
            }}
          >
            {displayContent}
          </Paragraph>
        ),
      },
    ]

    return (
      <div style={{ marginTop: '8px' }}>
        <Collapse 
          items={thinkingItems}
          size="small"
          ghost
          expandIcon={({ isActive }) => (
            <CaretRightOutlined 
              rotate={isActive ? 90 : 0} 
              style={{ fontSize: '10px', color: '#6a737d' }}
            />
          )}
          style={{
            backgroundColor: '#f6f8fa',
            border: '1px solid #e1e4e8',
            borderRadius: '6px',
          }}
          className="thinking-collapse"
        />
      </div>
    )
  }

  const renderAgentStreamsBox = (streamData: Message['streamData'], isStreaming?: boolean, messageId?: number) => {
    if (!streamData) return null
    
    // 检查是否有流程数据（只处理output和thinking，暂时关掉其他）
    const hasProcessData = streamData.output || streamData.thinking
    
    // 只有真正有流程数据时才显示，不要因为isStreaming就显示
    if (!hasProcessData) return null
    
    let displayContent = ''
    
    if (streamData.output) {
      const outputStyle = getStreamStyle('output')
      displayContent += `${outputStyle.icon} [OUTPUT]\n${streamData.output}\n\n`
    }
    if (streamData.thinking) {
      const thinkingStyle = getStreamStyle('thinking')
      displayContent += `${thinkingStyle.icon} [THINKING]\n${streamData.thinking}\n\n`
    }
    
    displayContent = displayContent.trim()

    const agentStreamItems = [
      {
        key: `agent-streams-${messageId}`, // 使用messageId确保唯一性
        label: (
          <span style={{ fontSize: '12px', color: '#666666' }}>
            Agent流程详情 {isStreaming && <span style={{ color: '#52c41a' }}>●</span>}
          </span>
        ),
        children: (
          <Paragraph 
            style={{ 
              margin: 0, 
              fontSize: '12px', 
              color: '#586069',
              whiteSpace: 'pre-wrap',
              maxHeight: '300px',
              overflow: 'auto',
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}
          >
            {displayContent}
          </Paragraph>
        ),
      },
    ]

    return (
      <div style={{ marginTop: '8px' }}>
        <Collapse 
          items={agentStreamItems}
          size="small"
          ghost
          expandIcon={({ isActive }) => (
            <CaretRightOutlined 
              rotate={isActive ? 90 : 0} 
              style={{ fontSize: '10px', color: '#666666' }}
            />
          )}
          style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '6px',
          }}
          className="agent-streams-collapse"
        />
      </div>
    )
  }

  const renderMessage = (message: Message) => {
    const isAgentMessage = message.isAgentMode && !message.isUser
    
    return (
      <List.Item key={message.id} style={{ padding: '12px 0', border: 'none' }}>
        <List.Item.Meta
          avatar={
            <Avatar 
              icon={message.isUser ? <UserOutlined /> : (isAgentMessage ? <ApiOutlined /> : <RobotOutlined />)}
              style={{ 
                backgroundColor: message.hasError ? '#ff4d4f' : (
                  message.isUser ? '#4a4a4a' : (isAgentMessage ? '#722ed1' : '#6c757d')
                )
              }}
            />
          }
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text strong style={{ 
                color: message.hasError ? '#ff4d4f' : (
                  message.isUser ? '#4a4a4a' : (isAgentMessage ? '#722ed1' : '#6c757d')
                ) 
              }}>
                {message.isUser ? '您' : (isAgentMessage ? 'Agent系统' : 'AI助手')}
              </Text>
              {message.isStreaming && (
                <Spin size="small" />
              )}
              {message.hasError && message.canRetry && (
                <Button 
                  type="link" 
                  size="small" 
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    const userMessages = messages.filter(m => m.isUser)
                    const lastUserMessage = userMessages[userMessages.length - 1]
                    if (lastUserMessage) {
                      handleRetry(lastUserMessage.content)
                    }
                  }}
                >
                  重试
                </Button>
              )}
            </div>
          }
          description={
            <div>
              {/* Thinking 部分 (仅LLM模式) */}
              {!isAgentMessage && renderThinkingBox(message.thinking, message.isStreaming, message.hasThinking, message.id)}
              
              {/* Agent流程详情 (可折叠的紫色框) */}
              {isAgentMessage && renderAgentStreamsBox(message.streamData, message.isStreaming, message.id)}
              
              {/* 主要内容 */}
              <div style={{ marginTop: '8px' }}>
                {isAgentMessage ? (
                  // Agent模式：显示初始状态信息和final_answer
                  <div>
                    {/* 初始状态信息 */}
                    {message.content && (
                      <Paragraph 
                        style={{ 
                          margin: '0 0 12px 0', 
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          color: message.hasError ? '#ff4d4f' : '#666',
                          fontSize: '13px'
                        }}
                      >
                        {/* 只显示状态信息，过滤掉流数据 */}
                        {message.content.split('\n\n')[0]}
                      </Paragraph>
                    )}
                    
                    {/* Final Answer 单独显示 */}
                    {message.streamData?.final_answer && (
                      <div style={{ marginTop: '12px' }}>
                        <Paragraph 
                          key={`final-answer-${message.id}`} // 添加唯一key
                          style={{ 
                            margin: 0, 
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: 'inherit',
                            fontSize: '14px',
                            lineHeight: '1.6'
                          }}
                        >
                          {message.streamData.final_answer}
                        </Paragraph>
                      </div>
                    )}
                  </div>
                ) : (
                  // LLM模式：正常显示
                  <Paragraph 
                    style={{ 
                      margin: 0, 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: message.hasError ? '#ff4d4f' : 'inherit'
                    }}
                  >
                    {message.content}
                  </Paragraph>
                )}
              </div>

              {/* 时间戳 */}
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                {message.timestamp.toLocaleTimeString()}
              </Text>
            </div>
          }
        />
      </List.Item>
    )
  }

  // 简化的状态检查函数
  const startStatusCheck = (messageId: number) => {
    console.log(`🚀 启动状态检查，目标消息ID: ${messageId}`)
    
    // 清理之前的检查
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current)
    }
    
    setCurrentTaskMessageId(messageId)
    
    // 设置定时器，每5秒检查一次
    statusCheckIntervalRef.current = setInterval(() => {
      console.log('⏰ 定时器触发')
      
      // 如果上一次检查还在进行中，跳过这次检查
      if (isCheckingStatusRef.current) {
        console.log('⏸️ 上次状态检查还在进行中，跳过这次检查')
        return
      }
      
      void (async () => {
        isCheckingStatusRef.current = true
        try {
          console.log('🔍 开始状态检查')
          const status = await agentService.checkAgentStatus()
          console.log('✅ 状态检查完成:', status)
          if (status.finished === true) {
            console.log('🎉 Agent任务完成！')
            stopStatusCheck()
            setMessages(prev => prev.map(msg => 
              msg.id === messageId 
                ? { 
                    ...msg, 
                    isStreaming: false,
                    content: '✅ Agent任务已完成\n\n' + (msg.streamData?.final_answer ? '请查看下方的最终回答。' : '任务处理完毕。')
                  }
                : msg
            ))
            setIsLoading(false)
          }
        } catch (error) {
          console.error('❌ 状态检查失败:', error)
        } finally {
          isCheckingStatusRef.current = false
        }
      })()
    }, 5000)
  }
  
  const stopStatusCheck = () => {
    console.log('🛑 停止状态检查')
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current)
      statusCheckIntervalRef.current = null
    }
    setCurrentTaskMessageId(null)
  }
  
  // 组件卸载时清理状态检查
  useEffect(() => {
    return () => {
      stopStatusCheck()
    }
  }, [])

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      padding: '8px 16px 16px 16px' 
    }}>
      {/* 标题 */}
      <Title level={5} style={{ marginBottom: '16px', color: '#2c3e50', fontSize: '12px', marginTop: '0' }}>
        智能交互
      </Title>

      {/* 模式切换和状态信息 */}
      <Card size="small" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Text strong>模式:</Text>
            <Switch
              checked={useAgentMode}
              onChange={handleAgentModeChange}
              checkedChildren="Agent"
              unCheckedChildren="LLM"
              loading={isInitializingAgent}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {useAgentMode ? (
              agentInitialized ? (
                <Text type="success">
                  <ApiOutlined /> Agent已就绪 (ID: {agentId?.substring(0, 8)}...)
                </Text>
              ) : (
                <Text type="warning">
                  <LoadingOutlined /> Agent初始化中...
                </Text>
              )
            ) : (
              <Text>当前模型: {llmConfig.llm_model_id}</Text>
            )}
          </div>
        </div>
        
        {/* 文件选择信息 */}
        {useAgentMode && (selectedTemplateFile || selectedSharedFile) && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            <Text strong>已选择文件:</Text>
            {selectedTemplateFile && (
              <div style={{ marginLeft: '8px' }}>
                📄 模板文件: {selectedTemplateFile}
              </div>
            )}
            {selectedSharedFile && (
              <div style={{ marginLeft: '8px' }}>
                📁 共享文件: {selectedSharedFile}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 聊天记录区域 */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        marginBottom: '16px',
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
        padding: '12px',
        background: '#fff'
      }}>
        <List
          dataSource={messages}
          renderItem={renderMessage}
        />
        <div ref={messagesEndRef} />
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* 输入区域 */}
      <Search
        placeholder={
          isLoading ? (
            useAgentMode ? "Agent系统处理中..." : "AI正在思考中..."
          ) : (
            useAgentMode ? "输入指令给Agent系统..." : "输入您的消息..."
          )
        }
        enterButton={<SendOutlined />}
        size="large"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onSearch={handleSendMessage}
        disabled={isLoading || (useAgentMode && !agentInitialized)}
        style={{ width: '100%' }}
      />
    </div>
  )
}

export default InteractionPanel 