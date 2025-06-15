import time
from utils.encode import safe_encode
from agent.tools.base_tool import Base_Tool
from agent.tools.protocol import Action_Result, Tool_Call_Paras

from utils.web_socket_manager import get_websocket_manager

class Office_Tool(Base_Tool):
    name = 'Office_Tool'
    description = \
        '''控制前端 Collabora CODE 文档编辑器的工具。
        支持的操作包括：
        - "insert_text": 在当前光标位置插入文本。
        - "search_and_replace": 搜索并替换文本。
        - "search_highlight": 搜索文本并高亮显示。
        - "format_text": 格式化选中的文本或后续输入的文本。
        - "goto_bookmark": 跳转到指定书签。
        - "insert_bookmark": 在当前位置插入书签。
        '''
    parameters = [
        {
            'name': 'operation',
            'type': 'string',
            'description': '''操作类型，支持以下值：
- "insert_text": 在当前光标位置插入文本。
- "search_and_replace": 搜索并替换文本。
- "search_highlight": 搜索文本并高亮显示。
- "format_text": 格式化选中的文本或后续输入的文本。
- "goto_bookmark": 跳转到指定书签。
- "insert_bookmark": 在当前位置插入书签。
''',
            'required': 'True',
        },
        {
            'name': 'content',
            'type': 'string',
            'description': '要插入或操作的内容文本。例如，对于`insert_text`，这是要插入的文本；对于`search_and_replace`，这是替换后的新文本。',
            'required': 'False',
        },
        {
            'name': 'target',
            'type': 'string',
            'description': '操作的目标。例如，对于`search_and_replace`或`search_highlight`，这是要搜索的文本；对于`goto_bookmark`或`insert_bookmark`，这是书签名称。',
            'required': 'False',
        },
        {
            'name': 'highlight_color',
            'type': 'string',
            'description': '用于`search_highlight`操作的高亮颜色。可以是颜色名称（如 "yellow"）或十六进制值（如 "#FFFF00"）。默认为 "yellow"。',
            'required': 'False',
        },
        {
            'name': 'format_options',
            'type': 'object',
            'description': '一个包含格式化选项的字典，用于 `format_text` 操作。支持的键包括 `font_name`, `font_size`, `color`, `bold`, `italic`, `underline`。例如: `{"font_name": "宋体", "font_size": 12, "color": "#FF0000", "bold": true}`',
            'required': 'False',
        }
    ]

    def __init__(self):
        print('🔧 Office_Tool 初始化中...')
        # 使用通用WebSocket管理器
        self.ws_manager = get_websocket_manager()
        # 启动WebSocket服务器（如果尚未启动）
        self.ws_manager.start_server()
        print('✅ Office_Tool 初始化完成')

    def call(self, tool_call_paras: Tool_Call_Paras):
        print(f'🔧 Office_Tool 调用参数: {tool_call_paras.callback_tool_paras_dict}')

        # 获取顶层agent_id（用于WebSocket连接管理）
        top_agent_id = tool_call_paras.callback_top_agent_id
        paras = tool_call_paras.callback_tool_paras_dict
        operation = paras.get('operation')

        if not operation:
            return Action_Result(result=safe_encode('❌ 必须提供 "operation" 参数'))

        print(f'🎯 目标Agent ID: {top_agent_id}, 操作: {operation}')

        try:
            # 构建Office操作命令
            command = {
                'type': 'office_operation',
                'operation': operation,
                'agent_id': top_agent_id,
                'data': {},
                'timestamp': int(time.time() * 1000)
            }

            # 根据操作类型填充data
            if operation == 'insert_text':
                if 'content' not in paras:
                    return Action_Result(result=safe_encode('❌ "insert_text" 操作需要 "content" 参数'))
                command['data'] = {'text': paras.get('content', '')}
            elif operation == 'search_and_replace':
                if 'target' not in paras:
                    return Action_Result(result=safe_encode('❌ "search_and_replace" 操作需要 "target" 参数'))
                command['data'] = {'search_text': paras.get('target'), 'replace_text': paras.get('content', '')}
            elif operation == 'search_highlight':
                if 'target' not in paras:
                    return Action_Result(result=safe_encode('❌ "search_highlight" 操作需要 "target" 参数'))
                command['data'] = {'search_text': paras.get('target'), 'highlight_color': paras.get('highlight_color', 'yellow')}
            elif operation == 'format_text':
                if 'format_options' not in paras:
                    return Action_Result(result=safe_encode('❌ "format_text" 操作需要 "format_options" 参数'))
                command['data'] = {'format_options': paras.get('format_options')}
            elif operation == 'goto_bookmark':
                if 'target' not in paras:
                    return Action_Result(result=safe_encode('❌ "goto_bookmark" 操作需要 "target" 参数'))
                command['data'] = {'bookmark_name': paras.get('target')}
            elif operation == 'insert_bookmark':
                if 'target' not in paras:
                    return Action_Result(result=safe_encode('❌ "insert_bookmark" 操作需要 "target" 参数'))
                command['data'] = {'bookmark_name': paras.get('target')}
            else:
                result = f'❌ 操作类型 "{operation}" 暂未实现或未知'
                return Action_Result(result=safe_encode(result))

            # 发送命令到WebSocket客户端
            success, message = self.ws_manager.send_command(top_agent_id, command)
            if success:
                result = f'✅ 成功向客户端 {top_agent_id} 发送操作: "{operation}"'
            else:
                result = f'❌ 向客户端 {top_agent_id} 发送操作 "{operation}" 失败: {message}'

        except Exception as e:
            result = f'❌ Office操作失败: {e!r}'

        # 确保返回安全编码的结果
        safe_result = safe_encode(result)
        action_result = Action_Result(result=safe_result)
        return action_result


# 用于测试的主函数
def main_office():
    import config
    from agent.core.tool_agent import Tool_Agent
    from agent.core.agent_config import Agent_Config

    tools = [Office_Tool]
    query = '请在文档中插入一段测试文本："这是通过 Agent 系统插入的测试内容。"'

    config = Agent_Config(
        base_url='http://powerai.cc:28001/v1',  # llama-4-400b
        api_key='empty',
    )

    agent = Tool_Agent(
        query=query,
        tool_classes=tools,
        agent_config=config
    )
    agent.init()
    success = agent.run()


if __name__ == "__main__":
    main_office()