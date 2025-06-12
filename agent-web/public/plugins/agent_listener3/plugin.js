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
        
        // 2秒后启动WebSocket连接
        setTimeout(function() {
            console.log('🔌 启动WebSocket连接');
            self.startWebSocket();
        }, 2000);
        
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
                console.log('🔗 WebSocket连接已打开', event);
            };
            
            websocket.onmessage = function(event) {
                console.log('📨 收到WebSocket消息:', event.data);
                self.doInject(event.data);
            };
            
            websocket.onclose = function(event) {
                console.log('❌ WebSocket连接已关闭', event);
                // 3秒后重新连接
                setTimeout(function() {
                    console.log('🔄 尝试重新连接WebSocket');
                    self.startWebSocket();
                }, 3000);
            };
            
            websocket.onerror = function(error) {
                console.error('❌ WebSocket连接错误:', error);
            };
            
        } catch (error) {
            console.error('❌ WebSocket连接失败:', error);
            // 5秒后重试
            var self = this;
            setTimeout(function() {
                console.log('🔄 WebSocket连接失败，5秒后重试');
                self.startWebSocket();
            }, 5000);
        }
    };

    // 注入文本
    window.Asc.plugin.doInject = function(message) {
        console.log('📝 开始注入文本, 消息: ' + message);
        window.Asc.scope.message = message;
        
        this.callCommand(function() {
            var str_msg = window.Asc.scope.message  // 官方用window.Asc.scope这个特殊变量向callCommand传递参数
            console.log('📞 进入回调');
            
            var oDocument = Api.GetDocument();
            if (!oDocument) {
                console.error('❌ 无法获取文档');
                return;
            }
            
            var oParagraph = Api.CreateParagraph();
            oParagraph.AddText('Agent指令 #' + ': ' + str_msg);
            // oParagraph.AddText('[' + data.timestamp + '] Agent指令 #' + data.count + ': ' + data.message);
            oDocument.InsertContent([oParagraph], 0);
            
            console.log('✅ 注入完成，内容: ' + str_msg);
            
            // 清理临时数据
            // delete window._tempInjectData;
        }, true, message);
    };

    // 按钮事件
    window.Asc.plugin.button = function(id) {
        console.log('🔘 按钮点击:', id);
    };

    // 销毁时清理
    window.Asc.plugin.onDestroy = function() {
        console.log('🗑️ 插件销毁');
        if (websocket) {
            websocket.close();
            websocket = null;
        }
    };

    console.log('✅ Agent Listener3 Plugin - 插件加载完成');

})(window, undefined); 