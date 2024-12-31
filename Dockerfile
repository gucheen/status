FROM node:lts-alpine

WORKDIR /home/node/app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --registry=https://registry.npmmirror.com

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK CMD nc -vz -w1 127.0.0.1 3000 || exit 1

CMD ["npm", "start"]
