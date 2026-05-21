import MessageList from './MessageList';
import ChatInput from './ChatInput';

export default function ChatPanel({ messages, isLoading, inputValue, setInputValue, sendMessage }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#16162A'
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #2A2A4A'
        }}
      >
        <h3
          style={{
            margin: 0,
            color: 'white',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: '600'
          }}
        >
          💬 AI Assistant
        </h3>
      </div>
      
      <MessageList messages={messages} isLoading={isLoading} />
      
      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        sendMessage={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
