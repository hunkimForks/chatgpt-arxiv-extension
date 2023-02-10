import { Button, Card, Divider, Grid, Text, Textarea, useToasts } from '@geist-ui/core'
import Trash2 from '@geist-ui/icons/trash2'
import { useCallback, useState } from 'preact/hooks'

function PromptCard(props: {
  header: string
  prompt: string
  onSave: (newPrompt: string) => Promise<void>
  onDismiss?: () => Promise<void>
}) {
  const { header, prompt, onSave, onDismiss } = props
  const [value, setValue] = useState<string>(prompt)
  const { setToast } = useToasts()

  const onClickSave = useCallback(
    (prompt: string) => {
      setValue(prompt)
      onSave(prompt)
        .then(() => {
          setToast({ text: 'Prompt changes saved', type: 'success' })
        })
        .catch(() => {
          setToast({ text: 'Failed to save prompt', type: 'error' })
        })
    },
    [onSave, setToast],
  )

  return (
    <Card width="100%">
      <Card.Content>
        <Grid.Container gap={2} justify="center" alignItems="center">
          <Grid xs>
            <Text b my={0}>
              {header}
            </Text>
          </Grid>
          {onDismiss && (
            <Grid xs={2} justify="center" alignItems="center">
              <Button
                style={{ border: 0 }}
                iconRight={<Trash2 size={18} />}
                auto
                px={0.6}
                onClick={() =>
                  onDismiss()
                    .then(() => {
                      setToast({ text: 'Prompt removed', type: 'success' })
                    })
                    .catch(() => {
                      setToast({ text: 'Failed to remove prompt', type: 'error' })
                    })
                }
              />
            </Grid>
          )}
        </Grid.Container>
      </Card.Content>

      <Divider h="1px" my={0} />

      <Card.Content>
        <Textarea
          value={value}
          width="100%"
          height="10em"
          placeholder="Type prompt here"
          onChange={(event) => setValue(event.target.value)}
        >
          {value}
        </Textarea>
      </Card.Content>
      <Card.Footer>
        <Button
          width="100%"
          type="secondary"
          ghost
          onClick={() => onClickSave(value)}
          className="mt-3"
        >
          Save Prompt
        </Button>
      </Card.Footer>
    </Card>
  )
}

export default PromptCard
