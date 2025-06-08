import React, { useState } from 'react'
import { Input, List, Avatar, Typography, Divider } from 'antd'
import { UserOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons'

const { Search } = Input
const { Title, Text } = Typography

interface Message {
  id: number
  content: string
  isUser: boolean
  timestamp: Date
}

const InteractionPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: '您好！我是您的智能助手，有什么可以帮助您的吗？',
      isUser: false,
      timestamp: new Date(),
    },
  ])

  const handleSendMessage = (value: string) => {
    if (!value.trim()) return

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now(),
      content: value,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])

    // 模拟Agent回复
    setTimeout(() => {
      const agentMessage: Message = {
        id: Date.now() + 1,
        content: `我收到了您的消息："${value}"。这是一个模拟回复，后续将接入真实的多智能体系统。`,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, agentMessage])
    }, 1000)
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
          renderItem={(message) => (
            <List.Item style={{ padding: '8px 0', border: 'none' }}>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={message.isUser ? <UserOutlined /> : <RobotOutlined />}
                    style={{ 
                      backgroundColor: message.isUser ? '#1677ff' : '#52c41a'
                    }}
                  />
                }
                title={
                  <Text strong style={{ color: message.isUser ? '#1677ff' : '#52c41a' }}>
                    {message.isUser ? '您' : 'Agent'}
                  </Text>
                }
                description={
                  <div>
                    <div style={{ marginBottom: '4px' }}>{message.content}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {message.timestamp.toLocaleTimeString()}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* 输入区域 */}
      <Search
        placeholder="输入您的消息..."
        enterButton={<SendOutlined />}
        size="large"
        onSearch={handleSendMessage}
        style={{ width: '100%' }}
      />
    </div>
  )
}

export default InteractionPanel 