// 远程开发配置文件
const REMOTE_CONFIG = {
  // 服务器信息
  server: {
    host: 'powerai.cc',
    port: 6000,
    username: 'tutu',
    password: 'jackseaver79'
  },
  
  // 开发服务器配置
  devServer: {
    port: 5101,
    host: '0.0.0.0',
    publicPath: '/',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },
  
  // 项目路径
  remotePath: '/home/tutu/server/life-agent-web',
  localPath: './',
  
  // 同步排除的文件和文件夹
  excludePatterns: [
    'node_modules',
    '.git',
    'dist',
    '.DS_Store',
    '*.log',
    '.vscode',
    '.idea'
  ]
}

module.exports = REMOTE_CONFIG 