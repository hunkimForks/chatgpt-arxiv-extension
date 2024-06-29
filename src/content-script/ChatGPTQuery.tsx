import { GearIcon } from '@primer/octicons-react'
import { useEffect, useState } from 'preact/hooks'
import { memo, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import Browser from 'webextension-polyfill'
import { captureEvent } from '../analytics'
import { Answer } from '../messaging'
import ChatGPTFeedback from './ChatGPTFeedback'
import { isBraveBrowser, shouldShowRatingTip } from './utils.js'

export type QueryStatus = 'success' | 'error' | undefined

interface Props {
  question: string
  promptSource: string
  onStatusChange?: (status: QueryStatus) => void
}

interface Requestion {
  requestion: string
  index: number
  answer: Answer | null
}

interface ReQuestionAnswerProps {
  answerText: string | undefined;
}

function ChatGPTQuery(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [done, setDone] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [status, setStatus] = useState<QueryStatus>()
  const [reError, setReError] = useState('')
  const [reQuestionDone, setReQuestionDone] = useState(false)
  const [requestionList, setRequestionList] = useState<Requestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [reQuestionAnswerText, setReQuestionAnswerText] = useState<string | undefined>();

  useEffect(() => {
    props.onStatusChange?.(status)
  }, [props, status])

  useEffect(() => {
    const port = Browser.runtime.connect()
    const listener = (msg: any) => {
      if (msg.text) {
        setAnswer(msg)
        setStatus('success')
      } else if (msg.error) {
        setError(msg.error)
        setStatus('error')
      } else if (msg.event === 'DONE') {
        setDone(true)
        setReQuestionDone(true)
      }
    }
    port.onMessage.addListener(listener)
    port.postMessage({ question: props.question })
    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }, [props.question, retry])

  // retry error on focus
  useEffect(() => {
    const onFocus = () => {
      if (error && (error == 'UNAUTHORIZED' || error === 'CLOUDFLARE')) {
        setError('')
        setRetry((r) => r + 1)
      }
    }
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [error])

  useEffect(() => {
    shouldShowRatingTip().then((show) => setShowTip(show))
  }, [])

  useEffect(() => {
    if (status === 'success') {
      captureEvent('show_answer', { host: location.host, language: navigator.language })
    }
  }, [props.question, status])

  const openOptionsPage = useCallback(() => {
    Browser.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE' })
  }, [])

  // requestion
  useEffect(() => {
    if (!requestionList[questionIndex]) return
    const port = Browser.runtime.connect()
    const listener = (msg: any) => {
      try {
        if (msg.text) {
          const requestionListValue = requestionList
          requestionListValue[questionIndex].answer = msg
          setRequestionList(requestionListValue)
          const answerText = requestionList[questionIndex]?.answer?.text;
          setReQuestionAnswerText(answerText);
        } else if (msg.event === 'DONE') {
          setReQuestionDone(true)
          setQuestionIndex(questionIndex + 1)
        }
      } catch {
        setReError(msg.error)
      }
    }
    port.onMessage.addListener(listener)
    port.postMessage({
      question: requestionList[questionIndex].requestion,
      conversationId: answer?.conversationId,
      parentMessageId: (questionIndex == 0 ? (answer?.messageId) : (requestionList[questionIndex - 1].answer?.messageId)),
    })
    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }, [requestionList, questionIndex, answer?.conversationId, answer?.messageId])

  // * Requery Handler Function
  const requeryHandler = useCallback(() => {
    if (inputRef.current) {
      setReQuestionDone(false)
      const requestion = inputRef.current.value
      setRequestionList([...requestionList, { requestion, index: questionIndex, answer: null }])
      inputRef.current.value = ''
    }
  }, [requestionList, questionIndex])

  const ReQuestionAnswerFixed = ({ text }: { text: string | undefined }) => {
    if (!text) return <p className="text-[#b6b8ba] animate-pulse">Answering...</p>
    return (
      <ReactMarkdown rehypePlugins={[[rehypeHighlight, { detect: true }]]}>{text}</ReactMarkdown>
    )
  }

  const ReQuestionAnswer = ({ answerText }: ReQuestionAnswerProps) => {
    if (!answerText || requestionList[requestionList.length-1]?.answer?.text == undefined) {
      return <p className="text-[#b6b8ba] animate-pulse">Answering...</p>;
    }
    return (
      <ReactMarkdown rehypePlugins={[[rehypeHighlight, { detect: true }]]}>
        {answerText}
      </ReactMarkdown>
    );
  };

  if (answer) {
    return (
      <div className="markdown-body gpt-markdown" id="gpt-answer" dir="auto">
        <div className="gpt-header">
          <span className="font-bold">arXivGPT</span>
          <span className="cursor-pointer leading-[0]" onClick={openOptionsPage}>
            <GearIcon size={14} />
          </span>
          <span className="mx-2 text-base text-gray-500">{`"${props.promptSource}" prompt is used`}</span>
          <ChatGPTFeedback
            messageId={answer.messageId}
            conversationId={answer.conversationId}
            answerText={answer.text}
          />
        </div>
        <ReactMarkdown rehypePlugins={[[rehypeHighlight, { detect: true }]]}>
          {answer.text}
        </ReactMarkdown>
        <div className="question-container">
          {requestionList.map((requestion) => (
            <div key={requestion.index}>
              <div className="font-bold">{`Q${requestion.index + 1} : ${
                requestion.requestion
              }`}</div>
              {reError ? (
                <p>
                  Failed to load response from ChatGPT:
                  <span className="break-all block">{reError}</span>
                </p>
              ) : (
                (requestion.index < requestionList.length - 1) ?
                (<ReQuestionAnswerFixed text={requestion.answer?.text} />)
                :(<ReQuestionAnswer answerText={reQuestionAnswerText} />)
              )}
            </div>
          ))}
        </div>

        {done && (
          <form
            id="requestion"
            style={{ display: 'flex' }}
            onSubmit={(e) => {
              // submit when press enter key
              e.preventDefault()
            }}
          >
            <input
              disabled={!reQuestionDone}
              type="text"
              ref={inputRef}
              placeholder="Ask Me Anything"
              id="question"
              style={{ width: '100%', padding: '1rem' }}
            />
            <button
              id="submit"
              onClick={requeryHandler}
              style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '0.2rem' }}
            >
              ASK
            </button>
          </form>
        )}
      </div>
    )
  }

  if (error === 'UNAUTHORIZED' || error === 'CLOUDFLARE') {
    return (
      <p>
        Please login and pass Cloudflare check at{' '}
        <a href="https://chat.openai.com" target="_blank" rel="noreferrer">
          chat.openai.com
        </a>
        {retry > 0 &&
          (() => {
            if (isBraveBrowser()) {
              return (
                <span className="block mt-2">
                  Still not working? Follow{' '}
                  <a href="https://github.com/wong2/chat-gpt-google-extension#troubleshooting">
                    Brave Troubleshooting
                  </a>
                </span>
              )
            } else {
              return (
                <span className="italic block mt-2 text-xs">
                  OpenAI requires passing a security check every once in a while. If this keeps
                  happening, change AI provider to OpenAI API in the extension options.
                </span>
              )
            }
          })()}
      </p>
    )
  }
  if (error) {
    return (
      <p>
        Failed to load response from ChatGPT:
        <span className="break-all block">{error}</span>
      </p>
    )
  }

  return <p className="text-[#b6b8ba] animate-pulse">Waiting for ChatGPT summarize...</p>
}

export default memo(ChatGPTQuery)
