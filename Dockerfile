# syntax=docker/dockerfile:1.6

# ===== deps/build =====
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
COPY .env.production ./
RUN npm install

# 拷贝源码并构建（Next 14 + output:'export' 会直接生成 out/）
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ===== serve =====
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# 拷贝静态站点
COPY --from=build /app/out ./

# 拷贝主 Nginx 配置文件，设置 worker_processes=1 和 worker_connections=16
# 确保在构建时，本地文件系统中有 nginx.conf 文件
COPY nginx.conf /etc/nginx/nginx.conf

# 拷贝站点 Nginx 配置（仅用于直接服务静态文件）
COPY default.ui.conf /etc/nginx/conf.d/default.conf

# 可选：更激进的缓存头（对 hashed 静态资源）
# 你也可以在 default.conf 里设置 Cache-Control

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
