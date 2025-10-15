# syntax=docker/dockerfile:1.6

# ===== deps/build =====
FROM node:20-alpine AS build
WORKDIR /app

# 先拷贝 lockfile，提升缓存命中
COPY package.json package-lock.json ./
RUN npm ci

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

# 拷贝站点 Nginx 配置（见下方 default.conf）
COPY default.conf /etc/nginx/conf.d/default.conf

# 可选：更激进的缓存头（对 hashed 静态资源）
# 你也可以在 default.conf 里设置 Cache-Control

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
