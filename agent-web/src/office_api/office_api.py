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
        write_log("ERROR: 搜索文本为空")
        return "ERROR: 搜索文本为空，无法执行搜索"
        # search_text = "hello"  # 测试内容已注释
        # write_log(f"⚠️ 搜索文本为空，使用默认值: {search_text}")
    
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

def insert_text(text, font_name="SimSun", font_color="black", font_size=12):
    """插入文本到文档当前光标位置，支持字体格式设置
    
    参数：
    text: 要插入的文本
    font_name: 字体名称，默认宋体
    font_color: 字体颜色，默认黑色
    font_size: 字体大小，默认12pt
    """
    write_log(f"📝📝📝 insert_text() 函数被调用！文本: {text[:50]}{'...' if len(text) > 50 else ''}")
    write_log(f"字体参数: font_name={font_name}, font_color={font_color}, font_size={font_size}")
    write_log("=== insert_text() 函数开始执行 ===")
    
    try:
        # 参数验证和默认值处理
        if not text:
            write_log("ERROR: 文本参数为空")
            return "ERROR: 文本参数为空，无法插入"
            # text = "默认插入文本"  # 测试内容已注释
        
        # 确保文本是字符串类型
        if not isinstance(text, str):
            text = str(text)
            write_log(f"已将文本转换为字符串: {text[:50]}...")
        
        # 字体名称处理
        if not font_name:
            font_name = "SimSun"  # 默认宋体
        write_log(f"使用字体: {font_name}")
        
        # 字体颜色处理
        if not font_color:
            font_color = "black"  # 默认黑色
        
        # 颜色映射（RGB值）
        color_map = {
            'black': 0x000000,      # 黑色
            'red': 0xFF0000,        # 红色
            'blue': 0x0000FF,       # 蓝色
            'green': 0x00FF00,      # 绿色
            'yellow': 0xFFFF00,     # 黄色
            'orange': 0xFFA500,     # 橙色
            'purple': 0x800080,     # 紫色
            'brown': 0xA52A2A,      # 棕色
            'gray': 0x808080,       # 灰色
            'darkblue': 0x000080,   # 深蓝色
        }
        
        # 获取颜色值
        if isinstance(font_color, str) and font_color.lower() in color_map:
            color_value = color_map[font_color.lower()]
        elif isinstance(font_color, int):
            color_value = font_color
        else:
            color_value = 0x000000  # 默认黑色
            write_log(f"WARNING: 未识别的颜色 {font_color}，使用默认黑色")
        
        write_log(f"使用颜色: {font_color} (0x{color_value:06X})")
        
        # 字体大小处理
        if not isinstance(font_size, (int, float)) or font_size <= 0:
            font_size = 12  # 默认小四（12pt）
        write_log(f"使用字体大小: {font_size}pt")
        
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
        doc_text = model.getText()
        cursor = doc_text.createTextCursor()
        write_log("成功创建文本光标")
        
        # \n\n转化为\n（不知道为什么，ds-v3就是会输出\n\n，指令完全控制不了）
        text = text.replace('\n\n', '\n')
        # 将 \n 转换为 \r 以实现真正的段落换行而不是软换行
        final_text = text.replace('\n', '\r')
        
        write_log(f"准备插入的最终文本: {final_text[:100]}{'...' if len(final_text) > 100 else ''}")
        
        # 移动光标到文档末尾（也可以根据需要移动到当前位置）
        cursor.gotoEnd(False)
        
        # 记录插入前的位置
        start_range = cursor.getStart()
        
        # 在文档中插入文本
        doc_text.insertString(cursor, final_text, False)
        write_log("成功插入文本到文档")
        
        # 创建文本范围用于格式化 - 从插入开始位置到当前光标位置
        text_range = doc_text.createTextCursorByRange(start_range)
        text_range.gotoRange(cursor.getEnd(), True)  # 扩展选择到插入文本的结尾
        
        write_log("开始设置文本格式...")
        
        # === 设置字符格式 ===
        # 设置字体名称
        text_range.setPropertyValue("CharFontName", font_name)
        text_range.setPropertyValue("CharFontNameAsian", font_name)
        text_range.setPropertyValue("CharFontNameComplex", font_name)
        write_log(f"已设置字体: {font_name}")
        
        # 设置字体颜色
        text_range.setPropertyValue("CharColor", color_value)
        write_log(f"已设置字体颜色: 0x{color_value:06X}")
        
        # 设置字体大小
        text_range.setPropertyValue("CharHeight", float(font_size))
        text_range.setPropertyValue("CharHeightAsian", float(font_size))
        text_range.setPropertyValue("CharHeightComplex", float(font_size))
        write_log(f"已设置字体大小: {font_size}pt")
        
        write_log("文本格式设置完成")
        
        write_log("=== insert_text() 函数执行完成 ===")
        
        # 构建返回信息
        format_info = f"字体: {font_name}, {font_color}, {font_size}pt"
        
        return f"SUCCESS: 成功插入并格式化文本 ({len(final_text)} 字符, {format_info})"
        
    except Exception as e:
        error_msg = f"ERROR in insert_text(): {str(e)}"
        error_traceback = traceback.format_exc()
        write_log(f"{error_msg}\n{error_traceback}")
        
        # 尝试在文档中也显示错误信息 - 已注释避免弹出信息
        # try:
        #     desktop = XSCRIPTCONTEXT.getDesktop()
        #     model = desktop.getCurrentComponent()
        #     if model:
        #         doc_text = model.getText()
        #         cursor = doc_text.createTextCursor()
        #         cursor.gotoEnd(False)
        #         error_display = f"\n[ERROR] insert_text() 执行失败: {str(e)}\n"
        #         doc_text.insertString(cursor, error_display, False)
        # except:
        #     pass
            
        return error_msg

def set_paragraph(line_spacing=1.5, first_line_indent=700, left_margin=0, right_margin=0, space_before=0, space_after=0):
    """设置当前段落或后续段落的格式
    
    参数：
    line_spacing: 行间距，如1.5表示1.5倍行距
    first_line_indent: 首行缩进，单位为1/100毫米，如700表示2个中文字符（约7mm）
    left_margin: 左边距，单位为1/100毫米
    right_margin: 右边距，单位为1/100毫米
    space_before: 段前间距，单位为1/100毫米
    space_after: 段后间距，单位为1/100毫米
    """
    # 参数验证和默认值处理
    if line_spacing is None or not isinstance(line_spacing, (int, float)):
        line_spacing = 1.5
    if first_line_indent is None or not isinstance(first_line_indent, (int, float)):
        first_line_indent = 700
    if left_margin is None or not isinstance(left_margin, (int, float)):
        left_margin = 0
    if right_margin is None or not isinstance(right_margin, (int, float)):
        right_margin = 0
    if space_before is None or not isinstance(space_before, (int, float)):
        space_before = 0
    if space_after is None or not isinstance(space_after, (int, float)):
        space_after = 0
    
    write_log(f"📐📐📐 set_paragraph() 函数被调用！")
    write_log(f"段落参数: line_spacing={line_spacing}, first_line_indent={first_line_indent}")
    write_log(f"边距参数: left_margin={left_margin}, right_margin={right_margin}")
    write_log(f"间距参数: space_before={space_before}, space_after={space_after}")
    write_log("=== set_paragraph() 函数开始执行 ===")
    
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
        doc_text = model.getText()
        cursor = doc_text.createTextCursor()
        write_log("成功创建文本光标")
        
        # 移动光标到文档末尾（也可以根据需要移动到当前位置）
        cursor.gotoEnd(False)
        
        # 创建一个段落范围用于格式化
        # 如果当前位置有内容，则格式化当前段落；否则格式化后续插入的内容
        paragraph_cursor = cursor.getStart()
        text_range = doc_text.createTextCursorByRange(paragraph_cursor)
        
        write_log("开始设置段落格式...")
        
        # === 设置行间距 ===
        if line_spacing > 0:
            write_log(f"设置行间距: {line_spacing}")
            try:
                import uno
                # 创建LineSpacing结构体
                line_spacing_struct = uno.createUnoStruct("com.sun.star.style.LineSpacing")
                
                # 根据官方文档，使用正确的Mode值
                # Mode 0 = PROP (比例模式)，Mode 3 = FIXED (固定模式)
                if line_spacing == 1.0:
                    # 单倍行距 - 使用比例模式
                    line_spacing_struct.Mode = 0  # PROP
                    line_spacing_struct.Height = 100  # 100%
                elif line_spacing <= 3.0:
                    # 对于常见的倍数行距，使用比例模式更稳定
                    line_spacing_struct.Mode = 0  # PROP
                    line_spacing_struct.Height = int(line_spacing * 100)  # 转换为百分比
                else:
                    # 对于很大的行距值，使用固定模式
                    line_spacing_struct.Mode = 3  # FIXED
                    line_spacing_struct.Height = int(line_spacing * 12 * 35.28)  # 基于12pt字体转换为1/100mm
                
                text_range.setPropertyValue("ParaLineSpacing", line_spacing_struct)
                write_log(f"已设置行间距: {line_spacing}倍 (Mode={line_spacing_struct.Mode}, Height={line_spacing_struct.Height})")
                
            except Exception as line_spacing_error:
                write_log(f"设置行间距时出错: {str(line_spacing_error)}")
        
        # === 设置首行缩进 ===
        if first_line_indent != 0:
            write_log(f"设置首行缩进: {first_line_indent}")
            try:
                # 如果传入的是毫米值，转换为1/100毫米
                if first_line_indent > 0 and first_line_indent < 100:
                    # 假设传入的是毫米，转换为1/100毫米
                    indent_value = int(first_line_indent * 100)
                else:
                    # 假设传入的已经是1/100毫米单位
                    indent_value = int(first_line_indent)
                
                text_range.setPropertyValue("ParaFirstLineIndent", indent_value)
                write_log(f"已设置首行缩进: {indent_value/100:.1f}mm ({indent_value} 1/100mm)")
                
            except Exception as indent_error:
                write_log(f"设置首行缩进时出错: {str(indent_error)}")
        
        # === 设置左边距 ===
        if left_margin != 0:
            write_log(f"设置左边距: {left_margin}")
            try:
                if left_margin > 0 and left_margin < 100:
                    # 假设传入的是毫米，转换为1/100毫米
                    margin_value = int(left_margin * 100)
                else:
                    # 假设传入的已经是1/100毫米单位
                    margin_value = int(left_margin)
                
                text_range.setPropertyValue("ParaLeftMargin", margin_value)
                write_log(f"已设置左边距: {margin_value/100:.1f}mm ({margin_value} 1/100mm)")
                
            except Exception as margin_error:
                write_log(f"设置左边距时出错: {str(margin_error)}")
        
        # === 设置右边距 ===
        if right_margin != 0:
            write_log(f"设置右边距: {right_margin}")
            try:
                if right_margin > 0 and right_margin < 100:
                    # 假设传入的是毫米，转换为1/100毫米
                    margin_value = int(right_margin * 100)
                else:
                    # 假设传入的已经是1/100毫米单位
                    margin_value = int(right_margin)
                
                text_range.setPropertyValue("ParaRightMargin", margin_value)
                write_log(f"已设置右边距: {margin_value/100:.1f}mm ({margin_value} 1/100mm)")
                
            except Exception as margin_error:
                write_log(f"设置右边距时出错: {str(margin_error)}")
        
        # === 设置段前间距 ===
        if space_before != 0:
            write_log(f"设置段前间距: {space_before}")
            try:
                if space_before > 0 and space_before < 100:
                    # 假设传入的是毫米，转换为1/100毫米
                    space_value = int(space_before * 100)
                else:
                    # 假设传入的已经是1/100毫米单位
                    space_value = int(space_before)
                
                text_range.setPropertyValue("ParaTopMargin", space_value)
                write_log(f"已设置段前间距: {space_value/100:.1f}mm ({space_value} 1/100mm)")
                
            except Exception as space_error:
                write_log(f"设置段前间距时出错: {str(space_error)}")
        
        # === 设置段后间距 ===
        if space_after != 0:
            write_log(f"设置段后间距: {space_after}")
            try:
                if space_after > 0 and space_after < 100:
                    # 假设传入的是毫米，转换为1/100毫米
                    space_value = int(space_after * 100)
                else:
                    # 假设传入的已经是1/100毫米单位
                    space_value = int(space_after)
                
                text_range.setPropertyValue("ParaBottomMargin", space_value)
                write_log(f"已设置段后间距: {space_value/100:.1f}mm ({space_value} 1/100mm)")
                
            except Exception as space_error:
                write_log(f"设置段后间距时出错: {str(space_error)}")
        
        write_log("段落格式设置完成")
        
        write_log("=== set_paragraph() 函数执行完成 ===")
        
        # 构建返回信息
        format_info = []
        format_info.append(f"行间距: {line_spacing}倍")
        format_info.append(f"首行缩进: {first_line_indent}")
        if left_margin != 0:
            format_info.append(f"左边距: {left_margin}")
        if right_margin != 0:
            format_info.append(f"右边距: {right_margin}")
        if space_before != 0:
            format_info.append(f"段前间距: {space_before}")
        if space_after != 0:
            format_info.append(f"段后间距: {space_after}")
        
        return f"SUCCESS: 成功设置段落格式 ({', '.join(format_info)})"
        
    except Exception as e:
        error_msg = f"ERROR in set_paragraph(): {str(e)}"
        error_traceback = traceback.format_exc()
        write_log(f"{error_msg}\n{error_traceback}")
        
        # 尝试在文档中也显示错误信息
        try:
            desktop = XSCRIPTCONTEXT.getDesktop()
            model = desktop.getCurrentComponent()
            if model:
                doc_text = model.getText()
                cursor = doc_text.createTextCursor()
                cursor.gotoEnd(False)
                error_display = f"\n[ERROR] set_paragraph() 执行失败: {str(e)}\n"
                doc_text.insertString(cursor, error_display, False)
        except:
            pass
            
        return error_msg

def insert_title(title, outline_level=1, font_name="SimSun", font_size=14, font_color="black", font_bold=True):
    """
    插入标题文本，设置大纲级别和格式
    
    参数：
    - title: 标题文本
    - outline_level: 大纲级别 (1-10，其中1是最高级别)
    - font_name: 字体名称，默认"SimSun"
    - font_size: 字体大小，默认14
    - font_color: 字体颜色，默认"black"
    - font_bold: 是否粗体，默认True
    
    返回值：
    - dict: 包含操作结果的字典
    """
    write_log(f"📝📝📝 insert_title() 函数被调用！标题: {title}")
    write_log(f"参数: outline_level={outline_level}, font_name={font_name}, font_size={font_size}, font_color={font_color}, font_bold={font_bold}")
    write_log("=== insert_title() 函数开始执行 ===")
    
    try:
        # 获取时间戳
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 获取文档上下文
        desktop = XSCRIPTCONTEXT.getDesktop()
        model = desktop.getCurrentComponent()
        doc_text = model.getText()
        cursor = doc_text.createTextCursor()
        
        # 移动到文档末尾
        cursor.gotoEnd(False)
        write_log("光标已移动到文档末尾")
        
        # === 第一步：检查是否需要在标题前添加段落分隔符 ===
        # 使用XParagraphCursor接口的isStartOfParagraph()方法检查位置
        is_at_paragraph_start = False
        try:
            # 创建段落光标来检查当前位置
            temp_cursor = doc_text.createTextCursorByRange(cursor.getStart())
            
            # 尝试查询XParagraphCursor接口
            try:
                # 根据UNO API规范，使用queryInterface获取接口
                para_cursor_interface = temp_cursor.queryInterface(uno.getTypeByName("com.sun.star.text.XParagraphCursor"))
                if para_cursor_interface and hasattr(para_cursor_interface, 'isStartOfParagraph'):
                    is_at_paragraph_start = para_cursor_interface.isStartOfParagraph()
                    write_log(f"使用XParagraphCursor.isStartOfParagraph()检查: {is_at_paragraph_start}")
                else:
                    raise Exception("无法获取XParagraphCursor接口")
            except Exception as interface_error:
                write_log(f"⚠️ queryInterface失败: {str(interface_error)}")
                # 备用方法：检查光标前是否有文本
                test_cursor = doc_text.createTextCursorByRange(cursor.getStart())
                try:
                    if test_cursor.goLeft(1, True):
                        # 如果能向左移动，说明前面有字符，检查是否为段落分隔符
                        selected_text = test_cursor.getString()
                        is_at_paragraph_start = (selected_text == "\r" or selected_text == "\n")
                        write_log(f"备用方法检查前一字符: '{repr(selected_text)}', 结果: {is_at_paragraph_start}")
                    else:
                        # 如果无法向左移动，说明在文档开始
                        is_at_paragraph_start = True
                        write_log("无法向左移动，认为在文档开始（段落开始）")
                except Exception as backup_error:
                    write_log(f"⚠️ 备用方法也失败: {str(backup_error)}")
                    # 最保守的方法：检查当前光标是否选中了内容
                    if cursor.isCollapsed():
                        # 光标没有选中内容，可能在段落开始
                        is_at_paragraph_start = True
                        write_log("光标无选中内容，假设在段落开始")
                    else:
                        is_at_paragraph_start = False
                        write_log("光标有选中内容，假设不在段落开始")
        except Exception as para_error:
            write_log(f"⚠️ 段落位置检查失败: {str(para_error)}")
            # 最终保守处理：总是添加段落分隔符以确保标题独立成段
            is_at_paragraph_start = False
            write_log("所有检查方法都失败，保守起见总是添加段落分隔符")
        
        write_log(f"最终判断 - 当前位置是否在段落开始: {is_at_paragraph_start}")
        
        # 如果不在段落开始，需要先添加段落分隔符
        prefix_text = "" if is_at_paragraph_start else "\r"
        
        # 处理标题文本，将 \n 转换为 \r
        processed_title = title.replace('\n', '\r')
        
        # 构建完整的插入文本：前缀 + 标题 + 后缀段落分隔符
        final_text = prefix_text + processed_title + "\r"
        
        write_log(f"将要插入的文本: '{final_text}' (前缀:{len(prefix_text)}字符, 标题:{len(processed_title)}字符, 后缀:1字符)")
        
        # === 第二步：插入完整文本 ===
        doc_text.insertString(cursor, final_text, False)
        write_log("文本已插入到文档")
        
        # === 第三步：选中标题文本进行格式设置 ===
        # 计算标题文本的位置（跳过前缀，不包含后缀）
        title_start_offset = len(prefix_text)
        title_length = len(processed_title)
        
        # 回到插入文本的开始位置
        cursor.goLeft(len(final_text), False)
        write_log("光标已移动到插入文本的开始位置")
        
        # 移动到标题开始位置（跳过前缀）
        if title_start_offset > 0:
            cursor.goRight(title_start_offset, False)
            write_log(f"光标已跳过前缀，移动到标题开始位置")
        
        # 选中标题文本
        cursor.goRight(title_length, True)
        write_log(f"已选中标题文本 ({title_length} 字符): '{cursor.getString()}'")
        
        # === 第四步：设置字符格式 ===
        try:
            write_log("开始设置字符格式...")
            
            # 设置字体名称 (包括所有字体变体)
            cursor.setPropertyValue("CharFontName", font_name)
            cursor.setPropertyValue("CharFontNameAsian", font_name)
            cursor.setPropertyValue("CharFontNameComplex", font_name)
            write_log(f"已设置字体名称: {font_name}")
            
            # 设置字体大小 (包括所有字体变体)
            cursor.setPropertyValue("CharHeight", float(font_size))
            cursor.setPropertyValue("CharHeightAsian", float(font_size))
            cursor.setPropertyValue("CharHeightComplex", float(font_size))
            write_log(f"已设置字体大小: {font_size}pt")
            
            # 处理字体颜色
            color_map = {
                'black': 0x000000,
                'red': 0xFF0000,
                'blue': 0x0000FF,
                'green': 0x008000,
                'yellow': 0xFFFF00,
                'orange': 0xFFA500,
                'purple': 0x800080,
                'brown': 0xA52A2A,
                'gray': 0x808080,
            }
            
            if isinstance(font_color, str) and font_color.lower() in color_map:
                color_value = color_map[font_color.lower()]
            elif isinstance(font_color, int):
                color_value = font_color
            else:
                color_value = 0x000000  # 默认黑色
                write_log(f"⚠️ 未识别的颜色 {font_color}，使用默认黑色")
            
            cursor.setPropertyValue("CharColor", color_value)
            write_log(f"已设置字体颜色: {font_color} (0x{color_value:06X})")
            
            # 设置字体粗细
            if font_bold:
                import com.sun.star.awt.FontWeight
                cursor.setPropertyValue("CharWeight", com.sun.star.awt.FontWeight.BOLD)
                write_log("已设置为粗体")
            else:
                import com.sun.star.awt.FontWeight
                cursor.setPropertyValue("CharWeight", com.sun.star.awt.FontWeight.NORMAL)
                write_log("已设置为正常字重")
                
        except Exception as e:
            write_log(f"❌ 设置字符格式时出错: {str(e)}")
        
        # === 第五步：设置段落格式 ===
        try:
            write_log("开始设置段落格式...")
            
            # 设置行间距为1.5倍
            line_spacing_struct = uno.createUnoStruct("com.sun.star.style.LineSpacing")
            line_spacing_struct.Mode = 0  # PROP模式 (比例模式)
            line_spacing_struct.Height = 150  # 150%
            cursor.setPropertyValue("ParaLineSpacing", line_spacing_struct)
            write_log(f"已设置行间距: 1.5倍 (比例模式, 150%)")
            
            # 设置首行缩进为0
            cursor.setPropertyValue("ParaFirstLineIndent", 0)
            write_log("已设置首行缩进: 0")
            
            # 设置左右边距为0
            cursor.setPropertyValue("ParaLeftMargin", 0)
            cursor.setPropertyValue("ParaRightMargin", 0)
            write_log("已设置左右边距: 0")
            
        except Exception as e:
            write_log(f"❌ 设置段落格式时出错: {str(e)}")
        
        # === 第六步：设置大纲级别 ===
        try:
            # 验证大纲级别范围
            if outline_level < 1:
                outline_level = 1
            elif outline_level > 10:
                outline_level = 10
            
            cursor.setPropertyValue("OutlineLevel", outline_level)
            write_log(f"已设置大纲级别: {outline_level}")
            
        except Exception as e:
            write_log(f"❌ 设置大纲级别时出错: {str(e)}")
        
        # === 第七步：移动光标到文档末尾 ===
        cursor.gotoEnd(False)
        write_log("光标已移动到文档末尾，格式设置完成")
        
        write_log(f"✅ 标题插入完成: {processed_title}")
        write_log("=== insert_title() 函数执行完成 ===")
        
        return {
            "status": "success",
            "message": f"标题插入成功: {processed_title}",
            "title": title,
            "outline_level": outline_level,
            "timestamp": timestamp
        }
        
    except Exception as e:
        error_msg = f"ERROR in insert_title(): {str(e)}"
        error_traceback = traceback.format_exc()
        write_log(f"{error_msg}\n{error_traceback}")
        
        # 尝试在文档中也显示错误信息
        try:
            desktop = XSCRIPTCONTEXT.getDesktop()
            model = desktop.getCurrentComponent()
            if model:
                doc_text = model.getText()
                cursor = doc_text.createTextCursor()
                cursor.gotoEnd(False)
                error_display = f"\n[ERROR] insert_title() 执行失败: {str(e)}\n"
                doc_text.insertString(cursor, error_display, False)
        except:
            pass
        
        return {
            "status": "error",
            "message": error_msg,
            "timestamp": timestamp
        }

def insert_table(rows=3, columns=3, table_title="", cell_data=None, 
                border_style="simple", column_widths=None, 
                header_style=True, font_name="SimSun", font_size=12):
    """
    插入表格到文档当前位置，支持批量数据填充和样式设置
    
    参数：
    - rows: 表格行数（默认3行）
    - columns: 表格列数（默认3列）
    - table_title: 表格标题（可选，会插入在表格上方）
    - cell_data: 单元格数据，支持多种格式：
      - None: 创建空表格
      - 字符串: 所有单元格填充相同内容
      - 二维列表: [["A1","B1","C1"], ["A2","B2","C2"]]
      - 字典: {"A1": "内容1", "B2": "内容2"} (按单元格名称填充)
    - border_style: 边框样式（"simple"/"none"/"thick"）
    - column_widths: 列宽设置，单位cm，如[3.0, 4.0, 2.5]
    - header_style: 是否设置第一行为表头样式（粗体、居中）
    - font_name, font_size: 表格字体设置
    """
    write_log(f"📊📊📊 insert_table() 函数被调用！")
    write_log(f"表格参数: rows={rows}, columns={columns}, title='{table_title}'")
    write_log(f"样式参数: border_style={border_style}, header_style={header_style}")
    write_log(f"字体参数: font_name={font_name}, font_size={font_size}")
    write_log("=== insert_table() 函数开始执行 ===")
    
    try:
        # 参数验证和默认值处理
        if not isinstance(rows, int) or rows <= 0:
            rows = 3
            write_log(f"⚠️ 行数无效，使用默认值: {rows}")
        
        if not isinstance(columns, int) or columns <= 0:
            columns = 3
            write_log(f"⚠️ 列数无效，使用默认值: {columns}")
        
        if not font_name:
            font_name = "SimSun"
        
        if not isinstance(font_size, (int, float)) or font_size <= 0:
            font_size = 12
        
        write_log(f"最终参数: {rows}行 x {columns}列, 字体: {font_name} {font_size}pt")
        
        # 获取文档上下文
        desktop = XSCRIPTCONTEXT.getDesktop()
        write_log("成功获取desktop")
        
        model = desktop.getCurrentComponent()
        write_log(f"获取当前文档组件: {model}")

        if not model:
            write_log("ERROR: 没有打开的文档")
            return "ERROR: 没有打开的文档"

        # 获取文档的文本内容和光标
        doc_text = model.getText()
        cursor = doc_text.createTextCursor()
        cursor.gotoEnd(False)
        write_log("成功创建文本光标并移动到文档末尾")
        
        # === 第一步：插入表格标题（如果提供） ===
        if table_title and table_title.strip():
            title_text = f"\n{table_title.strip()}\n"
            doc_text.insertString(cursor, title_text, False)
            write_log(f"已插入表格标题: {table_title}")
        
        # === 第二步：创建表格 ===
        write_log("开始创建表格...")
        
        # 创建表格对象
        table = model.createInstance("com.sun.star.text.TextTable")
        write_log("成功创建表格实例")
        
        # 初始化表格尺寸
        table.initialize(rows, columns)
        write_log(f"成功初始化表格尺寸: {rows}行 x {columns}列")
        
        # 插入表格到文档
        doc_text.insertTextContent(cursor, table, False)
        write_log("✅ 表格已成功插入到文档")
        
        # === 第三步：设置列宽（如果提供） ===
        if column_widths:
            write_log("设置列宽...")
            
            # 处理JSON字符串格式的列宽数据
            if isinstance(column_widths, str):
                try:
                    import json
                    column_widths = json.loads(column_widths)
                    write_log(f"成功解析列宽JSON字符串: {column_widths}")
                except:
                    write_log(f"无法解析列宽JSON字符串，跳过列宽设置")
                    column_widths = None
            
            if column_widths and isinstance(column_widths, list):
                try:
                    table_columns = table.getColumns()
                    for i, width in enumerate(column_widths):
                        if i < columns and isinstance(width, (int, float)) and width > 0:
                            col = table_columns.getByIndex(i)
                            # 转换为微米单位 (1cm = 10000微米)
                            width_microns = int(width * 10000)
                            col.setPropertyValue("Width", width_microns)
                            write_log(f"  列{i+1}宽度设置为: {width}cm ({width_microns}微米)")
                    
                    write_log("✅ 列宽设置完成")
                except Exception as width_error:
                    write_log(f"⚠️ 设置列宽时出错: {str(width_error)}")
        
        # === 第四步：填充表格数据 ===
        if cell_data is not None:
            write_log("开始填充表格数据...")
            write_log(f"数据类型: {type(cell_data)}")
            
            # 处理JSON字符串格式的数据（从前端传来的可能是JSON字符串）
            if isinstance(cell_data, str):
                try:
                    import json
                    cell_data = json.loads(cell_data)
                    write_log(f"成功解析JSON字符串，转换后类型: {type(cell_data)}")
                except:
                    write_log(f"无法解析JSON字符串，保持原始字符串格式")
            
            try:
                if isinstance(cell_data, list) and len(cell_data) > 0:
                    # 处理二维列表数据 - 优先使用批量方法
                    if all(isinstance(row, list) for row in cell_data):
                        write_log("检测到二维列表数据，尝试批量填充...")
                        
                        try:
                            # 计算实际数据范围
                            data_rows = min(len(cell_data), rows)
                            data_cols = min(max(len(row) for row in cell_data) if cell_data else 0, columns)
                            
                            if data_rows > 0 and data_cols > 0:
                                # 构建单元格范围
                                range_name = f"A1:{chr(65 + data_cols - 1)}{data_rows}"
                                write_log(f"使用范围 {range_name} 进行批量填充")
                                
                                # 获取单元格范围
                                cell_range = table.getCellRangeByName(range_name)
                                
                                # 准备数据数组
                                data_array = []
                                for i in range(data_rows):
                                    row_data = []
                                    for j in range(data_cols):
                                        if i < len(cell_data) and j < len(cell_data[i]):
                                            cell_value = cell_data[i][j]
                                            row_data.append(str(cell_value) if cell_value is not None else "")
                                        else:
                                            row_data.append("")
                                    data_array.append(tuple(row_data))
                                
                                # 批量设置数据
                                cell_range.setDataArray(tuple(data_array))
                                write_log(f"✅ 成功使用批量方法填充 {data_rows}x{data_cols} 数据")
                            
                        except Exception as batch_error:
                            write_log(f"⚠️ 批量填充失败，使用逐个单元格填充: {str(batch_error)}")
                            # 回退到逐个单元格填充
                            for i, row_data in enumerate(cell_data):
                                if i >= rows:
                                    break
                                if isinstance(row_data, list):
                                    for j, cell_value in enumerate(row_data):
                                        if j >= columns:
                                            break
                                        cell_name = f"{chr(65 + j)}{i + 1}"
                                        try:
                                            cell = table.getCellByName(cell_name)
                                            cell.setString(str(cell_value) if cell_value is not None else "")
                                        except Exception as cell_error:
                                            write_log(f"❌ 填充单元格 {cell_name} 失败: {str(cell_error)}")
                    
                    else:
                        # 一维列表，按行填充
                        write_log("检测到一维列表数据，按行填充...")
                        for i, item in enumerate(cell_data):
                            if i >= rows:
                                break
                            for j in range(columns):
                                cell_name = f"{chr(65 + j)}{i + 1}"
                                try:
                                    cell = table.getCellByName(cell_name)
                                    cell.setString(str(item) if item is not None else "")
                                except Exception as cell_error:
                                    write_log(f"❌ 填充单元格 {cell_name} 失败: {str(cell_error)}")
                
                elif isinstance(cell_data, dict):
                    # 字典数据，按单元格名称填充
                    write_log("检测到字典数据，按单元格名称填充...")
                    for cell_name, cell_value in cell_data.items():
                        try:
                            cell = table.getCellByName(cell_name.upper())
                            cell.setString(str(cell_value) if cell_value is not None else "")
                            write_log(f"  填充单元格 {cell_name}: {str(cell_value)[:20]}...")
                        except Exception as cell_error:
                            write_log(f"❌ 填充单元格 {cell_name} 失败: {str(cell_error)}")
                
                elif isinstance(cell_data, str):
                    # 字符串数据，填充所有单元格
                    write_log("检测到字符串数据，填充所有单元格...")
                    for i in range(rows):
                        for j in range(columns):
                            cell_name = f"{chr(65 + j)}{i + 1}"
                            try:
                                cell = table.getCellByName(cell_name)
                                cell.setString(cell_data)
                            except Exception as cell_error:
                                write_log(f"❌ 填充单元格 {cell_name} 失败: {str(cell_error)}")
                
                write_log("✅ 数据填充完成")
                
            except Exception as data_error:
                write_log(f"❌ 数据填充过程中出错: {str(data_error)}")
        
        # === 第五步：设置表头样式 ===
        if header_style and rows > 0:
            write_log("设置表头样式...")
            try:
                for j in range(columns):
                    cell_name = f"{chr(65 + j)}1"
                    try:
                        cell = table.getCellByName(cell_name)
                        
                        # 设置粗体
                        cell.setPropertyValue("CharWeight", 150.0)  # Bold
                        
                        # 设置居中对齐
                        cell.setPropertyValue("ParaAdjust", 1)  # CENTER
                        
                        # 设置背景色（浅灰色）
                        cell.setPropertyValue("BackColor", 0xF0F0F0)
                        
                        write_log(f"  表头单元格 {cell_name} 样式设置完成")
                        
                    except Exception as header_error:
                        write_log(f"❌ 设置表头单元格 {cell_name} 样式失败: {str(header_error)}")
                
                write_log("✅ 表头样式设置完成")
                
            except Exception as header_style_error:
                write_log(f"⚠️ 设置表头样式时出错: {str(header_style_error)}")
        
        # === 第六步：设置表格字体 ===
        try:
            write_log("设置表格字体...")
            
            # 设置整个表格的字体属性
            table.setPropertyValue("CharFontName", font_name)
            table.setPropertyValue("CharFontNameAsian", font_name)
            table.setPropertyValue("CharHeight", float(font_size))
            table.setPropertyValue("CharHeightAsian", float(font_size))
            
            write_log(f"✅ 表格字体设置完成: {font_name} {font_size}pt")
            
        except Exception as font_error:
            write_log(f"⚠️ 设置表格字体时出错: {str(font_error)}")
        
        # === 第七步：设置边框样式 ===
        try:
            write_log(f"设置表格边框样式: {border_style}")
            
            if border_style == "none":
                # 无边框
                table.setPropertyValue("TableBorder", None)
                write_log("已设置为无边框")
                
            elif border_style == "thick":
                # 粗边框
                try:
                    # 创建边框线
                    from com.sun.star.table import BorderLine
                    border_line = BorderLine()
                    border_line.OuterLineWidth = 50  # 粗边框，单位1/100mm
                    border_line.Color = 0x000000     # 黑色
                    
                    # 创建表格边框
                    from com.sun.star.table import TableBorder
                    table_border = TableBorder()
                    table_border.TopLine = border_line
                    table_border.BottomLine = border_line
                    table_border.LeftLine = border_line
                    table_border.RightLine = border_line
                    table_border.HorizontalLine = border_line
                    table_border.VerticalLine = border_line
                    
                    table.setPropertyValue("TableBorder", table_border)
                    write_log("已设置为粗边框")
                    
                except Exception as thick_border_error:
                    write_log(f"⚠️ 设置粗边框失败: {str(thick_border_error)}，使用默认边框")
            
            else:
                # 默认simple边框或其他情况，使用系统默认
                write_log("使用默认边框样式")
            
        except Exception as border_error:
            write_log(f"⚠️ 设置边框样式时出错: {str(border_error)}")
        
        # === 第八步：移动光标到表格后 ===
        cursor.gotoEnd(False)
        
        # === 第九步：插入确认消息 ===
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 统计信息
        data_info = ""
        if cell_data is not None:
            if isinstance(cell_data, list):
                data_info = f", 已填充 {len(cell_data)} 行数据"
            elif isinstance(cell_data, dict):
                data_info = f", 已填充 {len(cell_data)} 个单元格"
            elif isinstance(cell_data, str):
                data_info = f", 已用统一内容填充"
        
        confirmation_msg = f"\n[{timestamp}] 📊 表格插入完成:\n"
        confirmation_msg += f"   尺寸: {rows}行 x {columns}列\n"
        confirmation_msg += f"   标题: {table_title if table_title else '无'}\n"
        confirmation_msg += f"   字体: {font_name} {font_size}pt\n"
        confirmation_msg += f"   边框: {border_style}\n"
        confirmation_msg += f"   表头样式: {'是' if header_style else '否'}\n"
        if column_widths:
            confirmation_msg += f"   列宽: {column_widths}\n"
        confirmation_msg += f"   数据: {'已填充' if cell_data is not None else '空表格'}{data_info}\n"
        
        doc_text.insertString(cursor, confirmation_msg, False)
        write_log("已在文档末尾插入确认消息")
        
        write_log("=== insert_table() 函数执行完成 ===")
        
        return f"SUCCESS: 成功插入 {rows}x{columns} 表格{data_info}"
        
    except Exception as e:
        error_msg = f"ERROR in insert_table(): {str(e)}"
        error_traceback = traceback.format_exc()
        write_log(f"{error_msg}\n{error_traceback}")
        
        # 尝试在文档中也显示错误信息
        try:
            desktop = XSCRIPTCONTEXT.getDesktop()
            model = desktop.getCurrentComponent()
            if model:
                doc_text = model.getText()
                cursor = doc_text.createTextCursor()
                cursor.gotoEnd(False)
                error_display = f"\n[ERROR] insert_table() 执行失败: {str(e)}\n"
                doc_text.insertString(cursor, error_display, False)
        except:
            pass
            
        return error_msg

def insert_image(image_path, image_title="", width=None, height=None, 
                anchor_type="at_paragraph", alignment="center",
                keep_aspect_ratio=True):
    """
    插入图片到文档当前位置
    
    参数：
    - image_path: 图片文件路径（支持本地路径和URL）
    - image_title: 图片标题/说明（会作为图片标题插入）
    - width: 图片宽度，单位cm（None表示使用原始宽度）
    - height: 图片高度，单位cm（None表示使用原始高度）
    - anchor_type: 锚定类型：
      - "at_paragraph": 锚定到段落
      - "at_character": 锚定到字符
      - "as_character": 作为字符
      - "at_page": 锚定到页面
    - alignment: 对齐方式（"left"/"center"/"right"）
    - keep_aspect_ratio: 是否保持纵横比
    """
    write_log(f"🖼️🖼️🖼️ insert_image() 函数被调用！")
    write_log(f"图片参数: path='{image_path}', title='{image_title}'")
    write_log(f"尺寸参数: width={width}, height={height}, keep_aspect_ratio={keep_aspect_ratio}")
    write_log(f"样式参数: anchor_type={anchor_type}, alignment={alignment}")
    write_log("=== insert_image() 函数开始执行 ===")
    
    try:
        # 参数验证
        if not image_path or not image_path.strip():
            error_msg = "ERROR: 图片路径为空"
            write_log(error_msg)
            return error_msg
        
        image_path = image_path.strip()
        write_log(f"图片路径: {image_path}")
        
        # 获取文档上下文
        desktop = XSCRIPTCONTEXT.getDesktop()
        write_log("成功获取desktop")
        
        model = desktop.getCurrentComponent()
        write_log(f"获取当前文档组件: {model}")

        if not model:
            write_log("ERROR: 没有打开的文档")
            return "ERROR: 没有打开的文档"

        # 获取文档的文本内容和光标
        doc_text = model.getText()
        cursor = doc_text.createTextCursor()
        cursor.gotoEnd(False)
        write_log("成功创建文本光标并移动到文档末尾")
        
        # === 第一步：处理图片路径 ===
        write_log("处理图片路径...")
        
        graphic_url = ""
        try:
            import uno
            import os
            
            # 检查是否为URL
            if image_path.startswith(('http://', 'https://', 'ftp://', 'file://')):
                graphic_url = image_path
                write_log(f"检测到URL格式: {graphic_url}")
            else:
                # 本地文件路径处理
                if not os.path.isabs(image_path):
                    # 相对路径转换为绝对路径
                    image_path = os.path.abspath(image_path)
                    write_log(f"相对路径已转换为绝对路径: {image_path}")
                
                # 检查文件是否存在
                if not os.path.exists(image_path):
                    error_msg = f"ERROR: 图片文件不存在: {image_path}"
                    write_log(error_msg)
                    return error_msg
                
                # 转换为UNO URL格式
                graphic_url = uno.systemPathToFileUrl(image_path)
                write_log(f"本地路径已转换为UNO URL: {graphic_url}")
            
        except Exception as path_error:
            error_msg = f"ERROR: 图片路径处理失败: {str(path_error)}"
            write_log(error_msg)
            return error_msg
        
        # === 第二步：创建图片对象 ===
        write_log("创建图片对象...")
        
        try:
            # 创建图形对象
            graphic = model.createInstance("com.sun.star.text.GraphicObject")
            write_log("成功创建图形对象实例")
            
            # 设置图片URL
            graphic.setPropertyValue("GraphicURL", graphic_url)
            write_log(f"已设置图片URL: {graphic_url}")
            
        except Exception as create_error:
            error_msg = f"ERROR: 创建图片对象失败: {str(create_error)}"
            write_log(error_msg)
            return error_msg
        
        # === 第三步：设置锚定类型 ===
        write_log(f"设置锚定类型: {anchor_type}")
        
        try:
            from com.sun.star.text import TextContentAnchorType
            
            anchor_types = {
                "at_paragraph": TextContentAnchorType.AT_PARAGRAPH,
                "at_character": TextContentAnchorType.AT_CHARACTER,
                "as_character": TextContentAnchorType.AS_CHARACTER,
                "at_page": TextContentAnchorType.AT_PAGE
            }
            
            anchor_value = anchor_types.get(anchor_type, TextContentAnchorType.AT_PARAGRAPH)
            graphic.setPropertyValue("AnchorType", anchor_value)
            write_log(f"已设置锚定类型: {anchor_type}")
            
        except Exception as anchor_error:
            write_log(f"⚠️ 设置锚定类型失败: {str(anchor_error)}，使用默认值")
        
        # === 第四步：插入图片到文档 ===
        write_log("插入图片到文档...")
        
        try:
            doc_text.insertTextContent(cursor, graphic, False)
            write_log("✅ 图片已成功插入到文档")
            
        except Exception as insert_error:
            error_msg = f"ERROR: 插入图片失败: {str(insert_error)}"
            write_log(error_msg)
            return error_msg
        
        # === 第五步：设置图片尺寸 ===
        if width is not None or height is not None:
            write_log("设置图片尺寸...")
            
            try:
                # 获取图片原始尺寸
                original_size = graphic.getPropertyValue("Size")
                original_width_mm = original_size.Width / 100  # 转换为毫米
                original_height_mm = original_size.Height / 100
                
                write_log(f"图片原始尺寸: {original_width_mm:.1f}mm x {original_height_mm:.1f}mm")
                
                # 计算新尺寸
                new_width_mm = width * 10 if width is not None else original_width_mm
                new_height_mm = height * 10 if height is not None else original_height_mm
                
                # 保持纵横比处理
                if keep_aspect_ratio and width is not None and height is not None:
                    original_ratio = original_width_mm / original_height_mm
                    new_ratio = new_width_mm / new_height_mm
                    
                    if abs(new_ratio - original_ratio) > 0.01:  # 比例不一致
                        if new_ratio > original_ratio:
                            # 宽度过大，按高度调整宽度
                            new_width_mm = new_height_mm * original_ratio
                            write_log(f"保持纵横比：调整宽度为 {new_width_mm/10:.1f}cm")
                        else:
                            # 高度过大，按宽度调整高度
                            new_height_mm = new_width_mm / original_ratio
                            write_log(f"保持纵横比：调整高度为 {new_height_mm/10:.1f}cm")
                
                # 设置新尺寸
                from com.sun.star.awt import Size
                new_size = Size()
                new_size.Width = int(new_width_mm * 100)  # 转换为1/100mm
                new_size.Height = int(new_height_mm * 100)
                
                graphic.setPropertyValue("Size", new_size)
                write_log(f"✅ 图片尺寸已设置为: {new_width_mm/10:.1f}cm x {new_height_mm/10:.1f}cm")
                
            except Exception as size_error:
                write_log(f"⚠️ 设置图片尺寸失败: {str(size_error)}")
        
        # === 第六步：设置对齐方式 ===
        if anchor_type != "as_character":  # 作为字符时不能设置段落对齐
            write_log(f"设置对齐方式: {alignment}")
            
            try:
                from com.sun.star.style import ParagraphAdjust
                
                alignment_map = {
                    "left": ParagraphAdjust.LEFT,
                    "center": ParagraphAdjust.CENTER,
                    "right": ParagraphAdjust.RIGHT
                }
                
                if alignment in alignment_map:
                    # 需要设置包含图片的段落的对齐方式
                    graphic.setPropertyValue("ParaAdjust", alignment_map[alignment])
                    write_log(f"已设置对齐方式: {alignment}")
                
            except Exception as align_error:
                write_log(f"⚠️ 设置对齐方式失败: {str(align_error)}")
        
        # === 第七步：插入图片标题（如果提供） ===
        if image_title and image_title.strip():
            write_log("插入图片标题...")
            
            try:
                # 移动光标到图片后
                cursor.gotoEnd(False)
                
                # 插入标题
                title_text = f"\n{image_title.strip()}\n"
                doc_text.insertString(cursor, title_text, False)
                
                # 设置标题格式（居中、小字体）
                title_cursor = doc_text.createTextCursorByRange(cursor.getStart())
                title_cursor.goLeft(len(title_text), True)
                
                title_cursor.setPropertyValue("ParaAdjust", 1)  # CENTER
                title_cursor.setPropertyValue("CharHeight", 10.0)  # 小字体
                title_cursor.setPropertyValue("CharPosture", 1)  # Italic
                
                write_log(f"已插入图片标题: {image_title}")
                
            except Exception as title_error:
                write_log(f"⚠️ 插入图片标题失败: {str(title_error)}")
        
        # === 第八步：移动光标到文档末尾 ===
        cursor.gotoEnd(False)
        
        # === 第九步：插入确认消息 ===
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        confirmation_msg = f"\n[{timestamp}] 🖼️ 图片插入完成:\n"
        confirmation_msg += f"   路径: {image_path}\n"
        confirmation_msg += f"   标题: {image_title if image_title else '无'}\n"
        if width is not None or height is not None:
            size_info = f"{width}cm" if width else "自动"
            size_info += f" x {height}cm" if height else " x 自动"
            confirmation_msg += f"   尺寸: {size_info}\n"
        confirmation_msg += f"   锚定: {anchor_type}\n"
        confirmation_msg += f"   对齐: {alignment}\n"
        confirmation_msg += f"   保持比例: {'是' if keep_aspect_ratio else '否'}\n"
        
        doc_text.insertString(cursor, confirmation_msg, False)
        write_log("已在文档末尾插入确认消息")
        
        write_log("=== insert_image() 函数执行完成 ===")
        
        return f"SUCCESS: 成功插入图片 {image_path}"
        
    except Exception as e:
        error_msg = f"ERROR in insert_image(): {str(e)}"
        error_traceback = traceback.format_exc()
        write_log(f"{error_msg}\n{error_traceback}")
        
        # 尝试在文档中也显示错误信息
        try:
            desktop = XSCRIPTCONTEXT.getDesktop()
            model = desktop.getCurrentComponent()
            if model:
                doc_text = model.getText()
                cursor = doc_text.createTextCursor()
                cursor.gotoEnd(False)
                error_display = f"\n[ERROR] insert_image() 执行失败: {str(e)}\n"
                doc_text.insertString(cursor, error_display, False)
        except:
            pass
            
        return error_msg


def insert_math(formula="E = m c^2", as_inline=True, base_font_height=12):
    doc = XSCRIPTCONTEXT.getDocument()
    view = doc.getCurrentController().getViewCursor()

    obj = doc.createInstance("com.sun.star.text.TextEmbeddedObject")
    obj.CLSID = "078B7ABA-54FC-457F-8551-6147E776A997"  # StarMath OLE

    # ☆ 关键修复：枚举用 uno.Enum，而不是 getConstantByName
    obj.AnchorType = uno.Enum(
        "com.sun.star.text.TextContentAnchorType",
        "AS_CHARACTER" if as_inline else "AT_PARAGRAPH"
    )

    doc.Text.insertTextContent(view, obj, False)

    # 访问公式模型并设置
    model = obj.Model
    model.Formula = formula
    try:
        model.BaseFontHeight = int(base_font_height)
    except Exception:
        pass

    obj.getExtendedControlOverEmbeddedObject().update()

    return f"SUCCESS: 成功插入公式 ({formula})"

# LibreOffice/Collabora CODE 要求导出函数
# 这是必须的，否则CallPythonScript无法找到函数
g_exportedScripts = (hello, get_document_content, test_uno_connection, simple_test, debug_params, search_and_format_text, search_and_replace_with_format, select_chapter, insert_text, set_paragraph, insert_title, insert_table, insert_image, insert_math, ) 