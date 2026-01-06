FROM node:lts-alpine

WORKDIR /home/node/app

COPY package.json package-lock.json ./

RUN ["npm", "ci", "--omit=dev"]

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK CMD nc -vz -w1 127.0.0.1 3000 || exit 1

ENTRYPOINT ["node", "src/index.js"]
