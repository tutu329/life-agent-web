/**
 * Hello World Plugin
 * 基于OnlyOffice官方示例实现
 */
(function(window, undefined) {
    
    console.log('📦 Hello World Plugin - 插件脚本开始加载');

    // 插件初始化
    window.Asc.plugin.init = function() {
        console.log('🚀 Hello World Plugin - init() 方法被调用');
        
        // 自动执行插入操作
        this.insertHelloWorld();
    };

    // 插入 Hello World 文本的函数
    window.Asc.plugin.insertHelloWorld = function() {
        console.log('📝 开始插入 Hello World 文本');
        
        this.callCommand(function() {
            console.log('📞 进入 callCommand 回调');
            
            var oDocument = Api.GetDocument();
            console.log('📄 获取文档对象:', oDocument ? '成功' : '失败');
            
            if (!oDocument) {
                console.error('❌ 无法获取文档对象');
                return;
            }
            
            // 创建新段落并添加文本
            var oParagraph = Api.CreateParagraph();
            oParagraph.AddText("Hello World!");
            
            // 设置文本为粗体
            var oTextPr = oParagraph.GetTextPr();
            if (oTextPr) {
                oTextPr.SetBold(true);
            }
            
            // 插入到文档
            oDocument.InsertContent([oParagraph], 0);
            
            console.log('✅ Hello World 文本插入完成');
        }, true);
    };

    // 按钮事件处理
    window.Asc.plugin.button = function(id) {
        console.log('🔘 按钮点击事件:', id);
        this.insertHelloWorld();
    };

    console.log('✅ Hello World Plugin - 插件加载完成');

})(window, undefined); 