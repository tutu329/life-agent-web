import React, { useRef, useEffect, useState } from 'react'
import { Upload, Button, message, Card, Space } from 'antd'
import { InboxOutlined, FileAddOutlined, EyeOutlined } from '@ant-design/icons'
import type { RcFile } from 'antd/es/upload/interface'

const { Dragger } = Upload

interface CADViewerProps {}

const CADViewer: React.FC<CADViewerProps> = () => {
  const viewerContainerRef = useRef<HTMLDivElement>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const [loading, setLoading] = useState(false)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [viewer, setViewer] = useState<any>(null)

  // 初始化查看器
  const initViewer = async () => {
    try {
      // 动态导入dxf-viewer（避免SSR问题）
      const { DxfViewer } = await import('dxf-viewer')
      
      if (viewerContainerRef.current) {
        const viewerOptions = {
          canvasWidth: viewerContainerRef.current.clientWidth,
          canvasHeight: viewerContainerRef.current.clientHeight,
          autoResize: true,
          antialias: true,
          clearColor: new (await import('three')).Color('#f0f0f0'),
          clearAlpha: 1
        }
        
        const newViewer = new DxfViewer(viewerContainerRef.current, viewerOptions)
        setViewer(newViewer)
        console.log('🎯 CAD查看器初始化成功')
      }
    } catch (error) {
      console.error('❌ CAD查看器初始化失败:', error)
      messageApi.error('CAD查看器初始化失败')
    }
  }

  // 加载DXF文件
  const loadDXFFile = async (file: RcFile) => {
    if (!viewer) {
      messageApi.error('查看器未初始化')
      return
    }

    setLoading(true)
    
    try {
      // 创建文件URL
      const fileUrl = URL.createObjectURL(file)
      
      const loadParams = {
        url: fileUrl,
        fonts: null,
        progressCbk: (phase: string, processedSize: number, totalSize: number) => {
          const progress = (processedSize * 100) / totalSize
          console.log(`📊 ${phase} 进度: ${progress.toFixed(2)}%`)
        },
        workerFactory: null
      }

      // 加载DXF文件
      await viewer.Load(loadParams)
      
      // 适应视图
      const bounds = viewer.GetBounds()
      if (bounds) {
        viewer.FitView(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, 0.1)
      }
      
      setCurrentFile(file.name)
      messageApi.success(`成功加载文件: ${file.name}`)
      
      // 清理URL
      URL.revokeObjectURL(fileUrl)
      
    } catch (error) {
      console.error('❌ 加载DXF文件失败:', error)
      messageApi.error('加载DXF文件失败，请检查文件格式')
    } finally {
      setLoading(false)
    }
  }

  // 文件上传配置
  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.dxf,.dwg',
    beforeUpload: (file: RcFile) => {
      const isDXF = file.name.toLowerCase().endsWith('.dxf')
      const isDWG = file.name.toLowerCase().endsWith('.dwg')
      
      if (!isDXF && !isDWG) {
        messageApi.error('只支持DXF和DWG文件格式')
        return false
      }

      if (isDWG) {
        messageApi.warning('检测到DWG文件，建议先转换为DXF格式以获得最佳效果')
      }

      loadDXFFile(file)
      return false // 阻止默认上传行为
    },
    onDrop(e: React.DragEvent<HTMLDivElement>) {
      console.log('📁 拖放文件:', e.dataTransfer.files)
    },
  }

  // 清除当前文件
  const clearViewer = () => {
    if (viewer) {
      try {
        viewer.Clear()
        setCurrentFile(null)
        messageApi.success('已清除当前图纸')
      } catch (error) {
        console.error('❌ 清除查看器失败:', error)
      }
    }
  }

  // 组件挂载时初始化查看器
  useEffect(() => {
    // 设置一个唯一的容器ID
    if (viewerContainerRef.current) {
      viewerContainerRef.current.id = `cad-viewer-${Date.now()}`
    }
    
    // 延迟初始化，确保DOM已就绪
    const timer = setTimeout(initViewer, 100)
    
    return () => {
      clearTimeout(timer)
      if (viewer) {
        try {
          viewer.destroy?.()
        } catch (error) {
          console.error('❌ 销毁查看器失败:', error)
        }
      }
    }
  }, [])

  return (
    <>
      {contextHolder}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 工具栏 */}
        <Card size="small" style={{ marginBottom: '8px' }}>
          <Space>
            <Button 
              type="primary" 
              icon={<FileAddOutlined />}
              onClick={() => {
                const input = document.querySelector('.ant-upload input') as HTMLInputElement
                input?.click()
              }}
              loading={loading}
            >
              选择CAD文件
            </Button>
            
            {currentFile && (
              <>
                <span style={{ color: '#666' }}>
                  <EyeOutlined /> 当前文件: {currentFile}
                </span>
                <Button onClick={clearViewer}>
                  清除
                </Button>
              </>
            )}
          </Space>
        </Card>

        {/* 上传区域和查看器 */}
        <div style={{ flex: 1, position: 'relative' }}>
          {!currentFile && (
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              width: '400px'
            }}>
              <Dragger {...uploadProps} style={{ padding: '40px' }}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">点击或拖拽CAD文件到此区域</p>
                <p className="ant-upload-hint">
                  支持DXF格式文件，DWG文件建议先转换为DXF
                </p>
              </Dragger>
            </div>
          )}

          {/* CAD查看器容器 */}
          <div 
            ref={viewerContainerRef}
            style={{ 
              width: '100%', 
              height: '100%',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              backgroundColor: '#fafafa'
            }}
          />

          {/* 隐藏的上传组件 */}
          <div style={{ display: 'none' }}>
            <Upload {...uploadProps}>
              <Button>隐藏上传</Button>
            </Upload>
          </div>
        </div>
      </div>
    </>
  )
}

export default CADViewer 