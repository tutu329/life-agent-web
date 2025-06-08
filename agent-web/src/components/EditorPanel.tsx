import React from 'react'
import { Tabs } from 'antd'
import { BarChartOutlined, FileTextOutlined } from '@ant-design/icons'

const EditorPanel: React.FC = () => {
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
            <FileTextOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <h2 style={{ color: '#1677ff', marginBottom: '8px' }}>报告编制功能区</h2>
            <p>功能开发中，敬请期待...</p>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div style={{ height: '100%' }}>
      <Tabs
        defaultActiveKey="1"
        items={items}
        style={{ padding: '0 16px', height: '100%' }}
        tabBarStyle={{ marginBottom: 0 }}
      />
    </div>
  )
}

export default EditorPanel 