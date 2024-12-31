import fs from 'node:fs'
import { Feed } from 'feed'
import { indexPageEvent } from './index-page.js'

export async function rssPlugin(fastify) {
  function buildRSSFeed() {
    const feed = new Feed({
      title: process.env.title,
      description: process.env.description,
      id: process.env.site_url,
      link: process.env.site_url,
    })

    fastify.db.data.status.forEach(item => {
      const link = new URL(`#${item.time}`, process.env.site_url).href
      feed.addItem({
        title: item.text,
        id: link,
        link: link,
        date: new Date(item.time),
      })
    })

    const feedContent = feed.rss2()

    fs.writeFile('public/feed.xml', feedContent, (err) => {
      if (err) {
        console.error(err)
        return
      }
      console.log('RSS feed generated successfully.')
    })
  }

  indexPageEvent.on('indexPageUpdate', () => {
    buildRSSFeed()
  })

  fastify.get('/feed', (req, reply) => {
    reply.header('Content-type', 'text/xml;charset=UTF-8').sendFile('feed.xml')
  })
}
