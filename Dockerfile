FROM node:20

RUN npm install -g ts-node

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npx", "ts-node", "src/index.ts"]
