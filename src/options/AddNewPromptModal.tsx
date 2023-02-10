import { Input, Modal, Text, Textarea, useToasts } from '@geist-ui/core'
import { useState } from 'preact/hooks'
import { isValidHttpUrl } from '../content-script/utils'

function AddNewPromptModal(props: {
  visible: boolean
  onClose: () => void
  onSave: (newOverride: { site: string; prompt: string }) => Promise<void>
}) {
  const { visible, onClose, onSave } = props
  const [site, setSite] = useState<string>('')
  const [siteError, setSiteError] = useState<boolean>(false)
  const [prompt, setPrompt] = useState<string>('')
  const [promptError, setPromptError] = useState<boolean>(false)
  const { setToast } = useToasts()

  function validateInput() {
    const isSiteValid = isValidHttpUrl(site)
    setSiteError(!isSiteValid)
    if (!isSiteValid) {
      return false
    }
    const isPromptValid = prompt.trim().length > 0
    setPromptError(!isPromptValid)
    return isPromptValid
  }

  function close() {
    setSite('')
    setSiteError(false)
    setPrompt('')
    setPromptError(false)
    onClose()
  }

  return (
    <Modal visible={visible} onClose={onClose}>
      <Modal.Title>Add New Prompt</Modal.Title>
      <Modal.Content>
        <Input
          width={'100%'}
          clearable
          label="site"
          placeholder="https://arxiv.org/"
          onChange={(e) => setSite(e.target.value)}
        >
          {siteError && (
            <Text small type="error">
              Site is not valid
            </Text>
          )}
        </Input>
        {promptError && (
          <div className="mt-3 mb-2 px-1">
            <Text small type="error">
              Prompt cannot be empty
            </Text>
          </div>
        )}
        <Textarea
          my={promptError ? 0 : 1}
          value={prompt}
          width="100%"
          height="10em"
          placeholder="Type prompt here"
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Modal.Content>
      <Modal.Action passive onClick={() => close()}>
        Cancel
      </Modal.Action>
      <Modal.Action
        onClick={() => {
          if (!validateInput()) {
            return
          }
          onSave({ site, prompt })
            .then(() => {
              setToast({ text: 'New Prompt saved', type: 'success' })
              close()
            })
            .catch(() => {
              setToast({ text: 'Failed to save prompt', type: 'error' })
            })
        }}
      >
        Save
      </Modal.Action>
    </Modal>
  )
}

export default AddNewPromptModal
