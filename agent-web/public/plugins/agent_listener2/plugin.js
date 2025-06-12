/**
 * Agent Listener2 Plugin
 * 基于OnlyOffice官方示例实现，每3秒向docx注入"大家好啊！"
 */
(function(window, undefined) {
    
    console.log('📦 Agent Listener2 Plugin - 插件脚本开始加载');
    
    var intervalId = null;
    var injectCount = 0;

    // 插件初始化
    window.Asc.plugin.init = function() {
        console.log('🚀 Agent Listener2 Plugin - init() 方法被调用');
        
        var self = this;
        
        // 2秒后启动定时器
        setTimeout(function() {
            console.log('⏰ 启动定时器');
            self.startTimer();
        }, 2000);
        
        console.log('🚀 init() 方法执行完成');
    };

    // 文档内容准备好后的事件处理
    window.Asc.plugin.onDocumentContentReady = function() {
        console.log('📄 onDocumentContentReady 事件触发');
        this.startTimer();
    };

    // 启动定时器
    window.Asc.plugin.startTimer = function() {
        console.log('⏰ 开始启动定时器');
        
        if (intervalId) {
            console.log('🧹 清除旧定时器:', intervalId);
            clearInterval(intervalId);
        }
        
        // 立即执行一次
        this.doInject();
        
        // 设置定时器
        var self = this;
        intervalId = setInterval(function() {
            console.log('⏰ 定时器触发，intervalId:', intervalId);
            self.doInject();
        }, 3000);
        
        console.log('✅ 定时器设置完成，intervalId:', intervalId);
        
        // 验证定时器是否在运行
        setTimeout(function() {
            console.log('🔍 5秒后检查定时器状态，intervalId:', intervalId);
        }, 5000);
    };

    // 注入文本（简化版本）
    window.Asc.plugin.doInject = function() {
        // injectCount++;
        // console.log('📝 开始注入文本 - 第' + injectCount + '次');
        
        this.callCommand(function() {
            // console.log('📞 进入回调 - 第' + injectCount + '次');
            
            var oDocument = Api.GetDocument();
            if (!oDocument) {
                console.error('❌ 无法获取文档');
                return;
            }
            
            var oParagraph = Api.CreateParagraph();
            oParagraph.AddText("大家好啊！");
            // oParagraph.AddText("大家好啊！[" + injectCount + "]");
            oDocument.InsertContent([oParagraph], 0);
            
            console.log('✅ 注入完成');
        }, true);
    };

    // 按钮事件
    window.Asc.plugin.button = function(id) {
        console.log('🔘 按钮点击:', id);
    };

    // 销毁时清理
    window.Asc.plugin.onDestroy = function() {
        console.log('🗑️ 插件销毁');
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    console.log('✅ Agent Listener2 Plugin - 插件加载完成');

})(window, undefined); 