import fp from 'fastify-plugin'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const file = path.join(__dirname, '../database/db.json')
const adapter = new JSONFile(file)
const defaultData = { status: [], mastodonIdMap: {} }
const db = new Low(adapter, defaultData)

function lowdbDatabasePlugin(fastify, opts, done) {
  db.read()
    .then(() => {
      fastify.decorate('db', db)
      done()
    })
}

export default fp(lowdbDatabasePlugin)
