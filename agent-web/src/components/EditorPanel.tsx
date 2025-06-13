import React, { useState, useEffect } from 'react'
import { Tabs, Alert, Button, message } from 'antd'
import { BarChartOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons'

const EditorPanel: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const [iframeError, setIframeError] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [documentReady, setDocumentReady] = useState(false)
  
  // 生成唯一ID和key
  const uniqueId = `editor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Collabora CODE 配置
  const collaboraUrl = 'https://powerai.cc:5102'
  const wopiServerUrl = 'https://powerai.cc:5103'
  
  // 使用 Collabora CODE 的 WOPI 协议
  const createNewDocument = () => {
    const fileId = 'empty.docx'
    const accessToken = 'demo_token'
    const wopiSrc = `${wopiServerUrl}/wopi/files/${fileId}`
    
    // 使用新版本 Collabora CODE 的正确路径
    const url = `${collaboraUrl}/browser/dist/cool.html?` +
      `WOPISrc=${encodeURIComponent(wopiSrc)}&` +
      `access_token=${accessToken}`
    
    console.log('🔗 生成的 WOPI URL (HTTPS):', url)
    console.log('📋 WOPI Source:', wopiSrc)
    console.log('🔑 Access Token:', accessToken)
    
    return url
  }

  const handleIframeError = () => {
    setIframeError(true)
    messageApi.error('Collabora CODE 加载失败')
  }

  const handleReload = () => {
    setIframeError(false)
    setDocumentReady(false)
    setIframeKey(prev => prev + 1)
  }

  const handleIframeLoad = () => {
    setIframeError(false)
    setDocumentReady(true)
    messageApi.success('文档编辑器加载成功')
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
          {iframeError ? (
            <div style={{ 
              padding: '24px', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              background: '#fafafa',
              border: '2px dashed #d9d9d9',
              borderRadius: '8px'
            }}>
              <Alert
                message="Collabora CODE 加载失败"
                description={
                  <div>
                    <p><strong>常见解决方案：</strong></p>
                    <ol>
                      <li>
                        <strong>证书问题：</strong>
                        <br />在新标签页中访问 <a href={collaboraUrl} target="_blank" rel="noopener noreferrer">{collaboraUrl}</a>
                        <br />点击"高级" → "继续访问" 接受自签名证书
                      </li>
                      <li>
                        <strong>WOPI 服务器：</strong>
                        <br />确认 WOPI 服务器正在运行: <a href={`${wopiServerUrl}/health`} target="_blank" rel="noopener noreferrer">{wopiServerUrl}/health</a>
                      </li>
                      <li>
                        <strong>Collabora CODE 服务：</strong>
                        <br />确认 Collabora CODE 服务正在运行
                      </li>
                      <li>
                        <strong>网络问题：</strong>
                        <br />检查防火墙和网络连接
                      </li>
                    </ol>
                  </div>
                }
                type="warning"
                showIcon
                style={{ marginBottom: '16px', maxWidth: '600px' }}
              />
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={handleReload}
              >
                重新加载
              </Button>
            </div>
          ) : (
            <div style={{ height: '100%', position: 'relative' }}>
              {!documentReady && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1000,
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div>正在加载文档编辑器...</div>
                </div>
              )}
              <iframe
                key={iframeKey}
                id={uniqueId}
                src={createNewDocument()}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px'
                }}
                title="Collabora CODE 文档编辑器"
                allow="microphone; camera; geolocation; fullscreen"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-downloads"
                onError={handleIframeError}
                onLoad={handleIframeLoad}
              />
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      {contextHolder}
      <Tabs
        defaultActiveKey="2"
        items={items}
        style={{ padding: '0 16px', height: '100%' }}
        tabBarStyle={{ marginBottom: 0 }}
      />
    </>
  )
}

export default EditorPanel 