import cookies from '@fastify/cookie'
import helmet from '@fastify/helmet'
import FastifyStatic from '@fastify/static'
import view from '@fastify/view'
import art from 'art-template'
import Fastify from 'fastify'
import esso from 'fastify-esso'
import fp from 'fastify-plugin'
import path from 'node:path'
import staticResourcesHash from './auto-hash.js'
import lowdbDatabasePlugin from './database.js'
import { loginRoutes } from './login.js'
import { mastodonRoutes } from './mastodon.js'
import { statusRoutes } from './post.js'
import { indexPlugin } from './index-page.js'
import { rssPlugin } from './rss.js'

const config = {
  logger: true,
}

function createApp() {
  const app = Fastify(config)

  app.register(helmet, {
    contentSecurityPolicy: false,
  })
  app.register(esso({
    secret: process.env.Secret,
    token_prefix: null,
  }))
  app.register(FastifyStatic, {
    root: path.join(process.cwd(), 'public'),
    prefix: '/public/', // optional: default '/'
  })
  app.get('/favicon.ico', (req, reply) => {
    reply.sendFile('favicon.ico')
  })
  app.get('/favicon.svg', (req, reply) => {
    reply.sendFile('favicon.svg')
  })
  app.get('/robots.txt', (req, reply) => {
    reply.sendFile('/robots.txt')
  })

  app.register(cookies)
  app.register(view, {
    engine: {
      'art-template': art,
    },
  })

  app.register(staticResourcesHash)
  app.register(lowdbDatabasePlugin)
  app.register(fp(indexPlugin))
  app.register(fp(rssPlugin))

  app.setErrorHandler(function (error, req, reply) {
    if (error.statusCode === 401) {
      reply.redirect(`/login?from=${encodeURIComponent(req.url)}`)
    } else {
      reply.send(error)
    }
  })

  app.setNotFoundHandler((req, reply) => {
    reply.sendFile('404.html')
  })

  app.register(loginRoutes)

  app.register(statusRoutes)

  if (process.env.mastodon_server) {
    app.register(mastodonRoutes)
  }

  return app
}

export default createApp
