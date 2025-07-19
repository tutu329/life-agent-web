import React, { useState, useRef, useEffect } from 'react'
import { Button, message } from 'antd'
import { CopyOutlined, PlayCircleOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { CodeBlockProps, RenderableCode } from './types'

const CodeBlock: React.FC<CodeBlockProps> = ({
  id,
  content,
  language,
  maxHeight = 200,
  showRenderButton = false,
  showCopyButton = true,
  title,
  onRender,
  onCopy,
  className,
  style
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [needsExpansion, setNeedsExpansion] = useState(false)
  const codeRef = useRef<HTMLDivElement>(null)
  const [messageApi, contextHolder] = message.useMessage()

  // 检查是否需要折叠
  useEffect(() => {
    if (codeRef.current) {
      const height = codeRef.current.scrollHeight
      setNeedsExpansion(height > maxHeight)
    }
  }, [content, maxHeight])

  // 处理复制
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      messageApi.success('代码已复制到剪贴板')
      if (onCopy) {
        onCopy(content)
      }
    } catch (error) {
      messageApi.error('复制失败，请手动复制')
    }
  }

  // 处理渲染
  const handleRender = () => {
    if (!onRender) return

    let renderableCode: RenderableCode = {}

    // 根据语言类型构建可渲染的代码
    switch (language) {
      case 'html':
        renderableCode = {
          html: content,
          title: title || '代码渲染结果'
        }
        break
      case 'css':
        renderableCode = {
          css: content,
          html: '<div>CSS 样式预览</div>',
          title: title || 'CSS 样式预览'
        }
        break
      case 'javascript':
      case 'typescript':
        // 如果JavaScript代码中包含Three.js相关内容，自动添加库依赖
        const libraries: string[] = []
        const lowerContent = content.toLowerCase()
        
        if (lowerContent.includes('three.') || lowerContent.includes('new three')) {
          libraries.push('three.js')
        }
        if (lowerContent.includes('echarts') || lowerContent.includes('chart')) {
          libraries.push('echarts')
        }
        if (lowerContent.includes('d3.') || lowerContent.includes('d3v')) {
          libraries.push('d3')
        }
        if (lowerContent.includes('p5.') || lowerContent.includes('createcanvas')) {
          libraries.push('p5')
        }

        renderableCode = {
          javascript: content,
          html: '<div id="main" style="width: 100%; height: 400px;"></div>',
          libraries,
          title: title || 'JavaScript 代码执行结果'
        }
        break
      default:
        messageApi.warning(`暂不支持渲染 ${language} 语言的代码`)
        return
    }

    onRender(renderableCode)
    messageApi.success('代码已发送到渲染页面')
  }

  // 切换展开/折叠
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded)
  }

  // 获取语言显示名称
  const getLanguageDisplayName = (lang: string): string => {
    const langMap: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      html: 'HTML',
      css: 'CSS',
      cpp: 'C++',
      shell: 'Shell',
      json: 'JSON',
      markdown: 'Markdown',
      sql: 'SQL',
      yaml: 'YAML'
    }
    return langMap[lang] || lang.toUpperCase()
  }

  return (
    <>
      {contextHolder}
      <div 
        className={className}
        style={{
          border: '1px solid #e8e8e8',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#fafafa',
          ...style
        }}
      >
        {/* 代码块头部 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: '#f5f5f5',
          borderBottom: '1px solid #e8e8e8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '12px', 
              color: '#666',
              background: '#e6f7ff',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'monospace'
            }}>
              {getLanguageDisplayName(language)}
            </span>
            {title && (
              <span style={{ 
                fontSize: '12px', 
                color: '#333',
                fontWeight: 'bold'
              }}>
                {title}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {showCopyButton && (
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopy}
                title="复制代码"
              >
                复制
              </Button>
            )}
            
            {showRenderButton && (
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={handleRender}
                title="渲染到交互页"
                style={{ color: '#1677ff' }}
              >
                渲染
              </Button>
            )}

            {needsExpansion && (
              <Button
                type="text"
                size="small"
                icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                onClick={toggleExpansion}
                title={isExpanded ? '折叠代码' : '展开代码'}
              >
                {isExpanded ? '折叠' : '展开'}
              </Button>
            )}
          </div>
        </div>

        {/* 代码内容 */}
        <div 
          ref={codeRef}
          style={{
            maxHeight: needsExpansion && !isExpanded ? `${maxHeight}px` : 'none',
            overflow: needsExpansion && !isExpanded ? 'hidden' : 'auto',
            position: 'relative'
          }}
        >
          <SyntaxHighlighter
            language={language}
            style={tomorrow}
            showLineNumbers
            wrapLines
            customStyle={{
              margin: 0,
              fontSize: '12px',
              lineHeight: '1.4',
              background: '#fafafa'
            }}
          >
            {content}
          </SyntaxHighlighter>

          {/* 渐变遮罩 - 仅在折叠状态显示 */}
          {needsExpansion && !isExpanded && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40px',
              background: 'linear-gradient(transparent, #fafafa)',
              pointerEvents: 'none'
            }} />
          )}
        </div>
      </div>
    </>
  )
}

export default CodeBlock 