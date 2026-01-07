FROM node:lts-alpine AS base
WORKDIR /home/node/app

FROM base AS install

RUN mkdir -p /temp/prod
COPY package.json package-lock.json /temp/prod
RUN cd /temp/prod && npm ci --omit=dev

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY database database
COPY public public
COPY src src
COPY package.json .

ENV NODE_ENV=production
EXPOSE 3000/tcp
HEALTHCHECK CMD nc -vz -w1 127.0.0.1 3000 || exit 1
ENTRYPOINT ["node", "src/index.js"]
