import { fetchSSE } from '../fetch-sse'
import { GenerateAnswerParams, Provider } from '../types'

export class LLAMAProvider implements Provider {
  constructor(private token: string, private model: string) {
    this.token = token
    this.model = model
  }

  private buildPrompt(prompt: string): string {
    return '"' + prompt + '"'
  }

  async generateAnswer(params: GenerateAnswerParams) {
    let result = ''
    await fetchSSE('https://api.together.xyz/inference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        model: `${this.model}`,
        max_tokens: 2048,
        prompt: this.buildPrompt(params.prompt),
        request_type: 'language-model-inference',
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stream_tokens: true,
      }),
      onMessage(message: string) {
        if (message === '[DONE]') {
          params.onEvent({ type: 'done' })
          return
        }

        let data
        try {
          data = JSON.parse(message)
        } catch (err) {
          console.error(err)
          return
        }

        const text = data.choices?.[0]?.text
        if (text) {
          result += text
          params.onEvent({
            type: 'answer',
            data: {
              text: result,
              messageId: '',
              conversationId: '',
            },
          })
        }
      },
    })
    return {}
  }
}
