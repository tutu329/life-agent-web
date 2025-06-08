import { useState, createContext, useContext } from 'react'
import { Layout, Button, Modal, Form, Input, ConfigProvider, theme, Select, Card, Divider } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import ResourcePanel from './components/ResourcePanel'
import EditorPanel from './components/EditorPanel'
import InteractionPanel from './components/InteractionPanel'
import { LLMConfig } from './services/llmService'
import './App.css'

const { Header, Content, Sider } = Layout
const { Option } = Select

// 预设的模型配置
const MODEL_PRESETS = {
  'deepseek-R1': {
    base_url: 'https://api.deepseek.com/v1',
    api_key: 'sk-c1d34a4f21e3413487bb4b2806f6c4b8',
    llm_model_id: 'deepseek-chat',
    temperature: 0.6
  },
  'qwen3-235b-a22b': {
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api_key: 'sk-9f507c06d7534acf978cf30091bc5529',
    llm_model_id: 'qwen3-235b-a22b',
    temperature: 0.6
  }
}

// 创建LLM配置上下文
export const LLMConfigContext = createContext<LLMConfig | null>(null)

// 创建Hook来使用LLM配置
export const useLLMConfig = () => {
  const context = useContext(LLMConfigContext)
  if (!context) {
    throw new Error('useLLMConfig must be used within LLMConfigProvider')
  }
  return context
}

function App() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-R1')
  const [currentLLMConfig, setCurrentLLMConfig] = useState<LLMConfig>(MODEL_PRESETS['deepseek-R1'])

  const showSettingsModal = () => {
    setIsSettingsModalOpen(true)
    // 初始化表单值
    const currentConfig = MODEL_PRESETS[selectedModel as keyof typeof MODEL_PRESETS]
    form.setFieldsValue({
      selectedModel: selectedModel,
      ...currentConfig
    })
  }

  const handleSettingsOk = () => {
    form.validateFields().then((values) => {
      console.log('LLM配置保存:', values)
      // 更新当前LLM配置
      const newConfig: LLMConfig = {
        base_url: values.base_url,
        api_key: values.api_key,
        llm_model_id: values.llm_model_id,
        temperature: parseFloat(values.temperature)
      }
      setCurrentLLMConfig(newConfig)
      setIsSettingsModalOpen(false)
    })
  }

  const handleSettingsCancel = () => {
    setIsSettingsModalOpen(false)
  }

  const handleModelChange = (value: string) => {
    setSelectedModel(value)
    const config = MODEL_PRESETS[value as keyof typeof MODEL_PRESETS]
    form.setFieldsValue(config)
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
      <LLMConfigContext.Provider value={currentLLMConfig}>
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
            width={600}
          >
            <Form form={form} layout="vertical">
              <Card title="LLM 模型配置" size="small">
                <Form.Item
                  label="常用模型"
                  name="selectedModel"
                  rules={[{ required: true, message: '请选择模型' }]}
                >
                  <Select 
                    placeholder="选择常用模型"
                    onChange={handleModelChange}
                  >
                    <Option value="deepseek-R1">DeepSeek-R1</Option>
                    <Option value="qwen3-235b-a22b">Qwen3-235B-A22B</Option>
                  </Select>
                </Form.Item>

                <Divider orientation="left" orientationMargin="0">模型参数配置</Divider>

                <Form.Item
                  label="Base URL"
                  name="base_url"
                  rules={[{ required: true, message: '请输入 Base URL' }]}
                >
                  <Input placeholder="例如: https://api.deepseek.com/v1" />
                </Form.Item>

                <Form.Item
                  label="API Key"
                  name="api_key"
                  rules={[{ required: true, message: '请输入 API Key' }]}
                >
                  <Input.Password placeholder="请输入 API Key" />
                </Form.Item>

                <Form.Item
                  label="模型 ID"
                  name="llm_model_id"
                  rules={[{ required: true, message: '请输入模型 ID' }]}
                >
                  <Input placeholder="例如: deepseek-chat" />
                </Form.Item>

                <Form.Item
                  label="Temperature"
                  name="temperature"
                  rules={[
                    { required: true, message: '请输入 Temperature' },
                    { pattern: /^(0(\.\d+)?|1(\.0+)?)$/, message: 'Temperature 必须在 0-1 之间' }
                  ]}
                >
                  <Input 
                    placeholder="0.0 - 1.0，例如: 0.6" 
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </Form.Item>
              </Card>
            </Form>
          </Modal>
        </Layout>
      </LLMConfigContext.Provider>
    </ConfigProvider>
  )
}

export default App 