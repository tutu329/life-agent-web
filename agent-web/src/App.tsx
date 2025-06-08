import React, { useState } from 'react'
import { Layout, Button, Modal, Form, Input, ConfigProvider, theme } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import ResourcePanel from './components/ResourcePanel'
import EditorPanel from './components/EditorPanel'
import InteractionPanel from './components/InteractionPanel'
import './App.css'

const { Header, Content, Sider } = Layout

function App() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [form] = Form.useForm()

  const showSettingsModal = () => {
    setIsSettingsModalOpen(true)
  }

  const handleSettingsOk = () => {
    form.validateFields().then(() => {
      setIsSettingsModalOpen(false)
    })
  }

  const handleSettingsCancel = () => {
    setIsSettingsModalOpen(false)
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      <Layout style={{ height: '100vh' }}>
        {/* 顶部 Header */}
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1677ff' }}>
            Life Agent Web
          </div>
          <Button 
            type="text" 
            icon={<SettingOutlined />} 
            onClick={showSettingsModal}
            style={{ fontSize: '16px' }}
          >
            设置
          </Button>
        </Header>

        {/* 主体部分 - 三栏布局 */}
        <Layout>
          {/* 左栏 - 资源区 */}
          <Sider 
            width={280} 
            style={{ 
              background: '#fafafa',
              borderRight: '1px solid #f0f0f0'
            }}
          >
            <ResourcePanel />
          </Sider>

          {/* 中栏 - 编辑区 */}
          <Content style={{ 
            background: '#fff',
            borderRight: '1px solid #f0f0f0'
          }}>
            <EditorPanel />
          </Content>

          {/* 右栏 - 交互区 */}
          <Sider 
            width={350} 
            style={{ 
              background: '#fafafa'
            }}
          >
            <InteractionPanel />
          </Sider>
        </Layout>

        {/* 设置模态框 */}
        <Modal
          title="设置"
          open={isSettingsModalOpen}
          onOk={handleSettingsOk}
          onCancel={handleSettingsCancel}
          okText="确定"
          cancelText="取消"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="LLM 配置"
              name="llmConfig"
              rules={[{ required: false }]}
            >
              <Input placeholder="请输入 LLM 配置信息" />
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </ConfigProvider>
  )
}

export default App 