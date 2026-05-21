export default function AIMessage({ message }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
      <div style={{ fontSize: '20px', marginTop: '4px' }}>⚡</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '80%' }}>
        <div
          style={{
            backgroundColor: '#2A1F45',
            color: 'white',
            borderRadius: '12px 12px 12px 0',
            padding: '12px 16px',
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {message.content}
        </div>
        <div style={{ color: '#64648A', fontSize: '11px', marginTop: '4px', marginLeft: '4px' }}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
