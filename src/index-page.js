import art from 'art-template'
import dayjs from 'dayjs'
import Emittery from 'emittery'
import fsPromise from 'node:fs/promises'
import path from 'node:path'

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

  fastify.decorate('buildIndex', () => {
    const { data } = getIndexPageData()
    const html = art(path.join(process.cwd(), 'src/views/index.art'), { data, title: process.env.title })
    indexPageEvent.emit('indexPageUpdate')
    return fsPromise.writeFile('public/index.html', html)
  })

  if (process.env.NODE_ENV === 'development') {
    fastify.get('/', (req, reply) => {
      const { data } = getIndexPageData()

      return reply.view('src/views/index.art', {
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
