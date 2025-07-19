# 可视化分析功能开发计划 V2.0

## 项目概述
在现有的三栏布局中重构可视化分析功能，采用双标签页架构，支持实时接收后台混合内容流（文字+代码），并提供安全的前端代码沙箱渲染环境。

## 功能需求

### 主要目标
1. **双标签页架构**：将可视化分析拆分为"分析与代码"和"渲染与交互"两个功能独立的标签页
2. **实时内容流**：支持接收和显示后台推送的混合内容（文字段落+各种语言的代码块）
3. **智能代码识别**：自动识别Python、JavaScript、HTML、CSS、C++、Shell等常见代码，并提供语法高亮
4. **代码交互功能**：每个代码块支持复制、折叠/展开、以及"渲染到交互页"等操作
5. **安全代码执行**：基于iframe沙箱的前端代码渲染环境，支持Three.js等主流库

### 详细功能设计

#### "分析与代码"标签页
- **独立滚动**：拥有自己的滚动条，支持大量混合内容的流畅浏览
- **内容流渲染**：实时显示后台输出的文字和代码混合内容
- **智能代码框**：
  * 自动语法高亮（支持python、javascript、html、css、cpp、shell等）
  * 右上角复制按钮
  * 超过200px高度时自动折叠，提供展开按钮
  * 可选的"渲染到交互页"按钮（针对前端代码）

#### "渲染与交互"标签页
- **默认状态**：友好的空状态占位符，提示用户操作方式
- **沙箱渲染**：接收来自"分析与代码"页的前端代码，在隔离环境中安全执行
- **库支持**：预集成Three.js、ECharts等常用可视化库
- **交互能力**：支持用户与渲染结果进行交互

## 技术选型

### 核心框架
- **UI组件**：继续使用Ant Design保持一致性
- **标签页**：Ant Design Tabs组件
- **代码高亮**：react-syntax-highlighter
- **代码执行**：iframe + srcdoc（替代之前的new Function()方案）

### 安全机制
- **沙箱隔离**：iframe的sandbox属性限制权限
- **CSP策略**：Content Security Policy防止恶意代码
- **域隔离**：iframe内容与主应用完全隔离

### 支持的库
- **Three.js**：3D图形渲染
- **ECharts**：图表可视化
- **D3.js**：数据可视化
- **P5.js**：创意编程
- 通过CDN动态加载，按需引入

## 架构设计

### 目录结构
```
src/components/
├── VisualAnalysisPanel.tsx     # 主面板，管理双标签页和状态
└── visual/                     # 可视化功能子模块
    ├── AnalysisView.tsx        # "分析与代码"标签页主视图
    ├── CodeBlock.tsx          # 单个代码块组件（可折叠、可复制）
    ├── RenderView.tsx         # "渲染与交互"标签页主视图
    └── types.ts               # TypeScript类型定义
```

### 数据结构

#### 内容块接口
```typescript
interface ContentBlock {
  id: string;                    // 唯一标识符
  type: 'text' | 'code';        // 内容类型
  content: string;               // 实际内容
  language?: CodeLanguage;       // 代码语言（仅当type为code时）
  timestamp?: number;            // 创建时间戳
}

type CodeLanguage = 
  | 'python' 
  | 'javascript' 
  | 'html' 
  | 'css' 
  | 'cpp' 
  | 'shell' 
  | 'json' 
  | 'markdown';
```

#### 可渲染代码接口
```typescript
interface RenderableCode {
  html?: string;                 // HTML结构
  css?: string;                  // CSS样式
  javascript?: string;           // JavaScript逻辑
  libraries?: string[];          // 需要的外部库
}
```

### 组件设计

#### VisualAnalysisPanel（主容器）
```typescript
interface VisualAnalysisPanelProps {
  contentBlocks?: ContentBlock[];           // 内容流数据
  onContentUpdate?: (blocks: ContentBlock[]) => void;  // 内容更新回调
  onCodeRender?: (code: RenderableCode) => void;       // 代码渲染回调
}
```

#### AnalysisView（分析视图）
```typescript
interface AnalysisViewProps {
  contentBlocks: ContentBlock[];
  onRenderCode?: (blockId: string, code: RenderableCode) => void;
}
```

#### CodeBlock（代码块）
```typescript
interface CodeBlockProps {
  id: string;
  content: string;
  language: CodeLanguage;
  maxHeight?: number;            // 默认200px
  showRenderButton?: boolean;    // 是否显示"渲染"按钮
  onRender?: (code: RenderableCode) => void;
}
```

#### RenderView（渲染视图）
```typescript
interface RenderViewProps {
  code?: RenderableCode;
  loading?: boolean;
  onError?: (error: string) => void;
}
```

## 实施阶段

### 第一阶段：框架重构（1天）
- [x] 更新开发计划文档
- [ ] 创建visual/子目录结构
- [ ] 重构VisualAnalysisPanel为双标签页布局
- [ ] 定义TypeScript类型接口
- [ ] 创建各组件的基础骨架

### 第二阶段：分析与代码页开发（1.5天）
- [ ] 实现AnalysisView主视图组件
- [ ] 开发CodeBlock代码块组件
  * 语法高亮功能
  * 复制按钮实现
  * 折叠/展开逻辑
  * 渲染按钮（可选）
- [ ] 实现内容流的滚动和渲染
- [ ] 添加示例数据进行测试

### 第三阶段：渲染与交互页开发（1.5天）
- [ ] 实现RenderView沙箱视图
- [ ] 开发iframe沙箱机制
  * srcdoc动态HTML生成
  * sandbox属性安全配置
  * 外部库CDN集成
- [ ] 设计空状态占位符
- [ ] 实现代码接收和渲染逻辑
- [ ] 错误处理和用户反馈

### 第四阶段：整合与优化（1天）
- [ ] 双标签页间的数据传递
- [ ] 用户交互流程优化
- [ ] 性能优化和内存管理
- [ ] 样式统一和响应式适配
- [ ] 全面测试和bug修复

## 安全考虑

### iframe沙箱配置
```html
<iframe 
  sandbox="allow-scripts allow-same-origin"
  srcdoc="<!-- 动态生成的HTML -->"
  style="width: 100%; height: 100%; border: none;"
/>
```

### 权限限制
- **allow-scripts**：允许JavaScript执行
- **allow-same-origin**：允许访问同源资源
- **禁止**：弹窗、表单提交、顶级导航等

### CSP策略
- 限制可加载的外部资源域名
- 禁止内联事件处理器
- 限制eval()等危险函数的使用

## 性能优化

### 内存管理
- 组件卸载时清理iframe引用
- 大量内容时实现虚拟滚动
- 代码块按需渲染和回收

### 加载优化
- 外部库采用CDN缓存
- 代码高亮库按需加载
- iframe内容延迟加载

### 用户体验
- 代码渲染loading状态
- 错误边界和降级方案
- 响应式布局适配

## 后续扩展规划

### Phase 2功能
1. **代码编辑能力**：在代码块中支持简单的在线编辑
2. **多iframe管理**：支持同时渲染多个代码结果
3. **代码版本历史**：保存和回放代码执行历史
4. **导出功能**：将渲染结果导出为图片或HTML文件

### Phase 3集成
1. **后台API集成**：连接实时数据流接口
2. **WebSocket支持**：实时接收后台推送内容
3. **Agent交互**：与AI Agent进行代码生成对话
4. **协作功能**：多用户实时协作编辑

## 风险评估与应对

### 技术风险
- **中风险**：iframe沙箱的兼容性和性能问题
  * 应对：提供降级方案，在不支持的浏览器中显示代码而不执行
- **低风险**：外部库加载失败
  * 应对：CDN备份和本地fallback机制

### 用户体验风险
- **中风险**：大量内容导致页面卡顿
  * 应对：虚拟滚动和分页加载
- **低风险**：代码执行错误影响用户体验
  * 应对：完善的错误捕获和用户友好的错误提示

## 成功标准

### 功能完整性
1. ✅ 双标签页正常切换和布局
2. ✅ "分析与代码"页面独立滚动
3. ✅ 代码块自动识别语言并高亮
4. ✅ 复制和折叠功能正常工作
5. ✅ "渲染与交互"页面安全执行前端代码
6. ✅ 支持Three.js等主流库

### 性能指标
- 页面首次渲染时间 < 500ms
- 代码块渲染响应时间 < 200ms
- iframe沙箱加载时间 < 1000ms
- 内存占用增长 < 50MB（100个代码块）

### 用户体验
- 界面操作流畅无卡顿
- 错误提示清晰友好
- 与现有系统风格一致
- 移动端基本可用

**总计开发时间：5天**

*最后更新：2024年12月* 