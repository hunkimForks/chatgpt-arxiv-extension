import { fetchSSE } from '../fetch-sse'
import { GenerateAnswerParams, Provider } from '../types'

export class OpenAIProvider implements Provider {
  constructor(private token: string, private model: string) {
    this.token = token
    this.model = model
  }

  private buildMessages(prompt: string): string {
    return prompt
  }

  async generateAnswer(params: GenerateAnswerParams) {
    let result = ''
    await fetchSSE('https://api.upstage.ai/v1/solar/chat/completions', {
      method: 'POST',
      signal: params.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are excellent researchers. Please privde information about research paper.',
          },
          {
            role: 'user',
            content: this.buildMessages(params.prompt),
          },
        ],
        stream: true,
        max_tokens: 4096,
      }),
      onMessage(message) {
        console.debug('sse message', message)
        if (message === '[DONE]') {
          params.onEvent({ type: 'done' })
          return
        }
        let data
        try {
          data = JSON.parse(message)
          console.log(data)
          const text = data.choices[0]?.delta?.content
          if (text === '<|im_end|>' || text === '<|im_sep|>') {
            return
          }
          result += text
          params.onEvent({
            type: 'answer',
            data: {
              text: result,
              messageId: data.id,
              conversationId: data.id,
            },
          })
        } catch (err) {
          console.error(err)
          return
        }
      },
    })
    return {}
  }
}
