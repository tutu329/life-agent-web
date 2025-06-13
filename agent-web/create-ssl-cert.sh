#!/bin/bash

# 创建自签名 SSL 证书脚本

echo "🔐 创建自签名 SSL 证书..."

# 创建证书目录
mkdir -p ssl

# 生成私钥
openssl genrsa -out ssl/server.key 2048

# 生成证书签名请求
openssl req -new -key ssl/server.key -out ssl/server.csr -subj "/C=CN/ST=Beijing/L=Beijing/O=PowerAI/OU=IT/CN=powerai.cc"

# 生成自签名证书
openssl x509 -req -days 365 -in ssl/server.csr -signkey ssl/server.key -out ssl/server.crt

echo "✅ SSL 证书已创建:"
echo "   私钥: ssl/server.key"
echo "   证书: ssl/server.crt"

# 设置权限
chmod 600 ssl/server.key
chmod 644 ssl/server.crt

echo "🔒 证书权限已设置" 