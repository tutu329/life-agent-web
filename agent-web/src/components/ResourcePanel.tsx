import React from 'react'
import { Tree, Typography } from 'antd'
import { FolderOutlined, FileOutlined } from '@ant-design/icons'
import type { TreeDataNode } from 'antd'

const { Title } = Typography

const treeData: TreeDataNode[] = [
  {
    title: 'Project A',
    key: '0-0',
    icon: <FolderOutlined />,
    children: [
      {
        title: 'data.csv',
        key: '0-0-0',
        icon: <FileOutlined />,
        isLeaf: true,
      },
      {
        title: 'report.docx',
        key: '0-0-1',
        icon: <FileOutlined />,
        isLeaf: true,
      },
    ],
  },
  {
    title: 'Shared Files',
    key: '0-1',
    icon: <FolderOutlined />,
    children: [
      {
        title: 'image.png',
        key: '0-1-0',
        icon: <FileOutlined />,
        isLeaf: true,
      },
    ],
  },
]

const ResourcePanel: React.FC = () => {
  const onSelect = (selectedKeys: React.Key[], info: any) => {
    console.log('selected', selectedKeys, info)
  }

  return (
    <div style={{ padding: '8px 16px 16px 16px', height: '100%' }}>
      <Title level={5} style={{ marginBottom: '16px', color: '#2c3e50', fontSize: '12px', marginTop: '0' }}>
        资源
      </Title>
      <Tree
        showIcon
        defaultExpandAll
        defaultSelectedKeys={['0-0-0']}
        treeData={treeData}
        onSelect={onSelect}
        style={{
          background: 'transparent',
        }}
      />
    </div>
  )
}

export default ResourcePanel 