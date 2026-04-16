FROM node:20-alpine

WORKDIR /app

# Copiar dependencias primero (layer cache)
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Usuario no-root por seguridad
RUN addgroup -S nexgo && adduser -S nexgo -G nexgo
USER nexgo

EXPOSE 3000

CMD ["node", "server.js"]
