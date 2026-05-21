export default function UserMessage({ message }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '80%' }}>
        <div
          style={{
            backgroundColor: '#2F3542',
            color: 'white',
            borderRadius: '12px 12px 0 12px',
            padding: '12px 16px',
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {message.content}
        </div>
        <div style={{ color: '#64648A', fontSize: '11px', marginTop: '4px', marginRight: '4px' }}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
