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
        content: `// 创建一个可交互的3D地球仪
const container = document.getElementById('main');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

// 渲染器设置
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// 场景背景 - 星空
scene.background = new THREE.Color(0x000011);

// 创建地球几何体
const earthGeometry = new THREE.SphereGeometry(2, 64, 64);

// 创建地球材质
const earthMaterial = new THREE.MeshPhongMaterial({
  map: createEarthTexture(),
  bumpMap: createBumpTexture(),
  bumpScale: 0.1,
  specularMap: createSpecularTexture(),
  shininess: 30
});

const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.castShadow = true;
earth.receiveShadow = true;
scene.add(earth);

// 创建大气层
const atmosphereGeometry = new THREE.SphereGeometry(2.1, 64, 64);
const atmosphereMaterial = new THREE.MeshBasicMaterial({
  color: 0x87CEEB,
  transparent: true,
  opacity: 0.2,
  side: THREE.BackSide
});
const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
scene.add(atmosphere);

// 添加云层
const cloudGeometry = new THREE.SphereGeometry(2.02, 64, 64);
const cloudMaterial = new THREE.MeshLambertMaterial({
  map: createCloudTexture(),
  transparent: true,
  opacity: 0.8
});
const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
scene.add(clouds);

// 添加光源
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(5, 3, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
scene.add(ambientLight);

// 创建星空背景
createStarField();

camera.position.z = 6;

// 渲染参数控制
const controls = {
  earthRotationSpeed: 0.005,
  cloudRotationSpeed: 0.003,
  showClouds: true,
  showAtmosphere: true,
  lightIntensity: 1.0,
  autoRotate: true
};

// 创建控制面板
createControlPanel();

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  
  if (controls.autoRotate) {
    earth.rotation.y += controls.earthRotationSpeed;
    if (controls.showClouds) {
      clouds.rotation.y += controls.cloudRotationSpeed;
    }
  }
  
  renderer.render(scene, camera);
}

// 创建地球纹理
function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // 绘制海洋背景
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制大陆
  const continents = [
    // 亚洲
    { x: 350, y: 80, w: 120, h: 80 },
    // 欧洲
    { x: 280, y: 70, w: 60, h: 50 },
    // 非洲
    { x: 260, y: 100, w: 80, h: 120 },
    // 北美洲
    { x: 80, y: 60, w: 100, h: 100 },
    // 南美洲
    { x: 120, y: 140, w: 60, h: 100 },
    // 澳洲
    { x: 400, y: 180, w: 80, h: 40 }
  ];
  
  ctx.fillStyle = '#22c55e';
  continents.forEach(continent => {
    ctx.fillRect(continent.x, continent.y, continent.w, continent.h);
  });
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 创建凹凸贴图
function createBumpTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // 生成随机噪声作为凹凸效果
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const value = Math.random() * 255;
    imageData.data[i] = value;
    imageData.data[i + 1] = value;
    imageData.data[i + 2] = value;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  
  return new THREE.CanvasTexture(canvas);
}

// 创建高光贴图
function createSpecularTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // 海洋区域高反射，陆地低反射
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#333333';
  const continents = [
    { x: 350, y: 80, w: 120, h: 80 },
    { x: 280, y: 70, w: 60, h: 50 },
    { x: 260, y: 100, w: 80, h: 120 },
    { x: 80, y: 60, w: 100, h: 100 },
    { x: 120, y: 140, w: 60, h: 100 },
    { x: 400, y: 180, w: 80, h: 40 }
  ];
  
  continents.forEach(continent => {
    ctx.fillRect(continent.x, continent.y, continent.w, continent.h);
  });
  
  return new THREE.CanvasTexture(canvas);
}

// 创建云层纹理
function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // 透明背景
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制云朵
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 20 + 10;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  return new THREE.CanvasTexture(canvas);
}

// 创建星空
function createStarField() {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
  
  const starsVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starsVertices.push(x, y, z);
  }
  
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);
}

// 创建控制面板
function createControlPanel() {
  const panel = document.createElement('div');
  panel.style.cssText = \`
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    min-width: 200px;
  \`;
  
  panel.innerHTML = \`
    <h4 style="margin: 0 0 10px 0;">地球仪控制</h4>
    
    <label>地球自转速度:</label>
    <input type="range" id="earthSpeed" min="0" max="0.02" step="0.001" value="0.005" style="width: 100%">
    
    <label>云层速度:</label>
    <input type="range" id="cloudSpeed" min="0" max="0.01" step="0.001" value="0.003" style="width: 100%">
    
    <label>光照强度:</label>
    <input type="range" id="lightIntensity" min="0.1" max="2" step="0.1" value="1" style="width: 100%">
    
    <label><input type="checkbox" id="showClouds" checked> 显示云层</label><br>
    <label><input type="checkbox" id="showAtmosphere" checked> 显示大气层</label><br>
    <label><input type="checkbox" id="autoRotate" checked> 自动旋转</label>
  \`;
  
  container.appendChild(panel);
  
  // 绑定控制事件
  document.getElementById('earthSpeed').addEventListener('input', (e) => {
    controls.earthRotationSpeed = parseFloat(e.target.value);
  });
  
  document.getElementById('cloudSpeed').addEventListener('input', (e) => {
    controls.cloudRotationSpeed = parseFloat(e.target.value);
  });
  
  document.getElementById('lightIntensity').addEventListener('input', (e) => {
    sunLight.intensity = parseFloat(e.target.value);
  });
  
  document.getElementById('showClouds').addEventListener('change', (e) => {
    controls.showClouds = e.target.checked;
    clouds.visible = e.target.checked;
  });
  
  document.getElementById('showAtmosphere').addEventListener('change', (e) => {
    controls.showAtmosphere = e.target.checked;
    atmosphere.visible = e.target.checked;
  });
  
  document.getElementById('autoRotate').addEventListener('change', (e) => {
    controls.autoRotate = e.target.checked;
  });
}

// 鼠标控制
let mouseDown = false;
let mouseX = 0;
let mouseY = 0;

container.addEventListener('mousedown', (event) => {
  mouseDown = true;
  mouseX = event.clientX;
  mouseY = event.clientY;
});

container.addEventListener('mouseup', () => {
  mouseDown = false;
});

container.addEventListener('mousemove', (event) => {
  if (!mouseDown) return;
  
  const deltaX = event.clientX - mouseX;
  const deltaY = event.clientY - mouseY;
  
  earth.rotation.y += deltaX * 0.01;
  earth.rotation.x += deltaY * 0.01;
  clouds.rotation.y += deltaX * 0.01;
  clouds.rotation.x += deltaY * 0.01;
  
  mouseX = event.clientX;
  mouseY = event.clientY;
});

// 缩放控制
container.addEventListener('wheel', (event) => {
  camera.position.z += event.deltaY * 0.01;
  camera.position.z = Math.max(3, Math.min(10, camera.position.z));
});

// 窗口大小调整
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

animate();`,
        timestamp: Date.now(),
        metadata: {
          title: 'Three.js 可交互地球仪',
          description: '使用Three.js创建一个带有大陆、海洋、云层和大气层的可交互3D地球仪，包含多种渲染参数控制'
        }
      },
      {
        id: 'sample-text-2',
        type: 'text',
        content: '上面的代码展示了如何使用Three.js创建一个复杂的3D地球仪，包含以下特性：\n\n🌍 **地球表面**：动态生成的大陆和海洋纹理\n☁️ **云层系统**：可控制显示/隐藏的动态云层\n🌌 **大气层**：半透明的大气层效果\n⭐ **星空背景**：随机生成的星空效果\n💡 **光照系统**：可调节的太阳光和环境光\n🎮 **交互控制**：鼠标拖拽旋转、滚轮缩放\n⚙️ **参数面板**：实时调整各种渲染参数\n\n您可以点击代码块右上角的"渲染"按钮在右侧标签页中查看这个可交互的3D地球仪效果。',
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
          .visual-analysis-tabs {
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          /* AntD Tabs 内容区高度撑满，供子 TabPane 使用 */
          .visual-analysis-tabs .ant-tabs-content-holder {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden; /* parent 隐藏 */
            margin: 0 16px 16px;
            border: 1px solid #f0f0f0;
            border-top: none;
            border-radius: 0 0 8px 8px;
            background: #fff;
          }
          .visual-analysis-tabs .ant-tabs-content {
            flex: 1;
            height: 100%;
          }
          .visual-analysis-tabs .ant-tabs-tabpane {
            height: 100%;
            overflow-y: auto; /* 独立滚动 */
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