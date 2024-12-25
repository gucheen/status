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

const config = {
  logger: true,
}
const fastify = Fastify(config)

fastify.register(helmet, {
  contentSecurityPolicy: false,
})
fastify.register(esso({
  secret: process.env.Secret,
  token_prefix: null,
}))
fastify.register(FastifyStatic, {
  root: path.join(process.cwd(), 'public'),
  prefix: '/public/', // optional: default '/'
})
fastify.register(cookies)
fastify.register(view, {
  engine: {
    'art-template': art,
  },
})

fastify.register(staticResourcesHash)
fastify.register(lowdbDatabasePlugin)
fastify.register(fp(indexPlugin))

fastify.setErrorHandler(function (error, req, reply) {
  if (error.statusCode === 401) {
    reply.redirect(`/login?from=${encodeURIComponent(req.url)}`)
  } else {
    reply.send(error)
  }
})

fastify.setNotFoundHandler((req, reply) => {
  reply.sendFile('404.html')
})

fastify.register(loginRoutes)

fastify.register(statusRoutes)

if (process.env.mastodon_server) {
  fastify.register(mastodonRoutes)
}

fastify.listen({ host: '0.0.0.0', port: 3000 }, async (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.buildIndex()
})
