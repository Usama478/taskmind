import { Sparkles } from 'lucide-react'

export default function TypingIndicator() {
  return (
    <>
      <style>{`
        @keyframes tm-pulse {
          0%, 100% { opacity: 0.3; transform: translateY(0px); }
          50% { opacity: 1; transform: translateY(-2px); }
        }
        .tm-dot-1 { animation: tm-pulse 1.2s infinite; }
        .tm-dot-2 { animation: tm-pulse 1.2s infinite 0.15s; }
        .tm-dot-3 { animation: tm-pulse 1.2s infinite 0.3s; }
      `}</style>
      <div className="mb-4 flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] shadow-md shadow-[#7C5CBF]/30">
          <Sparkles size={13} className="text-white" />
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-white/[0.06] bg-[#1B1530] px-4 py-3">
          <span className="tm-dot-1 h-2 w-2 rounded-full bg-[#C4B5FD]" />
          <span className="tm-dot-2 h-2 w-2 rounded-full bg-[#C4B5FD]" />
          <span className="tm-dot-3 h-2 w-2 rounded-full bg-[#C4B5FD]" />
        </div>
      </div>
    </>
  )
}
