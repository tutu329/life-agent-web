#!/usr/bin/env python3
import asyncio
import websockets
import json
import ssl

async def test_websocket_connection():
    """测试WebSocket连接"""
    
    # 测试URL列表
    test_urls = [
        'wss://powerai.cc:5112',
        'ws://powerai.cc:5112'
    ]
    
    for url in test_urls:
        print(f'\n🔗 测试连接: {url}')
        
        try:
            # 配置SSL上下文（忽略证书验证）
            ssl_context = None
            if url.startswith('wss://'):
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
            
            # 尝试连接
            async with websockets.connect(url, ssl=ssl_context) as websocket:
                print(f'✅ 连接成功: {url}')
                
                # 发送注册消息
                test_agent_id = 'test_agent_' + str(int(asyncio.get_event_loop().time()))
                register_message = {
                    'type': 'register',
                    'agent_id': test_agent_id
                }
                
                print(f'📝 发送注册消息: {register_message}')
                await websocket.send(json.dumps(register_message))
                
                # 等待响应
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5)
                    print(f'📨 收到响应: {response}')
                    
                    # 解析响应
                    response_data = json.loads(response)
                    if response_data.get('type') == 'register_success':
                        print(f'✅ 注册成功: {response_data}')
                        return True
                    else:
                        print(f'⚠️ 注册失败: {response_data}')
                        
                except asyncio.TimeoutError:
                    print('⏰ 等待响应超时')
                    
        except Exception as e:
            print(f'❌ 连接失败: {e}')
            
    return False

async def main():
    print('🚀 开始WebSocket连接测试...')
    success = await test_websocket_connection()
    
    if success:
        print('\n✅ WebSocket连接测试成功')
    else:
        print('\n❌ WebSocket连接测试失败')
        print('\n可能的问题:')
        print('1. WebSocket服务器未启动')
        print('2. 端口5112被防火墙阻止')
        print('3. SSL证书问题')
        print('4. 网络连接问题')

if __name__ == '__main__':
    asyncio.run(main()) 