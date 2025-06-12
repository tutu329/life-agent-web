import React from 'react'
import { Tabs } from 'antd'
import { BarChartOutlined, FileTextOutlined } from '@ant-design/icons'
import { DocumentEditor } from '@onlyoffice/document-editor-react'

const EditorPanel: React.FC = () => {
  // 生成唯一ID和key
  const uniqueId = `editor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const documentKey = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // 最简化的文档配置
  const documentConfig = {
    width: '100%',
    height: '100%',
    document: {
      fileType: 'docx',
      key: documentKey,
      title: '新建文档.docx',
      url: 'http://powerai.cc:5101/empty.docx'
    },
    editorConfig: {
      mode: 'edit',
      lang: 'zh'
    }
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
        <div style={{ height: 'calc(100vh - 72px)' }}>
          <DocumentEditor
            id={uniqueId}
            documentServerUrl="http://powerai.cc:5102/"
            config={documentConfig}
          />
        </div>
      ),
    },
  ]

  return (
    <Tabs
      defaultActiveKey="2"
      items={items}
      style={{ padding: '0 16px', height: '100%' }}
      tabBarStyle={{ marginBottom: 0 }}
    />
  )
}

export default EditorPanel 