# OnlyOffice Document Server 远程安装说明

## 🎉 安装成功！

OnlyOffice Document Server 已成功安装在 powerai.cc 服务器上，使用端口 5102。

## 📍 服务信息

- **服务器地址**: powerai.cc
- **SSH端口**: 6000
- **OnlyOffice端口**: 5102
- **用户名**: tutu
- **容器名称**: onlyoffice-server-5102

## 🌐 访问地址

- **主页**: http://powerai.cc:5102/
- **欢迎页面**: http://powerai.cc:5102/welcome/
- **健康检查**: http://powerai.cc:5102/healthcheck
- **API地址**: http://powerai.cc:5102/web-apps/apps/api/documents/api.js

## 🔧 管理脚本

### 1. 安装脚本
```bash
./install-onlyoffice-remote.sh
```
用于在远程服务器上安装OnlyOffice Document Server。

### 2. 管理脚本
```bash
./manage-onlyoffice-remote.sh
```
用于管理远程OnlyOffice服务，支持以下操作：

#### 交互模式
直接运行脚本，会显示菜单供选择：
```bash
./manage-onlyoffice-remote.sh
```

#### 命令行模式
```bash
# 查看服务状态
./manage-onlyoffice-remote.sh status

# 启动服务
./manage-onlyoffice-remote.sh start

# 停止服务
./manage-onlyoffice-remote.sh stop

# 重启服务
./manage-onlyoffice-remote.sh restart

# 查看日志
./manage-onlyoffice-remote.sh logs

# 查看资源使用
./manage-onlyoffice-remote.sh resources

# 测试连接
./manage-onlyoffice-remote.sh test

# 删除服务
./manage-onlyoffice-remote.sh remove

# 重新安装
./manage-onlyoffice-remote.sh reinstall
```

## 📋 Docker 管理命令

如果需要直接通过SSH管理，可以使用以下命令：

```bash
# 连接到服务器
ssh -p 6000 tutu@powerai.cc

# 查看容器状态
sudo docker ps | grep onlyoffice-server-5102

# 查看日志
sudo docker logs onlyoffice-server-5102

# 停止服务
sudo docker stop onlyoffice-server-5102

# 启动服务
sudo docker start onlyoffice-server-5102

# 重启服务
sudo docker restart onlyoffice-server-5102

# 查看资源使用
sudo docker stats onlyoffice-server-5102 --no-stream

# 进入容器
sudo docker exec -it onlyoffice-server-5102 /bin/bash
```

## 🗂️ 数据存储

OnlyOffice的数据存储在服务器的以下目录：
- **主目录**: `/home/tutu/onlyoffice-data-5102/`
- **日志**: `/home/tutu/onlyoffice-data-5102/logs/`
- **数据**: `/home/tutu/onlyoffice-data-5102/data/` 
- **库文件**: `/home/tutu/onlyoffice-data-5102/lib/`
- **缓存**: `/home/tutu/onlyoffice-data-5102/cache/`

## 🔍 故障排除

### 1. 服务无法访问
检查防火墙设置，确保端口5102开放：
```bash
# 在服务器上执行
sudo ufw status
sudo ufw allow 5102
```

### 2. 容器启动失败
查看Docker日志：
```bash
sudo docker logs onlyoffice-server-5102
```

### 3. 内存不足
OnlyOffice需要至少1GB内存，检查系统资源：
```bash
free -h
sudo docker stats onlyoffice-server-5102 --no-stream
```

### 4. 重新安装
如果遇到问题，可以重新安装：
```bash
./manage-onlyoffice-remote.sh reinstall
```

## 📝 在应用中使用

在您的Web应用中，可以这样配置OnlyOffice编辑器：

```javascript
new DocsAPI.DocEditor("editor", {
    "documentType": "text",
    "document": {
        "fileType": "docx",
        "key": "unique-document-key",
        "title": "document.docx",
        "url": "https://your-domain.com/path/to/document.docx"
    },
    "editorConfig": {
        "mode": "edit",
        "lang": "zh-CN",
        "callbackUrl": "https://your-domain.com/callback"
    },
    "width": "100%",
    "height": "600px",
    "type": "desktop",
    "documentServerUrl": "http://powerai.cc:5102/"
});
```

## ⚠️ 注意事项

1. **安全性**: 当前配置禁用了JWT验证，适合内部使用。生产环境建议启用JWT。
2. **备份**: 定期备份 `/home/tutu/onlyoffice-data-5102/` 目录。
3. **更新**: 定期更新Docker镜像以获得最新功能和安全补丁。
4. **监控**: 建议设置监控来检查服务状态。

## 📞 支持

如果遇到问题，可以：
1. 查看日志：`./manage-onlyoffice-remote.sh logs`
2. 测试连接：`./manage-onlyoffice-remote.sh test`
3. 重启服务：`./manage-onlyoffice-remote.sh restart`

---
*安装时间: $(date)*
*服务器: powerai.cc:6000*
*端口: 5102* 