### **开发计划：多智能体系统前端页面**

#### **✅ OnlyOffice文档服务器已部署 (本地版本)**

OnlyOffice Document Server 已迁移到本地版本（非Docker）：

- **服务地址**: http://localhost:8080
- **状态**: 运行中
- **服务类型**: 本地 Node.js 服务
- **启动方式**: 系统服务 (LaunchAgent)

##### **✅ 问题解决方案**

**问题**: OnlyOffice加载本地文档时出现"下载失败"错误

**解决方案**: 使用本地空白文档

- **测试页面**: http://localhost:5173/test-onlyoffice.html ✅ 正常工作
- **主应用**: http://localhost:5173 → "报告编制"标签 ✅ 正常工作
- **文档源**: 本地空白文档 (public/empty.docx)

##### **使用方法**
1. 启动前端应用: `npm run dev`
2. 访问: http://localhost:5173
3. 点击"报告编制"标签页
4. 直接开始编辑文档

##### **服务管理命令 (本地版本)**
```bash
# 查看完整状态
./check-onlyoffice-status-native.sh

# 查看服务进程
pgrep -f "node.*server.js"

# 查看日志
tail -f ~/Library/Logs/onlyoffice-documentserver.log

# 手动停止服务
~/onlyoffice-documentserver/stop.sh

# 手动启动服务
~/onlyoffice-documentserver/start.sh

# 重启系统服务
launchctl unload ~/Library/LaunchAgents/com.onlyoffice.documentserver.plist
launchctl load ~/Library/LaunchAgents/com.onlyoffice.documentserver.plist

# 查看服务状态
~/onlyoffice-documentserver/status.sh

# 从Docker迁移到本地版本（一键迁移）
./migrate-to-native.sh
```

##### **空白文档配置 ✅**
现在OnlyOffice编辑器默认打开本地空白文档：
- **文档位置**: `public/empty.docx`
- **文档内容**: 包含一行默认提示文字，可直接开始编辑
- **网络配置**: Vite配置为监听所有网络接口 (0.0.0.0:5173)
- **IP地址访问**: 使用宿主机IP地址让OnlyOffice容器能访问文档
- **自动保存**: 编辑内容会自动保存

##### **管理脚本**
- **完整测试**: `./test-local-document.sh` - 测试所有组件状态
- **更新IP地址**: `./update-host-ip.sh` - 当IP地址变化时更新配置
- **重新生成空白文档**: `python3 create-empty-docx.py`

##### **远程工具配置**
在"报告编制"页面的设置中，可以配置：
- **端口**: 5122 (默认)
- **工具描述**: 用于Agent调用OnlyOffice工具的描述

#### **OnlyOffice文档服务器设置**

OnlyOffice需要文档服务器来处理文档编辑功能。目前已采用本地版本：

##### **✅ 当前方案：本地 Node.js 版本（推荐）**
- **优势**: 无需Docker、启动快速、资源占用低
- **安装**: 运行 `./install-onlyoffice-native.sh`
- **迁移**: 从Docker版本迁移：`./migrate-to-native.sh`
- **管理**: 使用系统服务，开机自启
- **访问**: http://localhost:8080

##### **备选方案1：Docker版本（已弃用）**
```bash
# 注意：已迁移到本地版本，不再推荐使用
docker pull onlyoffice/documentserver
docker run -i -t -d -p 8080:80 --name documentserver onlyoffice/documentserver
```

##### **备选方案2：云服务**
- 使用OnlyOffice云服务
- 或部署到自己的服务器

##### **🔄 从Docker迁移到本地版本**
如果你之前使用的是Docker版本，可以一键迁移：
```bash
./migrate-to-native.sh
```

**迁移优势**：
- ❌ 不再依赖Docker Desktop
- ✅ 更快的启动速度（秒级启动）
- ✅ 更低的内存占用
- ✅ 开机自动启动
- ✅ 更简单的管理和调试

#### **第一步：技术选型与环境搭建**

为了快速开发一个现代化、响应式且易于维护的界面，我建议采用以下主流技术栈：

1.  **前端框架：React**
    *   **原因**：React是目前最流行的前端框架之一，拥有庞大的生态系统和社区支持。其组件化思想非常适合构建我们这种模块化的复杂界面。我们将使用 **Vite** 作为构建工具，它能提供闪电般的启动和热更新速度。

2.  **UI 组件库：Ant Design (AntD)**
    *   **原因**：Ant Design 提供了大量高质量、开箱即用的组件（如布局、标签页、树形控件、按钮、聊天输入框等），完美契合我们的需求。它的设计语言专业、整洁，并且可以轻松配置为亮色主题，能够很好地模拟出 Cursor 的专业风格。

3.  **语言：TypeScript**
    *   **原因**：为项目提供类型安全，能有效减少运行时错误，提高代码的可维护性和健壮性，特别适合这种将要长期迭代的项目。

4.  **图标库：`@ant-design/icons`**
    *   **原因**：与 AntD 无缝集成，提供丰富的图标，满足"设置"等按钮的需求。

#### **第二步：项目结构与组件拆分**

我们会将整个页面拆分为独立的、可复用的React组件，使代码结构清晰。

*   `src/`
    *   `components/`
        *   `ResourcePanel/` (左栏：资源区)
        *   `EditorPanel/` (中栏：编辑区)
        *   `InteractionPanel/` (右栏：交互区)
        *   `Settings/` (右上角：设置功能)
    *   `App.tsx` (主应用文件，负责整合所有组件和布局)
    *   `main.tsx` (应用入口文件)
    *   `assets/` (存放静态资源，如logo等)

#### **第三步：页面布局实现**

我们将使用 Ant Design 的 `Layout` 组件来搭建经典的三栏式布局。

1.  **整体结构**：
    *   最外层使用 `<Layout>` 组件，并设置其高度为 `100vh`，确保页面占满整个视窗。
    *   顶部使用 `<Layout.Header>` 来放置"设置"按钮。
    *   主体部分使用一个水平的 `<Layout>`。
        *   左边栏使用 `<Layout.Sider>`，并放入 `ResourcePanel` 组件。
        *   中间内容区使用 `<Layout.Content>`，并放入 `EditorPanel` 组件。
        *   右边栏也使用 `<Layout.Sider>`，并放入 `InteractionPanel` 组件。

#### **第四步：各模块功能实现**

1.  **左栏「资源」(`ResourcePanel`)**
    *   **组件**：使用 AntD 的 `Tree` 组件。
    *   **功能**：先用静态数据模拟一个文件目录结构，例如：
        ```
        - Project A
          - data.csv
          - report.docx
        - Shared Files
          - image.png
        ```
    *   **外观**：设置为可展开/折叠，风格简洁。

2.  **中栏「核心编辑区」(`EditorPanel`)**
    *   **组件**：使用 AntD 的 `Tabs` 组件。
    *   **功能**：
        *   创建两个 `<Tabs.TabPane>`。
        *   第一个标签页 `key="1"`，标题为"可视化分析"。
        *   第二个标签页 `key="2"`，标题为"报告编制"。
        *   两个标签页的内容暂时都只放一个占位标题，例如 `<h1>可视化分析功能区</h1>`。

3.  **右栏「交互栏」(`InteractionPanel`)**
    *   **组件**：
        *   使用 AntD 的 `List` 或 `Comment` 组件来展示聊天记录。
        *   底部使用 `Input.Search` 组件作为聊天输入框，它自带一个发送按钮。
    *   **功能**：
        *   我们会用一个 React state (`useState`) 来保存聊天消息数组。
        *   当用户在输入框中按下回车或点击发送按钮时，将新消息添加到数组中，并模拟一个Agent的自动回复。
        *   聊天记录会根据这个数组动态渲染出来。

4.  **顶栏与「设置」功能**
    *   **组件**：
        *   顶栏右侧使用一个 `Button` 组件，并内嵌 `<SettingOutlined />` 图标。
        *   点击按钮时，弹出一个 AntD 的 `Modal` (模态框) 或 `Drawer` (抽屉)。
    *   **功能**：
        *   模态框标题为"设置"。
        *   内容暂时只包含一个表单项"LLM 配置"，后面跟一个 `Input` 输入框作为占位。

#### **第五步：风格定制（亮色系 & Cursor 风格）**

1.  **主题配置**：
    *   在 `App.tsx` 中，使用 AntD 的 `ConfigProvider` 组件包裹整个应用。
    *   通过 `theme` 属性，我们可以全局定制主题。
        *   `algorithm`: 设置为 `theme.defaultAlgorithm` 来启用亮色系。
        *   `token`: 设置 `colorPrimary` 为一个蓝色调（例如 `#1677ff`），来模拟 Cursor 的主色调。

2.  **细节微调**：
    *   编写少量的全局 CSS 来调整背景色、边框、间距等，使整体感觉更接近 Cursor 的简洁、现代风格。 