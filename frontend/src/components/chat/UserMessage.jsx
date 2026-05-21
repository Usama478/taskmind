export default function UserMessage({ message }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  return (
    <div className="mb-4 flex justify-end">
      <div className="flex max-w-[85%] flex-col items-end">
        <div className="whitespace-pre-wrap break-words rounded-2xl rounded-tr-md bg-gradient-to-br from-[#7C5CBF] to-[#5B3FBE] px-4 py-3 text-[14px] leading-6 text-white shadow-md shadow-[#7C5CBF]/20">
          {message.content}
        </div>
        <div className="mr-1 mt-1 text-[11px] text-gray-500">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  )
}
