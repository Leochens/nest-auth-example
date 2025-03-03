# 使用 Node.js 官方镜像作为基础镜像
FROM node:22-alpine

# 设置工作目录
WORKDIR /app

# 复制项目文件到容器中
COPY . .

# 复制启动脚本到容器中
COPY start.sh /app/start.sh

# 赋予启动脚本执行权限
RUN chmod +x /app/start.sh

# 暴露端口 3001
EXPOSE 3001

# 设置启动命令
CMD ["sh","/app/start.sh"]
