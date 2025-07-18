import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Select, message, Divider, Spin, Tabs } from 'antd'
import { CopyOutlined, ReloadOutlined, BarChartOutlined, CodeOutlined, Html5Outlined, FileTextOutlined } from '@ant-design/icons'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import * as echarts from 'echarts'
import { defaultSampleCode, allSamples, CodeSample } from './visualSamples'

const { Option } = Select

interface VisualAnalysisPanelProps {
  codeString?: string
  onCodeExecute?: (code: string) => void
}

const VisualAnalysisPanel: React.FC<VisualAnalysisPanelProps> = ({
  codeString,
  onCodeExecute
}) => {
  const [currentSample, setCurrentSample] = useState<CodeSample>(defaultSampleCode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSample, setSelectedSample] = useState<string>('multiLine')
  const [activeCodeTab, setActiveCodeTab] = useState<string>('javascript')
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  // 初始化图表
  useEffect(() => {
    if (chartRef.current) {
      // 销毁之前的图表实例
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose()
      }
      
      // 创建新的图表实例
      chartInstanceRef.current = echarts.init(chartRef.current)
      
      // 执行代码
      executeCode(currentSample.javascript)
    }

    // 清理函数
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose()
      }
    }
  }, [])

  // 当代码改变时重新执行
  useEffect(() => {
    if (chartInstanceRef.current) {
      executeCode(currentSample.javascript)
    }
  }, [currentSample])

  // 执行代码
  const executeCode = async (code: string) => {
    if (!chartInstanceRef.current) return

    setLoading(true)
    setError(null)

    try {
      // 清空图表
      chartInstanceRef.current.clear()
      
      // 创建安全的执行环境
      const executeFunction = new Function(
        'chartInstance', 
        'echarts', 
        code
      )
      
      // 执行代码
      await executeFunction(chartInstanceRef.current, echarts)
      
      // 触发回调
      if (onCodeExecute) {
        onCodeExecute(code)
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '代码执行出错'
      setError(errorMessage)
      console.error('代码执行错误:', err)
      messageApi.error(`代码执行失败: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // 复制代码到剪贴板
  const copyCode = async (codeType: string) => {
    try {
      let codeToCopy = ''
      switch (codeType) {
        case 'html':
          codeToCopy = currentSample.html || ''
          break
        case 'css':
          codeToCopy = currentSample.css || ''
          break
        case 'javascript':
          codeToCopy = currentSample.javascript
          break
        default:
          codeToCopy = currentSample.javascript
      }
      
      await navigator.clipboard.writeText(codeToCopy)
      messageApi.success(`${codeType.toUpperCase()} 代码已复制到剪贴板`)
    } catch (err) {
      messageApi.error('复制失败')
    }
  }

  // 重新执行代码
  const reloadChart = () => {
    executeCode(currentSample.javascript)
  }

  // 切换示例
  const handleSampleChange = (value: string) => {
    setSelectedSample(value)
    const sample = allSamples[value as keyof typeof allSamples]
    if (sample) {
      setCurrentSample(sample)
    }
  }

  // 窗口大小变化时调整图表
  useEffect(() => {
    const handleResize = () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 创建代码Tab项
  const createCodeTabs = () => {
    const tabs = []
    
    // JavaScript Tab (必有)
    tabs.push({
      key: 'javascript',
      label: (
        <span>
          <CodeOutlined />
          JavaScript
        </span>
      ),
              children: (
          <div style={{ 
            position: 'relative',
            height: '100%',
            overflow: 'auto'
          }}>
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => copyCode('javascript')}
              size="small"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 10,
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #d9d9d9'
              }}
              title="复制JavaScript代码"
            >
              复制
            </Button>
            <SyntaxHighlighter
              language="javascript"
              style={tomorrow}
              showLineNumbers
              wrapLines
              customStyle={{
                margin: 0,
                fontSize: '12px',
                lineHeight: '1.4',
                background: '#fafafa',
                paddingTop: '40px',
                minHeight: '100%',
                overflow: 'auto'
              }}
            >
              {currentSample.javascript}
            </SyntaxHighlighter>
          </div>
        )
    })

    // HTML Tab (如果有HTML代码)
    if (currentSample.html) {
      tabs.push({
        key: 'html',
        label: (
          <span>
            <Html5Outlined />
            HTML
          </span>
        ),
        children: (
          <div style={{ 
            position: 'relative',
            height: '100%',
            overflow: 'auto'
          }}>
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => copyCode('html')}
              size="small"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 10,
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #d9d9d9'
              }}
              title="复制HTML代码"
            >
              复制
            </Button>
            <SyntaxHighlighter
              language="html"
              style={tomorrow}
              showLineNumbers
              wrapLines
              customStyle={{
                margin: 0,
                fontSize: '12px',
                lineHeight: '1.4',
                background: '#fafafa',
                paddingTop: '40px',
                minHeight: '100%',
                overflow: 'auto'
              }}
            >
              {currentSample.html}
            </SyntaxHighlighter>
          </div>
        )
      })
    }

    // CSS Tab (如果有CSS代码)
    if (currentSample.css) {
      tabs.push({
        key: 'css',
        label: (
          <span>
            <FileTextOutlined />
            CSS
          </span>
        ),
        children: (
          <div style={{ 
            position: 'relative',
            height: '100%',
            overflow: 'auto'
          }}>
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => copyCode('css')}
              size="small"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 10,
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #d9d9d9'
              }}
              title="复制CSS代码"
            >
              复制
            </Button>
            <SyntaxHighlighter
              language="css"
              style={tomorrow}
              showLineNumbers
              wrapLines
              customStyle={{
                margin: 0,
                fontSize: '12px',
                lineHeight: '1.4',
                background: '#fafafa',
                paddingTop: '40px',
                minHeight: '100%',
                overflow: 'auto'
              }}
            >
              {currentSample.css}
            </SyntaxHighlighter>
          </div>
        )
      })
    }

    return tabs
  }

  return (
    <>
      {contextHolder}
      <style>
        {`
          .visual-analysis-tabs .ant-tabs-content-holder {
            flex: 1;
            overflow: auto;
          }
          .visual-analysis-tabs .ant-tabs-tabpane {
            height: 100%;
            overflow: auto;
          }
        `}
      </style>
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        padding: '16px',
        background: '#fafafa'
      }}>
        
        {/* 工具栏 */}
        <div style={{ 
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChartOutlined style={{ fontSize: '16px', color: '#1677ff' }} />
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>可视化分析</span>
            <Select
              value={selectedSample}
              onChange={handleSampleChange}
              style={{ width: 120 }}
              size="small"
            >
              {Object.entries(allSamples).map(([key, sample]) => (
                <Option key={key} value={key}>{sample.name}</Option>
              ))}
            </Select>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={reloadChart}
              size="small"
              title="重新执行代码"
            >
              刷新
            </Button>
          </div>
        </div>

        {/* 渲染区域 */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>图表渲染区</span>
              {currentSample.description && (
                <span style={{ 
                  fontSize: '12px', 
                  color: '#666',
                  fontWeight: 'normal'
                }}>
                  - {currentSample.description}
                </span>
              )}
            </div>
          }
          size="small"
          style={{ 
            flex: '1 1 60%',
            marginBottom: '16px',
            minHeight: '300px'
          }}
          bodyStyle={{ 
            padding: '12px',
            height: 'calc(100% - 57px)',
            position: 'relative'
          }}
        >
          <Spin spinning={loading} tip="正在渲染图表...">
            <div
              ref={chartRef}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '250px',
                background: '#fff',
                borderRadius: '6px'
              }}
            />
          </Spin>
          
          {error && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#ff4d4f',
              background: '#fff2f0',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #ffccc7'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>⚠️ 代码执行错误</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{error}</div>
            </div>
          )}
        </Card>

        {/* 代码显示区域 */}
        <Card
          title="代码查看器"
          size="small"
          style={{ 
            flex: '1 1 40%',
            maxHeight: '400px',
            display: 'flex',
            flexDirection: 'column'
          }}
          bodyStyle={{ 
            padding: '0',
            height: 'calc(100% - 57px)',
            overflow: 'hidden',
            flex: 1
          }}
        >
          <Tabs
            activeKey={activeCodeTab}
            onChange={setActiveCodeTab}
            items={createCodeTabs()}
            size="small"
            className="visual-analysis-tabs"
            style={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            tabBarStyle={{ 
              margin: '0 16px',
              paddingTop: '8px',
              flex: 'none'
            }}
          />
        </Card>
      </div>
    </>
  )
}

export default VisualAnalysisPanel 