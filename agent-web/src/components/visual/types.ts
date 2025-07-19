// 可视化分析模块的类型定义

// 支持的代码语言类型
export type CodeLanguage = 
  | 'python' 
  | 'javascript' 
  | 'html' 
  | 'css' 
  | 'cpp' 
  | 'shell' 
  | 'json' 
  | 'markdown'
  | 'typescript'
  | 'sql'
  | 'yaml'

// 内容块接口 - 用于表示文字和代码的混合内容流
export interface ContentBlock {
  id: string                    // 唯一标识符
  type: 'text' | 'code'        // 内容类型
  content: string               // 实际内容
  language?: CodeLanguage       // 代码语言（仅当type为code时）
  timestamp?: number            // 创建时间戳
  metadata?: {                  // 附加元数据
    title?: string              // 代码块标题
    description?: string        // 代码块描述
    editable?: boolean          // 是否可编辑
  }
}

// 可渲染代码接口 - 用于iframe沙箱渲染
export interface RenderableCode {
  html?: string                 // HTML结构
  css?: string                  // CSS样式
  javascript?: string           // JavaScript逻辑
  libraries?: string[]          // 需要的外部库名称
  title?: string               // 渲染内容标题
}

// 外部库配置
export interface LibraryConfig {
  name: string                  // 库名称
  cdnUrl: string               // CDN地址
  description?: string          // 库描述
}

// 预定义的常用库
export const PREDEFINED_LIBRARIES: LibraryConfig[] = [
  {
    name: 'three.js',
    cdnUrl: 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js',
    description: '3D图形渲染库'
  },
  {
    name: 'echarts',
    cdnUrl: 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js',
    description: 'Apache ECharts图表库'
  },
  {
    name: 'd3',
    cdnUrl: 'https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js',
    description: 'D3.js数据可视化库'
  },
  {
    name: 'p5',
    cdnUrl: 'https://cdn.jsdelivr.net/npm/p5@1.7.0/lib/p5.min.js',
    description: 'P5.js创意编程库'
  },
  {
    name: 'chart.js',
    cdnUrl: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js',
    description: 'Chart.js图表库'
  }
]

// 组件Props类型定义

// 主面板组件Props
export interface VisualAnalysisPanelProps {
  contentBlocks?: ContentBlock[]                              // 内容流数据
  onContentUpdate?: (blocks: ContentBlock[]) => void         // 内容更新回调
  onCodeRender?: (code: RenderableCode) => void              // 代码渲染回调
  className?: string                                          // 自定义样式类
  style?: React.CSSProperties                                 // 自定义样式
}

// 分析视图组件Props
export interface AnalysisViewProps {
  contentBlocks: ContentBlock[]                               // 要显示的内容块
  onRenderCode?: (blockId: string, code: RenderableCode) => void  // 渲染代码回调
  onCopyCode?: (blockId: string, content: string) => void    // 复制代码回调
  className?: string
  style?: React.CSSProperties
}

// 代码块组件Props
export interface CodeBlockProps {
  id: string                                                  // 代码块ID
  content: string                                             // 代码内容
  language: CodeLanguage                                      // 代码语言
  maxHeight?: number                                          // 最大高度，默认200px
  showRenderButton?: boolean                                  // 是否显示"渲染"按钮
  showCopyButton?: boolean                                    // 是否显示复制按钮，默认true
  title?: string                                             // 代码块标题
  onRender?: (code: RenderableCode) => void                  // 渲染回调
  onCopy?: (content: string) => void                         // 复制回调
  className?: string
  style?: React.CSSProperties
}

// 渲染视图组件Props
export interface RenderViewProps {
  code?: RenderableCode                                       // 要渲染的代码
  loading?: boolean                                           // 加载状态
  error?: string                                              // 错误信息
  onError?: (error: string) => void                          // 错误回调
  onLoad?: () => void                                         // 加载完成回调
  className?: string
  style?: React.CSSProperties
}

// 代码执行结果
export interface CodeExecutionResult {
  success: boolean                                            // 是否执行成功
  error?: string                                              // 错误信息
  output?: any                                                // 执行输出
  timestamp: number                                           // 执行时间戳
}

// 代码折叠状态
export interface CodeFoldState {
  [blockId: string]: boolean                                  // blockId -> isExpanded
}

// 代码语言检测函数类型
export type LanguageDetector = (content: string) => CodeLanguage | undefined

// 代码渲染器函数类型
export type CodeRenderer = (code: RenderableCode) => string  // 返回完整的HTML字符串 