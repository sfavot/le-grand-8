FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY config ./config
COPY src ./src

ENV NODE_ENV=production

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD wget -qO- http://127.0.0.1:${PORT:-3100}/health || exit 1

CMD ["node", "src/server.js"]
