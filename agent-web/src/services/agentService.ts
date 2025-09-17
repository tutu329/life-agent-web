// Agent系统相关的数据类型定义
export interface LLM_Config {
  base_url: string
  api_key: string
  llm_model_id: string
  temperature: number
  top_p: number
  max_new_tokens: number
  reasoning_effort: string
  vpn_on: boolean
  chatml: boolean
}

export interface Agent_Config {
  tool_names: string[]
  exp_json_path: string
  llm_config: LLM_Config
}

export interface Agent_As_Tool_Config {
  tool_names: string[]
  exp_json_path: string
  as_tool_name: string
  as_tool_description: string
  llm_config: LLM_Config
}

export interface Agents_System_Request {
  remote_tools: any[]
  upper_agent_config: Agent_Config
  lower_agents_config: Agent_As_Tool_Config[]
}

export interface Query_Agent_Context {
  custom_data_dict: { [key: string]: any }
}

export interface Query_Agent_Request {
  agent_id: string
  query: string
  context: Query_Agent_Context
}

export interface Agent_Status_Request {
  agent_id: string
}

export interface StreamEvent {
  data: string
  type?: string
  event?: string
}

export interface StreamResponse {
  id: string
  streams: string[]
}

export type StreamType = 'output' | 'thinking' | 'final_answer' | 'log' | 'tool_rtn_data'

export class SSEClient {
  private reader: ReadableStreamDefaultReader<Uint8Array>
  private decoder: TextDecoder

  constructor(response: Response) {
    this.reader = response.body!.getReader()
    this.decoder = new TextDecoder()
  }

  async* events(): AsyncGenerator<StreamEvent> {
    let buffer = ''
    
    while (true) {
      const { done, value } = await this.reader.read()
      
      if (done) break
      
      buffer += this.decoder.decode(value, { stream: true })
      
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      let event: Partial<StreamEvent> = {}
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        if (trimmedLine === '') {
          if (event.data !== undefined) {
            yield event as StreamEvent
            event = {}
          }
        } else if (trimmedLine.startsWith('data: ')) {
          event.data = trimmedLine.slice(6)
        } else if (trimmedLine.startsWith('event: ')) {
          event.event = trimmedLine.slice(7)
        } else if (trimmedLine.startsWith('id: ')) {
          // 处理id字段（如果需要）
        }
      }
    }
  }
}

export class AgentService {
  private baseUrl: string
  private agentId: string | null = null

  constructor(serverName: string = 'powerai.cc') {
    this.baseUrl = `https://${serverName}:5110`
  }

  // 初始化Agent系统
  async initializeAgentSystem(): Promise<string> {
    // 输出环境变量调试信息
    console.log('🔑 VITE_GROQ_API_KEY 环境变量:', import.meta.env.VITE_GROQ_API_KEY || '未设置')
    console.log('🔑 环境变量长度:', (import.meta.env.VITE_GROQ_API_KEY || '').length)

    const request: Agents_System_Request = {
      remote_tools: [],
      upper_agent_config: {
        tool_names: [],
        //tool_names: ['Folder_Tool'],
        exp_json_path: 'my_2_levels_mas_exp.json',
        llm_config: {
          base_url: 'http://powerai.cc:8001/v1',
          api_key: 'empty',
          llm_model_id: 'openai/gpt-oss-120b',
          temperature: 1.0,
          top_p: 1.0,
          max_new_tokens: 4096,
          reasoning_effort: 'low',
          vpn_on: false,
          chatml: true
        }
        // llm_config: {
        //   base_url: 'https://api.deepseek.com/v1',
        //   api_key: 'sk-c1d34a4f21e3413487bb4b2806f6c4b8',
        //   llm_model_id: 'deepseek-chat',
        //   temperature: 0.65,
        //   top_p: 0.9,
        //   max_new_tokens: 1000,
        //   vpn_on: false
        // }
      },
      lower_agents_config: [
        {
          tool_names: ['Write_Chapter_Tool'],
          // tool_names: ['Human_Console_Tool', 'Folder_Tool'],
          exp_json_path: '',
          as_tool_name: 'Write_Chapter_Agent_As_Tool',
          // as_tool_name: 'Folder_Agent_As_Tool',
          as_tool_description: '本工具用于在office文档中编制一个章节的内容',
          llm_config: {
            base_url: 'http://powerai.cc:8001/v1',
            api_key: 'empty',
            llm_model_id: 'openai/gpt-oss-120b',
            temperature: 1.0,
            top_p: 1.0,
            max_new_tokens: 4096,
            reasoning_effort: 'low',
            vpn_on: false,
            chatml: true
          }
          // llm_config: {
          //   base_url: 'https://api.deepseek.com/v1',
          //   api_key: 'sk-c1d34a4f21e3413487bb4b2806f6c4b8',
          //   llm_model_id: 'deepseek-chat',
          //   temperature: 0.70,
          //   top_p: 0.9,
          //   max_new_tokens: 1000,
          //   vpn_on: false
          // }
        }
      ]
    }

    // const request: Agents_System_Request = {
    //   remote_tools: [],
    //   upper_agent_config: {
    //     tool_names: ['Folder_Tool'],
    //     exp_json_path: 'my_2_levels_mas_exp.json',
    //     llm_config: {
    //       base_url: 'https://api.groq.com/openai/v1',
    //       api_key: import.meta.env.VITE_GROQ_API_KEY || '',
    //       llm_model_id: 'moonshotai/kimi-k2-instruct',
    //       temperature: 0.6,
    //       top_p: 0.9,
    //       max_new_tokens: 8192,
    //       vpn_on: true
    //     }
    //   },
    //   lower_agents_config: [
    //     {
    //       tool_names: ['Write_Chapter_Tool'],
    //       // tool_names: ['Human_Console_Tool', 'Folder_Tool'],
    //       exp_json_path: '',
    //       as_tool_name: 'Write_Chapter_Agent_As_Tool',
    //       // as_tool_name: 'Folder_Agent_As_Tool',
    //       as_tool_description: '本工具用于在office文档中编制一个章节的内容',
    //       llm_config: {
    //         base_url: 'https://api.groq.com/openai/v1',
    //         api_key: import.meta.env.VITE_GROQ_API_KEY || '',
    //         llm_model_id: 'moonshotai/kimi-k2-instruct',
    //         temperature: 0.6,
    //         top_p: 0.9,
    //         max_new_tokens: 8192,
    //         vpn_on: true
    //       }
    //     }
    //   ]
    // }

    try {
      const response = await fetch(`${this.baseUrl}/api/start_2_level_agents_system`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (response.ok) {
        const result = await response.json()
        const agentId = typeof result === 'string' ? result : result.toString()
        this.agentId = agentId
        console.log('✅ Agent系统初始化成功，agent_id:', this.agentId)
        return agentId
      } else {
        const errorText = await response.text()
        throw new Error(`Agent系统初始化失败: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('❌ Agent系统初始化错误:', error)
      throw error
    }
  }

  // 查询Agent系统
  async queryAgentSystem(query: string, context?: Query_Agent_Context): Promise<StreamResponse> {
    if (!this.agentId) {
      throw new Error('Agent系统未初始化，请先调用initializeAgentSystem()')
    }

    const request: Query_Agent_Request = {
      agent_id: this.agentId,
      query: query,
      context: context || { custom_data_dict: {} }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/query_2_level_agents_system`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ 查询Agent系统成功:', result)
        return result as StreamResponse
      } else {
        const errorText = await response.text()
        throw new Error(`查询Agent系统失败: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('❌ 查询Agent系统错误:', error)
      throw error
    }
  }

  // 监听SSE流
  async* listenToStream(streamId: string, streamName: string): AsyncGenerator<StreamEvent> {
    const streamUrl = `${this.baseUrl}/api/query_2_level_agents_system/stream/${streamId}/${streamName}`
    
    try {
      const response = await fetch(streamUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        throw new Error(`流连接失败: ${response.status} - ${response.statusText}`)
      }

      const client = new SSEClient(response)
      for await (const event of client.events()) {
        yield event
      }
    } catch (error) {
      console.error(`❌ 流 ${streamName} 出错:`, error)
      throw error
    }
  }

  // 检查Agent状态
  async checkAgentStatus(): Promise<{ finished: boolean }> {
    if (!this.agentId) {
      throw new Error('Agent系统未初始化')
    }

    const request: Agent_Status_Request = {
      agent_id: this.agentId
    }

    try {
      console.log('🚀 开始发送状态检查请求...')
      const response = await fetch(`${this.baseUrl}/api/get_agent_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })
      console.log('📡 收到响应，状态码:', response.status)
      
      if (response.ok) {
        const status = await response.json()
        console.log(`📊 Agent状态: finished=${status.finished}`)
        return status
      } else {
        const errorText = await response.text()
        throw new Error(`检查状态失败: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('❌ 检查Agent状态错误:', error)
      throw error
    }
  }

  // 获取当前agent_id
  getAgentId(): string | null {
    return this.agentId
  }

  // 重置agent_id
  resetAgentId(): void {
    this.agentId = null
  }
} 