/**
 * Agent Listener3 Plugin
 * 通过WebSocket接收后台指令，并将指令内容注入到docx中
 */
(function(window, undefined) {
    
    console.log('📦 Agent Listener3 Plugin - 插件脚本开始加载');
    
    var websocket = null;
    var wsUrl = 'ws://powerai.cc:5112'; // WebSocket服务器地址

    // 插件初始化
    window.Asc.plugin.init = function() {
        console.log('🚀 Agent Listener3 Plugin - init() 方法被调用');
        
        var self = this;
        
        // 立即启动WebSocket连接
        console.log('🔌 启动WebSocket连接');
        self.startWebSocket();
        
        console.log('🚀 init() 方法执行完成');
    };

    // 文档内容准备好后的事件处理
    window.Asc.plugin.onDocumentContentReady = function() {
        console.log('📄 onDocumentContentReady 事件触发');
        // 避免重复启动WebSocket
        if (!websocket || websocket.readyState !== WebSocket.OPEN) {
            this.startWebSocket();
        }
    };

    // 启动WebSocket连接
    window.Asc.plugin.startWebSocket = function() {
        console.log('🔌 开始启动WebSocket连接');
        
        if (websocket) {
            console.log('🧹 关闭旧WebSocket连接');
            websocket.close();
        }
        
        try {
            websocket = new WebSocket(wsUrl);
            console.log('✅ WebSocket连接创建成功');
            
            var self = this;
            
            websocket.onopen = function(event) {
                var timestamp = new Date().toLocaleTimeString();
                console.log('🔗 [' + timestamp + '] WebSocket连接已打开', event);
            };
            
            websocket.onmessage = function(event) {
                var timestamp = new Date().toLocaleTimeString();
                console.log('📨 [' + timestamp + '] 收到WebSocket消息:', event.data);
                self.doInject(event.data);
            };
            
            websocket.onclose = function(event) {
                var timestamp = new Date().toLocaleTimeString();
                console.log('❌ [' + timestamp + '] WebSocket连接已关闭, 代码:' + event.code);
                console.log('🔄 立即重连');
                self.startWebSocket();
            };
            
            websocket.onerror = function(error) {
                var timestamp = new Date().toLocaleTimeString();
                console.error('❌ [' + timestamp + '] WebSocket连接错误:', error);
            };
            
        } catch (error) {
            console.error('❌ WebSocket连接失败:', error);
            console.log('🔄 连接失败，尝试重连');
            var self = this;
            // 使用递归调用而不是setTimeout
            self.startWebSocket();
        }
    };

    // 注入文本
    window.Asc.plugin.doInject = function(message) {
        console.log('📝 开始注入文本, 消息: ' + message);
        console.log('🔍 WebSocket状态: ' + (websocket ? websocket.readyState : 'null'));
        
        this.callCommand(function() {
            var str_msg = 'oh my god';
            console.log('📞 进入回调');
            console.log(window.Asc);
            console.log('📞 进入回调');
            
            var oDocument = Api.GetDocument();
            if (!oDocument) {
                console.error('❌ 无法获取文档');
                return;
            }
            
            var oParagraph = Api.CreateParagraph();
            oParagraph.AddText('Agent指令: ' + str_msg);
            oDocument.InsertContent([oParagraph], 0);
            
            console.log('✅ 注入完成，内容: ' + str_msg);
        }, true);
    };

    // 按钮事件
    window.Asc.plugin.button = function(id) {
        console.log('🔘 按钮点击:', id);
    };

    // 销毁时清理
    window.Asc.plugin.onDestroy = function() {
        console.log('🗑️ 插件销毁');
        
        // 清理WebSocket连接
        if (websocket) {
            websocket.close();
            websocket = null;
        }
    };

    console.log('✅ Agent Listener3 Plugin - 插件加载完成');

})(window, undefined); 