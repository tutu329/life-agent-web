import React, { useState, useRef, useEffect } from 'react'
import { Input, List, Avatar, Typography, Divider, Card, Alert, Spin, Button, message } from 'antd'
import { UserOutlined, RobotOutlined, SendOutlined, ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLLMConfig } from '../App'
import { LLMService, ChatMessage } from '../services/llmService'

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
}

const InteractionPanel: React.FC = () => {
  const llmConfig = useLLMConfig()
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

  // 初始化LLM服务
  useEffect(() => {
    llmServiceRef.current = new LLMService(llmConfig)
  }, [llmConfig])

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (value: string, isRetry: boolean = false) => {
    if (!value.trim() || isLoading) return

    let userMessage: Message | null = null

    // 如果不是重试，添加用户消息
    if (!isRetry) {
      userMessage = {
        id: Date.now(),
        content: value,
        isUser: true,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, userMessage!])
    }

    setIsLoading(true)
    setInputValue('')

    // 更新聊天历史
    let updatedHistory = chatHistory
    if (!isRetry) {
      const newUserMessage: ChatMessage = { role: 'user', content: value }
      updatedHistory = [...chatHistory, newUserMessage]
      setChatHistory(updatedHistory)
    }

    // 创建助手消息（用于流式更新）
    const assistantMessageId = Date.now() + (isRetry ? 0 : 1)
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      thinking: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true,
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
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { 
                ...msg, 
                content: response.content, 
                thinking: response.thinking,
                isStreaming: !response.done 
              }
            : msg
        ))

        if (response.done) {
          break
        }
      }

      // 如果没有收到任何数据，尝试同步方式
      if (!hasReceivedData || (!finalContent && !finalThinking)) {
        message.warning('流式响应失败，尝试同步方式...')
        const syncResponse = await llmService.chatSync(updatedHistory)
        finalContent = syncResponse.content
        finalThinking = syncResponse.thinking || ''

        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { 
                ...msg, 
                content: finalContent, 
                thinking: finalThinking,
                isStreaming: false 
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
      
      // 显示错误消息
      const errorContent = `抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}`
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              content: errorContent,
              isStreaming: false,
              hasError: true,
              canRetry: true
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

  const renderThinkingBox = (thinking: string) => {
    if (!thinking) return null

    return (
      <Card 
        size="small" 
        style={{ 
          marginTop: '8px', 
          backgroundColor: '#f6f8fa',
          border: '1px solid #e1e4e8'
        }}
        title={
          <span style={{ fontSize: '12px', color: '#6a737d' }}>
            <ThunderboltOutlined /> 思考过程
          </span>
        }
      >
        <Paragraph 
          style={{ 
            margin: 0, 
            fontSize: '12px', 
            color: '#586069',
            whiteSpace: 'pre-wrap',
            maxHeight: '200px',
            overflow: 'auto'
          }}
        >
          {thinking}
        </Paragraph>
      </Card>
    )
  }

  const renderMessage = (message: Message) => {
    return (
      <List.Item key={message.id} style={{ padding: '12px 0', border: 'none' }}>
        <List.Item.Meta
          avatar={
            <Avatar 
              icon={message.isUser ? <UserOutlined /> : <RobotOutlined />}
              style={{ 
                backgroundColor: message.hasError ? '#ff4d4f' : (message.isUser ? '#1677ff' : '#52c41a')
              }}
            />
          }
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text strong style={{ color: message.hasError ? '#ff4d4f' : (message.isUser ? '#1677ff' : '#52c41a') }}>
                {message.isUser ? '您' : 'AI助手'}
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
                    // 找到对应的用户消息
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
              {/* Thinking 部分 */}
              {message.thinking && renderThinkingBox(message.thinking)}
              
              {/* 主要内容 */}
              <div style={{ marginTop: message.thinking ? '12px' : '0' }}>
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

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      padding: '16px' 
    }}>
      {/* 标题 */}
      <Title level={4} style={{ marginBottom: '16px', color: '#1677ff' }}>
        智能交互
      </Title>

      {/* 当前模型信息 */}
      <Alert
        message={`当前模型: ${llmConfig.llm_model_id}`}
        type="info"
        showIcon
        style={{ marginBottom: '12px', fontSize: '12px' }}
      />

      {/* 聊天记录区域 */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        marginBottom: '16px',
        border: '1px solid #f0f0f0',
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
        placeholder={isLoading ? "AI正在思考中..." : "输入您的消息..."}
        enterButton={<SendOutlined />}
        size="large"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onSearch={handleSendMessage}
        disabled={isLoading}
        style={{ width: '100%' }}
      />
    </div>
  )
}

export default InteractionPanel 