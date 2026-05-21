import TaskCard from './TaskCard';

export default function PrioritySection({ title, color, tasks, completeTask, deleteTask }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h2
          className="text-xs uppercase tracking-wide font-semibold"
          style={{ color }}
        >
          {title}
        </h2>
      </div>
      
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            completeTask={completeTask}
            deleteTask={deleteTask}
          />
        ))}
      </div>
    </div>
  );
}
