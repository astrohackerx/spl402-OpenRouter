import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer, createExpressMiddleware } from 'spl402'
import aiRoutes from './routes/ai.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    exposedHeaders: ['X-Payment-Required'],
  }),
)

app.use(express.json())

app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`)
  next()
})

const spl402 = createServer({
  network: 'mainnet-beta',
  recipientAddress: process.env.RECIPIENT_WALLET as string,
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  routes: [
    { path: '/api/free-data', price: 0, method: 'GET' },
    { path: '/api/premium-data', price: 0.001, method: 'GET' },
    { path: '/api/ultra-premium', price: 0.005, method: 'GET' },
    { path: '/api/enterprise-data', price: 0.01, method: 'GET' },
    { path: '/api/ai/chat', price: 0, method: 'POST' },
    { path: '/api/ai/code', price: 0.001, method: 'POST' },
    { path: '/api/ai/analyze', price: 0.001, method: 'POST' },
    { path: '/api/ai/generate', price: 0.005, method: 'POST' },
    { path: '/api/ai/vision', price: 0.01, method: 'POST' },
  ],
})

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: 'mainnet-beta',
    recipient: process.env.RECIPIENT_WALLET,
  })
})

app.post('/api/test', (_req: Request, res: Response) => {
  res.json({ message: 'Test endpoint works!' })
})

app.use((req, res, next) => {
  console.log(`🔍 Before SPL-402 middleware: ${req.method} ${req.path}`)
  next()
})

app.use(createExpressMiddleware(spl402))

app.use((req, res, next) => {
  console.log(`✅ After SPL-402 middleware: ${req.method} ${req.path}`)
  next()
})

app.use(aiRoutes)

app.get('/api/free-data', (_req: Request, res: Response) => {
  res.json({
    message: 'This is free data',
    timestamp: new Date().toISOString(),
    tier: 'free',
  })
})

app.get('/api/premium-data', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to premium tier!',
    data: {
      secret: 'This data costs 0.001 SOL',
      features: ['Advanced analytics', 'Real-time updates', 'Priority support'],
      timestamp: new Date().toISOString(),
    },
    tier: 'premium',
  })
})

app.get('/api/ultra-premium', (_req: Request, res: Response) => {
  res.json({
    message: 'Ultra premium content unlocked!',
    data: {
      secret: 'This exclusive data costs 0.005 SOL',
      features: [
        'Advanced analytics',
        'Real-time updates',
        'Priority support',
        'Dedicated account manager',
        'Custom integrations',
      ],
      insights: {
        market_analysis: 'Bullish trend detected',
        recommendation: 'Strong buy',
        confidence: 0.95,
      },
      timestamp: new Date().toISOString(),
    },
    tier: 'ultra-premium',
  })
})

app.get('/api/enterprise-data', (_req: Request, res: Response) => {
  res.json({
    message: 'Enterprise tier activated!',
    data: {
      secret: 'Top-tier enterprise data costs 0.01 SOL',
      features: [
        'All premium features',
        'White-label solution',
        'Custom SLA',
        '24/7 dedicated support',
        'Advanced security features',
        'API rate limit: Unlimited',
      ],
      enterprise_insights: {
        market_depth: 'Complete order book analysis',
        trading_signals: ['BUY', 'HOLD', 'ACCUMULATE'],
        risk_score: 0.15,
        recommended_position: '15% portfolio allocation',
      },
      timestamp: new Date().toISOString(),
    },
    tier: 'enterprise',
  })
})

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  SPL-402 AI Platform Server                            ║
╠════════════════════════════════════════════════════════╣
║  Status: ✅ Running                                     ║
║  Port: ${PORT}                                         ║
║  Network: mainnet-beta                                 ║
║  Recipient: ${process.env.RECIPIENT_WALLET?.slice(0, 8)}...  ║
║  OpenRouter: ${process.env.OPENROUTER_API_KEY ? '✅ Configured' : '❌ Missing'}              ║
╠════════════════════════════════════════════════════════╣
║  Demo Endpoints:                                       ║
║  GET  /api/free-data      - Free (0 SOL)              ║
║  GET  /api/premium-data   - 0.001 SOL                 ║
║  GET  /api/ultra-premium  - 0.005 SOL                 ║
║  GET  /api/enterprise-data- 0.01 SOL                  ║
╠════════════════════════════════════════════════════════╣
║  AI Endpoints:                                         ║
║  POST /api/ai/chat        - Free (Mistral 7B + auto)  ║
║  POST /api/ai/code        - 0.001 SOL (GPT-4o-mini)   ║
║  POST /api/ai/analyze     - 0.001 SOL (GPT-4o-mini)   ║
║  POST /api/ai/generate    - 0.005 SOL (Claude 3.5)    ║
║  POST /api/ai/vision      - 0.01 SOL (Claude 3.7)     ║
║                                                        ║
║  💡 Free tier auto-falls back to available models     ║
╠════════════════════════════════════════════════════════╣
║  Utility:                                              ║
║  GET  /health             - Health check              ║
║  POST /api/test           - Test endpoint             ║
╚════════════════════════════════════════════════════════╝
  `)
})

