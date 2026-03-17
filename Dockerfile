FROM node:20-alpine

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000 3001

CMD ["npm", "run", "dev"]
