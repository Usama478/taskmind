export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
      <div className="text-6xl mb-4">📝</div>
      <h2 className="text-white text-lg font-semibold mb-2">No tasks yet</h2>
      <p className="text-gray-500 text-sm mb-4">Tell me what you're working on!</p>
      <div className="text-2xl animate-bounce">←</div>
    </div>
  );
}
