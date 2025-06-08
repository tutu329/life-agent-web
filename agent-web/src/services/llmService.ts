import axios from 'axios'

export interface LLMConfig {
  base_url: string
  api_key: string
  llm_model_id: string
  temperature: number
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface StreamResponse {
  content: string
  thinking?: string
  done: boolean
}

export class LLMService {
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<StreamResponse> {
    try {
      const response = await fetch(`${this.config.base_url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.api_key}`,
        },
        body: JSON.stringify({
          model: this.config.llm_model_id,
          messages: messages,
          temperature: this.config.temperature,
          stream: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let currentThinking = ''
      let currentContent = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            yield { content: currentContent, thinking: currentThinking, done: true }
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              
              if (data === '[DONE]') {
                yield { content: currentContent, thinking: currentThinking, done: true }
                return
              }

              try {
                const parsed = JSON.parse(data)
                const delta = parsed.choices?.[0]?.delta

                if (delta) {
                  // console.log('Delta received:', delta) // 调试信息
                  
                  // 处理DeepSeek的thinking内容 (reasoning 或 reasoning_content)
                  if (delta.reasoning || delta.reasoning_content) {
                    const thinkingDelta = delta.reasoning || delta.reasoning_content
                    currentThinking += thinkingDelta
                    // console.log('DeepSeek thinking updated:', currentThinking) // 调试信息
                    yield { 
                      content: currentContent, 
                      thinking: currentThinking, 
                      done: false 
                    }
                  }

                  // 处理普通内容
                  if (delta.content) {
                    // 检查content中是否包含thinking标记（适用于更多模型）
                    const thinkingMatch = delta.content.match(/<thinking>(.*?)<\/thinking>/gs)
                    if (thinkingMatch) {
                      // 提取所有thinking内容
                      for (const match of thinkingMatch) {
                        const thinkingText = match.replace(/<\/?thinking>/g, '')
                        currentThinking += thinkingText
                      }
                      // 从content中移除thinking部分
                      const contentWithoutThinking = delta.content.replace(/<thinking>.*?<\/thinking>/gs, '').trim()
                      if (contentWithoutThinking) {
                        currentContent += contentWithoutThinking
                      }
                      // console.log('Thinking extracted from content:', currentThinking) // 调试信息
                    } else {
                      // 普通内容，直接添加
                      currentContent += delta.content
                    }
                    
                    yield { 
                      content: currentContent, 
                      thinking: currentThinking, 
                      done: false 
                    }
                  }

                  // 处理其他可能的thinking字段
                  if (delta.thinking) {
                    currentThinking += delta.thinking
                    // console.log('Other thinking format detected:', currentThinking) // 调试信息
                    yield { 
                      content: currentContent, 
                      thinking: currentThinking, 
                      done: false 
                    }
                  }
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', data)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error('Stream chat error:', error)
      throw error
    }
  }

  // 检查是否是thinking模型
  isThinkingModel(): boolean {
    const thinkingModels = ['deepseek-reasoner', 'qwen3-235b-a22b']
    return thinkingModels.includes(this.config.llm_model_id)
  }

  // 检查是否是Qwen模型
  private isQwenModel(): boolean {
    return this.config.llm_model_id.includes('qwen')
  }

  // 备用的非流式聊天方法（如果流式失败时使用）
  async chatSync(messages: ChatMessage[]): Promise<{ content: string; thinking?: string }> {
    try {
      const response = await axios.post(
        `${this.config.base_url}/chat/completions`,
        {
          model: this.config.llm_model_id,
          messages: messages,
          temperature: this.config.temperature,
          stream: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.api_key}`,
          },
        }
      )

      const fullContent = response.data.choices?.[0]?.message?.content || ''
      const reasoning = response.data.choices?.[0]?.message?.reasoning || ''
      
      console.log('Sync response:', response.data.choices?.[0]?.message) // 调试信息
      
      // 从content中提取thinking内容
      let thinking = reasoning
      let content = fullContent
      
      if (fullContent && !reasoning) {
        const thinkingMatch = fullContent.match(/<thinking>(.*?)<\/thinking>/gs)
        if (thinkingMatch) {
          thinking = thinkingMatch.map((match: string) => match.replace(/<\/?thinking>/g, '')).join('\n\n')
          content = fullContent.replace(/<thinking>.*?<\/thinking>/gs, '').trim()
          console.log('Thinking extracted from sync content:', thinking) // 调试信息
        }
      }

      return {
        content,
        thinking
      }
    } catch (error) {
      console.error('Sync chat error:', error)
      throw error
    }
  }
} 