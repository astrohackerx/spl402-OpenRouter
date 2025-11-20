import { useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useSPL402 } from 'spl402'
import { Transaction, PublicKey, TransactionInstruction } from '@solana/web3.js'
import AIChat from './AIChat'
import CodeGenerator from './CodeGenerator'
import TextAnalyzer from './TextAnalyzer'
import ContentGenerator from './ContentGenerator'
import VisionAnalyzer from './VisionAnalyzer'
import {
  MessageSquare,
  Code,
  FileText,
  PenTool,
  Image as ImageIcon,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const features = [
  {
    id: 'chat',
    name: 'AI Chat',
    icon: MessageSquare,
    description: 'Natural conversations with AI',
    tier: 'free',
    price: 0,
  },
  {
    id: 'code',
    name: 'Code Generation',
    icon: Code,
    description: 'Generate code in any language',
    tier: 'premium',
    price: 0.001,
  },
  {
    id: 'analyze',
    name: 'Text Analysis',
    icon: FileText,
    description: 'Summarize & analyze text',
    tier: 'premium',
    price: 0.001,
  },
  {
    id: 'generate',
    name: 'Content Creation',
    icon: PenTool,
    description: 'Generate creative content',
    tier: 'ultra-premium',
    price: 0.005,
  },
  {
    id: 'vision',
    name: 'Vision Analysis',
    icon: ImageIcon,
    description: 'Analyze images & documents',
    tier: 'enterprise',
    price: 0.01,
  },
]

export default function AIShowcase() {
  const [activeFeature, setActiveFeature] = useState('chat')
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})
  const wallet = useWallet()
  const { connection } = useConnection()
 

  const { makeRequest } = useSPL402({
    network: 'mainnet-beta',
    rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  })

  const makeAIRequest = async (
    endpoint: string,
    body: any,
    tier: string,
    price: number
  ) => {
    console.log('Making AI request:', { endpoint, tier, price, hasPublicKey: !!wallet.publicKey, walletConnected: wallet.connected })

    if (price > 0 && !wallet.connected) {
      throw new Error('Please connect your wallet to use paid features')
    }

    if (price > 0 && !wallet.publicKey) {
      throw new Error('Wallet connected but public key not available. Please try reconnecting your wallet.')
    }

    const fullEndpoint = `${API_URL}${endpoint}`

    try {
      let response: Response

      if (price === 0) {
        response = await fetch(fullEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, tier }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Free request error response:', errorText)
          throw new Error(`Request failed: ${errorText}`)
        }
      } else {
        if (!wallet.publicKey) {
          throw new Error('Please connect your wallet for paid features')
        }
        const walletAdapter = {
          publicKey: wallet.publicKey,
          signAndSendTransaction: async (transaction: any) => {
            const signature = await wallet.sendTransaction(transaction, connection, {
              skipPreflight: false,
            })
            return { signature }
          },
        }

        console.log('Calling makeRequest for paid POST:', {
          url: fullEndpoint,
          walletConnected: !!walletAdapter.publicKey,
          publicKey: walletAdapter.publicKey
        })

        const requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, tier }),
        }

        response = await makeRequest(fullEndpoint, walletAdapter, requestOptions)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Paid POST error response:', errorText)

          if (response.status === 402) {
            throw new Error('Payment required. Please approve the transaction in your wallet.')
          }

          throw new Error(`Request failed: ${errorText}`)
        }
      }

      return await response.json()
    } catch (error) {
      console.error('AI request error:', error)

      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('Transaction cancelled. Please approve the wallet transaction to continue.')
        }
        if (error.message.includes('Payment required but no payment details provided')) {
          throw new Error('Please connect your wallet to use this paid feature.')
        }
      }

      throw error
    }
  }

  const handleChatSubmit = async (messages: Message[]) => {
    const feature = features.find((f) => f.id === 'chat')!
    setLoading({ ...loading, chat: true })

    try {
      const response = await makeAIRequest(
        '/api/ai/chat',
        { messages },
        feature.tier,
        feature.price
      )
      return response.content
    } finally {
      setLoading({ ...loading, chat: false })
    }
  }

  const handleCodeGeneration = async (prompt: string, language: string) => {
    const feature = features.find((f) => f.id === 'code')!
    setLoading({ ...loading, code: true })

    try {
      const response = await makeAIRequest(
        '/api/ai/code',
        { prompt, language },
        feature.tier,
        feature.price
      )
      return response.content
    } finally {
      setLoading({ ...loading, code: false })
    }
  }

  const handleTextAnalysis = async (text: string, task: string) => {
    const feature = features.find((f) => f.id === 'analyze')!
    setLoading({ ...loading, analyze: true })

    try {
      const response = await makeAIRequest(
        '/api/ai/analyze',
        { text, task },
        feature.tier,
        feature.price
      )
      return response.content
    } finally {
      setLoading({ ...loading, analyze: false })
    }
  }

  const handleContentGeneration = async (
    prompt: string,
    contentType: string,
    tone: string
  ) => {
    const feature = features.find((f) => f.id === 'generate')!
    setLoading({ ...loading, generate: true })

    try {
      const response = await makeAIRequest(
        '/api/ai/generate',
        { prompt, contentType, tone },
        feature.tier,
        feature.price
      )
      return response.content
    } finally {
      setLoading({ ...loading, generate: false })
    }
  }

  const handleVisionAnalysis = async (prompt: string, imageUrl: string) => {
    const feature = features.find((f) => f.id === 'vision')!
    setLoading({ ...loading, vision: true })

    try {
      const imageContent = imageUrl.startsWith('data:')
        ? { imageBase64: imageUrl }
        : { imageUrl }

      const response = await makeAIRequest(
        '/api/ai/vision',
        { prompt, ...imageContent },
        feature.tier,
        feature.price
      )
      return response.content
    } finally {
      setLoading({ ...loading, vision: false })
    }
  }

  const renderFeature = () => {
    switch (activeFeature) {
      case 'chat':
        return (
          <AIChat
            tier="Free"
            onSubmit={handleChatSubmit}
            isLoading={loading.chat || false}
          />
        )
      case 'code':
        return (
          <CodeGenerator
            onGenerate={handleCodeGeneration}
            isLoading={loading.code || false}
          />
        )
      case 'analyze':
        return (
          <TextAnalyzer
            onAnalyze={handleTextAnalysis}
            isLoading={loading.analyze || false}
          />
        )
      case 'generate':
        return (
          <ContentGenerator
            onGenerate={handleContentGeneration}
            isLoading={loading.generate || false}
          />
        )
      case 'vision':
        return (
          <VisionAnalyzer
            onAnalyze={handleVisionAnalysis}
            isLoading={loading.vision || false}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-12">
      {/* <div className="text-center mb-12">
        <h2 className="text-4xl font-black mb-4">
          AI Features Powered by{' '}
          <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-transparent bg-clip-text">
            OpenRouter
          </span>
        </h2>
        <p className="text-xl text-gray-400">
          Access 500+ AI models with SOL micropayments
        </p>
      </div> */}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {features.map((feature) => {
            const Icon = feature.icon
            const isActive = activeFeature === feature.id

            return (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-zinc-800 border-[#9945FF]'
                    : 'bg-zinc-900 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isActive
                        ? 'bg-[#9945FF]'
                        : 'bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{feature.name}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                    <div className="mt-2 text-xs text-[#14F195]">
                      {feature.price === 0
                        ? 'FREE'
                        : `${feature.price} SOL per request`}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="lg:col-span-2 bg-zinc-900 rounded-lg border border-white/10 p-6">
          {renderFeature()}
        </div>
      </div>
    </div>
  )
}
