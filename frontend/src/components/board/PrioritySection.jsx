import TaskCard from './TaskCard'

export default function PrioritySection({
  title,
  color,
  tasks,
  completeTask,
  deleteTask,
  members = [],
  onAssign,
}) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
        <h2
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color }}
        >
          {title}
        </h2>
        <span className="text-[11px] text-gray-500">{tasks.length}</span>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            completeTask={completeTask}
            deleteTask={deleteTask}
            members={members}
            onAssign={onAssign}
          />
        ))}
      </div>
    </div>
  )
}
