import crypto from 'node:crypto'

const user = process.env.User
const passwordHash = crypto.createHash('sha256').update(process.env.Password).digest('hex')

export async function loginRoutes(fastify) {
  fastify.get('/login', async (req, reply) => {
    return reply.view('src/views/login.art')
  })

  fastify.post(
    '/auth',
    async (req, reply) => {
      const passHash = crypto.createHash('sha256').update(req.body.password).digest('hex')
      let validCredentials
      try {
        validCredentials = crypto.timingSafeEqual(Buffer.from(req.body.user), Buffer.from(user)) && crypto.timingSafeEqual(Buffer.from(passHash), Buffer.from(passwordHash))
      } catch (error) {
        return reply.code(400).send({ message: 'missmatch user or password' })
      }
      if (!validCredentials) {
        return reply.code(400).send({ message: 'missmatch user or password' })
      }

      const wristband = await fastify.generateAuthToken({ user: req.body.user })

      return reply.setCookie('authorization', wristband).send({ success: true })
    }
  )
}
