import { Send } from 'lucide-react';

export default function ChatInput({ inputValue, setInputValue, sendMessage, isLoading }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) {
        sendMessage(inputValue);
      }
    }
  };

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
    }
  };

  const isDisabled = isLoading || !inputValue.trim();

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#1E1E35',
        borderTop: '1px solid #2A2A4A'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          border: '1px solid #2A2A4A',
          borderRadius: '12px',
          backgroundColor: '#16162A',
          padding: '8px 12px'
        }}
      >
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Tell me what you're working on..."
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'white',
            fontSize: '14px',
            resize: 'none',
            minHeight: '24px',
            maxHeight: '120px',
            fontFamily: 'inherit',
            lineHeight: '1.5'
          }}
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={isDisabled}
          style={{
            backgroundColor: '#7C5CBF',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isDisabled ? 0.5 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          <Send size={18} color="white" />
        </button>
      </div>
    </div>
  );
}
