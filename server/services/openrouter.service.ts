import { OpenRouter } from '@openrouter/sdk'

export interface AIRequest {
  messages: Array<{ role: string; content: string | any[] }>
  tier: 'free' | 'premium' | 'ultra-premium' | 'enterprise'
  stream?: boolean
  maxTokens?: number
}

export interface AIResponse {
  content: string
  model: string
  tokensUsed: number
  promptTokens: number
  completionTokens: number
}

const TIER_MODELS = {
  free: 'mistralai/mistral-7b-instruct:free',
  premium: 'openai/gpt-4o-mini',
  'ultra-premium': 'anthropic/claude-3.5-sonnet',
  enterprise: 'anthropic/claude-3.7-sonnet',
}

const FREE_MODEL_FALLBACKS = [
  'mistralai/mistral-7b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'microsoft/phi-3-mini-128k-instruct:free',
]

export class OpenRouterService {
  private client: OpenRouter | null = null

  private getClient(): OpenRouter {
    if (!this.client) {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is required. Please set it in your .env file.')
      }

      this.client = new OpenRouter({
        apiKey,
        timeoutMs: 60000,
      })
    }
    return this.client
  }

  getModelForTier(tier: string): string {
    return TIER_MODELS[tier as keyof typeof TIER_MODELS] || TIER_MODELS.free
  }

  async chatCompletion(request: AIRequest): Promise<AIResponse> {
    const model = this.getModelForTier(request.tier)

    try {
      const response = await this.getClient().chat.send({
        model,
        messages: request.messages as any,
        ...(request.maxTokens && { maxTokens: request.maxTokens }),
      })

      const choice = response.choices[0]
      const usage = response.usage

      return {
        content: (choice.message.content as string) || '',
        model: response.model || model,
        tokensUsed: usage?.totalTokens || 0,
        promptTokens: usage?.promptTokens || 0,
        completionTokens: usage?.completionTokens || 0,
      }
    } catch (error) {
      console.error('OpenRouter SDK error, trying fallback...', error)
      return this.chatCompletionFallback(request)
    }
  }

  private async chatCompletionFallback(request: AIRequest): Promise<AIResponse> {
    const model = this.getModelForTier(request.tier)
    const apiKey = process.env.OPENROUTER_API_KEY
    const isFree = request.tier === 'free'

    const modelsToTry = isFree ? FREE_MODEL_FALLBACKS : [model]

    for (let i = 0; i < modelsToTry.length; i++) {
      const currentModel = modelsToTry[i]
      const requestBody = {
        model: currentModel,
        messages: request.messages,
        ...(request.maxTokens && { max_tokens: request.maxTokens }),
      }

      console.log(`🔄 Attempt ${i + 1}/${modelsToTry.length} - Model: ${currentModel}`)

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
            'X-Title': 'SPL-402 AI Platform',
          },
          body: JSON.stringify(requestBody),
        })

        const responseText = await response.text()

        if (!response.ok) {
          const errorData = JSON.parse(responseText)
          const is429 = response.status === 429

          if (is429 && i < modelsToTry.length - 1) {
            console.log(`⚠️  Model ${currentModel} rate-limited, trying next model...`)
            continue
          }

          console.error('📥 OpenRouter error:', responseText)
          throw new Error(`OpenRouter API error (${response.status}): ${errorData.error?.message || responseText}`)
        }

        const data = JSON.parse(responseText)

        if (!data.choices || !data.choices[0]) {
          console.error('📥 Invalid response structure:', data)
          throw new Error('Invalid response from OpenRouter')
        }

        const choice = data.choices[0]
        const usage = data.usage

        console.log(`✅ Success with model: ${currentModel}`)

        return {
          content: choice.message.content || '',
          model: data.model || currentModel,
          tokensUsed: usage?.total_tokens || 0,
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
        }
      } catch (error) {
        if (i === modelsToTry.length - 1) {
          console.error('❌ All models failed')
          throw new Error(`AI request failed: ${(error as Error).message}`)
        }
      }
    }

    throw new Error('AI request failed: All models exhausted')
  }

  async streamChatCompletion(request: AIRequest): Promise<AsyncIterable<any>> {
    const model = this.getModelForTier(request.tier)

    try {
      const stream = await this.getClient().chat.send({
        model,
        messages: request.messages as any,
        stream: true,
        ...(request.maxTokens && { maxTokens: request.maxTokens }),
      })

      return stream as any
    } catch (error) {
      console.error('OpenRouter streaming error:', error)
      throw new Error(`AI streaming failed: ${(error as Error).message}`)
    }
  }

  async codeGeneration(request: AIRequest): Promise<AIResponse> {
    const systemMessage = {
      role: 'system',
      content:
        'You are an expert programmer. Generate clean, efficient, and well-documented code based on the user request. Include comments and follow best practices.',
    }

    const messagesWithSystem = [systemMessage, ...request.messages]

    return this.chatCompletion({
      ...request,
      messages: messagesWithSystem,
      maxTokens: request.maxTokens || 4000,
    })
  }

  async textAnalysis(request: AIRequest): Promise<AIResponse> {
    const systemMessage = {
      role: 'system',
      content:
        'You are an expert text analyst. Analyze the provided text and provide insights, summaries, or answer questions about it. Be concise and accurate.',
    }

    const messagesWithSystem = [systemMessage, ...request.messages]

    return this.chatCompletion({
      ...request,
      messages: messagesWithSystem,
      maxTokens: request.maxTokens || 2000,
    })
  }

  async contentGeneration(request: AIRequest): Promise<AIResponse> {
    const systemMessage = {
      role: 'system',
      content:
        'You are a creative content writer. Generate high-quality, engaging content based on user requirements. Be creative, original, and maintain the requested tone and style.',
    }

    const messagesWithSystem = [systemMessage, ...request.messages]

    return this.chatCompletion({
      ...request,
      messages: messagesWithSystem,
      maxTokens: request.maxTokens || 3000,
    })
  }

  async multimodalAnalysis(request: AIRequest): Promise<AIResponse> {
    const model = this.getModelForTier(request.tier)

    const visionModels: { [key: string]: string } = {
      free: 'google/gemini-2.0-flash-exp:free',
      premium: 'openai/gpt-4o-mini',
      'ultra-premium': 'anthropic/claude-3.5-sonnet',
      enterprise: 'anthropic/claude-3.7-sonnet',
    }

    try {
      const response = await this.getClient().chat.send({
        model: visionModels[request.tier] || model,
        messages: request.messages as any,
        maxTokens: request.maxTokens || 2000,
      })

      const choice = response.choices[0]
      const usage = response.usage

      return {
        content: (choice.message.content as string) || '',
        model: response.model || model,
        tokensUsed: usage?.totalTokens || 0,
        promptTokens: usage?.promptTokens || 0,
        completionTokens: usage?.completionTokens || 0,
      }
    } catch (error) {
      console.error('Multimodal analysis error:', error)
      throw new Error(`Multimodal analysis failed: ${(error as Error).message}`)
    }
  }
}

export const openRouterService = new OpenRouterService()
