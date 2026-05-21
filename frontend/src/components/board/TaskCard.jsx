import { Check, X, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TaskCard({ task, completeTask, deleteTask }) {
  const getPriorityColor = (priority, status) => {
    if (status === 'DONE') return '#6B7280';
    switch (priority) {
      case 'HIGH': return '#EF4444';
      case 'MEDIUM': return '#F59E0B';
      case 'LOW': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    deadlineDate.setHours(0, 0, 0, 0);

    const msPerDay = 24 * 60 * 60 * 1000;
    const daysUntil = Math.round((deadlineDate - today) / msPerDay);

    if (daysUntil < 0) {
      return <span className="text-red-500 text-xs">Overdue</span>;
    }
    if (daysUntil === 0) {
      return <span className="text-red-500 text-xs">Today</span>;
    }
    if (daysUntil === 1) {
      return <span className="text-amber-500 text-xs">Tomorrow</span>;
    }
    if (daysUntil >= 2 && daysUntil <= 7) {
      return <span className="text-gray-500 text-xs">In {daysUntil} days</span>;
    }
    return (
      <span className="text-gray-500 text-xs">
        Due: {deadlineDate.toLocaleDateString()}
      </span>
    );
  };

  const getTimeAgo = (createdAt) => {
    if (!createdAt) return '';
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const borderColor = getPriorityColor(task.priority, task.status);
  const isDone = task.status === 'DONE';

  return (
    <div
      className="group relative rounded-lg p-4 transition-all duration-150 hover:bg-[#2E2E4E]"
      style={{
        backgroundColor: '#252540',
        borderLeft: `3px solid ${borderColor}`,
        opacity: isDone ? 0.6 : 1
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={`text-white font-semibold text-sm mb-2 ${isDone ? 'line-through' : ''}`}>
            {task.title}
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {task.category && task.category !== 'General' && (
              <span className="bg-[#3b82f6]/20 text-[#3b82f6] text-[10px] font-medium px-2 py-0.5 rounded-full border border-[#3b82f6]/30">
                {task.category}
              </span>
            )}
            {task.assignee && task.assignee !== 'None' && (
              <span className="bg-[#8b5cf6]/20 text-[#8b5cf6] text-[10px] font-medium px-2 py-0.5 rounded-full border border-[#8b5cf6]/30 flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#8b5cf6]/40 flex items-center justify-center text-[8px] text-white">
                  {task.assignee.charAt(0).toUpperCase()}
                </span>
                {task.assignee}
              </span>
            )}
            {task.asset_link && (
              <a
                href={task.asset_link.startsWith('http') ? task.asset_link : `https://${task.asset_link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#10b981]/20 text-[#10b981] text-[10px] font-medium px-2 py-0.5 rounded-full border border-[#10b981]/30 flex items-center gap-1 hover:bg-[#10b981]/30 transition-colors"
                onClick={(e) => e.stopPropagation()}
                title={task.asset_link}
              >
                <ExternalLink className="w-3 h-3" />
                Asset
              </a>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs">
            {formatDeadline(task.deadline)}
            {task.created_at && (
              <span className="text-gray-500">
                {getTimeAgo(task.created_at)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-30 group-hover:opacity-100 transition-opacity duration-150">
          {!isDone && (
            <button
              onClick={() => completeTask(task.id)}
              className="p-1.5 rounded hover:bg-green-500/20 transition-colors"
              title="Complete task"
            >
              <Check className="w-4 h-4 text-green-500" />
            </button>
          )}
          <button
            onClick={() => deleteTask(task.id)}
            className="p-1.5 rounded hover:bg-red-500/20 transition-colors"
            title="Delete task"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
