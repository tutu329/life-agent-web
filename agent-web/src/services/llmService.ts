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
                  // 处理DeepSeek的thinking内容
                  if (delta.reasoning) {
                    currentThinking += delta.reasoning
                    yield { 
                      content: currentContent, 
                      thinking: currentThinking, 
                      done: false 
                    }
                  }

                  // 处理普通内容
                  if (delta.content) {
                    currentContent += delta.content
                    yield { 
                      content: currentContent, 
                      thinking: currentThinking, 
                      done: false 
                    }
                  }

                  // 对于Qwen等其他模型，可能thinking信息在content中
                  if (this.isQwenModel() && delta.content) {
                    // 尝试检测thinking模式的特殊标记
                    const thinkingMatch = delta.content.match(/<thinking>(.*?)<\/thinking>/s)
                    if (thinkingMatch) {
                      currentThinking += thinkingMatch[1]
                      // 从content中移除thinking部分
                      const contentWithoutThinking = delta.content.replace(/<thinking>.*?<\/thinking>/s, '')
                      if (contentWithoutThinking.trim()) {
                        currentContent += contentWithoutThinking
                      }
                      yield { 
                        content: currentContent, 
                        thinking: currentThinking, 
                        done: false 
                      }
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
    const thinkingModels = ['deepseek-chat', 'qwen3-235b-a22b']
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

      const content = response.data.choices?.[0]?.message?.content || ''
      const reasoning = response.data.choices?.[0]?.message?.reasoning || ''

      return {
        content,
        thinking: reasoning
      }
    } catch (error) {
      console.error('Sync chat error:', error)
      throw error
    }
  }
} 