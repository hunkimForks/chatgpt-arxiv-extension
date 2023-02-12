import { render } from 'preact'
import '../base.css'
import { getUserConfig, Theme } from '../config'
import { detectSystemColorScheme } from '../utils'
import ChatGPTContainer from './ChatGPTContainer'
import { config, SearchEngine } from './search-engine-configs'
import './styles.scss'
import { getPossibleElementByQuerySelector } from './utils'

async function mount(question: string, promptSource: string, siteConfig: SearchEngine) {
  const container = document.createElement('div')
  container.className = 'chat-gpt-container'

  const userConfig = await getUserConfig()
  let theme: Theme
  if (userConfig.theme === Theme.Auto) {
    theme = detectSystemColorScheme()
  } else {
    theme = userConfig.theme
  }
  if (theme === Theme.Dark) {
    container.classList.add('gpt-dark')
  } else {
    container.classList.add('gpt-light')
  }

  const siderbarContainer = getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery)
  if (siderbarContainer) {
    siderbarContainer.prepend(container)
  } else {
    container.classList.add('sidebar-free')
    const appendContainer = getPossibleElementByQuerySelector(siteConfig.appendContainerQuery)
    if (appendContainer) {
      appendContainer.appendChild(container)
    }
  }

  render(
    <ChatGPTContainer
      question={question}
      promptSource={promptSource}
      triggerMode={userConfig.triggerMode || 'always'}
    />,
    container,
  )
}

/**
 * mount html elements when requestions triggered
 * @param question question string
 * @param index question index
 */
export async function requeryMount(question: string, index: number) {
  const container = document.querySelector<HTMLDivElement>('.question-container')
  let theme: Theme
  const questionItem = document.createElement('div')
  questionItem.className = `question-${index}`

  const userConfig = await getUserConfig()
  if (userConfig.theme === Theme.Auto) {
    theme = detectSystemColorScheme()
  } else {
    theme = userConfig.theme
  }
  if (theme === Theme.Dark) {
    container?.classList.add('gpt-dark')
    questionItem.classList.add('gpt-dark')
  } else {
    container?.classList.add('gpt-light')
    questionItem.classList.add('gpt-light')
  }
  questionItem.innerText = `Q${index + 1} : ${question}`
  container?.appendChild(questionItem)
}

const siteRegex = new RegExp(Object.keys(config).join('|'))
const siteName = location.hostname.match(siteRegex)![0]
const siteConfig = config[siteName]

async function run() {
  const searchInput = getPossibleElementByQuerySelector<HTMLInputElement>(siteConfig.inputQuery)
  console.debug('Try to Mount ChatGPT on', siteName)

  if (siteConfig.bodyQuery) {
    const bodyElement = getPossibleElementByQuerySelector(siteConfig.bodyQuery)
    console.debug('bodyElement', bodyElement)

    if (bodyElement && bodyElement.textContent) {
      const bodyInnerText = bodyElement.textContent.trim().replace(/\s+/g, ' ').substring(0, 1500)
      console.log('Body: ' + bodyInnerText)
      const userConfig = await getUserConfig()

      const found = userConfig.promptOverrides.find(
        (override) => new URL(override.site).hostname === location.hostname,
      )
      const question = found?.prompt ?? userConfig.prompt
      const promptSource = found?.site ?? 'default'

      mount(question + bodyInnerText, promptSource, siteConfig)
    }
  }

  //const searchInput = getPossibleElementByQuerySelector<HTMLInputElement>(siteConfig.inputQuery)
  //if (searchInput && searchInput.value) {
  //  console.debug('Mount ChatGPT on', siteName)
  //  const userConfig = await getUserConfig()
  //  const searchValueWithLanguageOption =
  //    userConfig.language === Language.Auto
  //      ? searchInput.value
  //      : `${searchInput.value}(in ${userConfig.language})`
  //  mount(searchValueWithLanguageOption, siteConfig)
}

run()

if (siteConfig.watchRouteChange) {
  siteConfig.watchRouteChange(run)
}
