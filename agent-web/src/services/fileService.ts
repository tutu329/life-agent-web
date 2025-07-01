// 文件管理服务
export interface FileInfo {
  name: string
  size: number
  type: string
  uploadTime: string
  path: string
}

export interface UploadResponse {
  success: boolean
  file?: FileInfo
  error?: string
}

export class FileService {
  private baseUrl: string

  constructor(baseUrl: string = 'https://powerai.cc:5103') {
    this.baseUrl = baseUrl
    // 文件管理API通过WOPI服务器提供（5103端口）
  }

  // 上传文件
  async uploadFile(file: File, type: 'template' | 'shared'): Promise<UploadResponse> {
    try {
      // 临时实现：直接上传文件内容
      const arrayBuffer = await file.arrayBuffer()
      
      const response = await fetch(`${this.baseUrl}/api/files/upload/${type}/${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: arrayBuffer,
      })

      if (response.ok) {
        const fileInfo: FileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          uploadTime: new Date().toISOString(),
          path: `uploads/${type}/${file.name}`
        }
        return { success: true, file: fileInfo }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error || 'Upload failed' }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' }
    }
  }

  // 获取文件列表
  async getFileList(type: 'template' | 'shared'): Promise<FileInfo[]> {
    try {
      console.log(`🔍 正在获取文件列表: ${type}`)
      console.log(`🌐 请求URL: ${this.baseUrl}/api/files/list/${type}`)
      
      const response = await fetch(`${this.baseUrl}/api/files/list/${type}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // 添加CORS相关配置
        mode: 'cors',
        credentials: 'include'
      })

      console.log(`📡 响应状态: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        console.error(`❌ API响应错误: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.error(`❌ 错误详情: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ 获取到文件列表:`, result)
      
      return result.files || []
    } catch (error) {
      console.error('❌ 获取文件列表失败:', error)
      // 抛出错误而不是返回空数组，让调用者知道发生了错误
      throw error
    }
  }

  // 删除文件
  async deleteFile(type: 'template' | 'shared', filename: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/files/delete/${type}/${filename}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Failed to delete file:', error)
      return false
    }
  }

  // 获取文件下载URL
  getFileUrl(type: 'template' | 'shared', filename: string): string {
    return `${this.baseUrl}/api/files/download/${type}/${encodeURIComponent(filename)}`
  }

  // 预览文件（用于支持的格式）
  getPreviewUrl(type: 'template' | 'shared', filename: string): string {
    return `${this.baseUrl}/api/files/preview/${type}/${encodeURIComponent(filename)}`
  }
}

export const fileService = new FileService() 