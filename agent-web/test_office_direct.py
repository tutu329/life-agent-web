#!/usr/bin/env python3
"""
直接测试Office_Tool的脚本
"""

import sys
import os
import time

# 添加项目路径
sys.path.append('/home/tutu/server')
sys.path.append('/home/tutu/server/life-agent-web')

try:
    from from_server_office_tool import Office_Tool, get_websocket_manager
    # 模拟Tool_Call_Paras，因为可能导入有问题
    
    print('🚀 开始测试Office_Tool...')
    
    # 获取WebSocket管理器并检查连接状态
    ws_manager = get_websocket_manager()
    debug_info = ws_manager.debug_connections()
    print(f'📊 WebSocket连接状态: {debug_info}')
    
    # 创建Office_Tool实例
    office_tool = Office_Tool()
    
    # 模拟tool_call_paras
    class MockToolCallParas:
        def __init__(self, agent_id, tool_paras_dict):
            self.callback_agent_id = agent_id
            self.callback_tool_paras_dict = tool_paras_dict
    
    # 测试agent_id
    test_agent_id = 'test_agent_direct_' + str(int(time.time()))
    print(f'🎯 测试Agent ID: {test_agent_id}')
    
    # 创建测试参数
    tool_paras = MockToolCallParas(
        agent_id=test_agent_id,
        tool_paras_dict={
            'operation': 'insert_text',
            'content': 'Hello from direct test!'
        }
    )
    
    # 调用Office_Tool
    print('📝 调用Office_Tool...')
    result = office_tool.call(tool_paras)
    print(f'📋 结果: {result}')
    
    # 再次检查连接状态
    debug_info_after = ws_manager.debug_connections()
    print(f'📊 调用后WebSocket连接状态: {debug_info_after}')
    
except Exception as e:
    print(f'❌ 测试失败: {e}')
    import traceback
    traceback.print_exc() 