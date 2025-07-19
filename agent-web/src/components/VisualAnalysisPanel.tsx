import React, { useState } from 'react'
import { Tabs, message } from 'antd'
import { FileTextOutlined, PlayCircleOutlined } from '@ant-design/icons'
import type { TabsProps } from 'antd'
import { 
  VisualAnalysisPanelProps, 
  ContentBlock, 
  RenderableCode 
} from './visual/types'
import AnalysisView from './visual/AnalysisView'
import RenderView from './visual/RenderView'

const VisualAnalysisPanel: React.FC<VisualAnalysisPanelProps> = ({
  contentBlocks = [],
  onContentUpdate,
  onCodeRender,
  className,
  style
}) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<string>('analysis')
  const [currentRenderCode, setCurrentRenderCode] = useState<RenderableCode | undefined>()
  const [renderLoading, setRenderLoading] = useState(false)
  const [renderError, setRenderError] = useState<string | undefined>()
  const [messageApi, contextHolder] = message.useMessage()

  // 处理从分析页面接收到的渲染请求
  const handleRenderCode = async (blockId: string, code: RenderableCode) => {
    try {
      setRenderLoading(true)
      setRenderError(undefined)
      
      setCurrentRenderCode(code)
      setActiveTab('render')
      
      if (onCodeRender) {
        onCodeRender(code)
      }
      
      messageApi.success('代码已发送到渲染页面')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '渲染失败'
      setRenderError(errorMessage)
      messageApi.error(`渲染失败: ${errorMessage}`)
    } finally {
      setRenderLoading(false)
    }
  }

  // 处理代码复制
  const handleCopyCode = async (blockId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      messageApi.success('代码已复制到剪贴板')
    } catch (error) {
      messageApi.error('复制失败，请手动复制')
    }
  }

  // 处理渲染页面的错误
  const handleRenderError = (error: string) => {
    setRenderError(error)
    messageApi.error(`渲染错误: ${error}`)
  }

  // 处理渲染页面加载完成
  const handleRenderLoad = () => {
    setRenderLoading(false)
    setRenderError(undefined)
  }

  // 创建示例数据（开发阶段使用）
  const getSampleContentBlocks = (): ContentBlock[] => {
    if (contentBlocks.length > 0) {
      return contentBlocks
    }

    return [
      {
        id: 'sample-text-1',
        type: 'text',
        content: '欢迎使用可视化分析功能！这里可以显示来自后台的文字内容和代码块。下面是一些示例代码：',
        timestamp: Date.now()
      },
      {
        id: 'sample-code-1',
        type: 'code',
        language: 'javascript',
        content: `// 创建一个简单的3D立方体
const container = document.getElementById('main');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const cube = new THREE.Mesh(geometry, material);

scene.add(cube);
camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}

animate();`,
        timestamp: Date.now(),
        metadata: {
          title: 'Three.js 旋转立方体',
          description: '使用Three.js创建一个旋转的绿色立方体'
        }
      },
      {
        id: 'sample-text-2',
        type: 'text',
        content: '上面的代码展示了如何使用Three.js创建3D图形。您可以点击代码块右上角的"渲染"按钮在右侧标签页中查看效果。',
        timestamp: Date.now()
      },
      {
        id: 'sample-code-2',
        type: 'code',
        language: 'html',
        content: `<div id="chart" style="width: 100%; height: 400px;"></div>
    
<script>
    const chart = echarts.init(document.getElementById('chart'));
    
    const option = {
        title: { text: '销售数据分析' },
        tooltip: { trigger: 'axis' },
        legend: { data: ['销售额', '利润'] },
        xAxis: {
            type: 'category',
            data: ['1月', '2月', '3月', '4月', '5月', '6月']
        },
        yAxis: { type: 'value' },
        series: [
            {
                name: '销售额',
                type: 'line',
                data: [120, 132, 101, 134, 90, 230]
            },
            {
                name: '利润',
                type: 'bar',
                data: [20, 32, 21, 34, 30, 80]
            }
        ]
    };
    
    chart.setOption(option);
</script>`,
        timestamp: Date.now(),
        metadata: {
          title: 'ECharts 混合图表',
          description: '展示销售数据的折线图和柱状图组合'
        }
      }
    ]
  }

  const tabItems: TabsProps['items'] = [
    {
      key: 'analysis',
      label: (
        <span>
          <FileTextOutlined />
          分析与代码
        </span>
      ),
      children: (
        <AnalysisView
          contentBlocks={getSampleContentBlocks()}
          onRenderCode={handleRenderCode}
          onCopyCode={handleCopyCode}
        />
      )
    },
    {
      key: 'render',
      label: (
        <span>
          <PlayCircleOutlined />
          渲染与交互
        </span>
      ),
      children: (
        <RenderView
          code={currentRenderCode}
          loading={renderLoading}
          error={renderError}
          onError={handleRenderError}
          onLoad={handleRenderLoad}
        />
      )
    }
  ]

  return (
    <>
      {contextHolder}
      <style>
        {`
          .visual-analysis-container {
            height: 100%;
            display: flex;
            flex-direction: column;
            background: #fafafa;
          }
          .visual-analysis-tabs .ant-tabs-nav {
            margin: 0 16px !important;
            padding-top: 8px;
            background: #fafafa;
          }
          .visual-analysis-tabs .ant-tabs-content-holder {
            flex: 1;
            overflow: hidden; /* Important: parent must hide overflow */
            margin: 0 16px 16px;
            border: 1px solid #f0f0f0;
            border-top: none;
            border-radius: 0 0 8px 8px;
            background: #fff;
          }
          .visual-analysis-tabs .ant-tabs-tabpane {
            height: 100%;
            overflow-y: auto; /* Child pane handles scrolling */
            padding: 16px;
          }
        `}
      </style>
      <div 
        className={`visual-analysis-container ${className || ''}`}
        style={style}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="small"
          className="visual-analysis-tabs"
          style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
          tabBarStyle={{ flex: 'none' }}
        />
      </div>
    </>
  )
}

export default VisualAnalysisPanel 