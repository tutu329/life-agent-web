import React from 'react'
import { Empty } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { AnalysisViewProps } from './types'
import CodeBlock from './CodeBlock'

const AnalysisView: React.FC<AnalysisViewProps> = ({
  contentBlocks,
  onRenderCode,
  onCopyCode,
  className,
  style
}) => {
  // 如果没有内容块，显示空状态
  if (!contentBlocks || contentBlocks.length === 0) {
    return (
      <div 
        className={className}
        style={{
          height: '100%',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
      >
        <Empty
          image={<FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
          description="暂无内容"
        />
      </div>
    )
  }

  return (
    <div 
      className={className}
      style={{
        height: '100%',
        overflow: 'auto',
        padding: '16px',
        background: '#fff',
        ...style
      }}
    >
      {contentBlocks.map((block) => {
        if (block.type === 'text') {
          return (
            <div
              key={block.id}
              style={{
                marginBottom: '16px',
                lineHeight: '1.6',
                fontSize: '14px',
                color: '#333',
                whiteSpace: 'pre-wrap'
              }}
            >
              {block.content}
            </div>
          )
        } else if (block.type === 'code') {
          return (
            <CodeBlock
              key={block.id}
              id={block.id}
              content={block.content}
              language={block.language || 'javascript'}
              title={block.metadata?.title}
              showRenderButton={
                block.language === 'javascript' || 
                block.language === 'html' || 
                block.language === 'css'
              }
              onRender={onRenderCode ? (code: import('./types').RenderableCode) => onRenderCode(block.id, code) : undefined}
              onCopy={onCopyCode ? (content: string) => onCopyCode(block.id, content) : undefined}
              style={{ marginBottom: '16px' }}
            />
          )
        }
        return null
      })}
    </div>
  )
}

export default AnalysisView 