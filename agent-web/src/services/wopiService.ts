// WOPI (Web Application Open Platform Interface) 服务
// 用于 Collabora CODE 访问文档的协议实现

export interface WOPIFileInfo {
  BaseFileName: string
  Size: number
  Version: string
  OwnerId: string
  UserId: string
  UserFriendlyName: string
  UserCanWrite: boolean
  UserCanNotWriteRelative: boolean
  PostMessageOrigin: string
  LastModifiedTime: string
  SHA256?: string
}

export interface WOPIResponse {
  success: boolean
  data?: any
  error?: string
}

export class WOPIService {
  private baseUrl: string
  private documents: Map<string, any> = new Map()

  constructor(baseUrl: string = 'https://powerai.cc:5101') {
    this.baseUrl = baseUrl
  }

  // 获取文件信息 (CheckFileInfo)
  async getFileInfo(fileId: string, accessToken: string): Promise<WOPIResponse> {
    try {
      // 验证访问令牌
      if (!this.validateAccessToken(accessToken)) {
        return { success: false, error: 'Invalid access token' }
      }

      // 模拟文件信息
      const fileInfo: WOPIFileInfo = {
        BaseFileName: 'empty.docx',
        Size: 12345, // 实际应该获取真实文件大小
        Version: '1.0',
        OwnerId: 'user1',
        UserId: 'user1',
        UserFriendlyName: 'Agent User',
        UserCanWrite: true,
        UserCanNotWriteRelative: false,
        PostMessageOrigin: this.baseUrl,
        LastModifiedTime: new Date().toISOString(),
        SHA256: 'dummy-hash'
      }

      return { success: true, data: fileInfo }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // 获取文件内容 (GetFile)
  async getFileContent(fileId: string, accessToken: string): Promise<WOPIResponse> {
    try {
      // 验证访问令牌
      if (!this.validateAccessToken(accessToken)) {
        return { success: false, error: 'Invalid access token' }
      }

      // WOPI服务器应该直接从文件系统读取文件，而不是通过HTTP请求
      // 这个方法在WOPI服务器中不会被调用，文件读取在wopiServer.ts中直接处理
      return { success: true, data: null }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // 保存文件内容 (PutFile)
  async putFileContent(fileId: string, accessToken: string, content: ArrayBuffer): Promise<WOPIResponse> {
    try {
      // 验证访问令牌
      if (!this.validateAccessToken(accessToken)) {
        return { success: false, error: 'Invalid access token' }
      }

      // 这里应该保存文件内容到服务器
      // 目前只是模拟保存
      console.log(`Saving file ${fileId}, size: ${content.byteLength} bytes`)
      
      // 存储到内存中（实际应用中应该保存到文件系统或数据库）
      this.documents.set(fileId, {
        content: content,
        lastModified: new Date(),
        version: Date.now().toString()
      })

      return { 
        success: true, 
        data: { 
          LastModifiedTime: new Date().toISOString(),
          Version: Date.now().toString()
        } 
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // 验证访问令牌
  private validateAccessToken(token: string): boolean {
    // 简单的令牌验证，实际应用中应该更严格
    return token === 'demo_token' || token.length > 0
  }

  // 生成访问令牌
  generateAccessToken(userId: string, fileId: string): string {
    // 简单的令牌生成，实际应用中应该使用 JWT 或其他安全方式
    return `${userId}_${fileId}_${Date.now()}`
  }

  // 获取 WOPI URL
  getWOPIUrl(fileId: string, accessToken: string): string {
    return `${this.baseUrl}/wopi/files/${fileId}?access_token=${accessToken}`
  }
}

// 导出单例实例
export const wopiService = new WOPIService() 