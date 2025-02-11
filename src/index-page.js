import dayjs from 'dayjs'
import Emittery from 'emittery'
import fsPromise from 'node:fs/promises'

export const indexPageEvent = new Emittery()

export async function indexPlugin(fastify) {
  function getIndexPageData() {
    const data = fastify.db.data.status.map(item => {
      const date = dayjs(item.time)
      const dateStr = date.format('YYYY年M月D日 H时m分')
      return {
        id: item.id,
        text: item.text,
        time: item.time,
        dateStr,
        isoDate: date.toISOString(),
      }
    })

    return { data }
  }

  fastify.decorate('buildIndex', async () => {
    const { data } = getIndexPageData()
    const html = await fastify.view('index', { data, title: process.env.title })
    indexPageEvent.emit('indexPageUpdate')
    return fsPromise.writeFile('public/index.html', html)
  })

  if (process.env.NODE_ENV === 'development') {
    fastify.get('/', (req, reply) => {
      const { data } = getIndexPageData()

      return reply.view('index', {
        data,
        title: process.env.title,
      })
    })
  } else {
    fastify.get('/', (req, reply) => {
      return reply.sendFile('index.html')
    })
  }
}
