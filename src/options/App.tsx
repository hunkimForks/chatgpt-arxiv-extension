import { Button, CssBaseline, GeistProvider, Radio, Text, Toggle, useToasts } from '@geist-ui/core'
import { Plus } from '@geist-ui/icons'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import '../base.css'
import {
  getUserConfig,
  Language,
  Prompt,
  SitePrompt,
  Theme,
  TriggerMode,
  TRIGGER_MODE_TEXT,
  updateUserConfig,
} from '../config'
import logo from '../logo.png'
import { detectSystemColorScheme, getExtensionVersion } from '../utils'
import AddNewPromptModal from './AddNewPromptModal'
import PromptCard from './PromptCard'
import ProviderSelect from './ProviderSelect'

function OptionsPage(props: { theme: Theme; onThemeChange: (theme: Theme) => void }) {
  const [triggerMode, setTriggerMode] = useState<TriggerMode>(TriggerMode.Always)
  const [language, setLanguage] = useState<Language>(Language.Auto)
  const [prompt, setPrompt] = useState<string>(Prompt)
  const [promptOverrides, setPromptOverrides] = useState<SitePrompt[]>([])
  const [modalVisible, setModalVisible] = useState<boolean>(false)

  const { setToast } = useToasts()

  useEffect(() => {
    getUserConfig().then((config) => {
      setTriggerMode(config.triggerMode)
      setLanguage(config.language)
      setPrompt(config.prompt)
      setPromptOverrides(config.promptOverrides)
    })
  }, [])

  const closeModalHandler = useCallback(() => {
    setModalVisible(false)
  }, [])

  const onTriggerModeChange = useCallback(
    (mode: TriggerMode) => {
      setTriggerMode(mode)
      updateUserConfig({ triggerMode: mode })
      setToast({ text: 'Changes saved', type: 'success' })
    },
    [setToast],
  )

  const onThemeChange = useCallback(
    (theme: Theme) => {
      updateUserConfig({ theme })
      props.onThemeChange(theme)
      setToast({ text: 'Changes saved', type: 'success' })
    },
    [props, setToast],
  )

  const onLanguageChange = useCallback(
    (language: Language) => {
      updateUserConfig({ language })
      setToast({ text: 'Changes saved', type: 'success' })
    },
    [setToast],
  )

  return (
    <div className="container mx-auto">
      <nav className="flex flex-row justify-between items-center mt-5 px-2">
        <div className="flex flex-row items-center gap-2">
          <img src={logo} className="w-10 h-10 rounded-lg" />
          <span className="font-semibold">ArixGPT(v{getExtensionVersion()})</span>
        </div>
        <div className="flex flex-row gap-3">
          <a
            href="https://github.com/hunkimForks/chatgpt-arxiv-extension/issues"
            target="_blank"
            rel="noreferrer"
          >
            Feedback
          </a>
          <a
            href="https://github.com/hunkimForks/chatgpt-arxiv-extension"
            target="_blank"
            rel="noreferrer"
          >
            Source code
          </a>
        </div>
      </nav>
      <main className="w-[600px] mx-auto mt-14">
        <Text h2>Options</Text>
        <Text h3 className="mt-5">
          Prompt
        </Text>

        <PromptCard
          header={'default'}
          onSave={(prompt) => updateUserConfig({ prompt })}
          prompt={prompt}
        />

        {promptOverrides.map((override, index) => {
          return (
            <div key={override.site} className="my-3">
              <PromptCard
                header={override.site}
                prompt={override.prompt}
                onSave={(newPrompt) => {
                  const newOverride: SitePrompt = {
                    site: override.site,
                    prompt: newPrompt,
                  }
                  const newOverrides = promptOverrides.filter((o) => o.site !== override.site)
                  newOverrides.splice(index, 0, newOverride)
                  setPromptOverrides(newOverrides)
                  return updateUserConfig({ promptOverrides: newOverrides })
                }}
                onDismiss={() => {
                  const newOverrides = promptOverrides.filter((_, i) => i !== index)
                  setPromptOverrides(newOverrides)
                  return updateUserConfig({ promptOverrides: newOverrides })
                }}
              />
            </div>
          )
        })}

        <Button mt={1} type="secondary" width={'100%'} onClick={() => setModalVisible(true)}>
          <Plus size={16} className="mx-2" />
          Add Prompt
        </Button>

        <AddNewPromptModal
          visible={modalVisible}
          onClose={closeModalHandler}
          onSave={({ site, prompt }) => {
            const newOverride: SitePrompt = {
              site,
              prompt,
            }
            const newOverrides = promptOverrides.concat([newOverride])
            setPromptOverrides(newOverrides)
            return updateUserConfig({ promptOverrides: newOverrides })
          }}
        />

        <Text h3 className="mt-8">
          Trigger Mode
        </Text>

        <Radio.Group
          value={triggerMode}
          onChange={(val) => onTriggerModeChange(val as TriggerMode)}
        >
          {Object.entries(TRIGGER_MODE_TEXT).map(([value, texts]) => {
            return (
              <Radio key={value} value={value}>
                {texts.title}
                <Radio.Description>{texts.desc}</Radio.Description>
              </Radio>
            )
          })}
        </Radio.Group>
        <Text h3 className="mt-5">
          Theme
        </Text>
        <Radio.Group value={props.theme} onChange={(val) => onThemeChange(val as Theme)} useRow>
          {Object.entries(Theme).map(([k, v]) => {
            return (
              <Radio key={v} value={v}>
                {k}
              </Radio>
            )
          })}
        </Radio.Group>
        <Text h3 className="mt-5 mb-0">
          AI Provider
        </Text>
        <ProviderSelect />
        <Text h3 className="mt-8">
          Misc
        </Text>
        <div className="flex flex-row items-center gap-4">
          <Toggle initialChecked disabled />
          <Text b margin={0}>
            Auto delete conversations generated by search
          </Text>
        </div>
      </main>
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState(Theme.Auto)

  const themeType = useMemo(() => {
    if (theme === Theme.Auto) {
      return detectSystemColorScheme()
    }
    return theme
  }, [theme])

  useEffect(() => {
    getUserConfig().then((config) => setTheme(config.theme))
  }, [])

  return (
    <GeistProvider themeType={themeType}>
      <CssBaseline />
      <OptionsPage theme={theme} onThemeChange={setTheme} />
    </GeistProvider>
  )
}

export default App
