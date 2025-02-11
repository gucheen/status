import got from 'got'
import { statusEmittery } from './post.js'

const request = got.extend({})

export async function mastodonRoutes(fastify) {
  fastify.requireAuthentication(fastify)

  statusEmittery.on('create', async (data = {}) => {
    const { postToMastodon, id, status } = data
    if (postToMastodon && typeof fastify.db.data?.mastodon_access?.access_token === 'string') {
      request.post(`${process.env.mastodon_server}/api/v1/statuses`, {
        headers: {
          Authorization: `Bearer ${fastify.db.data.mastodon_access.access_token}`,
          'Idempotency-Key': id,
        },
        json: {
          status: status.text,
          visibility: process.env.NODE_ENV === 'development' ? 'private' : 'public',
        },
      })
        .json()
        .then(async (mastodonStatus) => {
          fastify.db.update(dbData => {
            dbData.mastodonIdMap[id] = mastodonStatus.id
          })
        })
        .catch((error) => {
          console.error(error)
        })
    }
  })

  statusEmittery.on('delete', async (data = {}) => {
    const { id } = data
    const mastodonStatusId = fastify.db.data.mastodonIdMap[id]
    if (mastodonStatusId) {
      request.delete(`${process.env.mastodon_server}/api/v1/statuses/${mastodonStatusId}`, {
        headers: {
          Authorization: `Bearer ${fastify.db.data.mastodon_access.access_token}`,
        },
      })
        .then(async () => {
          fastify.db.update((dbData) => {
            delete dbData.mastodonIdMap[id]
          })
        })
        .catch(() => { })
    }
  })

  statusEmittery.on('update', async (data = {}) => {
    const { id, status } = data
    const mastodonStatusId = fastify.db.data.mastodonIdMap[id]
    if (mastodonStatusId) {
      request.put(`${process.env.mastodon_server}/api/v1/statuses/${mastodonStatusId}`, {
        headers: {
          Authorization: `Bearer ${fastify.db.data.mastodon_access.access_token}`,
        },
        json: {
          status: status.text,
        },
      })
        .catch(() => { })
    }
  })

  fastify.get(
    '/mastodon',
    async (req, reply) => {
      let user = {}
      if (typeof fastify.db.data?.mastodon_access?.access_token === 'string') {
        user = await request(`${process.env.mastodon_server}/api/v1/accounts/verify_credentials`, {
          headers: {
            Authorization: `Bearer ${fastify.db.data.mastodon_access.access_token}`,
          },
        }).json()
      }
      return reply.view('mastodon', {
        mastodonAuthUrl: `${process.env.mastodon_server}/oauth/authorize?client_id=${process.env.mastodon_client_id}&scope=read+write&redirect_uri=${process.env.mastodon_redirect_uri}&response_type=code`,
        mastodonServer: process.env.mastodon_server,
        authorized: typeof user.id === 'string',
        username: user.username,
        view: 'mastodon',
      })
    }
  )

  fastify.post(
    '/mastodon/auth',
    {
      schema: {
        body: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const result = await request.post(`${process.env.mastodon_server}/oauth/token`, {
          json: {
            client_id: process.env.mastodon_client_id,
            client_secret: process.env.mastodon_client_secret,
            redirect_uri: process.env.mastodon_redirect_uri,
            grant_type: 'authorization_code',
            code: req.body.code,
            scope: 'read write',
          },
        }).json()
        await fastify.db.update((dbData) => {
          dbData.mastodon_access = result
          if (typeof dbData.mastodonIdMap === 'undefined') {
            dbData.mastodonIdMap = {}
          }
        })
        return reply.send(result)
      } catch (error) {
        console.error(error)
        return reply.code(500).send(error)
      }
    }
  )
}
