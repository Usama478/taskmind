import { useEffect, useRef } from 'react'
import AIMessage from './AIMessage'
import UserMessage from './UserMessage'
import TypingIndicator from './TypingIndicator'

export default function MessageList({ messages, isLoading }) {
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isLoading])

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
      {messages.map((message, index) =>
        message.role === 'assistant' ? (
          <AIMessage key={message.id ?? index} message={message} />
        ) : (
          <UserMessage key={message.id ?? index} message={message} />
        ),
      )}
      {isLoading && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  )
}
