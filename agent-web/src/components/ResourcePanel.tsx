import React, { useState, useRef } from 'react'
import { Tree, Typography, Upload, Button, message, Popconfirm } from 'antd'
import { FolderOutlined, FileOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import type { TreeDataNode } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'

const { Title } = Typography
const { Dragger } = Upload

interface FileItem {
  key: string
  title: string
  type: 'template' | 'shared'
  originalName: string
  size: number
  uploadTime: Date
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
  const uploadRef = useRef<any>(null)

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
  const handleFileUpload = (file: File, type: 'template' | 'shared'): boolean => {
    if (!checkFileType(file)) {
      message.error(`不支持的文件类型。支持的格式：${SUPPORTED_FILE_TYPES.join(', ')}`)
      return false
    }

    const fileKey = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newFile: FileItem = {
      key: fileKey,
      title: file.name,
      type: type,
      originalName: file.name,
      size: file.size,
      uploadTime: new Date(),
    }

    setUploadedFiles(prevFiles => [...prevFiles, newFile])
    message.success(`文件 "${file.name}" 上传成功`)
    
    // 自动展开对应的文件夹
    if (!expandedKeys.includes(type)) {
      setExpandedKeys(prev => [...prev, type])
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
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        Array.from(files).forEach(file => {
          handleFileUpload(file, type)
        })
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
      if (selectedFile) {
        console.log('Selected file info:', selectedFile)
        // 这里可以触发回调或者更新全局状态，供其他组件使用
      }
    } else {
      // 如果点击的是文件夹，清除选择
      setSelectedKeys([])
    }
  }

  // 处理树节点展开/收起
  const onExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys)
  }

  // 删除文件
  const handleDeleteFile = (fileKey: string) => {
    setUploadedFiles(prevFiles => prevFiles.filter(file => file.key !== fileKey))
    setSelectedKeys(prevKeys => prevKeys.filter(key => key !== fileKey))
    message.success('文件已删除')
  }

  // 拖拽上传的props
  const getDropProps = (type: 'template' | 'shared') => ({
    name: 'file',
    multiple: true,
    accept: SUPPORTED_FILE_TYPES.join(','),
    beforeUpload: (file: UploadFile) => {
      const originFile = file.originFileObj || (file as unknown as File)
      return handleFileUpload(originFile, type)
    },
    onDrop(e: React.DragEvent<HTMLDivElement>) {
      console.log('Dropped files', e.dataTransfer.files)
    },
    showUploadList: false,
  })

  return (
    <div style={{ padding: '8px 16px 16px 16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={5} style={{ marginBottom: '16px', color: '#2c3e50', fontSize: '12px', marginTop: '0' }}>
        资源
      </Title>
      
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