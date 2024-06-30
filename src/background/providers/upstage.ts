import { fetchSSE } from '../fetch-sse'
import { GenerateAnswerParams, Provider } from '../types'

export class UpstageProvider implements Provider {
  constructor(private token: string, private model: string) {
    this.token = token
    this.model = model
  }

  private buildMessages(params: GenerateAnswerParams): object[] {
    if (params.previousMessages === undefined) {
      params.previousMessages = []
    }

    console.log(params.previousMessages[0])

    const messsages = [
      {
        role: 'system',
        content: 'You are excellent researchers. Please privde information about research paper.',
      },
      ...params.previousMessages,
      {
        role: 'user',
        content: params.prompt,
      },
    ]

    console.log(messsages)

    return messsages
  }

  async generateAnswer(params: GenerateAnswerParams) {
    console.log(params)

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
        messages: this.buildMessages(params),
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
          const text = data.choices[0]?.delta?.content
          if (text === '<|im_end|>' || text === '<|im_sep|>' || text === undefined) {
            params.onEvent({ type: 'done' })
            return
          }
          result += text
          params.onEvent({
            type: 'answer',
            data: {
              text: result + '✏',
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
