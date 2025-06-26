#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Office API for Collabora CODE
用于通过callPythonScript调用的Python脚本
"""

import uno
import datetime
import os
import traceback

# 日志文件路径
LOG_FILE = "/tmp/office_api.log"

def write_log(message):
    """写入日志文件"""
    try:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] {message}\n")
            f.flush()
    except:
        pass  # 忽略日志写入错误

def hello():
    """测试函数：在文档中插入Hello消息并记录日志"""
    write_log("🚀🚀🚀 hello() 函数被调用！🚀🚀🚀")
    write_log("=== hello() 函数开始执行 ===")
    
    try:
        write_log("尝试获取XSCRIPTCONTEXT...")
        
        # 获取文档上下文
        desktop = XSCRIPTCONTEXT.getDesktop()
        write_log("成功获取desktop")
        
        model = desktop.getCurrentComponent()
        write_log(f"获取当前文档组件: {model}")

        if not model:
            write_log("ERROR: 没有打开的文档")
            return "ERROR: 没有打开的文档"

        # 获取文档的文本内容和光标
        text = model.getText()
        cursor = text.createTextCursor()
        write_log("成功创建文本光标")
        
        # 准备插入的消息
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        message = f"\n[{timestamp}] Hello from Python API! office_api.hello() 执行成功！\n"
        
        write_log(f"准备插入文本: {message.strip()}")
        
        # 移动光标到文档末尾
        cursor.gotoEnd(False)
        
        # 在文档中插入文本
        text.insertString(cursor, message, 0)
        write_log("成功插入文本到文档")
        
        write_log("=== hello() 函数执行完成 ===")
        return "SUCCESS: hello() 执行成功"
        
    except Exception as e:
        error_msg = f"ERROR in hello(): {str(e)}"
        error_traceback = traceback.format_exc()
        write_log(f"{error_msg}\n{error_traceback}")
        
        # 尝试在文档中也显示错误信息
        try:
            desktop = XSCRIPTCONTEXT.getDesktop()
            model = desktop.getCurrentComponent()
            if model:
                text = model.getText()
                cursor = text.createTextCursor()
                cursor.gotoEnd(False)
                error_display = f"\n[ERROR] office_api.hello() 执行失败: {str(e)}\n"
                text.insertString(cursor, error_display, 0)
        except:
            pass
            
        return error_msg

def test_uno_connection():
    """测试UNO连接的函数"""
    write_log("🔧🔧🔧 test_uno_connection() 函数被调用！🔧🔧🔧")
    write_log("=== test_uno_connection() 函数开始执行 ===")
    
    try:
        write_log("测试XSCRIPTCONTEXT是否可用...")
        desktop = XSCRIPTCONTEXT.getDesktop()
        write_log("XSCRIPTCONTEXT.getDesktop() 成功")
        
        model = desktop.getCurrentComponent()
        write_log(f"当前文档组件: {type(model)} - {model}")
        
        if model:
            write_log(f"文档类型: {model.getImplementationName()}")
            write_log("UNO连接测试成功!")
            return "SUCCESS: UNO连接正常"
        else:
            write_log("WARNING: 没有打开的文档")
            return "WARNING: 没有打开的文档，但UNO连接正常"
            
    except Exception as e:
        error_msg = f"ERROR in test_uno_connection(): {str(e)}"
        error_traceback = traceback.format_exc()
        write_log(f"{error_msg}\n{error_traceback}")
        return error_msg

def simple_test():
    """最简单的测试函数，只写日志"""
    write_log("⭐⭐⭐ simple_test() 函数被调用！⭐⭐⭐")
    write_log("这是一个不依赖任何上下文的简单测试函数")
    return "simple_test executed successfully"

# 初始化日志
write_log("📦📦📦 office_api.py 模块已加载 (这只是导入时执行) 📦📦📦")
write_log(f"模块加载时间: {datetime.datetime.now()}")
write_log("如果您看到这条消息但没有看到函数调用日志，说明函数没有被实际调用")

# LibreOffice/Collabora CODE 要求导出函数
# 这是必须的，否则CallPythonScript无法找到函数
g_exportedScripts = (hello, test_uno_connection, simple_test,) 