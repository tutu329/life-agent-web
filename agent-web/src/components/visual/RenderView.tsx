import React, { useEffect, useRef, useState } from 'react'
import { Empty, Spin, Alert } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import { RenderViewProps, PREDEFINED_LIBRARIES } from './types'

const RenderView: React.FC<RenderViewProps> = ({
  code,
  loading = false,
  error,
  onError,
  onLoad,
  className,
  style
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isIframeLoading, setIsIframeLoading] = useState(false)

  // 生成完整的HTML文档
  const generateHTML = (codeToRender: RenderViewProps['code']): string => {
    if (!codeToRender) return ''

    const { html = '', css = '', javascript = '', libraries = [] } = codeToRender

    // 生成外部库的script标签
    const libraryScripts = libraries
      .map((libName: string) => {
        const lib = PREDEFINED_LIBRARIES.find(l => l.name === libName)
        return lib ? `<script src="${lib.cdnUrl}"></script>` : ''
      })
      .filter(Boolean)
      .join('\n    ')

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${codeToRender.title || '渲染结果'}</title>
    <style>
        body {
            margin: 0;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fff;
        }
        * {
            box-sizing: border-box;
        }
        ${css}
    </style>
    ${libraryScripts}
</head>
<body>
    ${html}
    
    <script>
        try {
            ${javascript}
        } catch (error) {
            console.error('代码执行错误:', error);
            document.body.innerHTML = 
                '<div style="color: #ff4d4f; padding: 20px; border: 1px solid #ffccc7; background: #fff2f0; border-radius: 6px; margin: 20px;">' +
                '<h3>🔥 代码执行错误</h3>' +
                '<p>' + error.message + '</p>' +
                '</div>';
        }
    </script>
</body>
</html>`
  }

  // 当代码变化时更新iframe
  useEffect(() => {
    if (!code || !iframeRef.current) return

    try {
      setIsIframeLoading(true)
      const htmlContent = generateHTML(code)
      iframeRef.current.srcdoc = htmlContent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '渲染失败'
      if (onError) {
        onError(errorMessage)
      }
    }
  }, [code, onError])

  // iframe加载事件处理
  const handleIframeLoad = () => {
    setIsIframeLoading(false)
    if (onLoad) {
      onLoad()
    }
  }

  const handleIframeError = () => {
    setIsIframeLoading(false)
    const errorMessage = 'iframe加载失败'
    if (onError) {
      onError(errorMessage)
    }
  }

  // 如果没有代码，显示空状态
  if (!code) {
    return (
      <div 
        className={className}
        style={{
          height: '100%',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fafafa',
          ...style
        }}
      >
        <Empty
          image={<PlayCircleOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
          description={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无可渲染内容</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                请在"分析与代码"页面点击代码块的"渲染"按钮
              </div>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div 
      className={className}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        ...style
      }}
    >
      {/* 样式修复：确保Spin容器撑满高度 */}
      <style>{`
        .render-view-spin-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .render-view-spin-wrapper .ant-spin-container {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .render-view-spin-wrapper .ant-spin-container > div {
          flex: 1;
        }
      `}</style>
      
      {/* 错误提示 */}
      {error && (
        <Alert
          type="error"
          message="渲染错误"
          description={error}
          showIcon
          closable
          style={{ margin: '16px' }}
        />
      )}

      {/* 加载状态 */}
      <Spin 
        spinning={loading || isIframeLoading} 
        tip="正在渲染代码..."
        wrapperClassName="render-view-spin-wrapper"
      >
        <iframe
          ref={iframeRef}
          title="代码渲染结果"
          sandbox="allow-scripts allow-same-origin"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#fff'
          }}
        />
      </Spin>
    </div>
  )
}

export default RenderView 