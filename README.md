# HyperDHT Cross-Container Test 

### (macOS Docker Desktop)

Standalone reproduction of HyperDHT/UDX stream failure across Docker containers on macOS Docker Desktop.

## Quick Test

```bash
# 1. Same-container test (control group — should PASS)
docker compose --profile same-container up same-container-test

# 2. Cross-container test
# Terminal 1: start bootstrap + server
docker compose up bootstrap server

# Terminal 2: copy KEY from server logs, then:
SERVER_KEY=<paste-key-here> docker compose --profile client up client

# 3. Cleanup
docker compose down
```

## Expected Results

| Test | macOS Docker Desktop | Linux Docker (native) |
|------|---------------------|-----------------------|
| Same-container | SUCCESS | SUCCESS |
| Cross-container | **BROKEN** | Likely works (untested) |

## What Happens

- **Same-container**: Both DHT nodes share the network namespace. UDX streams go through loopback. Works perfectly.
- **Cross-container**: The Noise handshake appears to complete (relayed through bootstrap), but the UDX data channel between containers never establishes. The server's `connection` callback never fires. The stream times out.

## Root Cause

Docker Desktop on macOS runs containers in a Linux VM with virtualized networking. UDX (the UDP transport layer used by HyperDHT) creates reliable streams over UDP that don't work correctly through the VM's virtual bridge network. Basic UDP (dgram) works fine cross-container — the issue is specific to UDX's protocol handling.
