import { useEffect, useRef, useState } from 'react';
import { Check, X, ExternalLink, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TaskCard({
  task,
  completeTask,
  deleteTask,
  members = [],
  onAssign,
}) {
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!isAssignOpen) return
    const handler = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsAssignOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isAssignOpen])

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

  const assignedMember = members.find((m) => m.user_id === task.assigned_to_user_id)
  const assigneeLabel = assignedMember?.name || (task.assignee && task.assignee !== 'None' ? task.assignee : null)

  return (
    <div
      className="group relative rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-150 hover:border-white/15 hover:bg-white/[0.05]"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        opacity: isDone ? 0.6 : 1,
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
            {assigneeLabel ? (
              <div className="relative" ref={wrapperRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onAssign) setIsAssignOpen((open) => !open)
                  }}
                  className="bg-[#8b5cf6]/20 text-[#8b5cf6] text-[10px] font-medium px-2 py-0.5 rounded-full border border-[#8b5cf6]/30 flex items-center gap-1 hover:bg-[#8b5cf6]/30 transition-colors"
                >
                  <span className="w-3 h-3 rounded-full bg-[#8b5cf6]/40 flex items-center justify-center text-[8px] text-white">
                    {assigneeLabel.charAt(0).toUpperCase()}
                  </span>
                  {assigneeLabel}
                </button>
                {isAssignOpen && onAssign && (
                  <AssignMenu
                    members={members}
                    currentAssigneeId={task.assigned_to_user_id}
                    onPick={async (userId) => {
                      setIsAssignOpen(false)
                      await onAssign(task.id, userId)
                    }}
                  />
                )}
              </div>
            ) : (
              onAssign && (
                <div className="relative" ref={wrapperRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsAssignOpen((open) => !open)
                    }}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-dashed border-[#2E2E4E] text-gray-500 flex items-center gap-1 hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
                  >
                    <UserPlus className="w-3 h-3" />
                    Assign
                  </button>
                  {isAssignOpen && (
                    <AssignMenu
                      members={members}
                      currentAssigneeId={task.assigned_to_user_id}
                      onPick={async (userId) => {
                        setIsAssignOpen(false)
                        await onAssign(task.id, userId)
                      }}
                    />
                  )}
                </div>
              )
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

function AssignMenu({ members, currentAssigneeId, onPick }) {
  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#11111E] py-1 shadow-2xl">
      <button
        type="button"
        onClick={() => onPick(null)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${
          currentAssigneeId == null
            ? 'bg-white/[0.08] text-white'
            : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
        }`}
      >
        Unassigned
      </button>
      {members.length === 0 ? (
        <p className="px-3 py-2 text-xs text-gray-500">
          No teammates yet. Add some from the Team menu.
        </p>
      ) : (
        members.map((member) => (
          <button
            key={member.user_id}
            type="button"
            onClick={() => onPick(member.user_id)}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${
              currentAssigneeId === member.user_id
                ? 'bg-white/[0.08] text-white'
                : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] text-[10px] font-bold text-white">
              {member.name.charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{member.name}</span>
            {member.role === 'OWNER' && (
              <span className="ml-auto text-[9px] uppercase tracking-wide text-[#C4B5FD]">
                Owner
              </span>
            )}
          </button>
        ))
      )}
    </div>
  )
}
