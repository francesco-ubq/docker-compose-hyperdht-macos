import DHT from 'hyperdht'

const bootstrap = [process.env.BOOTSTRAP || 'bootstrap:30001']
const SERVER_KEY = process.env.SERVER_KEY

if (!SERVER_KEY) {
  console.error('SERVER_KEY env var required')
  process.exit(1)
}

const dht = new DHT({ bootstrap })
await dht.ready()
console.log('Client DHT ready — host:', dht.host, 'port:', dht.port)

// Test 1: raw DHT stream
console.log('\n--- Test 1: Raw DHT stream ---')
const stream = dht.connect(Buffer.from(SERVER_KEY, 'hex'))

const streamResult = await new Promise((resolve) => {
  const timeout = setTimeout(() => resolve('TIMEOUT'), 15000)
  stream.on('open', () => {
    console.log('  Stream OPEN — remote:', stream.remotePublicKey?.toString('hex')?.slice(0, 16) + '...')
    stream.write('hello from client!')
  })
  stream.on('data', (data) => {
    clearTimeout(timeout)
    console.log('  Stream DATA:', data.toString())
    resolve('SUCCESS')
  })
  stream.on('error', (err) => {
    clearTimeout(timeout)
    console.log('  Stream ERROR:', err.code, err.message)
    resolve('ERROR: ' + err.code)
  })
})

stream.destroy()
console.log('  Result:', streamResult)

// Test 2: @hyperswarm/rpc
console.log('\n--- Test 2: @hyperswarm/rpc ---')
let RPC
try {
  RPC = (await import('@hyperswarm/rpc')).default
} catch {
  console.log('  @hyperswarm/rpc not installed, skipping')
  await dht.destroy()
  printSummary(streamResult, 'SKIPPED')
  process.exit(0)
}

const rpc = new RPC({ dht })
let rpcResult
try {
  const res = await rpc.request(Buffer.from(SERVER_KEY, 'hex'), 'ping', Buffer.alloc(0), { timeout: 10000 })
  console.log('  RPC SUCCESS:', res.toString())
  rpcResult = 'SUCCESS'
} catch (err) {
  console.log('  RPC FAILED:', err.code, err.message)
  rpcResult = 'ERROR: ' + err.code
}

await rpc.destroy()
await dht.destroy()

printSummary(streamResult, rpcResult)

function printSummary (stream, rpc) {
  console.log('\n========================================')
  console.log('  RESULTS')
  console.log('========================================')
  console.log('  Raw DHT stream:', stream)
  console.log('  @hyperswarm/rpc:', rpc)
  if (stream === 'SUCCESS' && (rpc === 'SUCCESS' || rpc === 'SKIPPED')) {
    console.log('\n  VERDICT: HyperDHT cross-container WORKS')
  } else {
    console.log('\n  VERDICT: HyperDHT cross-container BROKEN')
    console.log('  (likely macOS Docker Desktop UDX issue)')
  }
  console.log('========================================')
}
