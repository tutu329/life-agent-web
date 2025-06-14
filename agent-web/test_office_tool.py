#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试 Office 工具的基本功能
"""

import sys
import os
import time

# 添加路径以便导入
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from from_server_office_tool import Office_Tool
from agent.tools.protocol import Tool_Call_Paras

def test_office_tool():
    """测试 Office 工具的基本功能"""
    print("🚀 开始测试 Office 工具...")
    
    # 创建 Office 工具实例
    office_tool = Office_Tool()
    
    # 等待 WebSocket 服务器启动
    print("⏳ 等待 WebSocket 服务器启动...")
    time.sleep(3)
    
    # 测试插入文本功能
    test_params = {
        'operation': 'insert_text',
        'content': '这是通过 Office_Tool 插入的测试文本。\n\n当前时间: ' + time.strftime('%Y-%m-%d %H:%M:%S')
    }
    
    # 创建工具调用参数
    tool_call_paras = Tool_Call_Paras(
        callback_tool_paras_dict=test_params,
        callback_agent_config=None,
        callback_agent_id="test_agent",
        callback_last_tool_ctx=None,
        callback_father_agent_exp=None
    )
    
    # 调用工具
    print("📝 调用 Office 工具插入文本...")
    result = office_tool.call(tool_call_paras)
    
    print(f"📋 结果: {result.result}")
    
    # 再次测试插入不同内容
    test_params2 = {
        'operation': 'insert_text',
        'content': '\n\n--- 第二次测试 ---\n这是第二次通过 Office_Tool 插入的内容。\n支持多行文本\n和中文字符。\n\n'
    }
    
    tool_call_paras2 = Tool_Call_Paras(
        callback_tool_paras_dict=test_params2,
        callback_agent_config=None,
        callback_agent_id="test_agent",
        callback_last_tool_ctx=None,
        callback_father_agent_exp=None
    )
    
    print("📝 第二次调用 Office 工具...")
    result2 = office_tool.call(tool_call_paras2)
    
    print(f"📋 第二次结果: {result2.result}")
    
    print("✅ Office 工具测试完成！")
    
    # 保持程序运行，以便观察 WebSocket 连接
    print("🔄 WebSocket 服务器保持运行中，按 Ctrl+C 退出...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n👋 测试结束，退出程序")

if __name__ == "__main__":
    test_office_tool() 