import Browser from 'webextension-polyfill'
import { getProviderConfigs, ProviderType } from '../config'
import { UpstageProvider } from './providers/upstage'

async function generateAnswers(
  port: Browser.Runtime.Port,
  question: string,
  conversationId: string | undefined,
  parentMessageId: string | undefined,
  previousMessages: object[],
) {
  const providerConfigs = await getProviderConfigs()

  const { apiKey, model } = providerConfigs.configs[ProviderType.GPT3]!
  const provider = new UpstageProvider(apiKey, model)

  const controller = new AbortController()
  port.onDisconnect.addListener(() => {
    controller.abort()
    cleanup?.()
  })

  const { cleanup } = await provider.generateAnswer({
    prompt: question,
    previousMessages: previousMessages,
    signal: controller.signal,
    onEvent(event) {
      if (event.type === 'done') {
        port.postMessage({ event: 'DONE' })
        return
      }
      port.postMessage(event.data)
    },
    conversationId: conversationId,
    parentMessageId: parentMessageId,
  })
}

Browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (msg) => {
    console.debug('received msg', msg)
    try {
      await generateAnswers(
        port,
        msg.question,
        msg.conversationId,
        msg.parentMessageId,
        msg.previousMessages,
      )
    } catch (err: any) {
      console.error(err)
      const error_msg = '\nPlease check your API key and model name in the extension options.'
      port.postMessage({ text: err.message + error_msg })
    }
  })
})

Browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    Browser.runtime.openOptionsPage()
  }
})
