export default function TypingIndicator() {
  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .dot-1 { animation: pulse 1.4s infinite; }
        .dot-2 { animation: pulse 1.4s infinite 0.2s; }
        .dot-3 { animation: pulse 1.4s infinite 0.4s; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
        <div style={{ fontSize: '20px', marginTop: '4px' }}>⚡</div>
        <div
          style={{
            backgroundColor: '#2A1F45',
            borderRadius: '12px 12px 12px 0',
            padding: '12px 16px',
            display: 'flex',
            gap: '6px',
            alignItems: 'center'
          }}
        >
          <div
            className="dot-1"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#7C5CBF'
            }}
          />
          <div
            className="dot-2"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#7C5CBF'
            }}
          />
          <div
            className="dot-3"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#7C5CBF'
            }}
          />
        </div>
      </div>
    </>
  );
}
