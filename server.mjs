import DHT from 'hyperdht'

const bootstrap = [process.env.BOOTSTRAP || 'bootstrap:30001']
const seed = Buffer.alloc(32).fill(42)
const keyPair = DHT.keyPair(seed)

const dht = new DHT({ bootstrap })
await dht.ready()
console.log('Server DHT ready — host:', dht.host, 'port:', dht.port)

const server = dht.createServer((stream) => {
  console.log('CONNECTION from', stream.remotePublicKey.toString('hex').slice(0, 16) + '...')
  stream.on('data', (data) => {
    console.log('DATA:', data.toString())
    stream.write('ECHO: ' + data.toString())
  })
  stream.on('error', (err) => console.log('STREAM ERROR:', err.code))
  stream.on('close', () => console.log('STREAM CLOSED'))
})

await server.listen(keyPair)
console.log('Server listening — KEY:' + keyPair.publicKey.toString('hex'))

// Keep alive
setInterval(() => {}, 60000)
