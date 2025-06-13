#!/usr/bin/env python3
"""
Agent Mock Server for Agent Listener3 Plugin
模拟后台Agent，通过WebSocket向插件发送指令
每3秒发送一次 "tell me your name." 指令
"""

import asyncio
import websockets
import logging
import time
import ssl
import os

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 连接的客户端集合
connected_clients = set()

async def register_client(websocket):
    """注册新客户端"""
    connected_clients.add(websocket)
    logger.info(f"客户端连接: {websocket.remote_address}")
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.remove(websocket)
        logger.info(f"客户端断开: {websocket.remote_address}")

async def broadcast_message(message):
    """向所有连接的客户端广播消息"""
    if connected_clients:
        logger.info(f"广播消息给 {len(connected_clients)} 个客户端: {message}")
        # 创建广播任务
        broadcast_tasks = []
        for client in connected_clients.copy():  # 使用copy避免在迭代时修改集合
            try:
                task = asyncio.create_task(client.send(message))
                broadcast_tasks.append(task)
            except websockets.exceptions.ConnectionClosed:
                logger.warning("发现已断开的连接，移除客户端")
                connected_clients.discard(client)
        
        # 等待所有广播任务完成
        if broadcast_tasks:
            await asyncio.gather(*broadcast_tasks, return_exceptions=True)
    else:
        logger.info(f"没有连接的客户端，跳过广播: {message}")

async def periodic_sender():
    """定期发送指令"""
    message_count = 0
    while True:
        await asyncio.sleep(3)  # 每3秒发送一次
        message_count += 1
        message = f"tell me your name. [{message_count}]"
        await broadcast_message(message)

async def handle_client(websocket):
    """处理客户端连接 - 兼容新版本websockets"""
    logger.info(f"新的WebSocket连接: {websocket.remote_address}")
    await register_client(websocket)

async def main():
    """主函数"""
    logger.info("启动Agent Mock Server...")
    logger.info("WebSocket服务器将在 0.0.0.0:5112 启动 (WSS)")
    logger.info("每3秒向连接的客户端发送指令: 'tell me your name.'")
    
    # 配置SSL上下文
    ssl_context = None
    try:
        # 使用powerai.cc的SSL证书
        cert_path = "/home/tutu/ssl/powerai_public.crt"
        key_path = "/home/tutu/ssl/powerai.key"
        chain_path = "/home/tutu/ssl/powerai_chain.crt"
        
        if os.path.exists(cert_path) and os.path.exists(key_path):
            ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            # 加载证书和私钥
            ssl_context.load_cert_chain(cert_path, key_path)
            # 如果有证书链文件，加载证书链
            if os.path.exists(chain_path):
                ssl_context.load_verify_locations(chain_path)
                logger.info("✅ SSL证书链加载成功")
            logger.info("✅ SSL证书加载成功")
            logger.info(f"   证书文件: {cert_path}")
            logger.info(f"   私钥文件: {key_path}")
            logger.info(f"   证书链文件: {chain_path}")
        else:
            logger.warning(f"⚠️ SSL证书文件不存在:")
            logger.warning(f"   证书文件: {cert_path} (存在: {os.path.exists(cert_path)})")
            logger.warning(f"   私钥文件: {key_path} (存在: {os.path.exists(key_path)})")
            logger.warning(f"   证书链文件: {chain_path} (存在: {os.path.exists(chain_path)})")
            logger.warning("   将使用不安全的WebSocket连接")
    except Exception as e:
        logger.error(f"❌ SSL证书加载失败: {e}")
        logger.warning("   将使用不安全的WebSocket连接")
    
    # 启动WebSocket服务器 (优先使用WSS)
    try:
        if ssl_context:
            server = await websockets.serve(handle_client, "0.0.0.0", 5112, ssl=ssl_context)
            logger.info("🔒 WSS WebSocket服务器启动成功！")
        else:
            server = await websockets.serve(handle_client, "0.0.0.0", 5112)
            logger.info("⚠️ WS WebSocket服务器启动成功（不安全连接）！")
    except Exception as e:
        logger.error(f"❌ WebSocket服务器启动失败: {e}")
        return
    
    # 启动定期消息发送器
    sender_task = asyncio.create_task(periodic_sender())
    
    try:
        # 保持服务器运行
        await asyncio.gather(
            server.wait_closed(),
            sender_task
        )
    except KeyboardInterrupt:
        logger.info("收到中断信号，正在关闭服务器...")
        server.close()
        await server.wait_closed()
        sender_task.cancel()
        logger.info("服务器已关闭")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("程序被用户中断") 