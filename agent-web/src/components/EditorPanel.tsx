import React, { useState } from 'react'
import { Tabs, Button, Modal, Form, Input, Space } from 'antd'
import { BarChartOutlined, FileTextOutlined, SettingOutlined, SaveOutlined, FolderOpenOutlined, PrinterOutlined, UndoOutlined, RedoOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined } from '@ant-design/icons'
import { DocumentEditor } from '@onlyoffice/document-editor-react'

const EditorPanel: React.FC = () => {
  const [isRemoteToolModalOpen, setIsRemoteToolModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [onlyOfficeError, setOnlyOfficeError] = useState<string | null>(null)
  const [remoteToolConfig, setRemoteToolConfig] = useState({
    port: 5122,
    description: '本工具用于控制only-office进行office文档的读写操作。'
  })

  const showRemoteToolModal = () => {
    setIsRemoteToolModalOpen(true)
    form.setFieldsValue(remoteToolConfig)
  }

  const handleRemoteToolOk = () => {
    form.validateFields().then((values) => {
      setRemoteToolConfig(values)
      setIsRemoteToolModalOpen(false)
      console.log('远程工具配置保存:', values)
    })
  }

  const handleRemoteToolCancel = () => {
    setIsRemoteToolModalOpen(false)
  }

  const items = [
    {
      key: '1',
      label: (
        <span>
          <BarChartOutlined />
          可视化分析
        </span>
      ),
      children: (
        <div style={{ 
          padding: '24px', 
          height: 'calc(100vh - 120px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#fafafa',
          border: '2px dashed #d9d9d9',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center', color: '#8c8c8c' }}>
            <BarChartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <h2 style={{ color: '#1677ff', marginBottom: '8px' }}>可视化分析功能区</h2>
            <p>功能开发中，敬请期待...</p>
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <FileTextOutlined />
          报告编制
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column' }}>
          {/* 工具栏 */}
          <div style={{ 
            height: '40px',
            background: '#fafafa',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 12px'
          }}>
            {/* 左侧工具按钮 - 这些按钮将被隐藏 */}
            <div style={{ display: 'none' }}>
              <Space size="small">
                <Button type="text" size="small" icon={<SaveOutlined />} title="保存" />
                <Button type="text" size="small" icon={<FolderOpenOutlined />} title="打开" />
                <Button type="text" size="small" icon={<PrinterOutlined />} title="打印" />
                <Button type="text" size="small" icon={<UndoOutlined />} title="撤销" />
                <Button type="text" size="small" icon={<RedoOutlined />} title="重做" />
                <Button type="text" size="small" icon={<BoldOutlined />} title="粗体" />
                <Button type="text" size="small" icon={<ItalicOutlined />} title="斜体" />
                <Button type="text" size="small" icon={<UnderlineOutlined />} title="下划线" />
              </Space>
            </div>
            
            {/* 右侧设置按钮 */}
            <Button 
              type="text" 
              size="small" 
              icon={<SettingOutlined />}
              onClick={showRemoteToolModal}
            >
              设置
            </Button>
          </div>
          
          {/* OnlyOffice 编辑器 */}
          <div style={{ 
            flex: 1, 
            background: '#fff',
            minHeight: '500px',
            position: 'relative'
          }}>
            <style>
              {`
                /* 隐藏OnlyOffice工具栏中的特定按钮 */
                .asc-window iframe {
                  /* 尝试隐藏工具栏按钮 */
                }
                #onlyoffice-container .toolbar-btn-save,
                #onlyoffice-container .toolbar-btn-open,
                #onlyoffice-container .toolbar-btn-print,
                #onlyoffice-container .toolbar-btn-undo,
                #onlyoffice-container .toolbar-btn-redo,
                #onlyoffice-container .btn-toolbar,
                #onlyoffice-container [title="保存"],
                #onlyoffice-container [title="打开"],
                #onlyoffice-container [title="打印"] {
                  display: none !important;
                }
              `}
            </style>
            {onlyOfficeError ? (
              <div style={{ 
                height: '100%',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#fafafa',
                border: '2px dashed #ff7875',
                borderRadius: '8px',
                margin: '8px'
              }}>
                <div style={{ textAlign: 'center', color: '#8c8c8c' }}>
                  <FileTextOutlined style={{ fontSize: '48px', marginBottom: '16px', color: '#ff7875' }} />
                  <h3 style={{ color: '#ff7875', marginBottom: '8px' }}>OnlyOffice 连接失败</h3>
                  <p>{onlyOfficeError}</p>
                  <div style={{ marginTop: '16px' }}>
                    <Button 
                      type="primary" 
                      onClick={() => {
                        setOnlyOfficeError(null)
                        window.location.reload()
                      }}
                    >
                      重试
                    </Button>
                    <Button 
                      style={{ marginLeft: '8px' }}
                      onClick={() => window.open('/test-onlyoffice.html', '_blank')}
                    >
                      测试页面
                    </Button>
                  </div>
                  <p style={{ fontSize: '12px', marginTop: '16px', color: '#666' }}>
                    请确保OnlyOffice服务器运行在 http://localhost:5102
                  </p>
                </div>
              </div>
            ) : (
              <div 
                id="onlyoffice-container" 
                style={{ 
                  height: '100%', 
                  width: '100%',
                  minHeight: '500px',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }}
              >
                <DocumentEditor
                  id="onlyOfficeEditor"
                  documentServerUrl="http://powerai.cc:5102/"
                  config={{
                    width: '100%',
                    height: '100%',
                    type: 'desktop',
                    documentType: 'word',
                    document: {
                      fileType: 'docx',
                      key: 'blank_document_' + Date.now(),
                      title: '新建文档.docx',
                      url: 'http://powerai.cc:5101/empty.docx',
                      permissions: {
                        edit: true,
                        print: true,
                        download: true,
                        copy: true,
                        comment: true,
                        review: true
                      }
                    },
                    editorConfig: {
                      mode: 'edit',
                      lang: 'zh',
                      user: {
                        id: 'user1',
                        name: 'User'
                      },
                      customization: {
                        autosave: true,
                        compactToolbar: true,
                        hideRightMenu: false,
                        toolbarNoTabs: true
                      }
                    },
                    events: {
                      onAppReady: () => {
                        console.log('✅ OnlyOffice 应用已准备就绪')
                        setOnlyOfficeError(null)
                      },
                      onDocumentReady: () => {
                        console.log('📄 文档已加载完成')
                      },
                      onInfo: (event: any) => {
                        console.log('ℹ️ OnlyOffice 信息:', event)
                      },
                      onWarning: (event: any) => {
                        console.warn('⚠️ OnlyOffice 警告:', event)
                      },
                      onError: (event: any) => {
                        console.error('❌ OnlyOffice 错误:', event)
                        setOnlyOfficeError(`OnlyOffice错误: ${event?.data?.error || JSON.stringify(event)}`)
                      },
                      onRequestSaveAs: (event: any) => {
                        console.log('💾 请求另存为:', event)
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ),
    },
  ]

  return (
    <div style={{ height: '100%' }}>
      <Tabs
        defaultActiveKey="2"
        items={items}
        style={{ padding: '0 16px', height: '100%' }}
        tabBarStyle={{ marginBottom: 0 }}
      />
      
      {/* 远程工具设置模态框 */}
      <Modal
        title="作为远程工具设置"
        open={isRemoteToolModalOpen}
        onOk={handleRemoteToolOk}
        onCancel={handleRemoteToolCancel}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="端口"
            name="port"
            rules={[
              { required: true, message: '请输入端口号' },
              { pattern: /^[1-9]\d*$/, message: '端口号必须是正整数' }
            ]}
          >
            <Input placeholder="请输入端口号，默认为5122" type="number" />
          </Form.Item>

          <Form.Item
            label="工具描述"
            name="description"
            rules={[{ required: true, message: '请输入工具描述' }]}
          >
            <Input.TextArea 
              placeholder="请输入工具描述"
              rows={4}
              showCount
              maxLength={200}
            />
          </Form.Item>
          
          <div style={{ 
            background: '#f6f8fa', 
            border: '1px solid #e1e8ed', 
            borderRadius: '6px', 
            padding: '12px', 
            marginTop: '16px' 
          }}>
            <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.5' }}>
              <strong>说明：</strong>此设置用于配置OnlyOffice控件作为后台Agent工具的调用参数。
              <br />
              • 端口：Agent访问此工具的端口号
              <br />
              • 工具描述：Agent理解和使用此工具的描述信息
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default EditorPanel 