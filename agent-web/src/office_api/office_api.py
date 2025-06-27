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

def get_document_content():
    """获取文档的所有内容"""
    write_log("📄📄📄 get_document_content() 函数被调用！📄📄📄")
    write_log("=== get_document_content() 函数开始执行 ===")
    
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

        # 获取文档的文本内容
        text = model.getText()
        write_log("成功获取文档文本对象")
        
        # 获取所有文本内容
        document_content = text.getString()
        content_length = len(document_content)
        
        write_log(f"成功获取文档内容，总长度: {content_length} 字符")
        write_log(f"文档内容预览(前200字符): {document_content[:200]}")
        
        # 获取更多文档信息
        document_info = {
            'content_length': content_length,
            'has_content': content_length > 0,
            'document_type': model.getImplementationName() if hasattr(model, 'getImplementationName') else 'Unknown'
        }
        
        write_log(f"文档信息: {document_info}")
        
        # 在文档末尾插入获取内容的确认消息
        cursor = text.createTextCursor()
        cursor.gotoEnd(False)
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        confirmation_msg = f"\n[{timestamp}] 📄 已通过Python API获取文档内容，总计 {content_length} 字符\n"
        text.insertString(cursor, confirmation_msg, 0)
        write_log("已在文档末尾插入确认消息")
        
        write_log("=== get_document_content() 函数执行完成 ===")
        
        # 返回内容摘要（避免返回过长的内容）
        if content_length > 500:
            preview = document_content[:500] + "...(内容过长，已截断)"
        else:
            preview = document_content
            
        result = {
            'status': 'SUCCESS',
            'content_length': content_length,
            'document_type': document_info['document_type'],
            'content_preview': preview,
            'full_content': document_content  # 完整内容也返回，以备需要
        }
        
        return f"SUCCESS: 已获取文档内容 - 长度: {content_length} 字符"
        
    except Exception as e:
        error_msg = f"ERROR in get_document_content(): {str(e)}"
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
                error_display = f"\n[ERROR] get_document_content() 执行失败: {str(e)}\n"
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
g_exportedScripts = (hello, get_document_content, test_uno_connection, simple_test,) 