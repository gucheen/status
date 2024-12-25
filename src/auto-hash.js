import artTemplate from 'art-template'
import autoHash from 'auto-hash'
import fp from 'fastify-plugin'
import fsPromise from 'fs/promises'
import path from 'node:path'

const STATIC_EXT_LIST = ['.js', '.css', '.png']

function staticResourcesHash(fastify, opts, done) {
  if (process.env.NODE_ENV === 'development') {
    fastify.decorate('staticFilesHashes', {})
    artTemplate.defaults.imports.staticFilesHashes = {}
    artTemplate.defaults.imports.getResource = (filename) => {
      return `/public/${filename}`
    }
    done()
  } else {
    fsPromise.readdir('public')
      .then((result) => {
        const files = result
          .filter(f => STATIC_EXT_LIST.includes(path.extname(f)))
          .map(f => {
            return {
              file: `public/${f}`,
              name: f,
            }
          })
        return autoHash({
          files,
          len: 8,
        })
      })
      .then((staticFilesHashes) => {
        fastify.decorate('staticFilesHashes', staticFilesHashes)
        artTemplate.defaults.imports.staticFilesHashes = staticFilesHashes
        artTemplate.defaults.imports.getResource = (filename) => {
          return `/public/${filename}?h=${staticFilesHashes[filename]}`
        }
        done()
      })
  }
}

export default fp(staticResourcesHash)
