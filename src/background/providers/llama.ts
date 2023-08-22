import { fetchSimple } from '../fetch-sse'
import { GenerateAnswerParams, Provider } from '../types'

export class LLAMAProvider implements Provider {
  constructor(private token: string, private model: string) {
    this.token = token
    this.model = model
  }

  private buildPrompt(prompt: string): string {
    return prompt
  }

  async generateAnswer(params: GenerateAnswerParams) {
    await fetchSimple('https://api.together.xyz/inference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        model: `${this.model}`,
        max_tokens: 512,
        prompt: params.prompt,
        request_type: 'language-model-inference',
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
      }),
      onMessage(message: string) {
        let data
        try {
          data = JSON.parse(message)
        } catch (err) {
          console.error(err)
          return
        }

        if (data.status != 'finished') {
          console.error('error status', data.status)
          return
        }
        const text = data.output?.choices?.[0]?.text + '✏'
        if (text) {
          params.onEvent({
            type: 'answer',
            data: {
              text,
              messageId: '',
              conversationId: '',
              parentMessageId: '',
            },
          })
        }
      },
    })
    return {}
  }
}
