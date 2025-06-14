import { useState, createContext, useContext, useCallback } from 'react'
import { Layout, Button, Modal, Form, Input, ConfigProvider, theme, Select, Card, Divider, List, Popconfirm, message } from 'antd'
import { SettingOutlined, PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, FolderOpenOutlined, PrinterOutlined, UndoOutlined, RedoOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined } from '@ant-design/icons'
import ResourcePanel from './components/ResourcePanel'
import EditorPanel from './components/EditorPanel'
import InteractionPanel from './components/InteractionPanel'
import { LLMConfig } from './services/llmService'
import './App.css'

interface ModelConfig extends LLMConfig {
  name: string
}

const { Header, Content, Sider } = Layout
const { Option } = Select

// 默认的模型配置
const DEFAULT_MODEL_PRESETS: Record<string, ModelConfig> = {
  'deepseek-chat': {
    name: 'DeepSeek-Chat',
    base_url: 'https://api.deepseek.com/v1',
    api_key: 'sk-c1d34a4f21e3413487bb4b2806f6c4b8',
    llm_model_id: 'deepseek-chat',
    temperature: 0.6
  },
  'deepseek-reasoner': {
    name: 'DeepSeek-Reasoner',
    base_url: 'https://api.deepseek.com/v1',
    api_key: 'sk-c1d34a4f21e3413487bb4b2806f6c4b8',
    llm_model_id: 'deepseek-reasoner',
    temperature: 0.6
  },
  'qwen3-235b-a22b': {
    name: 'Qwen3-235B-A22B',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api_key: 'sk-9f507c06d7534acf978cf30091bc5529',
    llm_model_id: 'qwen3-235b-a22b',
    temperature: 0.6
  }
}

// 从localStorage加载自定义模型配置
const loadCustomModels = () => {
  try {
    const saved = localStorage.getItem('customModels')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

// 保存自定义模型配置到localStorage
const saveCustomModels = (customModels: any) => {
  localStorage.setItem('customModels', JSON.stringify(customModels))
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

// 创建Agent上下文
interface AgentContextType {
  agentId: string | null
  setAgentId: (id: string | null) => void
  agentInitialized: boolean
  setAgentInitialized: (initialized: boolean) => void
}

export const AgentContext = createContext<AgentContextType | null>(null)

// 创建Hook来使用Agent上下文
export const useAgentContext = () => {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error('useAgentContext must be used within AgentContextProvider')
  }
  return context
}

function App() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-reasoner')
  const [customModels, setCustomModels] = useState<Record<string, ModelConfig>>(() => loadCustomModels())
  const [currentLLMConfig, setCurrentLLMConfig] = useState<LLMConfig>(() => {
    const allModels = {...DEFAULT_MODEL_PRESETS, ...loadCustomModels()}
    return allModels['deepseek-reasoner']
  })
  const [rightSiderWidth, setRightSiderWidth] = useState<number>(700)
  const [isResizing, setIsResizing] = useState(false)
  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false)
  const [addModelForm] = Form.useForm()
  const [editingModelKey, setEditingModelKey] = useState<string | null>(null)
  
  // Agent相关状态
  const [agentId, setAgentId] = useState<string | null>(null)
  const [agentInitialized, setAgentInitialized] = useState(false)

  // 获取所有模型配置（默认+自定义）
  const getAllModels = (): Record<string, ModelConfig> => ({...DEFAULT_MODEL_PRESETS, ...customModels})

  const showSettingsModal = () => {
    setIsSettingsModalOpen(true)
    // 初始化表单值
    const allModels = getAllModels()
    const currentConfig = allModels[selectedModel as keyof typeof allModels]
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
    const allModels = getAllModels()
    const config = allModels[value as keyof typeof allModels]
    form.setFieldsValue(config)
  }

  // 处理右边栏宽度调整
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startWidth = rightSiderWidth
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX
      const newWidth = Math.max(300, Math.min(800, startWidth + deltaX))
      setRightSiderWidth(newWidth)
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [rightSiderWidth])

  // 添加自定义模型
  const handleAddModel = () => {
    setEditingModelKey(null)
    addModelForm.resetFields()
    setIsAddModelModalOpen(true)
  }

  // 编辑自定义模型
  const handleEditModel = (key: string) => {
    const model = customModels[key]
    setEditingModelKey(key)
    addModelForm.setFieldsValue(model)
    setIsAddModelModalOpen(true)
  }

  // 删除自定义模型
  const handleDeleteModel = (key: string) => {
    const newCustomModels = {...customModels}
    delete newCustomModels[key]
    setCustomModels(newCustomModels)
    saveCustomModels(newCustomModels)
    
    // 如果删除的是当前选中的模型，切换到默认模型
    if (selectedModel === key) {
      setSelectedModel('deepseek-reasoner')
      setCurrentLLMConfig(DEFAULT_MODEL_PRESETS['deepseek-reasoner'])
    }
    
    messageApi.success('模型配置已删除')
  }

  // 保存自定义模型配置
  const handleSaveCustomModel = () => {
    addModelForm.validateFields().then((values) => {
      const modelKey = values.llm_model_id
      const newCustomModels = {
        ...customModels,
        [modelKey]: values
      }
      
      setCustomModels(newCustomModels)
      saveCustomModels(newCustomModels)
      setIsAddModelModalOpen(false)
      
      messageApi.success(editingModelKey ? '模型配置已更新' : '模型配置已添加')
    })
  }

  // 配置 message 组件
  const [messageApi, contextHolder] = message.useMessage()

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#64748b',
          colorInfo: '#64748b',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#f8fafc',
          colorBgLayout: '#ffffff',
          colorBorder: '#e2e8f0',
          colorBorderSecondary: '#f1f5f9',
          colorText: '#2c3e50',
          colorTextSecondary: '#64748b',
          colorTextTertiary: '#94a3b8',
          borderRadius: 8,
        },
      }}
    >
      {contextHolder}
      <LLMConfigContext.Provider value={currentLLMConfig}>
        <AgentContext.Provider value={{
          agentId,
          setAgentId,
          agentInitialized,
          setAgentInitialized
        }}>
          <Layout style={{ height: '100vh' }}>
          {/* 顶部 Header */}
          <Header style={{ 
            background: '#f8fafc', 
            padding: '0 8px', 
            height: '24px',
            lineHeight: '24px',
            minHeight: '24px',
            borderBottom: '1px solid #e2e8f0',
            position: 'relative',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            {/* 左侧工具栏按钮 - 已隐藏 */}
            <div style={{ display: 'none' }}>
              <Button type="text" size="small" icon={<SaveOutlined />} title="保存" style={{ fontSize: '11px', height: '20px', padding: '0 4px' }} />
              <Button type="text" size="small" icon={<FolderOpenOutlined />} title="打开" style={{ fontSize: '11px', height: '20px', padding: '0 4px' }} />
              <Button type="text" size="small" icon={<PrinterOutlined />} title="打印" style={{ fontSize: '11px', height: '20px', padding: '0 4px' }} />
              <Button type="text" size="small" icon={<UndoOutlined />} title="撤销" style={{ fontSize: '11px', height: '20px', padding: '0 4px' }} />
              <Button type="text" size="small" icon={<RedoOutlined />} title="重做" style={{ fontSize: '11px', height: '20px', padding: '0 4px' }} />
              <Button type="text" size="small" icon={<BoldOutlined />} title="粗体" style={{ fontSize: '11px', height: '20px', padding: '0 4px' }} />
              <Button type="text" size="small" icon={<ItalicOutlined />} title="斜体" style={{ fontSize: '11px', height: '20px', padding: '0 4px' }} />
              <Button type="text" size="small" icon={<UnderlineOutlined />} title="下划线" style={{ fontSize: '11px', height: '20px', padding: '0 4px' }} />
            </div>
            
            {/* 设置按钮 - 绝对定位在右边 */}
            <div style={{ 
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)'
            }}>
              <Button 
                type="text" 
                icon={<SettingOutlined />} 
                onClick={showSettingsModal}
                style={{ fontSize: '11px', height: '20px', padding: '0 6px' }}
                size="small"
              >
                设置
              </Button>
            </div>
          </Header>

          {/* 主体部分 - 三栏布局 */}
          <Layout>
            {/* 左栏 - 资源区 */}
            <Sider 
              width={280} 
              style={{ 
                background: '#f1f5f9',
                borderRight: '1px solid #e2e8f0'
              }}
            >
              <ResourcePanel />
            </Sider>

            {/* 中栏 - 编辑区 */}
            <Content style={{ 
              background: '#ffffff',
              borderRight: '1px solid #e2e8f0'
            }}>
              <EditorPanel />
            </Content>

            {/* 右栏 - 交互区 */}
            <div style={{ 
              width: rightSiderWidth,
              background: '#f1f5f9',
              position: 'relative',
              display: 'flex'
            }}>
              {/* 可拖拽的分割线 */}
              <div
                style={{
                  width: '4px',
                  background: isResizing ? '#94a3b8' : 'transparent',
                  cursor: 'col-resize',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  zIndex: 10,
                  borderLeft: '1px solid #e2e8f0'
                }}
                onMouseDown={handleMouseDown}
              />
              <div style={{ flex: 1, marginLeft: '4px' }}>
                <InteractionPanel />
              </div>
            </div>
          </Layout>

          {/* 设置模态框 */}
          <Modal
            title="设置"
            open={isSettingsModalOpen}
            onOk={handleSettingsOk}
            onCancel={handleSettingsCancel}
            okText="确定"
            cancelText="取消"
            width={800}
          >
            <Form form={form} layout="vertical">
              <Card title="LLM 模型配置" size="small">
                <Form.Item
                  label="选择模型"
                  name="selectedModel"
                  rules={[{ required: true, message: '请选择模型' }]}
                >
                  <Select 
                    placeholder="选择模型"
                    onChange={handleModelChange}
                  >
                    {Object.entries(getAllModels()).map(([key, model]) => (
                      <Option key={key} value={key}>
                        {model.name || key}
                        {!DEFAULT_MODEL_PRESETS[key] && (
                          <span style={{ color: '#4a4a4a', marginLeft: '8px' }}>
                            (自定义)
                          </span>
                        )}
                      </Option>
                    ))}
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

                <Divider orientation="left" orientationMargin="0">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    自定义模型管理
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<PlusOutlined />}
                      onClick={handleAddModel}
                    >
                      添加模型
                    </Button>
                  </div>
                </Divider>

                {Object.keys(customModels).length > 0 ? (
                  <List
                    size="small"
                    dataSource={Object.entries(customModels)}
                    renderItem={([key, model]) => (
                      <List.Item
                        actions={[
                          <Button
                            key="edit"
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditModel(key)}
                          >
                            编辑
                          </Button>,
                          <Popconfirm
                            key="delete"
                            title="确定要删除这个模型配置吗？"
                            onConfirm={() => handleDeleteModel(key)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button
                              type="link"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                            >
                              删除
                            </Button>
                          </Popconfirm>
                        ]}
                      >
                        <List.Item.Meta
                          title={model.name || key}
                          description={`${model.base_url} - ${model.llm_model_id}`}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    暂无自定义模型配置
                  </div>
                )}
              </Card>
            </Form>
          </Modal>

          {/* 添加/编辑模型模态框 */}
          <Modal
            title={editingModelKey ? '编辑模型配置' : '添加模型配置'}
            open={isAddModelModalOpen}
            onOk={handleSaveCustomModel}
            onCancel={() => setIsAddModelModalOpen(false)}
            okText="保存"
            cancelText="取消"
            width={600}
          >
            <Form form={addModelForm} layout="vertical">
              <Form.Item
                label="模型名称"
                name="name"
                rules={[{ required: true, message: '请输入模型名称' }]}
              >
                <Input placeholder="例如: 我的 GPT-4" />
              </Form.Item>

              <Form.Item
                label="Base URL"
                name="base_url"
                rules={[{ required: true, message: '请输入 Base URL' }]}
              >
                <Input placeholder="例如: https://api.openai.com/v1" />
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
                <Input placeholder="例如: gpt-4" />
              </Form.Item>

              <Form.Item
                label="Temperature"
                name="temperature"
                rules={[
                  { required: true, message: '请输入 Temperature' },
                  { pattern: /^(0(\.\d+)?|1(\.0+)?)$/, message: 'Temperature 必须在 0-1 之间' }
                ]}
                initialValue={0.6}
              >
                <Input 
                  placeholder="0.0 - 1.0，例如: 0.6" 
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                />
              </Form.Item>
            </Form>
          </Modal>
        </Layout>
        </AgentContext.Provider>
      </LLMConfigContext.Provider>
    </ConfigProvider>
  )
}

export default App 