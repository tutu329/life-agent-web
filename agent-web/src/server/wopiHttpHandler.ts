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
  origin: ['https://powerai.cc:5102', 'http://powerai.cc:5101', 'http://localhost:5173'],
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

// WOPI 协议路由

// OPTIONS 预检请求处理
app.options('/wopi/*', (req: Request, res: Response) => {
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
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      res.setHeader('Content-Length', stats.size.toString())
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

export default app 