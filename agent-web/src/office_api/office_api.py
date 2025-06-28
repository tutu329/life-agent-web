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
        text.insertString(cursor, message, False)
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
                text.insertString(cursor, error_display, False)
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
        text.insertString(cursor, confirmation_msg, False)
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
                text.insertString(cursor, error_display, False)
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

def debug_params(*args, **kwargs):
    """专门用于调试参数传递的函数"""
    write_log("🐛🐛🐛 debug_params() 函数被调用！🐛🐛🐛")
    write_log(f"args类型: {type(args)}, 长度: {len(args)}")
    write_log(f"args内容: {args}")
    write_log(f"kwargs类型: {type(kwargs)}, 长度: {len(kwargs)}")
    write_log(f"kwargs内容: {kwargs}")
    
    # 尝试输出每个参数的详细信息
    for i, arg in enumerate(args):
        write_log(f"args[{i}]: 类型={type(arg)}, 值={arg}")
    
    for key, value in kwargs.items():
        write_log(f"kwargs['{key}']: 类型={type(value)}, 值={value}")
    
    write_log("🐛🐛🐛 debug_params() 函数执行完成！🐛🐛🐛")
    
    return f"debug_params called with {len(args)} args and {len(kwargs)} kwargs"

def search_and_format_text(*args, **kwargs):
    """搜索指定文本并设置格式（黄色高亮、宋体、18pt）- 处理官方格式参数"""
    write_log(f"🔍🔍🔍 search_and_format_text() 函数被调用！")
    write_log(f"收到的位置参数 args: {args}")
    write_log(f"收到的关键字参数 kwargs: {kwargs}")
    write_log("=== search_and_format_text() 函数开始执行 ===")
    
    search_text, highlight_color, font_name, font_size = args
    
    # 处理官方格式的参数：{'type': 'string', 'value': 'actual_value'}
    for key, value in kwargs.items():
        write_log(f"处理参数 {key}: {value}")
        
        if isinstance(value, dict) and 'type' in value and 'value' in value:
            actual_value = value['value']
            param_type = value['type']
            write_log(f"  解析官方格式参数 {key}: type={param_type}, value={actual_value}")
            
            if key == 'search_text':
                search_text = str(actual_value)
            elif key == 'highlight_color':
                highlight_color = str(actual_value)
            elif key == 'font_name':
                font_name = str(actual_value)
            elif key == 'font_size':
                try:
                    font_size = int(actual_value)
                except:
                    write_log(f"⚠️ 无法解析字体大小: {actual_value}，使用默认值")
        else:
            # 兼容处理直接传值的情况
            write_log(f"  直接使用参数 {key}: {value}")
            if key == 'search_text':
                search_text = str(value)
            elif key == 'highlight_color':
                highlight_color = str(value)
            elif key == 'font_name':
                font_name = str(value)
            elif key == 'font_size':
                try:
                    font_size = int(value)
                except:
                    write_log(f"⚠️ 无法解析字体大小: {value}，使用默认值")
    
    # 参数验证
    if not search_text or search_text == "":
        search_text = "hello"
        write_log(f"⚠️ 搜索文本为空，使用默认值: {search_text}")
    
    if not highlight_color:
        highlight_color = "yellow"
        write_log(f"⚠️ 高亮颜色为空，使用默认值: {highlight_color}")
        
    if not font_name:
        font_name = "宋体"
        write_log(f"⚠️ 字体名称为空，使用默认值: {font_name}")
        
    if not isinstance(font_size, int) or font_size <= 0:
        font_size = 18
        write_log(f"⚠️ 字体大小无效，使用默认值: {font_size}")
    
    write_log(f"最终使用的参数: search_text='{search_text}', highlight_color='{highlight_color}', font_name='{font_name}', font_size={font_size}")
    
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

        # 创建搜索描述符
        search_descriptor = model.createSearchDescriptor()
        search_descriptor.setSearchString(search_text)
        search_descriptor.SearchCaseSensitive = False  # 不区分大小写
        search_descriptor.SearchWords = False  # 不限制完整单词
        
        write_log(f"创建搜索描述符，搜索文本: {search_text}")
        
        # 执行搜索
        found_ranges = model.findAll(search_descriptor)
        write_log(f"搜索完成，找到 {found_ranges.getCount()} 个匹配项")
        
        if found_ranges.getCount() == 0:
            write_log("没有找到匹配的文本")
            return f"INFO: 没有找到匹配的文本 '{search_text}'"
        
        # 颜色映射（RGB值）
        color_map = {
            'yellow': 0xFFFF00,    # 黄色
            'red': 0xFF0000,       # 红色
            'green': 0x00FF00,     # 绿色
            'blue': 0x0000FF,      # 蓝色
            'orange': 0xFFA500,    # 橙色
            'pink': 0xFFC0CB,      # 粉色
        }
        
        # 获取颜色值
        bg_color = color_map.get(highlight_color.lower(), 0xFFFF00)  # 默认黄色
        
        # 格式化每个找到的文本范围
        for i in range(found_ranges.getCount()):
            text_range = found_ranges.getByIndex(i)
            write_log(f"正在格式化第 {i+1} 个匹配项: '{text_range.getString()}'")
            
            # 设置背景色（高亮）
            text_range.setPropertyValue("CharBackColor", bg_color)
            text_range.setPropertyValue("CharBackTransparent", False)
            
            # 设置字体名称
            text_range.setPropertyValue("CharFontName", font_name)
            text_range.setPropertyValue("CharFontNameAsian", font_name)
            text_range.setPropertyValue("CharFontNameComplex", font_name)
            
            # 设置字体大小
            text_range.setPropertyValue("CharHeight", float(font_size))
            text_range.setPropertyValue("CharHeightAsian", float(font_size))
            text_range.setPropertyValue("CharHeightComplex", float(font_size))
            
            write_log(f"已设置格式: 背景色={highlight_color}, 字体={font_name}, 大小={font_size}pt")
        
        # 在文档末尾插入操作确认消息
        text = model.getText()
        cursor = text.createTextCursor()
        cursor.gotoEnd(False)
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        confirmation_msg = f"\n[{timestamp}] 🔍 搜索并格式化完成: 找到 {found_ranges.getCount()} 个 '{search_text}' 并设置为{highlight_color}高亮、{font_name}字体、{font_size}pt\n"
        text.insertString(cursor, confirmation_msg, False)
        write_log("已在文档末尾插入确认消息")
        
        write_log("=== search_and_format_text() 函数执行完成 ===")
        return f"SUCCESS: 成功格式化 {found_ranges.getCount()} 个匹配项 '{search_text}'"
        
    except Exception as e:
        error_msg = f"ERROR in search_and_format_text(): {str(e)}"
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
                error_display = f"\n[ERROR] search_and_format_text() 执行失败: {str(e)}\n"
                text.insertString(cursor, error_display, False)
        except:
            pass
            
        return error_msg

def search_and_replace_with_format(search_text="旧文本", replace_text="新文本", highlight_color="yellow", font_name="宋体", font_size=18):
    """搜索并替换文本，同时设置新文本的格式"""
    write_log(f"🔄🔄🔄 search_and_replace_with_format() 函数被调用！搜索: {search_text}, 替换为: {replace_text}")
    write_log("=== search_and_replace_with_format() 函数开始执行 ===")
    
    try:
        desktop = XSCRIPTCONTEXT.getDesktop()
        model = desktop.getCurrentComponent()

        if not model:
            write_log("ERROR: 没有打开的文档")
            return "ERROR: 没有打开的文档"

        # 创建替换描述符
        replace_descriptor = model.createReplaceDescriptor()
        replace_descriptor.setSearchString(search_text)
        replace_descriptor.setReplaceString(replace_text)
        replace_descriptor.SearchCaseSensitive = False
        replace_descriptor.SearchWords = False
        
        write_log(f"创建替换描述符，搜索: {search_text}, 替换为: {replace_text}")
        
        # 执行替换
        replace_count = model.replaceAll(replace_descriptor)
        write_log(f"替换完成，共替换了 {replace_count} 个匹配项")
        
        if replace_count == 0:
            write_log("没有找到需要替换的文本")
            return f"INFO: 没有找到需要替换的文本 '{search_text}'"
        
        # 现在搜索并格式化替换后的文本
        search_descriptor = model.createSearchDescriptor()
        search_descriptor.setSearchString(replace_text)
        search_descriptor.SearchCaseSensitive = False
        search_descriptor.SearchWords = False
        
        found_ranges = model.findAll(search_descriptor)
        
        # 颜色映射
        color_map = {
            'yellow': 0xFFFF00, 'red': 0xFF0000, 'green': 0x00FF00,
            'blue': 0x0000FF, 'orange': 0xFFA500, 'pink': 0xFFC0CB,
        }
        bg_color = color_map.get(highlight_color.lower(), 0xFFFF00)
        
        # 格式化替换后的文本
        formatted_count = 0
        for i in range(found_ranges.getCount()):
            text_range = found_ranges.getByIndex(i)
            
            # 设置格式
            text_range.setPropertyValue("CharBackColor", bg_color)
            text_range.setPropertyValue("CharBackTransparent", False)
            text_range.setPropertyValue("CharFontName", font_name)
            text_range.setPropertyValue("CharFontNameAsian", font_name)
            text_range.setPropertyValue("CharHeight", float(font_size))
            text_range.setPropertyValue("CharHeightAsian", float(font_size))
            
            formatted_count += 1
        
        # 插入确认消息
        text = model.getText()
        cursor = text.createTextCursor()
        cursor.gotoEnd(False)
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        confirmation_msg = f"\n[{timestamp}] 🔄 替换并格式化完成: 将 {replace_count} 个 '{search_text}' 替换为 '{replace_text}' 并设置格式\n"
        text.insertString(cursor, confirmation_msg, False)
        
        write_log("=== search_and_replace_with_format() 函数执行完成 ===")
        return f"SUCCESS: 成功替换并格式化 {replace_count} 个匹配项"
        
    except Exception as e:
        error_msg = f"ERROR in search_and_replace_with_format(): {str(e)}"
        error_traceback = traceback.format_exc()
        write_log(f"{error_msg}\n{error_traceback}")
        return error_msg

# 初始化日志
write_log("📦📦📦 office_api.py 模块已加载 (这只是导入时执行) 📦📦📦")
write_log(f"模块加载时间: {datetime.datetime.now()}")
write_log("如果您看到这条消息但没有看到函数调用日志，说明函数没有被实际调用")

# LibreOffice/Collabora CODE 要求导出函数
# 这是必须的，否则CallPythonScript无法找到函数
g_exportedScripts = (hello, get_document_content, test_uno_connection, simple_test, debug_params, search_and_format_text, search_and_replace_with_format,) 