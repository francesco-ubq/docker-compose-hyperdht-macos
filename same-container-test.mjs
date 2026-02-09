import DHT from 'hyperdht'

const bootstrap = [process.env.BOOTSTRAP || 'bootstrap:30001']

// Server
const seed = Buffer.alloc(32).fill(42)
const keyPair = DHT.keyPair(seed)
const dhtServer = new DHT({ bootstrap })
await dhtServer.ready()
console.log('Server DHT ready — host:', dhtServer.host)

const server = dhtServer.createServer((stream) => {
  console.log('SERVER: Connection received!')
  stream.on('data', (d) => {
    console.log('SERVER: Data:', d.toString())
    stream.write('ECHO: ' + d.toString())
  })
  stream.on('error', (e) => console.log('SERVER: error', e.code))
})
await server.listen(keyPair)
const key = keyPair.publicKey.toString('hex')
console.log('Server listening — KEY:' + key)

// Wait for DHT propagation
await new Promise((r) => setTimeout(r, 3000))

// Client (separate DHT instance, same container)
const dhtClient = new DHT({ bootstrap })
await dhtClient.ready()
console.log('Client DHT ready — host:', dhtClient.host)

const stream = dhtClient.connect(Buffer.from(key, 'hex'))

const result = await new Promise((resolve) => {
  const timeout = setTimeout(() => resolve('TIMEOUT'), 15000)
  stream.on('open', () => {
    console.log('CLIENT: Stream open')
    stream.write('hello same container!')
  })
  stream.on('data', (d) => {
    clearTimeout(timeout)
    console.log('CLIENT: Data:', d.toString())
    resolve('SUCCESS')
  })
  stream.on('error', (e) => {
    clearTimeout(timeout)
    resolve('ERROR: ' + e.code)
  })
})

console.log('\n========================================')
console.log('  Same-container result:', result)
console.log('========================================')

stream.destroy()
await server.close()
await dhtServer.destroy()
await dhtClient.destroy()
