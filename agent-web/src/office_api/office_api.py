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
    """获取文档的所有内容，包括表格结构化数据"""
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
        
        # 获取基础文本内容
        document_content = text.getString()
        content_length = len(document_content)
        
        write_log(f"成功获取文档内容，总长度: {content_length} 字符")
        write_log(f"文档内容预览(前200字符): {document_content[:200]}")
        
        # 准备结果数据结构
        result_data = {
            'basic_text': document_content,
            'content_length': content_length,
            'tables': [],
            'document_type': model.getImplementationName() if hasattr(model, 'getImplementationName') else 'Unknown'
        }
        
        # === 开始处理表格内容 ===
        write_log("🔍 开始搜索和解析表格...")
        
        try:
            # 获取文档中的所有表格
            text_tables = model.getTextTables()
            table_count = text_tables.getCount()
            write_log(f"📊 文档中共发现 {table_count} 个表格")
            
            for table_idx in range(table_count):
                table = text_tables.getByIndex(table_idx)
                table_name = table.getName()
                write_log(f"📊 处理表格 {table_idx + 1}: {table_name}")
                
                # 获取表格的行和列信息
                rows = table.getRows()
                columns = table.getColumns()
                row_count = rows.getCount()
                col_count = columns.getCount()
                
                write_log(f"   表格尺寸: {row_count} 行 x {col_count} 列")
                
                # === 使用getCellNames()获取所有实际存在的单元格（正确处理合并单元格）===
                try:
                    all_cell_names = table.getCellNames()
                    write_log(f"   实际单元格数量: {len(all_cell_names)} 个")
                    write_log(f"   单元格名称列表: {list(all_cell_names)[:10]}{'...' if len(all_cell_names) > 10 else ''}")
                except Exception as cell_names_error:
                    write_log(f"⚠️ 获取单元格名称失败: {str(cell_names_error)}")
                    all_cell_names = []
                
                # 创建表格数据结构
                table_data = {
                    'name': table_name,
                    'rows': row_count,
                    'columns': col_count,
                    'actual_cells': len(all_cell_names),
                    'data': []
                }
                
                # 如果能获取到单元格名称，使用正确的方法遍历
                if all_cell_names:
                    # 按单元格名称读取内容
                    cell_data_dict = {}
                    for cell_name in all_cell_names:
                        try:
                            # 获取单元格对象
                            cell = table.getCellByName(cell_name)
                            
                            # 获取单元格文本内容
                            cell_text = cell.getString()
                            
                            # 获取单元格的其他属性
                            cell_info = {
                                'position': cell_name,
                                'content': cell_text,
                                'is_merged': False,  # 可以进一步检测合并单元格
                                'length': len(cell_text)
                            }
                            
                            # 检查是否为合并单元格（改进的检测）
                            try:
                                # 检查单元格名称是否包含点号（表示分割单元格）
                                if '.' in cell_name:
                                    cell_info['is_split'] = True
                                    cell_info['parent_cell'] = cell_name.split('.')[0]
                                else:
                                    cell_info['is_split'] = False
                                
                                # 尝试获取合并信息
                                if hasattr(cell, 'getColumnSpan') and hasattr(cell, 'getRowSpan'):
                                    col_span = getattr(cell, 'getColumnSpan', lambda: 1)()
                                    row_span = getattr(cell, 'getRowSpan', lambda: 1)()
                                    if col_span > 1 or row_span > 1:
                                        cell_info['is_merged'] = True
                                        cell_info['col_span'] = col_span
                                        cell_info['row_span'] = row_span
                            except Exception as merge_error:
                                write_log(f"   检测合并信息时出错 {cell_name}: {str(merge_error)}")
                            
                            cell_data_dict[cell_name] = cell_info
                            
                            write_log(f"     单元格 {cell_name}: '{cell_text[:30]}'{'...' if len(cell_text) > 30 else ''}")
                            
                        except Exception as cell_error:
                            write_log(f"❌ 读取单元格 {cell_name} 时出错: {str(cell_error)}")
                            cell_data_dict[cell_name] = {
                                'position': cell_name,
                                'content': '',
                                'error': str(cell_error)
                            }
                    
                    # 尝试重新组织数据为行列结构（基于单元格名称）
                    organized_data = []
                    max_row = 0
                    max_col = 0
                    
                    # 解析单元格名称以确定实际的表格结构
                    cell_positions = {}
                    for cell_name in cell_data_dict.keys():
                        try:
                            # 解析基本单元格名称（忽略分割后的.1.1部分）
                            base_name = cell_name.split('.')[0] if '.' in cell_name else cell_name
                            
                            # 解析列字母和行数字
                            col_letters = ""
                            row_digits = ""
                            for char in base_name:
                                if char.isalpha():
                                    col_letters += char
                                elif char.isdigit():
                                    row_digits += char
                            
                            if col_letters and row_digits:
                                # 将列字母转换为数字（A=0, B=1, ...）
                                col_num = 0
                                for i, char in enumerate(reversed(col_letters.upper())):
                                    col_num += (ord(char) - ord('A') + 1) * (26 ** i)
                                col_num -= 1  # 转换为0基索引
                                
                                row_num = int(row_digits) - 1  # 转换为0基索引
                                
                                cell_positions[cell_name] = (row_num, col_num)
                                max_row = max(max_row, row_num)
                                max_col = max(max_col, col_num)
                        except Exception as parse_error:
                            write_log(f"   解析单元格位置失败 {cell_name}: {str(parse_error)}")
                    
                    # 创建行列结构的数据
                    for row_idx in range(max_row + 1):
                        row_data = []
                        for col_idx in range(max_col + 1):
                            # 查找该位置的单元格
                            found_cell = None
                            for cell_name, (r, c) in cell_positions.items():
                                if r == row_idx and c == col_idx:
                                    found_cell = cell_data_dict[cell_name]
                                    break
                            
                            if found_cell:
                                row_data.append(found_cell)
                            else:
                                # 该位置可能被合并或不存在
                                row_data.append({
                                    'position': f"{chr(65 + col_idx)}{row_idx + 1}",
                                    'content': '[合并或空]',
                                    'is_merged_target': True
                                })
                        
                        organized_data.append(row_data)
                    
                    table_data['data'] = organized_data
                    table_data['actual_structure'] = f"{max_row + 1} 行 x {max_col + 1} 列"
                    
                else:
                    # 回退到原来的方法（如果getCellNames失败）
                    write_log("   回退到传统行列遍历方法")
                    for row_idx in range(row_count):
                        row_data = []
                        for col_idx in range(col_count):
                            try:
                                # 获取单元格名称（如A1, B1, A2等）
                                cell_name = f"{chr(65 + col_idx)}{row_idx + 1}"
                                
                                # 获取单元格对象
                                cell = table.getCellByName(cell_name)
                                
                                # 获取单元格文本内容
                                cell_text = cell.getString()
                                
                                # 获取单元格的其他属性
                                cell_info = {
                                    'position': cell_name,
                                    'content': cell_text,
                                    'is_merged': False,
                                    'length': len(cell_text)
                                }
                                
                                row_data.append(cell_info)
                                
                            except Exception as cell_error:
                                write_log(f"❌ 读取单元格 {chr(65 + col_idx)}{row_idx + 1} 时出错: {str(cell_error)}")
                                row_data.append({
                                    'position': f"{chr(65 + col_idx)}{row_idx + 1}",
                                    'content': '',
                                    'error': str(cell_error)
                                })
                        
                        table_data['data'].append(row_data)
                
                result_data['tables'].append(table_data)
                write_log(f"✅ 表格 {table_name} 解析完成")
                
        except Exception as table_error:
            write_log(f"⚠️ 表格处理过程中出现错误: {str(table_error)}")
            result_data['table_error'] = str(table_error)
        
        # === 生成结构化内容摘要 ===
        content_summary = []
        content_summary.append(f"📄 文档类型: {result_data['document_type']}")
        content_summary.append(f"📄 文档总长度: {content_length} 字符")
        content_summary.append(f"📊 表格数量: {len(result_data['tables'])} 个")
        
        # 表格内容摘要
        for i, table in enumerate(result_data['tables']):
            # 显示基础信息和实际结构
            basic_info = f"📊 表格 {i+1} ({table['name']}): {table['rows']}行 x {table['columns']}列"
            if 'actual_structure' in table:
                basic_info += f" (实际: {table['actual_structure']})"
            if 'actual_cells' in table:
                basic_info += f", {table['actual_cells']} 个单元格"
            content_summary.append(basic_info)
            
            # 显示表格前几行的内容预览
            if table['data'] and len(table['data']) > 0:
                content_summary.append("   表格内容预览:")
                for row_idx, row in enumerate(table['data'][:3]):  # 只显示前3行
                    row_cells = []
                    for cell in row[:5]:  # 只显示前5列
                        cell_content = cell.get('content', '')
                        if cell.get('is_merged_target'):
                            cell_content = '[合并]'
                        elif cell.get('is_split'):
                            cell_content = f"[分割]{cell_content[:15]}"
                        else:
                            cell_content = cell_content[:20]
                        row_cells.append(cell_content)
                    row_text = " | ".join(row_cells)
                    content_summary.append(f"   行{row_idx+1}: {row_text}")
                if len(table['data']) > 3:
                    content_summary.append(f"   ... (还有 {len(table['data']) - 3} 行)")
        
        # 普通文本内容预览
        if content_length > 0:
            text_preview = document_content[:300] + ("..." if content_length > 300 else "")
            content_summary.append(f"📄 文本内容预览: {text_preview}")
        
        write_log(f"📊 内容解析完成: {len(result_data['tables'])} 个表格, {content_length} 字符文本")
        
        # 在文档末尾插入获取内容的确认消息
        cursor = text.createTextCursor()
        cursor.gotoEnd(False)
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # === 构建完整的解析结果插入到文档中 ===
        detailed_result = [
            f"\n{'='*60}",
            f"[{timestamp}] 📄 文档内容解析结果",
            f"{'='*60}",
            f"📄 文档类型: {result_data['document_type']}",
            f"📄 文档总长度: {content_length} 字符",
            f"📊 表格数量: {len(result_data['tables'])} 个",
            ""
        ]
        
        # 添加表格详细内容
        if result_data['tables']:
            detailed_result.append("📊 表格详细内容:")
            detailed_result.append("-" * 40)
            
            for i, table in enumerate(result_data['tables']):
                detailed_result.append(f"\n📊 表格 {i+1}: {table['name']}")
                table_info = f"   尺寸: {table['rows']} 行 x {table['columns']} 列"
                if 'actual_structure' in table:
                    table_info += f" (实际: {table['actual_structure']})"
                if 'actual_cells' in table:
                    table_info += f", {table['actual_cells']} 个单元格"
                detailed_result.append(table_info)
                detailed_result.append("   内容:")
                
                # 显示表格的完整内容
                for row_idx, row in enumerate(table['data']):
                    row_cells = []
                    for cell in row:
                        cell_content = cell.get('content', '')
                        
                        # 处理不同类型的单元格
                        if cell.get('is_merged_target'):
                            cell_display = f"{cell['position']}:[合并单元格]"
                        elif cell.get('is_split'):
                            parent = cell.get('parent_cell', '')
                            cell_display = f"{cell['position']}(分割自{parent}):{cell_content[:20]}"
                        elif cell.get('error'):
                            cell_display = f"{cell['position']}:[错误:{cell['error'][:15]}]"
                        else:
                            if not cell_content:
                                cell_content = '[空]'
                            # 限制单元格显示长度，避免过长
                            if len(cell_content) > 25:
                                cell_content = cell_content[:25] + "..."
                            cell_display = f"{cell['position']}:{cell_content}"
                        
                        row_cells.append(cell_display)
                    
                    detailed_result.append(f"     行{row_idx+1}: {' | '.join(row_cells)}")
                
                detailed_result.append("")
        else:
            detailed_result.append("📊 文档中没有发现表格")
        
        # 添加文本内容
        detailed_result.append("\n📄 文档文本内容:")
        detailed_result.append("-" * 40)
        if document_content.strip():
            # 将长文本分段显示，每行最多100字符
            text_lines = []
            remaining_text = document_content
            while remaining_text:
                if len(remaining_text) <= 100:
                    text_lines.append(remaining_text)
                    break
                else:
                    # 尝试在合适的位置断行（句号、换行符等）
                    break_pos = 100
                    for break_char in ['。', '\n', '！', '？', '.', '!', '?']:
                        pos = remaining_text[:100].rfind(break_char)
                        if pos > 50:  # 至少要有50个字符
                            break_pos = pos + 1
                            break
                    
                    text_lines.append(remaining_text[:break_pos])
                    remaining_text = remaining_text[break_pos:]
            
            for line_idx, line in enumerate(text_lines[:20]):  # 最多显示20行
                detailed_result.append(f"   {line_idx+1:2d}: {line}")
            
            if len(text_lines) > 20:
                detailed_result.append(f"   ... (还有 {len(text_lines) - 20} 行文本)")
        else:
            detailed_result.append("   [文档文本为空]")
        
        detailed_result.append(f"\n{'='*60}")
        detailed_result.append(f"解析完成时间: {timestamp}")
        detailed_result.append(f"{'='*60}\n")
        
        # 将完整结果插入到文档中
        complete_result_text = "\n".join(detailed_result)
        text.insertString(cursor, complete_result_text, False)
        write_log("已在文档末尾插入完整的解析结果")
        
        write_log("=== get_document_content() 函数执行完成 ===")
        
        # 返回内容摘要
        summary_text = "\n".join(content_summary)
        return f"SUCCESS: {summary_text}"
        
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

def select_chapter(chapter="2.1"):
    """选中指定章节的完整内容"""
    write_log(f"📖📖📖 select_chapter() 函数被调用！章节: {chapter}")
    write_log("=== select_chapter() 函数开始执行 ===")
    
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
        
        # 创建用于搜索的枚举器
        paragraph_enum = text.createEnumeration()
        write_log("成功创建段落枚举器")
        
        # 存储所有段落的信息
        paragraphs = []
        paragraph_index = 0
        
        # 遍历所有段落
        while paragraph_enum.hasMoreElements():
            paragraph = paragraph_enum.nextElement()
            paragraph_text = paragraph.getString()
            
            # 获取段落样式信息
            paragraph_style = ""
            try:
                paragraph_style = paragraph.getPropertyValue("ParaStyleName")
            except:
                paragraph_style = "普通"
            
            paragraphs.append({
                'index': paragraph_index,
                'text': paragraph_text,
                'style': paragraph_style,
                'paragraph_obj': paragraph
            })
            
            paragraph_index += 1
        
        write_log(f"总共找到 {len(paragraphs)} 个段落")
        
        # 解析章节编号的层级
        def parse_chapter_level(chapter_num):
            """解析章节编号的层级，返回层级列表"""
            return [int(x) for x in chapter_num.split('.') if x.isdigit()]
        
        # 检查是否为章节标题
        import re
        def is_chapter_title(text, style):
            """判断是否为正文章节标题（不是目录项）"""
            text = text.strip()
            
            # 首先检查是否为目录项格式，如果是则不能是正文章节标题
            if is_toc_item_format(text):
                return False
            
            # 检查样式是否为标题类型
            if style and ("标题" in style or "Heading" in style):
                return True
            
            # 通过正则表达式检查章节编号模式
            chapter_pattern = r'^(\d+(?:\.\d+)*)\s+'
            match = re.match(chapter_pattern, text)
            if match:
                # 确保不是目录项：检查是否以页码结尾
                if not re.search(r'\s+\d+$', text):  # 不以空格+数字结尾
                    return True
            
            return False
        
        # 首先识别目录区域
        def find_table_of_contents_area(all_paragraphs):
            """识别文档中的目录区域，返回(开始索引, 结束索引)"""
            toc_start = -1
            toc_end = -1
            
            # 查找包含"目录"字样的段落
            for i, para in enumerate(all_paragraphs):
                text = para['text'].strip()
                if text == "目录" or "目录" in text:
                    write_log(f"找到目录标题: 第{i}段 - {text}")
                    toc_start = i
                    break
            
            if toc_start != -1:
                # 从目录标题开始查找目录结束位置
                for i in range(toc_start + 1, min(toc_start + 50, len(all_paragraphs))):  # 限制在50段内查找
                    text = all_paragraphs[i]['text'].strip()
                    
                    # 如果不是目录项格式，且不是空行，可能是目录结束
                    if text and not is_toc_item_format(text):
                        # 检查是否是正文章节开始
                        if is_chapter_title(text, all_paragraphs[i]['style']):
                            toc_end = i
                            write_log(f"目录结束: 第{i}段，下一个是正文章节: {text[:50]}...")
                            break
                
                # 如果没找到明确结束，使用启发式方法
                if toc_end == -1:
                    toc_end = min(toc_start + 30, len(all_paragraphs))  # 假设目录不超过30段
                    write_log(f"目录结束(启发式): 第{toc_end}段")
            
            write_log(f"目录区域: 第{toc_start}段 到 第{toc_end}段")
            return toc_start, toc_end
        
        def is_toc_item_format(text):
            """判断是否为目录项格式"""
            text = text.strip()
            if not text:
                return False
                
            # 目录项特征：章节编号 + 标题 + 页码
            # 如："1.1 基本情况 1" 或 "2.1 建设现状 5"
            toc_patterns = [
                r'^(\d+(?:\.\d+)*)\s+\S.*\s+(\d+)$',  # 编号 + 标题 + 页码
                r'^(\d+(?:\.\d+)*)\s+.*\t+(\d+)$',    # 编号 + 标题 + 制表符 + 页码
                r'^(\d+(?:\.\d+)*)\s+.*\.+\s*(\d+)$', # 编号 + 标题 + 点填充 + 页码
            ]
            
            for pattern in toc_patterns:
                if re.match(pattern, text):
                    return True
            return False
        
        # 检查是否为目录项（改进版）
        def is_table_of_contents(text, index, all_paragraphs, toc_start, toc_end):
            """判断是否为目录项"""
            # 如果在目录区域内，且符合目录项格式
            if toc_start <= index <= toc_end:
                return is_toc_item_format(text)
            return False
        
        # 首先识别目录区域
        toc_start, toc_end = find_table_of_contents_area(paragraphs)
        
        # 查找目标章节和下一个章节
        target_chapter_level = parse_chapter_level(chapter)
        target_start_index = -1
        target_end_index = len(paragraphs)
        
        write_log(f"目标章节 '{chapter}' 的层级: {target_chapter_level}")
        
        # 第一遍：查找目标章节的开始位置（只在目录区域之外查找）
        search_start = max(0, toc_end + 1) if toc_end != -1 else 0
        write_log(f"从第{search_start}段开始搜索正文章节（跳过目录区域）")
        
        for i in range(search_start, len(paragraphs)):
            para = paragraphs[i]
            para_text = para['text'].strip()
            para_style = para['style']
            
            # 跳过空段落
            if not para_text:
                continue
            
            # 跳过目录项（双重保险）
            if is_table_of_contents(para_text, i, paragraphs, toc_start, toc_end):
                write_log(f"跳过目录项: 第{i}段 - {para_text[:30]}...")
                continue
            
            # 检查是否为章节标题
            if is_chapter_title(para_text, para_style):
                # 提取章节编号
                chapter_pattern = r'^(\d+(?:\.\d+)*)'
                match = re.match(chapter_pattern, para_text)
                if match:
                    found_chapter = match.group(1)
                    write_log(f"找到正文章节标题 ({para_style}): {found_chapter} - {para_text[:50]}...")
                    
                    # 检查是否为目标章节
                    if found_chapter == chapter:
                        target_start_index = i
                        write_log(f"✅ 找到目标章节开始位置: 第{i}段")
                        break
        
        if target_start_index == -1:
            error_msg = f"未找到章节 '{chapter}'"
            write_log(f"ERROR: {error_msg}")
            return f"ERROR: {error_msg}"
        
        # 第二遍：查找目标章节的结束位置（下一个同级或更高级章节）
        for i in range(target_start_index + 1, len(paragraphs)):
            para_text = paragraphs[i]['text'].strip()
            para_style = paragraphs[i]['style']
            
            # 跳过空段落和目录项
            if not para_text or is_table_of_contents(para_text, i, paragraphs, toc_start, toc_end):
                continue
            
            # 检查是否为章节标题
            if is_chapter_title(para_text, para_style):
                chapter_pattern = r'^(\d+(?:\.\d+)*)'
                match = re.match(chapter_pattern, para_text)
                if match:
                    found_chapter = match.group(1)
                    found_level = parse_chapter_level(found_chapter)
                    
                    # 判断是不是下一个章节
                    # 如果层级相同或更高（数字更少），则为结束位置
                    if len(found_level) <= len(target_chapter_level):
                        # 检查是否为同级的下一个章节或更高级章节
                        if (len(found_level) == len(target_chapter_level) and 
                            found_level[:-1] == target_chapter_level[:-1] and 
                            found_level[-1] > target_chapter_level[-1]) or \
                           len(found_level) < len(target_chapter_level):
                            target_end_index = i
                            write_log(f"✅ 找到章节结束位置: 第{i}段 (下一章节: {found_chapter})")
                            break
        
        write_log(f"章节范围: 第{target_start_index}段 到 第{target_end_index-1}段")
        
        # 创建文本光标并选择范围
        cursor = text.createTextCursor()
        
        # 移动到目标章节开始位置
        start_paragraph = paragraphs[target_start_index]['paragraph_obj']
        cursor.gotoRange(start_paragraph.getStart(), False)
        
        # 扩展选择到章节结束位置
        if target_end_index < len(paragraphs):
            end_paragraph = paragraphs[target_end_index - 1]['paragraph_obj']
            cursor.gotoRange(end_paragraph.getEnd(), True)
        else:
            # 如果是最后一个章节，选择到文档末尾
            cursor.gotoEnd(True)
        
        # 选择文本范围
        model.getCurrentController().select(cursor)
        
        # 在文档末尾插入确认消息
        text_cursor = text.createTextCursor()
        text_cursor.gotoEnd(False)
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 统计选中的内容
        selected_paragraphs = target_end_index - target_start_index
        selected_text = cursor.getString()
        
        confirmation_msg = f"\n[{timestamp}] 📖 章节选择完成:\n"
        confirmation_msg += f"   章节: {chapter}\n"
        confirmation_msg += f"   范围: 第{target_start_index+1}段 到 第{target_end_index}段\n"
        confirmation_msg += f"   段落数: {selected_paragraphs}\n"
        confirmation_msg += f"   字符数: {len(selected_text)}\n"
        confirmation_msg += f"   内容预览: {selected_text[:100]}{'...' if len(selected_text) > 100 else ''}\n"
        
        text.insertString(text_cursor, confirmation_msg, False)
        write_log("已在文档末尾插入选择确认消息")
        
        write_log("=== select_chapter() 函数执行完成 ===")
        return f"SUCCESS: 成功选中章节 '{chapter}' ({selected_paragraphs}段，{len(selected_text)}字符)"
        
    except Exception as e:
        error_msg = f"ERROR in select_chapter(): {str(e)}"
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
                error_display = f"\n[ERROR] select_chapter() 执行失败: {str(e)}\n"
                text.insertString(cursor, error_display, False)
        except:
            pass
            
        return error_msg

# LibreOffice/Collabora CODE 要求导出函数
# 这是必须的，否则CallPythonScript无法找到函数
g_exportedScripts = (hello, get_document_content, test_uno_connection, simple_test, debug_params, search_and_format_text, search_and_replace_with_format, select_chapter,) 