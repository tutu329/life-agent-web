import React, { useState, useRef, useEffect } from 'react'
import { Tree, Typography, Upload, Button, message, Popconfirm } from 'antd'
import { FolderOutlined, FileOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import type { TreeDataNode } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { fileService, type FileInfo } from '../services/fileService'
import { useFileSelection } from '../App'

const { Title } = Typography
const { Dragger } = Upload

interface FileItem {
  key: string
  title: string
  type: 'template' | 'shared'
  originalName: string
  size: number
  uploadTime: Date
  serverInfo?: FileInfo // 添加服务器文件信息
}

// 支持的文件类型
const SUPPORTED_FILE_TYPES = ['.docx', '.doc', '.xls', '.xlsx', '.pdf', '.txt', '.md']
const SUPPORTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/pdf', // .pdf
  'text/plain', // .txt
  'text/markdown', // .md
]

const ResourcePanel: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([])
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['template', 'shared'])
  const [uploadingForType, setUploadingForType] = useState<'template' | 'shared' | null>(null)
  const [loading, setLoading] = useState(false)
  const uploadRef = useRef<any>(null)
  
  // 使用文件选择上下文
  const { setSelectedTemplateFile, setSelectedSharedFile } = useFileSelection()

  // 从服务器加载文件列表
  useEffect(() => {
    loadFilesFromServer()
  }, [])

  const loadFilesFromServer = async () => {
    setLoading(true)
    try {
      console.log('🔄 开始从服务器加载文件列表...')
      
      const [templateFiles, sharedFiles] = await Promise.all([
        fileService.getFileList('template'),
        fileService.getFileList('shared')
      ])

      console.log('📋 模板文件:', templateFiles)
      console.log('📋 共享文件:', sharedFiles)

      const allFiles: FileItem[] = [
        ...templateFiles.map(file => ({
          key: `template_${file.name}`,
          title: file.name,
          type: 'template' as const,
          originalName: file.name,
          size: file.size,
          uploadTime: new Date(file.uploadTime),
          serverInfo: file
        })),
        ...sharedFiles.map(file => ({
          key: `shared_${file.name}`,
          title: file.name,
          type: 'shared' as const,
          originalName: file.name,
          size: file.size,
          uploadTime: new Date(file.uploadTime),
          serverInfo: file
        }))
      ]

      console.log('📁 处理后的文件列表:', allFiles)
      setUploadedFiles(allFiles)
      
      if (allFiles.length > 0) {
        message.success(`成功加载 ${allFiles.length} 个文件`)
      } else {
        message.info('暂无上传的文件')
      }
    } catch (error) {
      console.error('❌ 加载文件列表失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error({
        content: `加载文件列表失败: ${errorMessage}`,
        duration: 10,
        onClick: () => {
          // 点击错误消息可以重试
          loadFilesFromServer()
        }
      })
      // 设置空列表，避免显示旧数据
      setUploadedFiles([])
    } finally {
      setLoading(false)
    }
  }

  // 生成树数据
  const generateTreeData = (): TreeDataNode[] => {
    const templateFiles = uploadedFiles.filter(file => file.type === 'template')
    const sharedFiles = uploadedFiles.filter(file => file.type === 'shared')

    return [
      {
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>模板文件</span>
            <Button 
              type="text" 
              size="small" 
              icon={<UploadOutlined />}
              style={{ fontSize: '10px', height: '20px', padding: '0 4px' }}
              onClick={(e) => {
                e.stopPropagation()
                handleUploadClick('template')
              }}
              title="上传模板文件"
            />
          </div>
        ),
        key: 'template',
        icon: <FolderOutlined />,
        children: templateFiles.map(file => ({
          title: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.title}
              </span>
              <Popconfirm
                title="确定要删除这个文件吗？"
                onConfirm={(e) => {
                  e?.stopPropagation()
                  handleDeleteFile(file.key)
                }}
                okText="确定"
                cancelText="取消"
              >
                <Button 
                  type="text" 
                  size="small" 
                  icon={<DeleteOutlined />}
                  style={{ fontSize: '10px', height: '16px', padding: '0 2px', marginLeft: '4px' }}
                  onClick={(e) => e.stopPropagation()}
                  title="删除文件"
                />
              </Popconfirm>
            </div>
          ),
          key: file.key,
          icon: <FileOutlined />,
          isLeaf: true,
        })),
      },
      {
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>共享文件</span>
            <Button 
              type="text" 
              size="small" 
              icon={<UploadOutlined />}
              style={{ fontSize: '10px', height: '20px', padding: '0 4px' }}
              onClick={(e) => {
                e.stopPropagation()
                handleUploadClick('shared')
              }}
              title="上传共享文件"
            />
          </div>
        ),
        key: 'shared',
        icon: <FolderOutlined />,
        children: sharedFiles.map(file => ({
          title: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.title}
              </span>
              <Popconfirm
                title="确定要删除这个文件吗？"
                onConfirm={(e) => {
                  e?.stopPropagation()
                  handleDeleteFile(file.key)
                }}
                okText="确定"
                cancelText="取消"
              >
                <Button 
                  type="text" 
                  size="small" 
                  icon={<DeleteOutlined />}
                  style={{ fontSize: '10px', height: '16px', padding: '0 2px', marginLeft: '4px' }}
                  onClick={(e) => e.stopPropagation()}
                  title="删除文件"
                />
              </Popconfirm>
            </div>
          ),
          key: file.key,
          icon: <FileOutlined />,
          isLeaf: true,
        })),
      },
    ]
  }

  // 检查文件类型
  const checkFileType = (file: File): boolean => {
    const fileName = file.name.toLowerCase()
    const fileExtension = '.' + fileName.split('.').pop()
    return SUPPORTED_FILE_TYPES.includes(fileExtension) || SUPPORTED_MIME_TYPES.includes(file.type)
  }

  // 处理文件上传
  const handleFileUpload = async (file: File, type: 'template' | 'shared'): Promise<boolean> => {
    if (!checkFileType(file)) {
      message.error(`不支持的文件类型。支持的格式：${SUPPORTED_FILE_TYPES.join(', ')}`)
      return false
    }

    try {
      message.loading({ content: `正在上传 "${file.name}"...`, key: 'upload' })
      
      const result = await fileService.uploadFile(file, type)
      
      if (result.success && result.file) {
        const newFile: FileItem = {
          key: `${type}_${result.file.name}`,
          title: result.file.name,
          type: type,
          originalName: result.file.name,
          size: result.file.size,
          uploadTime: new Date(result.file.uploadTime),
          serverInfo: result.file
        }

        setUploadedFiles(prevFiles => [...prevFiles, newFile])
        message.success({ content: `文件 "${file.name}" 上传成功`, key: 'upload' })
        
        // 自动展开对应的文件夹
        if (!expandedKeys.includes(type)) {
          setExpandedKeys(prev => [...prev, type])
        }
      } else {
        message.error({ content: `上传失败: ${result.error}`, key: 'upload' })
      }
    } catch (error) {
      console.error('Upload failed:', error)
      message.error({ content: '上传失败', key: 'upload' })
    }

    return false // 阻止默认上传行为
  }

  // 处理点击上传按钮
  const handleUploadClick = (type: 'template' | 'shared') => {
    setUploadingForType(type)
    // 创建文件输入元素
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = SUPPORTED_FILE_TYPES.join(',')
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        const uploadPromises = Array.from(files).map(file => 
          handleFileUpload(file, type)
        )
        await Promise.all(uploadPromises)
      }
      setUploadingForType(null)
    }
    input.click()
  }

  // 处理树节点选择
  const onSelect = (selectedKeys: React.Key[], info: any) => {
    // 只允许选择文件节点，不允许选择文件夹节点
    if (info.node.isLeaf) {
      setSelectedKeys(selectedKeys)
      console.log('selected file:', selectedKeys, info)
      
      // 找到选中的文件信息
      const selectedFile = uploadedFiles.find(file => file.key === selectedKeys[0])
      if (selectedFile && selectedFile.serverInfo) {
        console.log('Selected file info:', selectedFile)
        // 生成文件下载URL
        const downloadUrl = fileService.getFileUrl(selectedFile.type, selectedFile.serverInfo.name)
        console.log('File download URL:', downloadUrl)
        
        // 更新全局状态
        if (selectedFile.type === 'template') {
          setSelectedTemplateFile(selectedFile.serverInfo.name)
          setSelectedSharedFile('') // 清空共享文件选择
        } else if (selectedFile.type === 'shared') {
          setSelectedSharedFile(selectedFile.serverInfo.name)
          setSelectedTemplateFile('') // 清空模板文件选择
        }
      }
    } else {
      // 如果点击的是文件夹，清除选择
      setSelectedKeys([])
      // 清空文件选择
      setSelectedTemplateFile('')
      setSelectedSharedFile('')
    }
  }

  // 处理树节点展开/收起
  const onExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys)
  }

  // 删除文件
  const handleDeleteFile = async (fileKey: string) => {
    const file = uploadedFiles.find(f => f.key === fileKey)
    if (!file || !file.serverInfo) {
      message.error('文件信息不完整，无法删除')
      return
    }

    try {
      message.loading({ content: `正在删除 "${file.title}"...`, key: 'delete' })
      
      const success = await fileService.deleteFile(file.type, file.serverInfo.name)
      
      if (success) {
        setUploadedFiles(prevFiles => prevFiles.filter(f => f.key !== fileKey))
        setSelectedKeys(prevKeys => prevKeys.filter(key => key !== fileKey))
        message.success({ content: '文件已删除', key: 'delete' })
      } else {
        message.error({ content: '删除失败', key: 'delete' })
      }
    } catch (error) {
      console.error('Delete failed:', error)
      message.error({ content: '删除失败', key: 'delete' })
    }
  }

  // 拖拽上传的props
  const getDropProps = (type: 'template' | 'shared') => ({
    name: 'file',
    multiple: true,
    accept: SUPPORTED_FILE_TYPES.join(','),
    beforeUpload: async (file: UploadFile) => {
      const originFile = file.originFileObj || (file as unknown as File)
      await handleFileUpload(originFile, type)
      return false // 阻止默认上传行为
    },
    onDrop(e: React.DragEvent<HTMLDivElement>) {
      console.log('Dropped files', e.dataTransfer.files)
    },
    showUploadList: false,
  })

  return (
    <div style={{ padding: '8px 16px 16px 16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Title level={5} style={{ margin: 0, color: '#2c3e50', fontSize: '12px' }}>
          资源
        </Title>
        <Button 
          type="text" 
          size="small" 
          loading={loading}
          onClick={loadFilesFromServer}
          style={{ fontSize: '10px', height: '20px', padding: '0 4px' }}
          title="刷新文件列表"
        >
          🔄
        </Button>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Tree
          showIcon
          selectedKeys={selectedKeys}
          expandedKeys={expandedKeys}
          treeData={generateTreeData()}
          onSelect={onSelect}
          onExpand={onExpand}
          style={{
            background: 'transparent',
          }}
        />
      </div>

      {/* 拖拽上传区域 */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ marginBottom: '8px' }}>
          <Dragger
            {...getDropProps('template')}
            style={{ 
              padding: '8px', 
              border: '1px dashed #d9d9d9',
              background: '#fafafa'
            }}
          >
            <div style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
              <UploadOutlined style={{ fontSize: '14px', marginRight: '4px' }} />
              拖拽到此处上传到模板文件
            </div>
          </Dragger>
        </div>
        
        <div>
          <Dragger
            {...getDropProps('shared')}
            style={{ 
              padding: '8px', 
              border: '1px dashed #d9d9d9',
              background: '#fafafa'
            }}
          >
            <div style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
              <UploadOutlined style={{ fontSize: '14px', marginRight: '4px' }} />
              拖拽到此处上传到共享文件
            </div>
          </Dragger>
        </div>
      </div>

      {/* 支持格式提示 */}
      <div style={{ 
        marginTop: '8px', 
        padding: '4px', 
        textAlign: 'center',
        fontSize: '10px',
        color: '#999',
        background: '#f9f9f9',
        borderRadius: '4px'
      }}>
        支持：{SUPPORTED_FILE_TYPES.join(', ')}
      </div>
    </div>
  )
}

export default ResourcePanel 