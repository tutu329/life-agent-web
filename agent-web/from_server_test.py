def _listen_to_stream(base_url: str, stream_id: str, stream_name: str):
    """监听单个 SSE 流"""
    # 注意：这里需要构建正确的流URL
    # 假设你的服务器基础URL是 https://powerai.cc:5110
    server_base = base_url.replace('/api/query_2_level_agents_system', '')
    stream_url = f"{server_base}/api/query_2_level_agents_system/stream/{stream_id}/{stream_name}"
    print(f"🔗 连接到流: {stream_name} - {stream_url}")

    try:
        response = requests.get(stream_url, stream=True)
        if response.status_code != 200:
            print(f"❌ 流连接失败: {response.status_code} - {response.text}")
            return

        client = SSEClient(response)

        if stream_name=='output':
            o = dgreen
        elif stream_name=='thinking':
            o = dblue
        elif stream_name=='final_answer':
            o = dred
        elif stream_name=='log':
            o = print
        elif stream_name == 'tool_rtn_data':
            o = dyellow

        o(f'[{stream_name}]', end='')
        for event in client.events():
            o(f"{event.data}", end='')
        o()
    except Exception as e:
        print(f"❌ 流 {stream_name} 出错: {e}")

def main_test_2_level_agents_system_without_remote_tool():
    server_name = 'powerai.cc'
    # server_name = 'localhost'

    request = Agents_System_Request(
        remote_tools=[],
        upper_agent_config=Agent_Config(
            tool_names=['Human_Console_Tool'],
            exp_json_path='my_2_levels_mas_exp.json',

            base_url='https://api.deepseek.com/v1',
            api_key='sk-c1d34a4f21e3413487bb4b2806f6c4b8',
            # llm_model_id='deepseek-reasoner',  # 模型指向 DeepSeek-R1-0528
            llm_model_id='deepseek-chat',  # 模型指向 DeepSeek-V3-0324
            temperature=0.65
        ),
        lower_agents_config=[
            Agent_As_Tool_Config(
                tool_names=['Human_Console_Tool', 'Folder_Tool'],
                exp_json_path='',
                as_tool_name='Folder_Agent_As_Tool',
                as_tool_description='本工具用于获取文件夹中的文件和文件夹信息',

                base_url='https://api.deepseek.com/v1',
                api_key='sk-c1d34a4f21e3413487bb4b2806f6c4b8',
                # llm_model_id = 'deepseek-reasoner',  # 模型指向 DeepSeek-R1-0528
                llm_model_id='deepseek-chat',  # 模型指向 DeepSeek-V3-0324
                temperature=0.70
            )
        ]
    )

    try:
        start_url = f"https://{server_name}:5110/api/start_2_level_agents_system"
        print("🚀 第一步：发送请求启动Agents System...")
        response = requests.post(start_url, json=request.dict())

        if response.status_code == 200:
            result = response.json()
            print("✅ Agents System已启动!")
            print(f"✅ result: '{result}'")
        else:
            print(f"❌ Agents System启动失败: {response.status_code}")
            print(response.text)

    except requests.exceptions.ConnectionError:
        print("❌ 连接失败！请确保agent_fastapi_server.py已启动")
    except Exception as e:
        print(f"❌ 发生错误: {e}")

    query = r'我叫电力用户，请告诉./文件夹下有哪些文件'
    agent_id = result# result即为agent_id
    request = Query_Agent_Request(
        agent_id=agent_id,    # result即为agent_id
        query=query
    )

    try:
        start_url = f"https://{server_name}:5110/api/query_2_level_agents_system"
        print("🚀 第二步：对Agents System进行query...")
        print(f"🚀 query内容: '{query}'")
        response = requests.post(start_url, json=request.dict())

        if response.status_code == 200:
            result = response.json()
            print("✅ 对Agents System的query任务启动成功!")
            print("📄 启动响应:")
            print(result)

            # 获取 stream_id 和可用流
            stream_id = result.get('id')
            available_streams = result.get('streams', [])

            if stream_id and available_streams:
                print(f"\n🆔 获得流 ID: {stream_id}")
                print(f"📡 可用流列表: {available_streams}")

                print(f"\n🔄 第二步：开始监听 SSE 流...")

                # 为每个流创建线程来监听
                threads = []
                for stream_name in available_streams:
                    thread = threading.Thread(
                        target=_listen_to_stream,
                        args=(start_url, stream_id, stream_name)
                    )
                    thread.daemon = True
                    thread.start()
                    threads.append(thread)

                # 等待所有流完成（或手动中断）
                try:
                    print("⏳ 监听流中... (按 Ctrl+C 停止)")
                    # for thread in threads:
                    #     thread.join()
                except KeyboardInterrupt:
                    print("\n⚠️ 用户中断，停止监听流")
            else:
                print("❌ 没有获得有效的流ID或可用流列表")

        else:
            print(f"❌ 任务启动失败: {response.status_code}")
            print(response.text)

    except requests.exceptions.ConnectionError:
        print("❌ 连接失败！请确保agent_fastapi_server.py已启动")
    except Exception as e:
        print(f"❌ 发生错误: {e}")

    start_url = f"https://{server_name}:5110/api/get_agent_status"
    print("检查对Agents System的query是否完成...")
    request = Agent_Status_Request(
        agent_id=agent_id
    )
    while(True):
        response = requests.post(start_url, json=request.dict())
        time.sleep(0.5)
        if response.status_code == 200:
            status = response.json()

            if status['finished']==True:
                break
        time.sleep(1)
    print(f'agent任务执行已完成，客户端退出！')

if __name__ == "__main__":
    main_test_2_level_agents_system_without_remote_tool()