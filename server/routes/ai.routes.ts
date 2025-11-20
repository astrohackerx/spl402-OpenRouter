import { Router, Request, Response } from 'express'
import { openRouterService } from '../services/openrouter.service'

const router = Router()

router.post('/api/ai/chat', async (req: Request, res: Response) => {
  console.log('📨 Chat endpoint hit:', req.body)
  try {
    const { messages, tier = 'free', stream = false } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' })
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const streamResponse = await openRouterService.streamChatCompletion({
        messages,
        tier,
        stream: true,
      })

      for await (const chunk of streamResponse) {
        const delta = chunk.choices?.[0]?.delta?.content
        if (delta) {
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`)
        }
      }

      res.write('data: [DONE]\n\n')
      res.end()
    } else {
      const startTime = Date.now()
      const response = await openRouterService.chatCompletion({
        messages,
        tier,
      })
      const responseTime = Date.now() - startTime

      res.json({
        ...response,
        responseTime,
        tier,
      })
    }
  } catch (error) {
    console.error('Chat completion error:', error)
    res.status(500).json({
      error: 'Chat completion failed',
      message: (error as Error).message,
    })
  }
})

router.post('/api/ai/code', async (req: Request, res: Response) => {
  try {
    const { prompt, language, tier } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (!tier) {
      return res.status(400).json({ error: 'Tier is required' })
    }

    const userMessage = language
      ? `Generate ${language} code: ${prompt}`
      : `Generate code: ${prompt}`

    const startTime = Date.now()
    const response = await openRouterService.codeGeneration({
      messages: [{ role: 'user', content: userMessage }],
      tier,
    })
    const responseTime = Date.now() - startTime

    res.json({
      ...response,
      responseTime,
      tier,
      language: language || 'auto',
    })
  } catch (error) {
    console.error('Code generation error:', error)
    res.status(500).json({
      error: 'Code generation failed',
      message: (error as Error).message,
    })
  }
})

router.post('/api/ai/analyze', async (req: Request, res: Response) => {
  try {
    const { text, task, tier } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    if (!tier) {
      return res.status(400).json({ error: 'Tier is required' })
    }

    const taskPrompts: { [key: string]: string } = {
      summarize: `Summarize the following text concisely:\n\n${text}`,
      analyze: `Analyze the following text and provide key insights:\n\n${text}`,
      sentiment: `Analyze the sentiment of the following text:\n\n${text}`,
      keywords: `Extract key keywords and topics from the following text:\n\n${text}`,
    }

    const userMessage = taskPrompts[task] || `Analyze this text:\n\n${text}`

    const startTime = Date.now()
    const response = await openRouterService.textAnalysis({
      messages: [{ role: 'user', content: userMessage }],
      tier,
    })
    const responseTime = Date.now() - startTime

    res.json({
      ...response,
      responseTime,
      tier,
      task: task || 'analyze',
    })
  } catch (error) {
    console.error('Text analysis error:', error)
    res.status(500).json({
      error: 'Text analysis failed',
      message: (error as Error).message,
    })
  }
})

router.post('/api/ai/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, contentType, tone, tier } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (!tier) {
      return res.status(400).json({ error: 'Tier is required' })
    }

    let userMessage = prompt

    if (contentType) {
      userMessage = `Generate ${contentType}: ${prompt}`
    }

    if (tone) {
      userMessage += `\n\nTone: ${tone}`
    }

    const startTime = Date.now()
    const response = await openRouterService.contentGeneration({
      messages: [{ role: 'user', content: userMessage }],
      tier,
    })
    const responseTime = Date.now() - startTime

    res.json({
      ...response,
      responseTime,
      tier,
      contentType: contentType || 'general',
      tone: tone || 'neutral',
    })
  } catch (error) {
    console.error('Content generation error:', error)
    res.status(500).json({
      error: 'Content generation failed',
      message: (error as Error).message,
    })
  }
})

router.post('/api/ai/vision', async (req: Request, res: Response) => {
  try {
    const { prompt, imageUrl, imageBase64, tier } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (!imageUrl && !imageBase64) {
      return res.status(400).json({ error: 'Image URL or base64 data is required' })
    }

    if (!tier) {
      return res.status(400).json({ error: 'Tier is required' })
    }

    const imageContent = imageUrl
      ? { type: 'image_url', image_url: { url: imageUrl } }
      : { type: 'image_url', image_url: { url: imageBase64 } }

    const messages = [
      {
        role: 'user',
        content: [{ type: 'text', text: prompt }, imageContent],
      },
    ]

    const startTime = Date.now()
    const response = await openRouterService.multimodalAnalysis({
      messages,
      tier,
    })
    const responseTime = Date.now() - startTime

    res.json({
      ...response,
      responseTime,
      tier,
      mediaType: 'image',
    })
  } catch (error) {
    console.error('Vision analysis error:', error)
    res.status(500).json({
      error: 'Vision analysis failed',
      message: (error as Error).message,
    })
  }
})

export default router
