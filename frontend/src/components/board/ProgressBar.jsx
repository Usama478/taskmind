export default function ProgressBar({ tasks }) {
  const completed = tasks.filter(t => t.status === 'DONE').length;
  const total = tasks.length;
  const percentage = total === 0 ? 0 : (completed / total) * 100;
  
  const isAllDone = completed === total && total > 0;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm ${isAllDone ? 'text-green-500' : 'text-gray-500'}`}>
          {isAllDone ? 'All done! 🎉' : `${completed} of ${total} tasks completed`}
        </span>
      </div>
      
      <div className="w-full h-1.5 bg-[#2E2E4E] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#7C5CBF] transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
