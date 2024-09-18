# Используем Node.js 20 на базе Debian 12 (Bookworm)
FROM node:20

RUN npm install -g ts-node

# Указываем рабочую директорию в контейнере
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости проекта
RUN npm install

# Копируем весь исходный код проекта
COPY . .

# Открываем порт 3000 для доступа к приложению
EXPOSE 3000

# Запускаем сервер (указываем правильную команду для запуска Fastify с TypeScript)
CMD ["npx", "ts-node", "src/index.ts"]
