import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Tabs, Alert, Button, message, Badge } from 'antd'
import { BarChartOutlined, FileTextOutlined, ReloadOutlined, WifiOutlined, SketchOutlined } from '@ant-design/icons'
import { useAgentContext } from '../App'
import CADViewer from './CADViewer'
import VisualAnalysisPanel from './VisualAnalysisPanel'

const EditorPanel: React.FC = () => {
  const { agentId, agentInitialized } = useAgentContext()
  const [messageApi, contextHolder] = message.useMessage()
  const [iframeError, setIframeError] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [documentReady, setDocumentReady] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [receivedMessages, setReceivedMessages] = useState<string[]>([])
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  
  // 生成唯一ID和key
  const uniqueId = `editor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Collabora CODE 配置
  const collaboraUrl = 'https://powerai.cc:5102'
  const wopiServerUrl = 'https://powerai.cc:5103'
  // WebSocket连接，用于接收后台Agent系统的Office操作指令
  const wsUrls = [
    'wss://powerai.cc:5112',  // 首先尝试安全连接
    'ws://powerai.cc:5112'    // 如果安全连接失败，尝试普通连接
  ]
  
  // 初始化WebSocket连接 - 用于接收后台Agent系统的Office操作指令
  const initWebSocket = (urlIndex = 0) => {
    if (urlIndex >= wsUrls.length) {
      console.error('❌ 所有WebSocket连接尝试都失败了')
      messageApi.error('无法连接到Office服务器')
      return
    }
    
    const wsUrl = wsUrls[urlIndex]
    console.log(`🚀 尝试连接Office WebSocket服务器 (${urlIndex + 1}/${wsUrls.length}): ${wsUrl}`)
    console.log('🔍 当前Agent状态:', { agentId, agentInitialized })
    
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      
      // 添加连接超时检测
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error('⏰ WebSocket连接超时')
          ws.close()
        }
      }, 10000) // 10秒超时
      
      ws.onopen = () => {
        console.log('🔗 Office WebSocket连接已建立')
        
        // 只有当agentId存在时才发送注册消息
        if (agentId) {
          const registerMessage = {
            type: 'register',
            agent_id: agentId
          }
          
          console.log('📝 发送Agent注册消息:', registerMessage, '(Agent初始化状态:', agentInitialized, ')')
          console.log(`🆔 当前EditorPanel使用的Agent ID: ${agentId}`)
          ws.send(JSON.stringify(registerMessage))
        } else {
          console.log('⏳ agentId为空，等待Agent系统初始化后再注册WebSocket连接')
        }
      }
      
      ws.onmessage = (event) => {
        console.log('📨 收到WebSocket消息:', event.data)
        try {
          const message = JSON.parse(event.data)
          
          if (message.type === 'register_success') {
            console.log('✅ Agent注册成功:', message)
            setWsConnected(true)
            messageApi.success('Office服务连接成功')
          } else if (message.type === 'office_operation') {
            console.log('🔧 收到Office操作指令:', message)
            handleOfficeCommand(message)
          } else {
            console.log('📩 收到其他类型消息:', message)
          }
        } catch (error) {
          console.error('❌ 解析WebSocket消息失败:', error)
          // 兼容处理：如果不是JSON格式，当作文本指令处理
          const textMessage = event.data
          setReceivedMessages(prev => [...prev.slice(-9), textMessage]) // 保留最近10条消息
          
          // 延迟1秒后插入文本，确保iframe完全加载
          setTimeout(() => {
            insertTextToDocument(textMessage)
          }, 1000)
        }
      }
      
      ws.onclose = (event) => {
        console.log('🔌 Office WebSocket连接已关闭:', event.code, event.reason)
        setWsConnected(false)
        messageApi.warning('Office服务连接断开')
        
        // 5秒后尝试重连
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            console.log('🔄 尝试重新连接Office WebSocket...')
            initWebSocket()
          }
        }, 5000)
      }
      
      ws.onerror = (error) => {
        console.error(`❌ Office WebSocket错误 (${wsUrl}):`, error)
        // 如果当前连接失败，尝试下一个URL
        if (urlIndex + 1 < wsUrls.length) {
          console.log('🔄 尝试下一个WebSocket地址...')
          setTimeout(() => {
            initWebSocket(urlIndex + 1)
          }, 1000)
        } else {
          messageApi.error('Office服务连接错误')
        }
      }
      
    } catch (error) {
      console.error('❌ Office WebSocket初始化失败:', error)
      messageApi.error('无法连接到Office服务')
    }
  }
  
  // 处理来自后台Agent的Office操作指令
  const handleOfficeCommand = (message: any) => {
    console.log('🔧 处理Office操作指令:', message)
    
    const { operation, data, agent_id } = message
    console.log(`📋 操作: ${operation}, Agent ID: ${agent_id}`)
    
    // 检查agent_id是否匹配当前前端的agentId
    console.log(`🔍 Agent ID比较: 消息中的=${agent_id}, 当前前端的=${agentId}`)
    
    if (!agentId) {
      console.log(`⚠️ 当前前端agentId为空，忽略Office指令`)
      return
    }
    
    if (agent_id && agent_id !== agentId) {
      console.log(`⚠️ 忽略不匹配的Agent指令: ${agent_id} !== ${agentId}`)
      return
    }
    
    switch (operation) {
      case 'insert_text':
        if (data && data.text) {
          setReceivedMessages(prev => [...prev.slice(-9), `插入文本: ${data.text.substring(0, 20)}...`]) // 保留最近10条消息
          insertTextToDocument(data.text)
        }
        break
      
      case 'search_and_replace':
        if (data && data.search_text) {
          setReceivedMessages(prev => [...prev.slice(-9), `替换'${data.search_text}'为'${data.replace_text}'`])
          searchAndReplace(data.search_text, data.replace_text)
        }
        break
        
      case 'search_highlight':
        if (data && data.search_text) {
          setReceivedMessages(prev => [...prev.slice(-9), `高亮'${data.search_text}'`])
          searchAndHighlight(data.search_text, data.highlight_color)
        }
        break

      case 'format_text':
        if (data && data.format_options) {
          setReceivedMessages(prev => [...prev.slice(-9), `格式化文本`])
          formatText(data.format_options)
        }
        break

      case 'goto_bookmark':
        if (data && data.bookmark_name) {
          setReceivedMessages(prev => [...prev.slice(-9), `跳转到书签'${data.bookmark_name}'`])
          gotoBookmark(data.bookmark_name)
        }
        break
        
      case 'insert_bookmark':
        if (data && data.bookmark_name) {
          setReceivedMessages(prev => [...prev.slice(-9), `插入书签'${data.bookmark_name}'`])
          insertBookmark(data.bookmark_name)
        }
        break
      
      case 'call_raw_command':
        if (data && iframeRef.current) {
          // 如果文档尚未就绪，则延迟1秒后再次尝试发送此指令
          if (!documentReady) {
            console.log('⏳ 文档尚未就绪，1秒后将重试原始指令:', data.MessageId);
            setTimeout(() => {
              console.log('🔄 重试发送原始指令:', data.MessageId);
              iframeRef.current?.contentWindow?.postMessage(data, collaboraUrl);
            }, 1000);
            return;
          }

          const messageId = data.MessageId || '未知指令';
          setReceivedMessages(prev => [...prev.slice(-9), `原始指令: ${messageId}`]);
          console.log('🔧 执行原始指令:', data);
          iframeRef.current.contentWindow?.postMessage(data, collaboraUrl);
        }
        break;
      case 'call_python_script':
        if (data && iframeRef.current) {
          // 如果文档尚未就绪，则延迟1秒后再次尝试发送此指令
          if (!documentReady) {
            console.log('⏳ 文档尚未就绪，1秒后将重试原始指令:', data.MessageId);
            setTimeout(() => {
              console.log('🔄 重试发送原始指令:', data.MessageId);
              iframeRef.current?.contentWindow?.postMessage(data, collaboraUrl);
            }, 1000);
            return;
          }

          // const messageId = data.MessageId || '未知指令';
          // setReceivedMessages(prev => [...prev.slice(-9), `原始指令: ${messageId}`]);
          // console.log('🔧 执行python脚本:', data);
          // iframeRef.current.contentWindow?.postMessage(data, collaboraUrl);


          // 将后台参数转换为LibreOffice UNO API格式
          const convertedParams: any = {}
          if (data.params) {
            Object.keys(data.params).forEach(key => {
              const value = data.params[key]
              if (typeof value === 'string') {
                convertedParams[key] = {'type': 'string', 'value': value}
              } else if (typeof value === 'number') {
                convertedParams[key] = {'type': Number.isInteger(value) ? 'long' : 'double', 'value': value}
              } else if (typeof value === 'boolean') {
                convertedParams[key] = {'type': 'boolean', 'value': value}
              } else {
                convertedParams[key] = {'type': 'string', 'value': String(value)}
              }
            })
          }

          const officialFormat = {
            'MessageId': 'CallPythonScript',
            'SendTime': Date.now(),
            'ScriptFile': 'office_api.py',
            'Function': data.cmd,
            'Values': convertedParams
          }
          // setReceivedMessages(prev => [...prev.slice(-9), '🎯 测试CallPythonScript'])
          
          try {
            iframeRef.current.contentWindow?.postMessage(JSON.stringify({'MessageId': 'Host_PostmessageReady'}), '*')
            iframeRef.current.contentWindow?.postMessage(JSON.stringify(officialFormat), collaboraUrl)
            
            // messageApi.info('✅ 已发送CallPythonScript调用，请观察控制台和文档响应！')
          } catch (error) {
            console.error('❌ 发送CallPythonScript失败:', error)
            messageApi.error('发送Python脚本调用失败')
          }

          // const officialFormat = {
          //   'MessageId': 'CallPythonScript',
          //   'SendTime': Date.now(),
          //   'ScriptFile': 'office_api.py',
          //   'Function': 'insert_text',
          //   'Values': {
          //     'text': {'type': 'string', 'value': data.text || '默认测试文本'},
          //     'font_name': {'type': 'string', 'value': data.font_name || 'SimSun'},
          //     'font_color': {'type': 'string', 'value': data.font_color || 'black'},
          //     'font_size': {'type': 'long', 'value': data.font_size || 12}
          //   }
          // }
          // setReceivedMessages(prev => [...prev.slice(-9), '🎯 测试CallPythonScript'])
          
          // try {
          //   iframeRef.current.contentWindow?.postMessage(JSON.stringify({'MessageId': 'Host_PostmessageReady'}), '*')
          //   iframeRef.current.contentWindow?.postMessage(JSON.stringify(officialFormat), collaboraUrl)
            
          //   messageApi.info('✅ 已发送CallPythonScript调用，请观察控制台和文档响应！')
          // } catch (error) {
          //   console.error('❌ 发送CallPythonScript失败:', error)
          //   messageApi.error('发送Python脚本调用失败')
          // }

        }
        break;      
      default:
        console.warn('❌ 未知的Office操作:', operation)
    }
  }
  
  // Helper to convert color to UNO format (decimal integer BGR)
  const getColorUnoValue = (colorStr: string): number => {
    // Standard color names
    const colorMap: { [key: string]: string } = {
        'black': '#000000', 'white': '#FFFFFF', 'red': '#FF0000', 'green': '#00FF00', 'blue': '#0000FF',
        'yellow': '#FFFF00', 'cyan': '#00FFFF', 'magenta': '#FF00FF', 'silver': '#C0C0C0', 'gray': '#808080',
        'maroon': '#800000', 'olive': '#808000', 'purple': '#800080', 'teal': '#008080', 'navy': '#000080'
    };

    let hex = colorMap[colorStr.toLowerCase()] || colorStr;
    
    if (hex.startsWith('#')) {
      hex = hex.substring(1);
    }
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    if (hex.length !== 6) {
      console.warn(`Invalid color format: ${colorStr}. Defaulting to yellow.`);
      return 16776960; // Default to yellow in BGR
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Convert RGB to BGR integer
    return (b << 16) | (g << 8) | r;
  };
  
  // 向Collabora CODE插入文本 - 使用官方API
  const insertTextToDocument = (text: string) => {
    if (!iframeRef.current) {
      console.log('⏳ iframe未准备好，暂存消息:', text)
      return
    }
    
    try {
      const timestamp = new Date().toLocaleTimeString()
      const insertText = `[${timestamp}] Agent指令: ${text}\n`
      
      console.log('📝 使用官方API插入文本:', insertText.trim())
      
      // 方法1: 使用官方推荐的Action_Paste（剪贴板方式）
      const pasteMessage = {
        MessageId: 'Action_Paste',
        SendTime: Date.now(),
        Values: {
          Mimetype: 'text/plain;charset=utf-8',
          Data: insertText
        }
      }
      
      console.log('📋 发送Action_Paste命令:', pasteMessage)
      iframeRef.current.contentWindow?.postMessage(pasteMessage, 'https://powerai.cc:5102')
      
      // 方法2: 使用官方推荐的Send_UNO_Command + .uno:InsertText
      setTimeout(() => {
        const unoMessage = {
          MessageId: 'Send_UNO_Command',
          SendTime: Date.now(),
          Values: {
            Command: '.uno:InsertText',
            Args: {
              Text: {
                type: 'string',
                value: insertText
              }
            }
          }
        }
        
        console.log('🔧 发送Send_UNO_Command:', unoMessage)
        iframeRef.current?.contentWindow?.postMessage(unoMessage, 'https://powerai.cc:5102')
      }, 100)
      
      // 方法3: 尝试使用CallPythonScript（如文档所示）
      setTimeout(() => {
        const pythonScript = {
          MessageId: 'CallPythonScript',
          SendTime: Date.now(),
          Values: {
            ScriptName: 'InsertText.py',
            Function: 'InsertText',
            Args: [insertText]
          }
        }
        
        console.log('🐍 发送CallPythonScript:', pythonScript)
        iframeRef.current?.contentWindow?.postMessage(pythonScript, 'https://powerai.cc:5102')
      }, 200)
      
    } catch (error) {
      console.error('❌ 插入文本到文档失败:', error)
    }
  }
  
  // 发送Host_PostmessageReady消息 - 官方要求的初始化消息
  const sendHostReady = () => {
    if (!iframeRef.current) return
    
    const readyMessage = {
      MessageId: 'Host_PostmessageReady',
      SendTime: Date.now(),
      Values: {}
    }
    
    console.log('🚀 向Collabora CODE发送Host_PostmessageReady:', readyMessage)
    // 注意：必须发送到正确的origin
    iframeRef.current.contentWindow?.postMessage(readyMessage, 'https://powerai.cc:5102')
    
    // 注释掉错误的WOPI服务器postMessage，因为iframe的origin是5102不是5103
    // setTimeout(() => {
    //   iframeRef.current?.contentWindow?.postMessage(readyMessage, 'https://powerai.cc:5103')
    // }, 100)
    
    // 最后尝试通配符（按官方文档的一些示例）
    setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(readyMessage, '*')
    }, 200)
  }
  
  // 监听agentId变化，输出调试信息
  useEffect(() => {
    console.log('🔍 EditorPanel - agentId发生变化:', agentId)
    console.log('🔍 EditorPanel - agentInitialized状态:', agentInitialized)
    console.log('🔍 EditorPanel - 将使用的Agent ID:', agentId || '(空)')
  }, [agentId, agentInitialized])

  // 监听agentId变化，当agentId可用时才初始化WebSocket
  useEffect(() => {
    if (agentId) {
      console.log('📝 Agent ID已可用，初始化WebSocket连接:', agentId)
      initWebSocket()
      // 注意：不再重新加载iframe，文档只在首次加载时创建
    } else {
      console.log('⏳ 等待Agent ID...')
    }
  }, [agentId])

  // 组件挂载时的初始化
  useEffect(() => {
    console.log('📝 EditorPanel已加载')
    console.log('🔍 当前Agent状态:', { agentId, agentInitialized })
    
    // 监听来自Collabora CODE的消息
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        console.log('📩 收到来自Collabora CODE的消息:', data)
        
        // 根据消息类型处理文档状态
        if (data.MessageId === 'Action_Load_Resp' || data.MessageId === 'View_Added' || (data.MessageId === 'App_LoadingStatus' && data.Values?.Status === 'Document_Loaded')) {
          if (!documentReady) { // 仅在状态从未就绪 -> 就绪时打印日志
            console.log('✅✅✅ 文档已完全准备就绪，可以接收指令！✅✅✅')
            setDocumentReady(true)
          }
          // 文档加载完成后，再次发送Host_PostmessageReady确保通信建立
          setTimeout(() => {
            sendHostReady()
          }, 1000)
        }
        
        // 专门处理Python脚本相关的消息
        if (data.MessageId === 'CallPythonScript-Result') {
          console.log('🐍 ------CallPythonScript响应:', data)
          
          // 通用的Python脚本响应处理
          const responseText = typeof data.Values === 'string' ? data.Values : JSON.stringify(data.Values)
          console.log('🐍 详细响应内容:', responseText)
          setReceivedMessages(prev => [...prev.slice(-9), `Python响应: ${responseText}`])
            
          // 如果包含ERROR，显示错误消息
          if (responseText.includes('ERROR')) {
            console.error('❌ Python API执行出错:', responseText)
            messageApi.error(`Python API执行出错: ${responseText}`)
          } else if (responseText.includes('SUCCESS')) {
            console.log('✅ Python API执行成功:', responseText)
            messageApi.success(`Python API执行成功: ${responseText}`)
          } else {
            console.warn('⚠️ Python API响应未知格式:', responseText)
            messageApi.info(`Python API响应: ${responseText}`)
          }
        }
        
        if (data.MessageId === 'Send_UNO_Command_Resp') {
          console.log('🔧 UNO Command响应:', data)
          setReceivedMessages(prev => [...prev.slice(-9), `UNO响应: ${JSON.stringify(data.Values)}`])
        }
        
        if (data.MessageId === 'Execute_Script_Resp') {
          console.log('📜 Execute Script响应:', data)
          setReceivedMessages(prev => [...prev.slice(-9), `Script响应: ${JSON.stringify(data.Values)}`])
        }
        
        // 处理错误消息
        if (data.MessageId && data.MessageId.includes('Error')) {
          console.error('❌ Collabora错误消息:', data)
          setReceivedMessages(prev => [...prev.slice(-9), `错误: ${data.MessageId}`])
          messageApi.error(`Collabora错误: ${data.MessageId}`)
        }
        
      } catch (error) {
        console.log('📩 收到来自iframe的原始消息:', event.data)
        // 如果是字符串消息，也记录下来
        if (typeof event.data === 'string') {
          setReceivedMessages(prev => [...prev.slice(-9), `原始消息: ${event.data.substring(0, 50)}...`])
        }
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    // 清理函数
    return () => {
      window.removeEventListener('message', handleMessage)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // 监听agentId变化，重新注册WebSocket连接
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && agentId) {
      console.log('🔄 Agent ID已更新，重新注册WebSocket连接:', agentId)
      
      const registerMessage = {
        type: 'register',
        agent_id: agentId
      }
      wsRef.current.send(JSON.stringify(registerMessage))
    }
  }, [agentId])
  
  // 注意：我们现在直接插入消息，不再等待documentReady状态

  // 使用 Collabora CODE 的 WOPI 协议
  const createNewDocument = () => {
    // 使用固定的文档ID，确保文档只加载一次，所有Agent共享同一个文档
    const fileId = 'empty.docx' // 固定使用默认文档
    
    const accessToken = 'demo_token'
    const wopiSrc = `${wopiServerUrl}/wopi/files/${fileId}`
    
    // 使用新版本 Collabora CODE 的正确路径，添加中文语言支持
    const url = `${collaboraUrl}/browser/dist/cool.html?` +
      `WOPISrc=${encodeURIComponent(wopiSrc)}&` +
      `access_token=${accessToken}&` +
      `lang=zh-CN`
    
    // 日志只在首次生成时打印，避免重复打印
    if (!(window as any)._wopiUrlLogged) {
      console.log('🔗 生成的 WOPI URL (HTTPS):', url)
      console.log('📋 WOPI Source:', wopiSrc)
      console.log('🔑 Access Token:', accessToken)
      console.log('📄 使用固定文档ID:', fileId)
      ;(window as any)._wopiUrlLogged = true
    }
    
    return url
  }

  // 使用 useMemo 优化 URL 的生成，确保只在组件首次挂载时计算一次
  const wopiUrl = useMemo(() => createNewDocument(), [])

  const handleIframeError = () => {
    setIframeError(true)
    messageApi.error('Collabora CODE 加载失败')
  }

  const handleReload = () => {
    setIframeError(false)
    setDocumentReady(false)
    setIframeKey(prev => prev + 1)
  }

  const handleIframeLoad = () => {
    setIframeError(false)
    setDocumentReady(true)
    messageApi.success('文档编辑器加载成功')
    
    // 延迟发送Host_PostmessageReady消息，确保iframe完全加载
    setTimeout(() => {
      sendHostReady()
    }, 2000)
  }

  // --- 新增Office操作函数 ---

  const searchAndReplace = (searchText: string, replaceText: string | undefined) => {
    if (!iframeRef.current) return;
    const command = {
      MessageId: 'Send_UNO_Command',
      SendTime: Date.now(),
      Values: {
        Command: '.uno:ExecuteSearch',
        Args: {
          SearchItem: {
            type: '[]com.sun.star.beans.PropertyValue',
            value: [
              { Name: 'SearchText', Value: { type: 'string', value: searchText } },
              { Name: 'ReplaceText', Value: { type: 'string', value: replaceText || '' } },
              { Name: 'SearchAll', Value: { type: 'boolean', value: true } },
            ],
          },
        },
      },
    };
    console.log('🔄 执行搜索和替换:', command);
    iframeRef.current.contentWindow?.postMessage(command, collaboraUrl);
  };

  const searchAndHighlight = (searchText: string, highlightColor: string = 'yellow') => {
    if (!iframeRef.current) return;
    const colorValue = getColorUnoValue(highlightColor);

    const command = {
      MessageId: 'Send_UNO_Command',
      SendTime: Date.now(),
      Values: {
        Command: '.uno:ExecuteSearch',
        Args: {
          SearchItem: {
            type: '[]com.sun.star.beans.PropertyValue',
            value: [
              { Name: 'SearchText', Value: { type: 'string', value: searchText } },
              { Name: 'SearchAll', Value: { type: 'boolean', value: true } },
              // Action after finding: apply background color
              { Name: 'Action', Value: { type: 'short', value: 2 } }, // 2 = Replace
              { Name: 'CharBackColor', Value: { type: 'long', value: colorValue } },
            ],
          },
        },
      },
    };
    
    console.log('🎨 搜索并高亮:', command);
    iframeRef.current.contentWindow?.postMessage(command, collaboraUrl);
  };

  const formatText = (options: any) => {
    if (!iframeRef.current) return;

    const sendUno = (command: string, args: object) => {
      const message = {
        MessageId: 'Send_UNO_Command',
        SendTime: Date.now(),
        Values: { Command: command, Args: args },
      };
      console.log(`🎨 应用格式化 ${command}:`, message);
      iframeRef.current?.contentWindow?.postMessage(message, collaboraUrl);
    };

    if (options.font_name) {
      sendUno('.uno:FontName', { Name: { type: 'string', value: options.font_name } });
    }
    if (options.font_size) {
      sendUno('.uno:FontHeight', { Height: { type: 'float', value: options.font_size } });
    }
    if (options.color) {
      sendUno('.uno:Color', { Color: { type: 'long', value: getColorUnoValue(options.color) } });
    }
    if (options.bold) {
      sendUno('.uno:Bold', {});
    }
    if (options.italic) {
      sendUno('.uno:Italic', {});
    }
    if (options.underline) {
      sendUno('.uno:Underline', {});
    }
  };

  const insertBookmark = (bookmarkName: string) => {
    if (!iframeRef.current) return;
    const command = {
      MessageId: 'Send_UNO_Command',
      SendTime: Date.now(),
      Values: {
        Command: '.uno:InsertBookmark',
        Args: { Name: { type: 'string', value: bookmarkName } },
      },
    };
    console.log('🔖 插入书签:', command);
    iframeRef.current.contentWindow?.postMessage(command, collaboraUrl);
  };

  const gotoBookmark = (bookmarkName: string) => {
    if (!iframeRef.current) return;
    const command = {
        MessageId: 'Navigate_To_Bookmark',
        SendTime: Date.now(),
        Values: { Bookmark: bookmarkName }
    };
    console.log('🚀 跳转到书签:', command);
    iframeRef.current.contentWindow?.postMessage(command, collaboraUrl);
  };

  // 测试CallPythonScript调用office_api.py - 使用社区验证的成功格式
  const testCallPythonScript = () => {
    if (!iframeRef.current) {
      console.log('❌ iframe未准备好')
      messageApi.error('文档编辑器未准备好')
      return
    }

    console.log('🐍 测试CallPythonScript - 使用社区验证的成功格式')
    
    // 🎯 方式1: 官方SDK文档的精确格式 (最重要的尝试)
    const officialFormat = {
      'MessageId': 'CallPythonScript',
      'SendTime': Date.now(),
      'ScriptFile': 'office_api.py',
      'Function': 'hello',
      'Values': null
    }
    console.log('📤 方式1 - 官方SDK格式:', officialFormat)
    setReceivedMessages(prev => [...prev.slice(-9), '🎯 测试官方SDK格式'])
    
    try {
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({'MessageId': 'Host_PostmessageReady'}), '*')
      iframeRef.current.contentWindow?.postMessage(JSON.stringify(officialFormat), collaboraUrl)
      
      messageApi.info('✅ 已发送CallPythonScript调用，请观察控制台和文档响应！')
    } catch (error) {
      console.error('❌ 发送CallPythonScript失败:', error)
      messageApi.error('发送Python脚本调用失败')
    }
  }

  // 测试获取文档内容
  const testGetDocumentContent = () => {
    if (!iframeRef.current) {
      console.log('❌ iframe未准备好')
      messageApi.error('文档编辑器未准备好')
      return
    }

    console.log('📄 测试获取文档内容 - 调用get_document_content函数')
    
    const getContentFormat = {
      'MessageId': 'CallPythonScript',
      'SendTime': Date.now(),
      'ScriptFile': 'office_api.py',
      'Function': 'get_document_content',
      'Values': null
    }
    console.log('📤 获取文档内容格式:', getContentFormat)
    setReceivedMessages(prev => [...prev.slice(-9), '📄 测试获取文档内容'])
    
    try {
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({'MessageId': 'Host_PostmessageReady'}), '*')
      iframeRef.current.contentWindow?.postMessage(JSON.stringify(getContentFormat), collaboraUrl)
      
      messageApi.info('✅ 已发送获取文档内容请求，请观察控制台和文档响应！')
    } catch (error) {
      console.error('❌ 发送获取文档内容请求失败:', error)
      messageApi.error('发送获取文档内容请求失败')
    }
  }

  // 测试UNO连接和替代调用方式
  const testUnoConnection = () => {
    if (!iframeRef.current) {
      console.log('❌ iframe未准备好')
      messageApi.error('文档编辑器未准备好')
      return
    }

    console.log('🔧 测试多种Python脚本调用方式')
    
    // 方式A: callPythonScript（小写）
    const callPythonMessage = {
      MessageId: 'CallPythonScript',
      SendTime: Date.now(),
      Values: {
        ScriptName: 'office_api.py',
        Function: 'test_uno_connection',
        Args: []
      }
    }
    
    // 方式B: 使用UNO RunMacro命令
    const unoMacroMessage = {
      MessageId: 'Send_UNO_Command',
      SendTime: Date.now(),
      Values: {
        Command: '.uno:RunMacro',
        Args: {
          Script: {
            type: 'string',
            value: 'vnd.sun.star.script:office_api.hello?language=Python&location=share'
          }
        }
      }
    }
    // const unoMacroMessage = {
    //   MessageId: 'Send_UNO_Command',
    //   SendTime: Date.now(),
    //   Values: {
    //     Command: 'vnd.sun.star.script:office_api.hello?language=Python&location=share',
    //     Args: {}
    //   }
    // }
    
    // 方式C: 直接执行脚本URL
    const scriptUrlMessage = {
      MessageId: 'Execute_Script',
      SendTime: Date.now(),
      Values: {
        ScriptURL: 'vnd.sun.star.script:office_api.hello?language=Python&location=share'
      }
    }
    
    console.log('📤 方式A - CallPythonScript:', callPythonMessage)
    setReceivedMessages(prev => [...prev.slice(-9), '测试A: CallPythonScript方式'])
    
    try {
      iframeRef.current?.contentWindow?.postMessage(unoMacroMessage, collaboraUrl)
      // iframeRef.current.contentWindow?.postMessage(callPythonMessage, collaboraUrl)
      
      // setTimeout(() => {
      //   console.log('📤 方式B - UNO RunMacro:', unoMacroMessage)
      //   setReceivedMessages(prev => [...prev.slice(-9), '测试B: UNO RunMacro方式'])
      //   iframeRef.current?.contentWindow?.postMessage(unoMacroMessage, collaboraUrl)
      // }, 1000)
      
      // setTimeout(() => {
      //   console.log('📤 方式C - Execute_Script:', scriptUrlMessage)
      //   setReceivedMessages(prev => [...prev.slice(-9), '测试C: Execute_Script方式'])
      //   iframeRef.current?.contentWindow?.postMessage(scriptUrlMessage, collaboraUrl)
      // }, 2000)
      
      messageApi.info('已发送多种Python脚本调用测试，请检查文档和日志')
    } catch (error) {
      console.error('❌ 发送测试失败:', error)
            messageApi.error('发送测试失败')
    }
  }

  // 直接宏调用测试 - 使用最简单的方式
  const testDirectMacroCall = () => {
    if (!iframeRef.current) {
      console.log('❌ iframe未准备好')
      messageApi.error('文档编辑器未准备好')
      return
    }

    console.log('🎯 直接测试宏调用 - 尝试正确的Python脚本调用格式')
    
    // 方法1: 使用标准的UNO宏调用
    const macroCallMessage1 = {
      MessageId: 'Send_UNO_Command',
      SendTime: Date.now(),
      Values: {
        Command: '.uno:RunMacro',
        Args: {
          MacroName: {
            type: 'string',
            value: 'office_api.hello'  // 直接使用模块名.函数名
          }
        }
      }
    }
    
    // 方法2: 尝试清除日志文件并重新创建模块加载
    const clearLogMessage = {
      MessageId: 'Send_UNO_Command',
      SendTime: Date.now(),
      Values: {
        Command: '.uno:ExecuteMacro',  // 尝试不同的命令
        Args: {
          Script: {
            type: 'string',
            value: 'office_api.hello'
          }
        }
      }
    }
    
    console.log('📤 方法1 - RunMacro:', macroCallMessage1)
    setReceivedMessages(prev => [...prev.slice(-9), '测试1: RunMacro直接调用'])
    
    try {
      iframeRef.current.contentWindow?.postMessage(macroCallMessage1, collaboraUrl)
      
      setTimeout(() => {
        console.log('📤 方法2 - ExecuteMacro:', clearLogMessage)
        setReceivedMessages(prev => [...prev.slice(-9), '测试2: ExecuteMacro'])
        iframeRef.current?.contentWindow?.postMessage(clearLogMessage, collaboraUrl)
      }, 1000)
      
      messageApi.info('已发送宏调用测试，观察是否有响应')
    } catch (error) {
      console.error('❌ 发送宏调用测试失败:', error)
      messageApi.error('发送宏调用测试失败')
    }
  }

  // 测试搜索hello字符串并设置格式 - 使用官方正确格式
  const testSearchHello = () => {
    if (!iframeRef.current) {
      console.log('❌ iframe未准备好')
      messageApi.error('文档编辑器未准备好')
      return
    }

    console.log('🔍 测试搜索hello字符串并设置格式 - 使用官方正确格式')
    
    // 🎯 根据官方示例，使用正确的参数格式：每个参数都有type和value
    const searchHelloFormat = {
      'MessageId': 'CallPythonScript',
      'SendTime': Date.now(),
      'ScriptFile': 'office_api.py',
      'Function': 'search_and_format_text',
      'Values': {
        'search_text': {'type': 'string', 'value': 'hello'},
        'highlight_color': {'type': 'string', 'value': 'red'},
        'font_name': {'type': 'string', 'value': '宋体'},
        'font_size': {'type': 'long', 'value': 18}
      }
    }
    
    console.log('📤 搜索hello格式（官方正确格式）:', searchHelloFormat)
    setReceivedMessages(prev => [...prev.slice(-9), '🔍 官方正确格式-搜索hello'])
    
    try {
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({'MessageId': 'Host_PostmessageReady'}), '*')
      iframeRef.current.contentWindow?.postMessage(JSON.stringify(searchHelloFormat), collaboraUrl)
      
      messageApi.info('✅ 已发送官方正确格式的搜索hello请求！')
    } catch (error) {
      console.error('❌ 发送搜索hello请求失败:', error)
      messageApi.error('发送搜索hello请求失败')
    }
  }

  // 测试章节选中功能
  const testSelectChapter = () => {
    if (!iframeRef.current) {
      console.log('❌ iframe未准备好')
      messageApi.error('文档编辑器未准备好')
      return
    }

    console.log('📝 测试章节选中功能 - 选中章节2.1')
    
    // 使用官方正确格式调用select_chapter函数
    const selectChapterFormat = {
      'MessageId': 'CallPythonScript',
      'SendTime': Date.now(),
      'ScriptFile': 'office_api.py',
      'Function': 'select_chapter',
      'Values': {
        'chapter': {'type': 'string', 'value': '2.1'}
      }
    }
    
    console.log('📤 章节选中格式（官方正确格式）:', selectChapterFormat)
    setReceivedMessages(prev => [...prev.slice(-9), '📝 测试章节选中2.1'])
    
    try {
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({'MessageId': 'Host_PostmessageReady'}), '*')
      iframeRef.current.contentWindow?.postMessage(JSON.stringify(selectChapterFormat), collaboraUrl)
      
      messageApi.info('✅ 已发送章节选中请求！')
    } catch (error) {
      console.error('❌ 发送章节选中请求失败:', error)
      messageApi.error('发送章节选中请求失败')
    }
  }

  // 测试表格插入功能
  const testInsertTable = () => {
    if (!iframeRef.current) {
      console.log('❌ iframe未准备好')
      messageApi.error('文档编辑器未准备好')
      return
    }

    console.log('📊 测试表格插入功能 - 插入员工信息表')
    
    // 准备测试数据
    const tableData = [
      ["姓名", "年龄", "部门", "薪资"],
      ["张三", "25", "技术部", "15000"],
      ["李四", "30", "市场部", "12000"],
      ["王五", "28", "财务部", "11000"]
    ]
    
    // 使用官方正确格式调用insert_table函数
    const insertTableFormat = {
      'MessageId': 'CallPythonScript',
      'SendTime': Date.now(),
      'ScriptFile': 'office_api.py',
      'Function': 'insert_table',
      'Values': {
        'rows': {'type': 'long', 'value': 4},
        'columns': {'type': 'long', 'value': 4},
        'table_title': {'type': 'string', 'value': '测试表格 - 员工信息表'},
        'cell_data': {'type': 'string', 'value': JSON.stringify(tableData)},
        'border_style': {'type': 'string', 'value': 'thick'},
        'header_style': {'type': 'boolean', 'value': true},
        'font_name': {'type': 'string', 'value': 'SimSun'},
        'font_size': {'type': 'long', 'value': 12},
        'column_widths': {'type': 'string', 'value': JSON.stringify([3.0, 2.0, 3.0, 2.5])}
      }
    }
    
    console.log('📤 表格插入格式（官方正确格式）:', insertTableFormat)
    setReceivedMessages(prev => [...prev.slice(-9), '📊 测试表格插入'])
    
    try {
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({'MessageId': 'Host_PostmessageReady'}), '*')
      iframeRef.current.contentWindow?.postMessage(JSON.stringify(insertTableFormat), collaboraUrl)
      
      messageApi.info('✅ 已发送表格插入请求！')
    } catch (error) {
      console.error('❌ 发送表格插入请求失败:', error)
      messageApi.error('发送表格插入请求失败')
    }
  }

  // 测试图片插入功能
  const testInsertImage = () => {
    if (!iframeRef.current) {
      console.log('❌ iframe未准备好')
      messageApi.error('文档编辑器未准备好')
      return
    }

    console.log('🖼️ 测试图片插入功能 - 插入测试图片')
    
    // 使用官方正确格式调用insert_image函数
    const insertImageFormat = {
      'MessageId': 'CallPythonScript',
      'SendTime': Date.now(),
      'ScriptFile': 'office_api.py',
      'Function': 'insert_image',
      'Values': {
        'image_path': {'type': 'string', 'value': 'https://powerai.cc:5103/1.png'},
        'image_title': {'type': 'string', 'value': '测试图片 - 本地1.png图片'},
        'width': {'type': 'double', 'value': 8.0},
        'height': {'type': 'double', 'value': 5.0},
        'anchor_type': {'type': 'string', 'value': 'at_paragraph'},
        'alignment': {'type': 'string', 'value': 'center'},
        'keep_aspect_ratio': {'type': 'boolean', 'value': false}
      }
    }
    
    console.log('📤 图片插入格式（官方正确格式）:', insertImageFormat)
    setReceivedMessages(prev => [...prev.slice(-9), '🖼️ 测试图片插入'])
    
    try {
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({'MessageId': 'Host_PostmessageReady'}), '*')
      iframeRef.current.contentWindow?.postMessage(JSON.stringify(insertImageFormat), collaboraUrl)
      
      messageApi.info('✅ 已发送图片插入请求！')
    } catch (error) {
      console.error('❌ 发送图片插入请求失败:', error)
      messageApi.error('发送图片插入请求失败')
    }
  }

  // 综合测试新功能
  const testNewFunctions = () => {
    if (!iframeRef.current) {
      console.log('❌ iframe未准备好')
      messageApi.error('文档编辑器未准备好')
      return
    }

    console.log('🎯 开始综合测试新功能...')
    messageApi.info('开始综合测试：标题→文字→表格→图片')
    
    // 第一步：插入标题
    setTimeout(() => {
      const titleFormat = {
        'MessageId': 'CallPythonScript',
        'SendTime': Date.now(),
        'ScriptFile': 'office_api.py',
        'Function': 'insert_title',
        'Values': {
          'title': {'type': 'string', 'value': '新功能测试报告'},
          'outline_level': {'type': 'long', 'value': 1},
          'font_size': {'type': 'long', 'value': 16},
          'font_color': {'type': 'string', 'value': 'blue'},
          'font_bold': {'type': 'boolean', 'value': true}
        }
      }
      
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({'MessageId': 'Host_PostmessageReady'}), '*')
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(titleFormat), collaboraUrl)
      console.log('✅ 第1步：插入标题')
    }, 500)
    
    // 第二步：插入说明文字
    setTimeout(() => {
      const textFormat = {
        'MessageId': 'CallPythonScript',
        'SendTime': Date.now(),
        'ScriptFile': 'office_api.py',
        'Function': 'insert_text',
        'Values': {
          'text': {'type': 'string', 'value': '本文档展示了新开发的insert_table和insert_image函数的功能。下面将展示各种表格和图片插入效果。'},
          'font_name': {'type': 'string', 'value': 'SimSun'},
          'font_size': {'type': 'long', 'value': 12},
          'font_color': {'type': 'string', 'value': 'black'}
        }
      }
      
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(textFormat), collaboraUrl)
      console.log('✅ 第2步：插入说明文字')
    }, 2000)
    
    // 第三步：插入表格
    setTimeout(() => {
      const tableData = [
        ["功能", "状态", "测试结果"],
        ["insert_table", "✅完成", "通过"],
        ["insert_image", "✅完成", "通过"],
        ["批量数据", "✅完成", "通过"]
      ]
      
      const tableFormat = {
        'MessageId': 'CallPythonScript',
        'SendTime': Date.now(),
        'ScriptFile': 'office_api.py',
        'Function': 'insert_table',
        'Values': {
          'rows': {'type': 'long', 'value': 4},
          'columns': {'type': 'long', 'value': 3},
          'table_title': {'type': 'string', 'value': '功能测试结果汇总'},
          'cell_data': {'type': 'string', 'value': JSON.stringify(tableData)},
          'border_style': {'type': 'string', 'value': 'thick'},
          'header_style': {'type': 'boolean', 'value': true},
          'font_size': {'type': 'long', 'value': 11}
        }
      }
      
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(tableFormat), collaboraUrl)
      console.log('✅ 第3步：插入测试表格')
    }, 4000)
    
    // 第四步：插入图片
    setTimeout(() => {
      const imageFormat = {
        'MessageId': 'CallPythonScript',
        'SendTime': Date.now(),
        'ScriptFile': 'office_api.py',
        'Function': 'insert_image',
        'Values': {
          'image_path': {'type': 'string', 'value': 'https://powerai.cc:5103/1.png'},
          'image_title': {'type': 'string', 'value': '测试完成 - 本地1.png图片'},
          'width': {'type': 'double', 'value': 10.0},
          'height': {'type': 'double', 'value': 5.0},
          'anchor_type': {'type': 'string', 'value': 'at_paragraph'},
          'alignment': {'type': 'string', 'value': 'center'}
        }
      }
      
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(imageFormat), collaboraUrl)
      console.log('✅ 第4步：插入测试图片')
      messageApi.success('🎉 综合测试完成！请检查文档内容')
    }, 6000)
    
    setReceivedMessages(prev => [...prev.slice(-9), '🎯 开始4步综合测试'])
  }



  const items = [
    {
      key: '1',
      label: (
        <span>
          <BarChartOutlined />
          可视化分析
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 48px)' }}>
          <VisualAnalysisPanel />
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <FileTextOutlined />
          报告编制
          {/* 
          <Badge 
            dot={wsConnected} 
            status={wsConnected ? 'success' : 'error'} 
            style={{ marginLeft: '8px' }}
          />
          */}
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 48px)' }}>
          {/* WebSocket状态显示 */}
          {/* 
          <div style={{ 
            padding: '8px 16px', 
            background: wsConnected ? '#f6ffed' : '#fff2f0',
            border: `1px solid ${wsConnected ? '#b7eb8f' : '#ffccc7'}`,
            borderRadius: '6px',
            marginBottom: '8px',
            fontSize: '12px'
          }}>
            <WifiOutlined style={{ 
              color: wsConnected ? '#52c41a' : '#ff4d4f', 
              marginRight: '8px' 
            }} />
            Office服务状态: {wsConnected ? '已连接' : '已断开'} | 
            已接收指令: {receivedMessages.length} 条
            {receivedMessages.length > 0 && (
              <span style={{ marginLeft: '16px', color: '#666' }}>
                最新: {receivedMessages[receivedMessages.length - 1]}
              </span>
            )}
          </div>
          */}
          
          {/* 测试按钮区域 */}
          <div style={{ 
            padding: '8px 16px', 
            background: '#f0f2f5',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            marginBottom: '8px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>
              CallPythonScript测试 (监听CallPythonScript-Result响应):
            </span>
            <Button 
              size="small" 
              type="primary" 
              onClick={testCallPythonScript}
              disabled={!documentReady}
            >
              测试hello()
            </Button>
            <Button 
              size="small" 
              onClick={testGetDocumentContent}
              disabled={!documentReady}
            >
              获取文档内容
            </Button>
            <Button 
              size="small" 
              onClick={testInsertTable}
              disabled={!documentReady}
              type="primary"
              style={{ background: '#ff6b35', borderColor: '#ff6b35' }}
            >
              🆕测试表格插入
            </Button>
            <Button 
              size="small" 
              onClick={testInsertImage}
              disabled={!documentReady}
              type="primary"
              style={{ background: '#f39c12', borderColor: '#f39c12' }}
            >
              🆕测试图片插入
            </Button>
            <Button 
              size="small" 
              onClick={testNewFunctions}
              disabled={!documentReady}
              type="primary"
              style={{ background: '#e74c3c', borderColor: '#e74c3c' }}
            >
              🎯综合测试新功能
            </Button>
            <Button 
              size="small" 
              onClick={testSelectChapter}
              disabled={!documentReady}
              type="primary"
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              测试章节选中
            </Button>

            <span style={{ fontSize: '11px', color: '#999' }}>
              {documentReady ? '文档已就绪' : '等待文档加载...'}
            </span>
          </div>
          
          {iframeError ? (
            <div style={{ 
              padding: '24px', 
              height: 'calc(100% - 40px)', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              background: '#fafafa',
              border: '2px dashed #d9d9d9',
              borderRadius: '8px'
            }}>
              <Alert
                message="Collabora CODE 加载失败"
                description={
                  <div>
                    <p><strong>常见解决方案：</strong></p>
                    <ol>
                      <li>
                        <strong>证书问题：</strong>
                        <br />在新标签页中访问 <a href={collaboraUrl} target="_blank" rel="noopener noreferrer">{collaboraUrl}</a>
                        <br />点击"高级" → "继续访问" 接受自签名证书
                      </li>
                      <li>
                        <strong>WOPI 服务器：</strong>
                        <br />确认 WOPI 服务器正在运行: <a href={`${wopiServerUrl}/health`} target="_blank" rel="noopener noreferrer">{wopiServerUrl}/health</a>
                      </li>
                      <li>
                        <strong>Collabora CODE 服务：</strong>
                        <br />确认 Collabora CODE 服务正在运行
                      </li>
                      <li>
                        <strong>网络问题：</strong>
                        <br />检查防火墙和网络连接
                      </li>
                    </ol>
                  </div>
                }
                type="warning"
                showIcon
                style={{ marginBottom: '16px', maxWidth: '600px' }}
              />
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={handleReload}
              >
                重新加载
              </Button>
            </div>
          ) : (
            <div style={{ height: 'calc(100% - 40px)', position: 'relative' }}>
              {!documentReady && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1000,
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div>正在加载文档编辑器...</div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                key={iframeKey}
                id={uniqueId}
                src={wopiUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px'
                }}
                title="Collabora CODE 文档编辑器"
                allow="microphone; camera; geolocation; fullscreen"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-downloads"
                onError={handleIframeError}
                onLoad={handleIframeLoad}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <span>
          <SketchOutlined />
          图纸绘制
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 48px)', padding: '8px' }}>
          <CADViewer />
        </div>
      ),
    },
  ]

  return (
    <>
      {contextHolder}
      <Tabs
        defaultActiveKey="2"
        items={items}
        style={{ padding: '0 16px', height: '100%' }}
        tabBarStyle={{ marginBottom: 0 }}
      />
    </>
  )
}

export default EditorPanel 