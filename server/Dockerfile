FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production

EXPOSE 4000

CMD ["npx", "tsx", "src/index.ts"]
