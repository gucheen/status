import { Edge } from 'edge.js'
import fp from 'fastify-plugin'

export const edge = Edge.create({
  cache: process.env.NODE_ENV === 'production',
})
edge.mount(new URL('./views', import.meta.url))

function fastifyEdge(fastify, opts, done) {
  fastify.decorate('view', (templateName, data) => edge.render(templateName, data))
  fastify.decorateReply('view', async function (page, data) {
    try {
      const html = await edge.render(page, data)
      this.header('Content-Type', 'text/html; charset=utf-8')
      this.send(html)
    } catch (err) {
      this.send(err)
    }

    return this
  })
  done()
}

export default fastifyEdge = fp(fastifyEdge)
