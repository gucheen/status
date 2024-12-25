import dayjs from 'dayjs'
import Emittery from 'emittery'
import { nanoid } from 'nanoid'

export const statusEmittery = new Emittery()

export async function statusRoutes(fastify) {
  fastify.requireAuthentication(fastify)

  async function dbUpdateAndRebuildIndex(updater) {
    await fastify.db.update(updater)
    return fastify.buildIndex()
  }

  fastify.get('/post', (req, reply) => {
    return reply.view('src/views/post.art', {
      view: 'post',
      mastodonServer: process.env.mastodonServer,
    })
  })

  fastify.get('/posts/:statusId', (req, reply) => {
    if (!req.params.statusId) {
      const err = new Error()
      err.statusCode = 404
      err.message = 'status not found'
      throw err
    }
    const match = fastify.db.data.status.find(item => item.id === req.params.statusId)
    if (match) {
      return reply.view('src/views/edit.art', {
        view: 'manage',
        text: match.text,
        createdAt: dayjs(match.time).format('YYYY-MM-DD HH:mm:ss'),
        updateAt: match.updateAt ? dayjs(match.updateAt).format('YYYY-MM-DD HH:mm:ss') : null,
        publishedToMastodon: typeof fastify.db.data.mastodonIdMap?.[match.id] === 'string',
      })
    }
    const err = new Error()
    err.statusCode = 404
    err.message = 'status not found'
    throw err
  })

  fastify.post(
    '/status',
    {
      schema: {
        body: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const text = req.body.text.trim()
      if (text.length === 0) {
        return reply.code('400').send({ message: 'Please input text' })
      }
      const id = nanoid()
      const status = {
        time: Date.now(),
        text,
        id,
      }
      await dbUpdateAndRebuildIndex(dbData => {
        dbData.status.unshift(status)
      })
      statusEmittery.emit('create', {
        postToMastodon: req.body.postToMastodon,
        id,
        status,
      })
      return { success: true }
    }
  )

  fastify.get(
    '/manage',
    async (req, reply) => {
      const data = fastify.db.data.status.map(item => {
        const date = dayjs(item.time)
        const dateStr = date.format('YYYY年M月D日')
        return {
          id: item.id,
          text: item.text,
          time: item.time,
          updateAt: item.updateAt,
          dateStr,
          isoDate: date.toISOString(),
          timeStr: date.format('H时m分'),
          foramtTime: date.format('YYYY-MM-DD HH:mm'),
        }
      })
      return reply.view('src/views/manage.art', {
        data,
        view: 'manage',
      })
    }
  )

  fastify.delete(
    '/status/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const id = req.params.id
      const index = fastify.db.data.status.findIndex(item => item.id === id)
      if (index > -1) {
        let status
        await dbUpdateAndRebuildIndex((dbData) => {
          status = dbData.status.splice(index, 1)
        })
        statusEmittery.emit('delete', {
          id,
          status,
        })
      }
      return { success: true }
    },
  )

  fastify.patch(
    '/status/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const id = req.params.id
      let status
      await dbUpdateAndRebuildIndex((dbData) => {
        status = dbData.status.find(item => item.id === id)
        if (status) {
          status.text = req.body.text
          status.updateAt = Date.now()
        }
      })
      if (status) {
        statusEmittery.emit('update', {
          id,
          status,
        })
      }
      return { success: true }
    },
  )
}
