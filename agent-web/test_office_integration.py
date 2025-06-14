#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Office 工具与 Agent 系统集成测试
"""

import requests
import json
import time
import sys

# 测试配置
AGENT_SERVER_URL = "https://powerai.cc:5110"  # Agent服务器地址
TEST_QUERY = "请在文档中插入一段测试文本：这是通过Agent系统自动插入的内容，测试时间：" + time.strftime('%Y-%m-%d %H:%M:%S')

def test_agent_server():
    """测试Agent服务器是否正常运行"""
    print("🔍 测试Agent服务器连接...")
    
    try:
        # 测试根路径
        response = requests.get(f"{AGENT_SERVER_URL}/", verify=False, timeout=10)
        if response.status_code == 200:
            print("✅ Agent服务器运行正常")
            return True
        else:
            print(f"❌ Agent服务器响应异常: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 无法连接到Agent服务器: {e}")
        return False

def test_start_agent_system():
    """测试启动Agent系统"""
    print("🚀 测试启动Agent系统...")
    
    try:
        # 启动Agent系统的请求
        payload = {
            "father_agent_config": {
                "base_url": "http://powerai.cc:28001/v1",
                "api_key": "empty"
            },
            "child_agent_config": {
                "base_url": "http://powerai.cc:28001/v1", 
                "api_key": "empty"
            }
        }
        
        response = requests.post(
            f"{AGENT_SERVER_URL}/api/start_2_level_agents_system",
            json=payload,
            verify=False,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            agent_id = result.get("agent_id")
            print(f"✅ Agent系统启动成功，ID: {agent_id}")
            return agent_id
        else:
            print(f"❌ Agent系统启动失败: {response.status_code}")
            print(f"响应内容: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 启动Agent系统出错: {e}")
        return None

def test_query_agent_system(agent_id):
    """测试查询Agent系统"""
    print("📝 测试查询Agent系统...")
    
    try:
        payload = {
            "agent_id": agent_id,
            "query": TEST_QUERY
        }
        
        response = requests.post(
            f"{AGENT_SERVER_URL}/api/query_2_level_agents_system",
            json=payload,
            verify=False,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            stream_id = result.get("id")
            streams = result.get("streams", [])
            print(f"✅ 查询成功，Stream ID: {stream_id}")
            print(f"📡 可用流: {streams}")
            return stream_id, streams
        else:
            print(f"❌ 查询失败: {response.status_code}")
            print(f"响应内容: {response.text}")
            return None, None
            
    except Exception as e:
        print(f"❌ 查询Agent系统出错: {e}")
        return None, None

def test_check_agent_status(agent_id):
    """测试检查Agent状态"""
    print("🔍 检查Agent执行状态...")
    
    max_wait_time = 60  # 最大等待时间60秒
    start_time = time.time()
    
    while time.time() - start_time < max_wait_time:
        try:
            payload = {"agent_id": agent_id}
            response = requests.post(
                f"{AGENT_SERVER_URL}/api/get_agent_status",
                json=payload,
                verify=False,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                finished = result.get("finished", False)
                
                if finished:
                    print("✅ Agent任务执行完成")
                    return True
                else:
                    print("⌛ Agent任务执行中...")
                    time.sleep(3)
            else:
                print(f"⚠️ 状态查询失败: {response.status_code}")
                time.sleep(3)
                
        except Exception as e:
            print(f"⚠️ 状态查询出错: {e}")
            time.sleep(3)
    
    print("⏰ Agent任务执行超时")
    return False

def main():
    """主测试流程"""
    print("🧪 开始Office工具与Agent系统集成测试")
    print("=" * 50)
    
    # 步骤1: 测试Agent服务器连接
    if not test_agent_server():
        print("❌ 测试失败：Agent服务器无法连接")
        sys.exit(1)
    
    # 步骤2: 启动Agent系统
    agent_id = test_start_agent_system()
    if not agent_id:
        print("❌ 测试失败：无法启动Agent系统")
        sys.exit(1)
    
    # 步骤3: 查询Agent系统
    stream_id, streams = test_query_agent_system(agent_id)
    if not stream_id:
        print("❌ 测试失败：无法查询Agent系统")
        sys.exit(1)
    
    # 步骤4: 检查执行状态
    if test_check_agent_status(agent_id):
        print("✅ 集成测试完成！")
        print("\n📋 测试总结:")
        print(f"- Agent ID: {agent_id}")
        print(f"- Stream ID: {stream_id}")
        print(f"- 测试查询: {TEST_QUERY}")
        print("\n💡 下一步操作:")
        print("1. 打开浏览器访问 https://powerai.cc:5101")
        print("2. 切换到'报告编制'标签页")
        print("3. 检查WebSocket连接状态")
        print("4. 查看Collabora CODE中是否有插入的测试文本")
    else:
        print("⚠️ 集成测试部分完成，但Agent任务执行超时")
        print("请手动检查前端页面和WebSocket连接状态")

if __name__ == "__main__":
    main() 