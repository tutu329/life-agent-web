import { useState, createContext, useContext, useCallback, useEffect } from 'react'
import { Layout, Button, Modal, Form, Input, ConfigProvider, theme, Select, Card, Divider, List, Popconfirm, message } from 'antd'
import { SettingOutlined, PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, FolderOpenOutlined, PrinterOutlined, UndoOutlined, RedoOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined, MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons'
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

// 创建文件选择上下文
interface FileSelectionContextType {
  selectedTemplateFile: string
  selectedSharedFile: string
  setSelectedTemplateFile: (filename: string) => void
  setSelectedSharedFile: (filename: string) => void
}

export const FileSelectionContext = createContext<FileSelectionContextType | null>(null)

// 创建Hook来使用文件选择上下文
export const useFileSelection = () => {
  const context = useContext(FileSelectionContext)
  if (!context) {
    throw new Error('useFileSelection must be used within FileSelectionProvider')
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
  const [rightSiderWidth, setRightSiderWidth] = useState<number>(450) // 增加右侧栏默认宽度
  const [isResizing, setIsResizing] = useState(false)
  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false)
  const [addModelForm] = Form.useForm()
  const [editingModelKey, setEditingModelKey] = useState<string | null>(null)
  
  // Agent相关状态
  const [agentId, setAgentId] = useState<string | null>(null)
  const [agentInitialized, setAgentInitialized] = useState(false)
  
  // 文件选择状态
  const [selectedTemplateFile, setSelectedTemplateFile] = useState('')
  const [selectedSharedFile, setSelectedSharedFile] = useState('')
  
  // 左侧栏折叠状态，默认为折叠
  const [leftSiderCollapsed, setLeftSiderCollapsed] = useState(true)
  
  // 检测屏幕尺寸以自动调整布局
  const [screenWidth, setScreenWidth] = useState(window.innerWidth)
  
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
      // 在小屏幕上自动折叠左侧栏
      if (window.innerWidth < 768 && !leftSiderCollapsed) {
        setLeftSiderCollapsed(true)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [leftSiderCollapsed])

  // 监听快捷键 Ctrl+1 或 Command+1 来切换资源面板
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否按下了 Ctrl+1 (Windows/Linux) 或 Command+1 (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === '1') {
        event.preventDefault() // 阻止默认行为
        toggleLeftSider()
      }
    }

    // 添加键盘事件监听器
    document.addEventListener('keydown', handleKeyDown)
    
    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [leftSiderCollapsed]) // 依赖leftSiderCollapsed以确保toggleLeftSider有正确的状态

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
      const newWidth = Math.max(200, Math.min(800, startWidth + deltaX)) // 放宽拖拽范围：最小200px，最大800px
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

  // 处理触摸事件 - 为iPad等触摸设备提供支持
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    
    const startX = e.touches[0].clientX
    const startWidth = rightSiderWidth
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        const deltaX = startX - e.touches[0].clientX
        const newWidth = Math.max(200, Math.min(800, startWidth + deltaX)) // 放宽拖拽范围
        setRightSiderWidth(newWidth)
      }
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      setIsResizing(false)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
    
    // 使用更积极的事件监听配置
    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true })
  }, [rightSiderWidth])

  // 切换左侧栏折叠状态
  const toggleLeftSider = () => {
    setLeftSiderCollapsed(!leftSiderCollapsed)
  }

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
          <FileSelectionContext.Provider value={{ 
            selectedTemplateFile, 
            selectedSharedFile, 
            setSelectedTemplateFile, 
            setSelectedSharedFile 
          }}>
            {/* <Layout style={{ 
              height: '100vh',
              minHeight: screenWidth <= 1024 ? 'calc(100vh - env(safe-area-inset-top, 0px))' : '100vh' // iPad安全区域适配
            }}> */}
            <Layout
              className="app-root"
              style={{
                height: '100%',          // 占满 #root 剩余空间
                // minHeight: '100vh',      // 至少视口高
              }}
            >


          {/* 顶部 Header */}
          <Header style={{ 
            background: '#f8fafc', 
            padding: '0', // 移除所有内边距，让内部容器处理布局
            height: screenWidth <= 1024 ? `calc(28px + env(safe-area-inset-top, 0px))` : '24px', // 总高度包含安全区域
            minHeight: screenWidth <= 1024 ? `calc(28px + env(safe-area-inset-top, 0px))` : '24px',
            borderBottom: '1px solid #e2e8f0',
            position: 'relative',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            zIndex: 1000, // 确保Header在最上层
            display: 'flex',
            alignItems: 'stretch' // 让内部容器拉伸填满
          }}>
            {/* 内容容器 - 处理安全区域和内容居中 */}
            <div style={{
              width: '100%',
              height: '100%',
              paddingTop: screenWidth <= 1024 ? 'env(safe-area-inset-top, 0px)' : '0',
              paddingLeft: '8px',
              paddingRight: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              {/* 左侧折叠按钮 */}
              <Button 
                type="text" 
                icon={leftSiderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={toggleLeftSider}
                style={{ 
                  fontSize: screenWidth <= 1024 ? '14px' : '12px', 
                  height: screenWidth <= 1024 ? '22px' : '20px', 
                  padding: screenWidth <= 1024 ? '0 8px' : '0 6px',
                  minWidth: screenWidth <= 1024 ? '22px' : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                size="small"
                title={leftSiderCollapsed ? '展开资源面板' : '收起资源面板'}
              />
              
              {/* 中间空白区域 */}
              <div style={{ flex: 1 }} />
              
              {/* 右侧设置按钮 */}
              <Button 
                type="text" 
                icon={<SettingOutlined />} 
                onClick={showSettingsModal}
                style={{ 
                  fontSize: screenWidth <= 1024 ? '14px' : '12px', 
                  height: screenWidth <= 1024 ? '22px' : '20px', 
                  padding: screenWidth <= 1024 ? '0 8px' : '0 6px',
                  minWidth: screenWidth <= 1024 ? '50px' : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
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
              width={310}
              collapsedWidth={0}
              collapsed={leftSiderCollapsed}
              trigger={null}
              className="left-sider-panel"
              style={{ 
                background: '#f1f5f9',
                borderRight: leftSiderCollapsed ? 'none' : '1px solid #e2e8f0',
                transition: 'all 0.2s'
              }}
            >
              <ResourcePanel />
            </Sider>

            {/* 中栏 - 编辑区 */}
            <Content 
              className="main-layout-content"
              style={{ 
                background: '#ffffff',
                borderRight: '1px solid #e2e8f0',
                minWidth: '600px',
                flex: 1
              }}
            >
              <EditorPanel />
            </Content>

            {/* 右栏 - 交互区 */}
            <div 
              className="right-sider-panel"
              style={{ 
                width: rightSiderWidth,
                background: '#f1f5f9',
                position: 'relative',
                display: 'flex',
                minWidth: '200px',
                maxWidth: '800px' // 放宽最大宽度限制，与拖拽范围一致
              }}
            >
              {/* 可拖拽的分割线 */}
              <div
                style={{
                  width: screenWidth <= 1024 ? '16px' : '4px', // iPad等触摸设备使用更宽的触摸区域
                  background: isResizing ? '#94a3b8' : (screenWidth <= 1024 ? 'rgba(203, 213, 225, 0.5)' : 'transparent'),
                  cursor: 'col-resize',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  zIndex: 10,
                  borderLeft: '1px solid #e2e8f0',
                  // 增加触摸友好性
                  touchAction: 'none', // 阻止所有默认触摸行为
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  // 添加视觉提示
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // 确保在iPad上始终可见和可交互
                  minWidth: screenWidth <= 1024 ? '16px' : '4px',
                  opacity: screenWidth <= 1024 ? 1 : (isResizing ? 1 : 0.3),
                  transition: 'all 0.2s ease'
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                title="拖拽调整交互栏宽度"
              >
                {/* 在触摸设备上显示拖拽指示器 */}
                {screenWidth <= 1024 && (
                  <div style={{
                    width: '3px',
                    height: '40px',
                    background: isResizing ? '#475569' : '#94a3b8',
                    borderRadius: '2px',
                    opacity: 0.8,
                    transition: 'all 0.2s ease'
                  }} />
                )}
              </div>
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
          </FileSelectionContext.Provider>
        </AgentContext.Provider>
      </LLMConfigContext.Provider>
    </ConfigProvider>
  )
}

export default App 