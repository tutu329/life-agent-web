import React, { useState, useRef, useEffect } from 'react'
import { Input, List, Avatar, Typography, Divider, Alert, Spin, Button, message, Collapse } from 'antd'
import { UserOutlined, RobotOutlined, SendOutlined, ReloadOutlined, CaretRightOutlined } from '@ant-design/icons'
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
  hasThinking?: boolean // 用于标记这条消息是否应该显示thinking框
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
    const llmService = llmServiceRef.current
    const isThinkingModel = llmService?.isThinkingModel() || false
    
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      thinking: isThinkingModel ? '' : undefined, // thinking模型初始化为空字符串，等待真实内容
      isUser: false,
      timestamp: new Date(),
      isStreaming: true,
      hasThinking: isThinkingModel, // 标记这条消息应该显示thinking框
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

        // 可选：保留关键调试信息
        // console.log('前端收到流式响应:', response)

        // 更新消息内容
        setMessages(prev => {
          const updatedMessages = prev.map(msg => 
            msg.id === assistantMessageId 
              ? { 
                  ...msg, 
                  content: response.content, 
                  thinking: isThinkingModel ? response.thinking : undefined,
                  isStreaming: !response.done,
                  hasThinking: isThinkingModel // 确保hasThinking字段保持
                }
              : msg
          )
          // 可选：保留关键调试信息
          // const updatedMsg = updatedMessages.find(m => m.id === assistantMessageId)
          // console.log('消息更新后状态:', updatedMsg)
          return updatedMessages
        })

        if (response.done) {
          // 流式响应完成时，确保最终的thinking内容被保存
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { 
                  ...msg, 
                  content: finalContent, 
                  thinking: isThinkingModel ? finalThinking : undefined,
                  isStreaming: false,
                  hasThinking: isThinkingModel // 确保hasThinking字段保持
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

        console.log('同步响应结果:', syncResponse) // 调试信息
        console.log('同步thinking内容:', finalThinking) // 调试信息

        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { 
                ...msg, 
                content: finalContent, 
                thinking: isThinkingModel ? finalThinking : undefined,
                isStreaming: false,
                hasThinking: isThinkingModel // 确保hasThinking字段保持
              }
            : msg
        ))
      }

      // 最终更新消息（这里已经在上面的同步响应处理中完成了）

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
              canRetry: true,
              hasThinking: isThinkingModel // 即使出错也保持thinking框显示状态
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

  const renderThinkingBox = (thinking: string | undefined, isStreaming?: boolean, hasThinkingContent?: boolean) => {
    const llmService = llmServiceRef.current
    const isThinkingModel = llmService?.isThinkingModel() || false
    
    // 只有thinking模型才显示thinking框
    if (!isThinkingModel) return null
    
    // 如果不需要显示thinking框，直接返回null
    if (!hasThinkingContent) return null
    
    // 决定显示的内容
    let displayContent = ''
    
    if (thinking && thinking.trim()) {
      // 有实际的thinking内容
      displayContent = thinking
    } else if (isStreaming) {
      // 正在流式响应中
      displayContent = '正在思考中...'
    } else if (hasThinkingContent) {
      // 流式响应完成但没有thinking内容
      displayContent = '思考过程已完成'
    } else {
      // 不应该显示thinking框
      displayContent = ''
    }

    const thinkingItems = [
      {
        key: '1',
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

  const renderMessage = (message: Message) => {
    return (
      <List.Item key={message.id} style={{ padding: '12px 0', border: 'none' }}>
        <List.Item.Meta
          avatar={
            <Avatar 
              icon={message.isUser ? <UserOutlined /> : <RobotOutlined />}
              style={{ 
                backgroundColor: message.hasError ? '#ff4d4f' : (message.isUser ? '#4a4a4a' : '#6c757d')
              }}
            />
          }
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text strong style={{ color: message.hasError ? '#ff4d4f' : (message.isUser ? '#4a4a4a' : '#6c757d') }}>
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
              {renderThinkingBox(message.thinking, message.isStreaming, message.hasThinking)}
              
              {/* 主要内容 */}
              <div style={{ marginTop: '0' }}>
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
      padding: '8px 16px 16px 16px' 
    }}>
      {/* 标题 */}
      <Title level={5} style={{ marginBottom: '16px', color: '#2c3e50', fontSize: '12px', marginTop: '0' }}>
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