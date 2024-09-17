nano Dockerfile

# Используйте официальный образ Node.js как базовый
FROM node:14

# Установите рабочую директорию
WORKDIR /app

# Скопируйте package.json и package-lock.json (или yarn.lock)
COPY package*.json ./

# Установите зависимости
RUN npm install

# Установите ts-node и typescript глобально
RUN npm install -g ts-node typescript

# Скопируйте остальной код приложения
COPY . .

# Укажите порт, который будет прослушиваться
EXPOSE 3000

# Запустите приложение
CMD ["ts-node", "src/index.ts"]
