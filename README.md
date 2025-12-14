# DAO Backend

Minimal Express server that exposes REST endpoints for DAO proposal data and Web3 authentication via nonce signing.

## Getting Started

```bash
npm install
cp .env.example .env # create the file if it doesn't exist yet
npm start
```

The server listens on `PORT` (defaults to `3000`).

## Environment Variables

| Variable | Description |
| --- | --- |
| `PORT` | Port for the Express server (default `3000`). |
| `CLIENT_ORIGIN` | Comma-separated origins allowed via CORS, e.g. `http://localhost:5173`. Use `*` to allow any origin (no credentials). |
| `RPC_URL` | JSON-RPC endpoint used to poll contract events. |
| `DAO_CONTRACT_ADDRESS` | Address of the DAO contract to monitor. |
| `START_BLOCK` | Optional block number to start polling from. |
| `POLL_INTERVAL_MS` | Optional polling interval in milliseconds (default `10000`). |
| `NONCE_TTL_MS` | Optional lifespan for issued nonces (default 5 minutes). |

Create an `.env` file at the project root and populate the variables relevant to your environment.

## API

### `GET /auth/nonce?address=0x...`
Generates and returns a nonce for the provided wallet address.

### `POST /auth/verify`
Body: `{ "address": "0x...", "signature": "0x...", "chainId": 560048 }`  
Verifies the provided signature against the last nonce and marks the address as authenticated.

### `GET /proposals`
Returns cached DAO proposals populated via event polling.
