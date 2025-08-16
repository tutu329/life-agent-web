import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import https from 'https'
import { wopiService } from '../services/wopiService'

const app = express()
const PORT = 5103 // WOPI 服务器端口

// 中间件
app.use(cors({
  origin: ['https://powerai.cc:5102', 'https://powerai.cc:5101', 'http://powerai.cc:5101', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}))

// 添加请求日志中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`📥 ${req.method} ${req.url} - Origin: ${req.headers.origin}`)
  next()
})

app.use(express.json())
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }))

// 添加静态文件服务 - 为图片等资源提供访问
app.use(express.static(path.join(process.cwd(), 'public'), {
  setHeaders: (res, path) => {
    // 设置CORS和缓存头
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    // 根据文件类型设置Content-Type
    if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png')
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg')
    } else if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif')
    } else if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml')
    }
  }
}))

console.log(`📁 静态文件目录: ${path.join(process.cwd(), 'public')}`)

// 创建上传目录
const ensureUploadsDir = () => {
  const uploadsDir = path.join(process.cwd(), 'uploads')
  const templateDir = path.join(uploadsDir, 'template')
  const sharedDir = path.join(uploadsDir, 'shared')
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
  if (!fs.existsSync(templateDir)) {
    fs.mkdirSync(templateDir, { recursive: true })
  }
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true })
  }
}

// 确保上传目录存在
ensureUploadsDir()

// WOPI 协议路由

// OPTIONS 预检请求处理
app.options('/wopi/*', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
  res.status(200).send()
})

// 文件管理API的OPTIONS处理
app.options('/api/files/*', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
  res.status(200).send()
})

// WOPI 发现端点
app.get('/hosting/discovery', (req: Request, res: Response) => {
  const discoveryXml = `<?xml version="1.0" encoding="utf-8"?>
<wopi-discovery>
  <net-zone name="external-http">
    <app name="Word" favIconUrl="https://powerai.cc:5102/favicon.ico">
      <action name="edit" ext="docx" urlsrc="https://powerai.cc:5102/loleaflet/dist/loleaflet.html?&lt;WOPISrc=WOPI_SOURCE&gt;&amp;&lt;access_token=ACCESS_TOKEN&gt;"/>
      <action name="view" ext="docx" urlsrc="https://powerai.cc:5102/loleaflet/dist/loleaflet.html?&lt;WOPISrc=WOPI_SOURCE&gt;&amp;&lt;access_token=ACCESS_TOKEN&gt;"/>
    </app>
  </net-zone>
</wopi-discovery>`
  
  res.setHeader('Content-Type', 'application/xml')
  res.send(discoveryXml)
})

// CheckFileInfo - 获取文件信息
app.get('/wopi/files/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params
  const accessToken = req.query.access_token as string

  console.log(`📋 WOPI CheckFileInfo: fileId=${fileId}, token=${accessToken}`)

  try {
    const result = await wopiService.getFileInfo(fileId, accessToken)
    
    if (!result.success) {
      return res.status(401).json({ error: result.error })
    }

    // 获取实际文件信息
    const filePath = path.join(process.cwd(), 'public', 'empty.docx')
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      result.data.Size = stats.size
      result.data.LastModifiedTime = stats.mtime.toISOString()
    }

    console.log(`✅ 返回文件信息: ${JSON.stringify(result.data, null, 2)}`)
    res.json(result.data)
    
  } catch (error) {
    console.error('❌ WOPI CheckFileInfo error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GetFile - 获取文件内容
app.get('/wopi/files/:fileId/contents', async (req: Request, res: Response) => {
  const { fileId } = req.params
  const accessToken = req.query.access_token as string

  console.log(`📄 WOPI GetFile: fileId=${fileId}, token=${accessToken}`)

  try {
    const result = await wopiService.getFileContent(fileId, accessToken)
    
    if (!result.success) {
      console.log(`❌ WOPI validation failed: ${result.error}`)
      return res.status(401).json({ error: result.error })
    }

    // 直接发送文件 - 使用绝对路径
    const filePath = path.resolve(process.cwd(), 'public', 'empty.docx')
    console.log(`📁 文件路径: ${filePath}`)
    console.log(`📊 文件存在: ${fs.existsSync(filePath)}`)
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      console.log(`📏 文件大小: ${stats.size} bytes`)
      
      // 设置文件相关的响应头
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      res.setHeader('Content-Length', stats.size.toString())
      
      console.log(`✅ 发送文件: ${filePath}, 大小: ${stats.size} bytes`)
      res.sendFile(filePath)
      
    } else {
      console.log(`❌ 文件不存在: ${filePath}`)
      res.status(404).json({ error: 'File not found' })
    }
  } catch (error) {
    console.error('❌ WOPI GetFile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PutFile - 保存文件内容
app.post('/wopi/files/:fileId/contents', async (req: Request, res: Response) => {
  const { fileId } = req.params
  const accessToken = req.query.access_token as string

  console.log(`💾 WOPI PutFile: fileId=${fileId}, token=${accessToken}`)

  try {
    const result = await wopiService.putFileContent(fileId, accessToken, req.body)
    
    if (!result.success) {
      return res.status(401).json({ error: result.error })
    }

    // 保存文件到磁盘
    const filePath = path.join(process.cwd(), 'public', 'empty.docx')
    fs.writeFileSync(filePath, req.body)

    res.json(result.data)
  } catch (error) {
    console.error('❌ WOPI PutFile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 添加文本到文档的API端点
app.post('/append-text', async (req: Request, res: Response) => {
  const { text } = req.body
  
  console.log(`📝 接收到文本插入请求: ${text}`)
  
  try {
    // 使用Python脚本修改docx文件
    const { exec } = require('child_process')
    const command = `cd /home/tutu/server/life-agent-web && python3 -c "
import sys
sys.path.append('.')
from docx import Document
import os

# 读取现有文档
doc_path = 'public/empty.docx'
if os.path.exists(doc_path):
    doc = Document(doc_path)
else:
    doc = Document()

# 添加新文本
doc.add_paragraph('${text}')

# 保存文档
doc.save(doc_path)
print('文档已更新')
"`
    
    exec(command, (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error('❌ Python脚本执行失败:', error)
        res.status(500).json({ error: 'Failed to update document' })
        return
      }
      
      console.log('✅ 文档已更新:', stdout)
      res.json({ success: true, message: 'Text appended successfully' })
    })
    
  } catch (error) {
    console.error('❌ 文本插入失败:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 文件管理API
// 获取文件列表
app.get('/api/files/list/:type', (req: Request, res: Response) => {
  const { type } = req.params
  
  if (type !== 'template' && type !== 'shared') {
    return res.status(400).json({ error: 'Invalid file type' })
  }
  
  try {
    const dir = path.join(process.cwd(), 'uploads', type)
    if (!fs.existsSync(dir)) {
      return res.json({ files: [] })
    }
    
    const files = fs.readdirSync(dir).map(filename => {
      const filepath = path.join(dir, filename)
      const stats = fs.statSync(filepath)
      
      return {
        name: filename,
        size: stats.size,
        type: path.extname(filename).toLowerCase(),
        uploadTime: stats.birthtime.toISOString(),
        path: filepath
      }
    })
    
    res.json({ files })
  } catch (error) {
    console.error('Failed to list files:', error)
    res.status(500).json({ error: 'Failed to list files' })
  }
})

// 上传文件 (简单上传，直接传输文件内容)
app.post('/api/files/upload/:type/:filename', (req: Request, res: Response) => {
  const { type } = req.params
  let { filename } = req.params
  
  // URL解码文件名，处理中文文件名
  try {
    filename = decodeURIComponent(filename)
  } catch (e) {
    console.error('Failed to decode filename:', filename)
  }
  
  console.log(`📤 上传请求: type=${type}, filename=${filename}`)
  
  if (type !== 'template' && type !== 'shared') {
    return res.status(400).json({ error: 'Invalid file type' })
  }
  
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', type)
    const filepath = path.join(uploadsDir, filename)
    
    console.log(`📁 上传目录: ${uploadsDir}`)
    console.log(`📄 文件路径: ${filepath}`)
    console.log(`📊 请求体大小: ${req.body ? req.body.length : 0} bytes`)
    
    // 确保目录存在
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
      console.log(`✅ 创建目录: ${uploadsDir}`)
    }
    
    // 保存文件
    fs.writeFileSync(filepath, req.body)
    
    const stats = fs.statSync(filepath)
    const fileInfo = {
      name: filename,
      size: stats.size,
      type: path.extname(filename).toLowerCase(),
      uploadTime: new Date().toISOString(), // 使用当前时间而不是birthtime
      path: filepath
    }
    
    console.log(`✅ 文件上传成功: ${filepath} (${stats.size} bytes)`)
    res.json({ success: true, file: fileInfo })
    
  } catch (error) {
    console.error('❌ 上传文件失败:', error)
    res.status(500).json({ 
      error: 'Failed to upload file', 
      details: error instanceof Error ? error.message : 'Unknown error',
      filename: filename,
      type: type
    })
  }
})

// 下载文件
app.get('/api/files/download/:type/:filename', (req: Request, res: Response) => {
  const { type } = req.params
  let { filename } = req.params
  
  // URL解码文件名，处理中文文件名
  try {
    filename = decodeURIComponent(filename)
  } catch (e) {
    console.error('Failed to decode filename:', filename)
  }
  
  console.log(`📥 下载请求: type=${type}, filename=${filename}`)
  
  if (type !== 'template' && type !== 'shared') {
    console.error('❌ 无效的文件类型:', type)
    res.status(400)
    res.setHeader('Content-Type', 'application/json')
    return res.json({ error: 'Invalid file type' })
  }
  
  try {
    const filepath = path.join(process.cwd(), 'uploads', type, filename)
    console.log(`📁 文件路径: ${filepath}`)
    console.log(`📊 文件存在: ${fs.existsSync(filepath)}`)
    
    if (!fs.existsSync(filepath)) {
      console.error('❌ 文件不存在:', filepath)
      
      // 列出目录中的所有文件以便调试
      const dir = path.join(process.cwd(), 'uploads', type)
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir)
        console.log(`📋 目录 ${dir} 中的文件:`, files)
      } else {
        console.log(`📋 目录 ${dir} 不存在`)
      }
      
      res.status(404)
      res.setHeader('Content-Type', 'application/json')
      return res.json({ error: 'File not found', path: filepath })
    }
    
    const stats = fs.statSync(filepath)
    const ext = path.extname(filename).toLowerCase()
    
    console.log(`📏 文件大小: ${stats.size} bytes`)
    console.log(`📄 文件扩展名: ${ext}`)
    
    // 设置适当的content-type
    let contentType = 'application/octet-stream'
    if (ext === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (ext === '.pdf') {
      contentType = 'application/pdf'
    } else if (ext === '.txt') {
      contentType = 'text/plain'
    } else if (ext === '.xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (ext === '.xls') {
      contentType = 'application/vnd.ms-excel'
    }
    
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', stats.size.toString())
    
    // 对中文文件名进行正确编码
    const encodedFilename = encodeURIComponent(filename)
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`)
    
    console.log(`✅ 开始传输文件: ${filepath}`)
    
    const fileStream = fs.createReadStream(filepath)
    
    fileStream.on('error', (streamError) => {
      console.error('❌ 文件流读取错误:', streamError)
      if (!res.headersSent) {
        res.status(500)
        res.setHeader('Content-Type', 'application/json')
        res.json({ error: 'File stream error' })
      }
    })
    
    fileStream.on('end', () => {
      console.log(`✅ 文件传输完成: ${filename}`)
    })
    
    fileStream.pipe(res)
    
  } catch (error) {
    console.error('❌ 下载文件失败:', error)
    if (!res.headersSent) {
      res.status(500)
      res.setHeader('Content-Type', 'application/json')
      res.json({ error: 'Failed to download file', details: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
})

// 删除文件
app.delete('/api/files/delete/:type/:filename', (req: Request, res: Response) => {
  const { type, filename } = req.params
  
  if (type !== 'template' && type !== 'shared') {
    return res.status(400).json({ error: 'Invalid file type' })
  }
  
  try {
    const filepath = path.join(process.cwd(), 'uploads', type, filename)
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' })
    }
    
    fs.unlinkSync(filepath)
    res.json({ success: true, message: 'File deleted successfully' })
    
  } catch (error) {
    console.error('Failed to delete file:', error)
    res.status(500).json({ error: 'Failed to delete file' })
  }
})

// 调试API - 列出所有上传的文件
app.get('/api/files/debug', (req: Request, res: Response) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const result: any = {
      uploadsDir,
      exists: fs.existsSync(uploadsDir),
      template: { files: [], dir: path.join(uploadsDir, 'template') },
      shared: { files: [], dir: path.join(uploadsDir, 'shared') }
    }
    
    // 检查模板文件夹
    const templateDir = path.join(uploadsDir, 'template')
    if (fs.existsSync(templateDir)) {
      result.template.exists = true
      result.template.files = fs.readdirSync(templateDir).map(filename => {
        const filepath = path.join(templateDir, filename)
        const stats = fs.statSync(filepath)
        return {
          name: filename,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          fullPath: filepath
        }
      })
    } else {
      result.template.exists = false
    }
    
    // 检查共享文件夹
    const sharedDir = path.join(uploadsDir, 'shared')
    if (fs.existsSync(sharedDir)) {
      result.shared.exists = true
      result.shared.files = fs.readdirSync(sharedDir).map(filename => {
        const filepath = path.join(sharedDir, filename)
        const stats = fs.statSync(filepath)
        return {
          name: filename,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          fullPath: filepath
        }
      })
    } else {
      result.shared.exists = false
    }
    
    console.log('📋 调试信息:', JSON.stringify(result, null, 2))
    res.json(result)
  } catch (error) {
    console.error('Failed to get debug info:', error)
    res.status(500).json({ error: 'Failed to get debug info' })
  }
})

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'WOPI Server', port: PORT })
})

// 创建自签名证书的 HTTPS 服务器
const createHttpsServer = () => {
  try {
    // 使用 powerai.cc 的现有证书文件
    const keyPath = '/home/tutu/ssl/powerai.key'
    const certPath = '/home/tutu/ssl/powerai_public.crt'
    const chainPath = '/home/tutu/ssl/powerai_chain.crt'
    
    console.log(`🔍 检查证书文件:`)
    console.log(`   私钥: ${keyPath} - 存在: ${fs.existsSync(keyPath)}`)
    console.log(`   证书: ${certPath} - 存在: ${fs.existsSync(certPath)}`)
    console.log(`   证书链: ${chainPath} - 存在: ${fs.existsSync(chainPath)}`)
    
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const options: any = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      }
      
      // 如果有证书链文件，也加载它
      if (fs.existsSync(chainPath)) {
        options.ca = fs.readFileSync(chainPath)
      }
      
      https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 WOPI Server (HTTPS) 已启动`)
        console.log(`📍 地址: https://powerai.cc:${PORT}`)
        console.log(`🔗 健康检查: https://powerai.cc:${PORT}/health`)
        console.log(`📋 WOPI 端点: https://powerai.cc:${PORT}/wopi/files/{fileId}`)
        console.log(`🔐 使用 powerai.cc SSL 证书`)
      })
    } else {
      // 如果没有证书文件，回退到 HTTP
      console.log('⚠️ 未找到 powerai.cc SSL 证书，使用 HTTP 模式')
      console.log(`💡 请确保以下文件存在:`)
      console.log(`   ${keyPath}`)
      console.log(`   ${certPath}`)
      startHttpServer()
    }
  } catch (error) {
    console.log('⚠️ HTTPS 启动失败，使用 HTTP 模式:', error)
    startHttpServer()
  }
}

// HTTP 服务器作为备选
const startHttpServer = () => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WOPI Server (HTTP) 已启动`)
    console.log(`📍 地址: http://powerai.cc:${PORT}`)
    console.log(`🔗 健康检查: http://powerai.cc:${PORT}/health`)
    console.log(`📋 WOPI 端点: http://powerai.cc:${PORT}/wopi/files/{fileId}`)
  })
}

// 启动服务器
createHttpsServer()

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason)
})

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('📟 收到SIGTERM信号，准备关闭服务器...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('📟 收到SIGINT信号，准备关闭服务器...')
  process.exit(0)
})

export default app 