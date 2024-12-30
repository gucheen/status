# syntax=docker/dockerfile:1

FROM node:lts-alpine

ARG USER_ID
ARG GROUP_ID

RUN addgroup --gid $GROUP_ID user
RUN adduser --disabled-password --gecos '' --uid $USER_ID -G user user
USER user

ENV NODE_ENV=production

WORKDIR /home/node/app

COPY --chown=user:user ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY --chown=user:user . .

HEALTHCHECK CMD nc -vz -w1 127.0.0.1 3000 || exit 1

CMD ["npm", "start"]
