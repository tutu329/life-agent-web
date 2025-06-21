import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Tabs, Alert, Button, message, Badge } from 'antd'
import { BarChartOutlined, FileTextOutlined, ReloadOutlined, WifiOutlined, SketchOutlined } from '@ant-design/icons'
import { useAgentContext } from '../App'
import CADViewer from './CADViewer'

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
      } catch (error) {
        console.log('📩 收到来自iframe的原始消息:', event.data)
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
        <div style={{ 
          padding: '24px', 
          height: 'calc(100vh - 120px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#fafafa',
          border: '2px dashed #d9d9d9',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center', color: '#8c8c8c' }}>
            <BarChartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <h2 style={{ color: '#1677ff', marginBottom: '8px' }}>可视化分析功能区</h2>
            <p>功能开发中，敬请期待...</p>
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <FileTextOutlined />
          报告编制
          <Badge 
            dot={wsConnected} 
            status={wsConnected ? 'success' : 'error'} 
            style={{ marginLeft: '8px' }}
          />
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 72px)' }}>
          {/* WebSocket状态显示 */}
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
        <div style={{ height: 'calc(100vh - 72px)', padding: '8px' }}>
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