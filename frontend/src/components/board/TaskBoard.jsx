import PrioritySection from './PrioritySection';
import ProgressBar from './ProgressBar';
import EmptyState from './EmptyState';

export default function TaskBoard({ tasks, completeTask, deleteTask }) {
  const highTasks = tasks.filter(t => t.priority === 'HIGH' && t.status !== 'DONE');
  const mediumTasks = tasks.filter(t => t.priority === 'MEDIUM' && t.status !== 'DONE');
  const lowTasks = tasks.filter(t => t.priority === 'LOW' && t.status !== 'DONE');
  const doneTasks = tasks.filter(t => t.status === 'DONE');

  const hasAnyTasks = highTasks.length > 0 || mediumTasks.length > 0 || 
                      lowTasks.length > 0 || doneTasks.length > 0;

  return (
    <div className="h-full overflow-y-auto bg-[#1A1A2E] p-5">
      <div className="mb-6">
        <h1 className="text-white text-xl font-bold">📋 Task Board</h1>
      </div>

      {!hasAnyTasks ? (
        <EmptyState />
      ) : (
        <>
          {highTasks.length > 0 && (
            <PrioritySection
              title="High Priority"
              color="#EF4444"
              tasks={highTasks}
              completeTask={completeTask}
              deleteTask={deleteTask}
            />
          )}

          {mediumTasks.length > 0 && (
            <PrioritySection
              title="Medium Priority"
              color="#F59E0B"
              tasks={mediumTasks}
              completeTask={completeTask}
              deleteTask={deleteTask}
            />
          )}

          {lowTasks.length > 0 && (
            <PrioritySection
              title="Low Priority"
              color="#10B981"
              tasks={lowTasks}
              completeTask={completeTask}
              deleteTask={deleteTask}
            />
          )}

          {doneTasks.length > 0 && (
            <PrioritySection
              title="Completed"
              color="#6B7280"
              tasks={doneTasks}
              completeTask={completeTask}
              deleteTask={deleteTask}
            />
          )}

          <ProgressBar tasks={tasks} />
        </>
      )}
    </div>
  );
}
