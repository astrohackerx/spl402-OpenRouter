# SPL-402 + OpenRouter Integration

Payment-gated AI API using Solana's SPL-402 protocol and OpenRouter's unified LLM gateway.

## Overview

This project integrates SPL-402 (HTTP 402 payment protocol on Solana) with OpenRouter (unified API for 400+ AI models). Users pay with SOL to access premium AI features through their Solana wallet.

**Key Components:**
- SPL-402 payment verification middleware
- OpenRouter SDK for multi-model AI access
- Solana Web3.js for blockchain transactions
- React + Wallet Adapter frontend

## Architecture

```
Client Request → SPL-402 Middleware → Payment Verification (Solana) → OpenRouter API → Response
```

**Payment Flow:**
1. Client requests protected endpoint
2. Server returns 402 Payment Required with transaction details
3. Client signs and submits transaction to Solana
4. Server verifies transaction on-chain
5. Server processes request via OpenRouter
6. Response returned to client

**Free Tier Flow:**
1. Client requests free endpoint
2. Server calls OpenRouter directly
3. Response returned to client

## Features

| Tier | Price | Capabilities |
|------|-------|-------------|
| Free | 0 SOL | Chat, Content Generation, Code Generation |
| Premium | 0.001 SOL | + Text Analysis |
| Ultra | 0.005 SOL | + Vision Analysis |
| Enterprise | 0.01 SOL | + Advanced Models |

## Setup

### Prerequisites

- Node.js 18+
- Solana wallet (Phantom, Solflare, etc.)
- OpenRouter API key: https://openrouter.ai/keys

### Installation

```bash
git clone <repo>
cd spl402-openrouter

# Server
cd server
npm install
cp .env.example .env
# Edit .env with your values

# Client
cd ../client
npm install
cp .env.example .env
# Edit .env with your values
```

### Environment Variables

**server/.env:**
```env
PORT=3001
RECIPIENT_WALLET=<your-solana-address>
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
FRONTEND_URL=http://localhost:5173
OPENROUTER_API_KEY=<your-api-key>
```

**client/.env:**
```env
VITE_API_URL=http://localhost:3001
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Run

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

Navigate to `http://localhost:5173`

## Project Structure

```
spl402-openrouter/
├── server/
│   ├── index.ts                    # Express server + SPL-402 config
│   ├── routes/ai.routes.ts         # AI endpoint handlers
│   └── services/openrouter.service.ts  # OpenRouter integration
└── client/
    └── src/
        ├── App.tsx                 # Main app
        ├── main.tsx                # Wallet setup
        └── components/
            ├── AIShowcase.tsx      # Feature dashboard
            ├── AIChat.tsx
            ├── CodeGenerator.tsx
            ├── TextAnalyzer.tsx
            ├── ContentGenerator.tsx
            └── VisionAnalyzer.tsx
```

## API Endpoints

### POST /api/ai/chat
```json
{
  "message": "Your message",
  "tier": "free"
}
```

### POST /api/ai/content
```json
{
  "type": "blog|social|email",
  "topic": "Topic description",
  "tier": "free"
}
```

### POST /api/ai/code
```json
{
  "language": "python|javascript|etc",
  "description": "What to generate",
  "tier": "free"
}
```

### POST /api/ai/analyze
```json
{
  "text": "Text to analyze",
  "tier": "premium"
}
```

### POST /api/ai/vision
```json
{
  "imageUrl": "https://...",
  "prompt": "Analyze this image",
  "tier": "ultra"
}
```

## Implementation Details

### SPL-402 Integration

**Server (server/index.ts):**
```typescript
import spl402 from 'spl402';

const payment = spl402({
  recipientWallet: process.env.RECIPIENT_WALLET,
  connection: new Connection(process.env.SOLANA_RPC_URL),
  routes: [
    { path: '/api/ai/analyze', price: 0.001 },
    { path: '/api/ai/vision', price: 0.005 },
    // Free endpoints not listed
  ]
});

app.use(payment.middleware());
```

**Client (components/AIShowcase.tsx):**
```typescript
import spl402 from 'spl402';

const client = spl402.client({
  wallet: wallet,
  connection: new Connection(RPC_URL)
});

// For paid tiers
const response = await client.makeRequest(
  `${API_URL}/api/ai/analyze`,
  {
    method: 'POST',
    body: JSON.stringify({ text, tier: 'premium' })
  }
);

// For free tier
const response = await fetch(`${API_URL}/api/ai/chat`, {
  method: 'POST',
  body: JSON.stringify({ message, tier: 'free' })
});
```

### OpenRouter Integration

**Service (server/services/openrouter.service.ts):**
```typescript
import OpenRouter from '@openrouter/sdk';

const client = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

const completion = await client.chat.completions.create({
  model: 'google/gemini-2.0-flash-exp:free',
  messages: [{ role: 'user', content: prompt }]
});
```

**Model Selection:**
```typescript
const TIER_MODELS = {
  free: 'google/gemini-2.0-flash-exp:free',
  premium: 'openai/gpt-4o-mini',
  ultra: 'anthropic/claude-3.5-sonnet',
  enterprise: 'anthropic/claude-3.7-sonnet'
};
```

## Key Technical Considerations

### SPL-402 POST Request Issue

**Problem:** SPL-402 library has serialization issues with POST requests when using `makeRequest()` with body data.

**Solution:** Use standard `fetch()` for free tier endpoints. Use SPL-402's `makeRequest()` only for paid endpoints that require payment verification.

```typescript
// ✓ Works - Free tier with fetch
await fetch(url, {
  method: 'POST',
  body: JSON.stringify(data)
});

// ✓ Works - Paid tier with GET
await client.makeRequest(url);

// ✗ Breaks - Paid tier with POST + body
await client.makeRequest(url, {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### CORS Configuration

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Error Handling

```typescript
try {
  const result = await client.makeRequest(url, options);
  const data = await result.json();
} catch (error) {
  if (error.message?.includes('pubkey.equals')) {
    // SPL-402 serialization error - see above
  }
}
```

## Testing

### Devnet

```env
# Server
SOLANA_RPC_URL=https://api.devnet.solana.com

# Client
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

Get devnet SOL: https://faucet.solana.com

### Mainnet

Use production RPC endpoints:
- Helius: https://helius.dev
- QuickNode: https://quicknode.com
- Alchemy: https://alchemy.com

## Customization

### Add AI Models

Edit `server/services/openrouter.service.ts`:
```typescript
const TIER_MODELS = {
  premium: 'openai/gpt-4-turbo',  // Change model
  // ...
};
```

Browse models: https://openrouter.ai/models

### Change Pricing

Edit `server/index.ts`:
```typescript
routes: [
  { path: '/api/ai/analyze', price: 0.002 },  // Change price
  // ...
]
```

### Add Endpoints

1. Create route handler in `server/routes/ai.routes.ts`
2. Add OpenRouter service method in `server/services/openrouter.service.ts`
3. Register route in `server/index.ts` with pricing
4. Create client component in `client/src/components/`

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Solana Wallet Adapter
- Tailwind CSS
- Vite

**Backend:**
- Express.js
- TypeScript
- SPL-402 middleware
- OpenRouter SDK

**Blockchain:**
- Solana Web3.js
- SPL-402 protocol

**AI:**
- OpenRouter API
- 400+ models from 60+ providers

## Resources

**SPL-402:**
- Docs: https://solana.com/developers/guides/getstarted/intro-to-x402
- Package: https://www.npmjs.com/package/spl402

**OpenRouter:**
- Docs: https://openrouter.ai/docs
- Models: https://openrouter.ai/docs/models
- API Reference: https://openrouter.ai/docs/api-reference

**Solana:**
- Docs: https://docs.solana.com
- Web3.js: https://solana-labs.github.io/solana-web3.js
- Wallet Adapter: https://github.com/anza-xyz/wallet-adapter

## License

MIT

