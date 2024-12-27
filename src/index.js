import createApp from './app.js'

const app = createApp()

app.listen({ host: '0.0.0.0', port: 3000 }, async (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  app.buildIndex()
})
