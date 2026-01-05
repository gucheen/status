import crypto from 'node:crypto'
import * as openidClient from 'openid-client'

const user = process.env.User
const passwordHash = crypto.createHash('sha256').update(process.env.Password).digest('hex')

export async function loginRoutes(fastify) {
  if (process.env.ENABLE_OIDC === '1' && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET && process.env.OIDC_DISCOVERY_ENDPOINT) {
    const oidcConfig = await openidClient.discovery(new URL(process.env.OIDC_DISCOVERY_ENDPOINT), process.env.OIDC_CLIENT_ID, process.env.OIDC_CLIENT_SECRET)
    const code_challenge_method = 'S256'
    const code_verifier = openidClient.randomPKCECodeVerifier()
    const code_challenge = await openidClient.calculatePKCECodeChallenge(code_verifier)
    let nonce
    let state
    const parameters = {
      redirect_uri: new URL('/auth/callback', process.env.site_url).href,
      scope: 'openid profile email',
      code_challenge,
      code_challenge_method,
    }
    fastify.get('/login', async (req, reply) => {
      if (!oidcConfig.serverMetadata().supportsPKCE()) {
        nonce = openidClient.randomNonce()
        parameters.nonce = nonce
      }
      state = openidClient.randomState()
      parameters.state = state
      const authorizationUrl = openidClient.buildAuthorizationUrl(oidcConfig, parameters)
      return reply.view('login', {
        oidcUrl: authorizationUrl.href,
        oidcProviderName: process.env.OIDC_PROVIDER_NAME,
      })
    })

    fastify.get(
      '/auth/callback',
      async (req, reply) => {
        const currentUrl = new URL(req.url, process.env.site_url)
        const tokens = await openidClient.authorizationCodeGrant(oidcConfig, currentUrl, {
          pkceCodeVerifier: code_verifier,
          expectedNonce: nonce,
          idTokenExpected: true,
          expectedState: state,
        })
        const access_token = tokens.access_token
        const claims = tokens.claims()
        const sub = claims.sub
        const userInfo = await openidClient.fetchUserInfo(oidcConfig, access_token, sub)

        const wristband = await fastify.generateAuthToken({ user: userInfo })

        return reply.setCookie('authorization', wristband, {
          domain: currentUrl.hostname,
          path: '/',
        }).redirect('/post')
      }
    )
  } else {
    fastify.get('/login', async (req, reply) => {
      return reply.view('login')
    })
  }

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
