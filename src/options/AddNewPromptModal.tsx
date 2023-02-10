import { Input, Modal, Textarea, useToasts } from '@geist-ui/core'
import { useState } from 'preact/hooks'

function AddNewPromptModal(props: {
  visible: boolean
  onClose: () => void
  onSave: (newOverride: { site: string; prompt: string }) => Promise<void>
}) {
  const { visible, onClose, onSave } = props
  const [site, setSite] = useState<string>('')
  const [prompt, setPrompt] = useState<string>('')
  const { setToast } = useToasts()

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
        />
        <Textarea
          my={1}
          value={prompt}
          width="100%"
          height="10em"
          placeholder="Type prompt here"
          onChange={(event) => setPrompt(event.target.value)}
        >
          {prompt}
        </Textarea>
      </Modal.Content>
      <Modal.Action passive onClick={() => onClose()}>
        Cancel
      </Modal.Action>
      <Modal.Action
        onClick={() => {
          onSave({ site, prompt })
            .then(() => {
              setSite('')
              setPrompt('')
              setToast({ text: 'New Prompt saved', type: 'success' })
              onClose()
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
