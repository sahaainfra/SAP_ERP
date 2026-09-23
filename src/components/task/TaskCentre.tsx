/**
 * Part 24 — Task Centre Component
 * 
 * Unified task management interface with four views:
 * 1. List - Grouped by due date (Overdue, Today, This Week, Later, No Due Date)
 * 2. Board - Kanban by status (drag to change)
 * 3. Calendar - By due date
 * 4. Timeline - Gantt-style for dependent tasks
 * 
 * Supports all seven task sources and TASK-01 through TASK-04 business rules.
 */

import React, { useState, useEffect } from 'react';
import {
  Task,
  TaskView,
  TaskStatus,
  TaskPriority,
  TaskFilters,
  CompleteTaskRequest,
  ReassignTaskRequest,
} from '../../platform/task/types';
import { taskService } from '../../platform/task/task-service';
import { Actor } from '../../platform/permission/actor';

interface TaskCentreProps {
  actor: Actor;
}

export const TaskCentre: React.FC<TaskCentreProps> = ({ actor }) => {
  const [view, setView] = useState<TaskView>('list');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [actor, filters]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getTasks(actor, filters);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId: number) => {
    try {
      await taskService.startTask(taskId, actor);
      await loadTasks();
    } catch (error) {
      console.error('Failed to start task:', error);
      alert(error instanceof Error ? error.message : 'Failed to start task');
    }
  };

  const handleCompleteTask = async (taskId: number, request: CompleteTaskRequest) => {
    try {
      await taskService.completeTask(taskId, request, actor);
      setShowCompleteDialog(false);
      setSelectedTask(null);
      await loadTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert(error instanceof Error ? error.message : 'Failed to complete task');
    }
  };

  const handleBlockTask = async (taskId: number, reason: string) => {
    try {
      await taskService.blockTask(taskId, reason, actor);
      setShowBlockDialog(false);
      await loadTasks();
    } catch (error) {
      console.error('Failed to block task:', error);
      alert(error instanceof Error ? error.message : 'Failed to block task');
    }
  };

  const handleReassignTask = async (taskId: number, request: ReassignTaskRequest) => {
    try {
      await taskService.reassignTask(taskId, request, actor);
      setShowReassignDialog(false);
      await loadTasks();
    } catch (error) {
      console.error('Failed to reassign task:', error);
      alert(error instanceof Error ? error.message : 'Failed to reassign task');
    }
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'CRITICAL': return 'var(--sapNegativeColor, #bb0000)';
      case 'HIGH': return 'var(--sapCriticalColor, #e9730c)';
      case 'MEDIUM': return 'var(--sapNeutralColor, #6a6d70)';
      case 'LOW': return 'var(--sapPositiveColor, #107e3e)';
      default: return 'var(--sapNeutralColor, #6a6d70)';
    }
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'OPEN': return 'var(--sapInformativeColor, #0a6ed1)';
      case 'IN_PROGRESS': return 'var(--sapCriticalColor, #e9730c)';
      case 'BLOCKED': return 'var(--sapNegativeColor, #bb0000)';
      case 'COMPLETED': return 'var(--sapPositiveColor, #107e3e)';
      case 'CANCELLED': return 'var(--sapNeutralColor, #6a6d70)';
      default: return 'var(--sapNeutralColor, #6a6d70)';
    }
  };

  const formatDueDate = (dueAt?: string): string => {
    if (!dueAt) return 'No due date';
    
    const now = new Date();
    const due = new Date(dueAt);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 7) return `Due in ${diffDays} days`;
    if (diffDays < 30) return `Due in ${Math.floor(diffDays / 7)} weeks`;
    return `Due ${due.toLocaleDateString()}`;
  };

  const getTaskTypeIcon = (taskType: string): string => {
    switch (taskType) {
      case 'MANUAL': return '✏️';
      case 'SYSTEM': return '⚙️';
      case 'WORKFLOW': return '🔄';
      case 'ALERT': return '⚠️';
      case 'CHAT': return '💬';
      case 'RECURRING': return '🔁';
      case 'CHECKLIST': return '☑️';
      default: return '📋';
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  const renderListView = () => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const groups = [
      {
        label: 'Overdue',
        tasks: tasks.filter(t => t.dueAt && new Date(t.dueAt) < today && t.status !== 'COMPLETED'),
      },
      {
        label: 'Today',
        tasks: tasks.filter(t => {
          if (!t.dueAt || t.status === 'COMPLETED') return false;
          const due = new Date(t.dueAt);
          return due >= today && due < tomorrow;
        }),
      },
      {
        label: 'This Week',
        tasks: tasks.filter(t => {
          if (!t.dueAt || t.status === 'COMPLETED') return false;
          const due = new Date(t.dueAt);
          return due >= tomorrow && due < nextWeek;
        }),
      },
      {
        label: 'Later',
        tasks: tasks.filter(t => {
          if (!t.dueAt || t.status === 'COMPLETED') return false;
          const due = new Date(t.dueAt);
          return due >= nextWeek;
        }),
      },
      {
        label: 'No Due Date',
        tasks: tasks.filter(t => !t.dueAt && t.status !== 'COMPLETED'),
      },
    ];

    return (
      <div className="task-list-view">
        {groups.map((group, idx) => (
          group.tasks.length > 0 && (
            <div key={idx} className="task-group">
              <h3 className="group-header">{group.label} ({group.tasks.length})</h3>
              <div className="task-cards">
                {group.tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                    formatDueDate={formatDueDate}
                    getTaskTypeIcon={getTaskTypeIcon}
                  />
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // BOARD VIEW (Kanban)
  // ═══════════════════════════════════════════════════════════════════════════

  const renderBoardView = () => {
    const columns: TaskStatus[] = ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];
    
    return (
      <div className="task-board-view">
        {columns.map(status => {
          const columnTasks = tasks.filter(t => t.status === status);
          return (
            <div key={status} className="board-column">
              <div className="column-header" style={{ borderLeftColor: getStatusColor(status) }}>
                <h3>{status.replace('_', ' ')} ({columnTasks.length})</h3>
              </div>
              <div className="column-tasks">
                {columnTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                    formatDueDate={formatDueDate}
                    getTaskTypeIcon={getTaskTypeIcon}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CALENDAR VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  const renderCalendarView = () => {
    // Group tasks by due date
    const tasksByDate: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (task.dueAt) {
        const dateKey = new Date(task.dueAt).toISOString().split('T')[0];
        if (!tasksByDate[dateKey]) {
          tasksByDate[dateKey] = [];
        }
        tasksByDate[dateKey].push(task);
      }
    });

    // Generate calendar for current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return (
      <div className="task-calendar-view">
        <div className="calendar-header">
          <h2>{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        </div>
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
            {days.map((day, idx) => {
              if (!day) {
                return <div key={idx} className="calendar-day empty"></div>;
              }
              const dateKey = day.toISOString().split('T')[0];
              const dayTasks = tasksByDate[dateKey] || [];
              const isToday = day.toDateString() === now.toDateString();

              return (
                <div key={idx} className={`calendar-day ${isToday ? 'today' : ''}`}>
                  <div className="day-number">{day.getDate()}</div>
                  <div className="day-tasks">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        className="day-task"
                        style={{ borderLeftColor: getPriorityColor(task.priority) }}
                        onClick={() => setSelectedTask(task)}
                      >
                        {task.title.substring(0, 20)}...
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="day-task-more">+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMELINE VIEW (Gantt-style)
  // ═══════════════════════════════════════════════════════════════════════════

  const renderTimelineView = () => {
    // For now, render a simplified timeline
    // In production, would use a Gantt chart library
    const sortedTasks = [...tasks]
      .filter(t => t.dueAt)
      .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime());

    return (
      <div className="task-timeline-view">
        <div className="timeline-header">
          <h2>Task Timeline</h2>
        </div>
        <div className="timeline-tasks">
          {sortedTasks.map(task => {
            const dueDate = new Date(task.dueAt!);
            const createdDate = new Date(task.createdAt);
            const totalDays = (dueDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
            const elapsedDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
            const progress = Math.min(100, (elapsedDays / totalDays) * 100);

            return (
              <div key={task.id} className="timeline-task" onClick={() => setSelectedTask(task)}>
                <div className="task-info">
                  <span className="task-title">{task.title}</span>
                  <span className="task-due">{formatDueDate(task.dueAt)}</span>
                </div>
                <div className="task-bar">
                  <div
                    className="task-progress"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: getStatusColor(task.status),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK CARD COMPONENT
  // ═══════════════════════════════════════════════════════════════════════════

  const TaskCard: React.FC<{
    task: Task;
    onClick: () => void;
    getPriorityColor: (priority: TaskPriority) => string;
    getStatusColor: (status: TaskStatus) => string;
    formatDueDate: (dueAt?: string) => string;
    getTaskTypeIcon: (taskType: string) => string;
  }> = ({ task, onClick, getPriorityColor, getStatusColor, formatDueDate, getTaskTypeIcon }) => (
    <div className="task-card" onClick={onClick}>
      <div className="task-card-header">
        <span className="task-type-icon">{getTaskTypeIcon(task.taskType)}</span>
        <span className="task-number">{task.taskNumber}</span>
        <span className="task-priority" style={{ color: getPriorityColor(task.priority) }}>
          {task.priority}
        </span>
      </div>
      <div className="task-card-title">{task.title}</div>
      <div className="task-card-meta">
        <span className="task-status" style={{ color: getStatusColor(task.status) }}>
          {task.status}
        </span>
        <span className="task-due">{formatDueDate(task.dueAt)}</span>
      </div>
      {task.progressPercent > 0 && (
        <div className="task-progress-bar">
          <div
            className="task-progress-fill"
            style={{ width: `${task.progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="task-centre">
      {/* Header */}
      <div className="task-centre-header">
        <h1>Task Centre</h1>
        <div className="view-switcher">
          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            📋 List
          </button>
          <button
            className={view === 'board' ? 'active' : ''}
            onClick={() => setView('board')}
          >
            📊 Board
          </button>
          <button
            className={view === 'calendar' ? 'active' : ''}
            onClick={() => setView('calendar')}
          >
            📅 Calendar
          </button>
          <button
            className={view === 'timeline' ? 'active' : ''}
            onClick={() => setView('timeline')}
          >
            📈 Timeline
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="task-filters">
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as TaskStatus || undefined })}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="BLOCKED">Blocked</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={filters.priority || ''}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value as TaskPriority || undefined })}
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={filters.taskType || ''}
          onChange={(e) => setFilters({ ...filters, taskType: e.target.value as any || undefined })}
        >
          <option value="">All Types</option>
          <option value="MANUAL">Manual</option>
          <option value="SYSTEM">System</option>
          <option value="WORKFLOW">Workflow</option>
          <option value="ALERT">Alert</option>
          <option value="CHAT">Chat</option>
          <option value="RECURRING">Recurring</option>
          <option value="CHECKLIST">Checklist</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : (
        <>
          {view === 'list' && renderListView()}
          {view === 'board' && renderBoardView()}
          {view === 'calendar' && renderCalendarView()}
          {view === 'timeline' && renderTimelineView()}
        </>
      )}

      {/* Task Detail Dialog */}
      {selectedTask && (
        <div className="dialog-overlay" onClick={() => setSelectedTask(null)}>
          <div className="dialog task-detail-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>{selectedTask.taskNumber}</h2>
              <button onClick={() => setSelectedTask(null)}>×</button>
            </div>
            <div className="dialog-content">
              <div className="task-detail-title">{selectedTask.title}</div>
              {selectedTask.description && (
                <div className="task-detail-description">{selectedTask.description}</div>
              )}
              <div className="task-detail-meta">
                <div><strong>Type:</strong> {selectedTask.taskType}</div>
                <div><strong>Priority:</strong> {selectedTask.priority}</div>
                <div><strong>Status:</strong> {selectedTask.status}</div>
                <div><strong>Due:</strong> {formatDueDate(selectedTask.dueAt)}</div>
                <div><strong>Assigned to:</strong> User {selectedTask.assignedTo}</div>
                {selectedTask.progressPercent > 0 && (
                  <div><strong>Progress:</strong> {selectedTask.progressPercent}%</div>
                )}
              </div>
              <div className="task-detail-actions">
                {selectedTask.status === 'OPEN' && (
                  <button onClick={() => handleStartTask(selectedTask.id)}>Start</button>
                )}
                {selectedTask.status !== 'COMPLETED' && selectedTask.status !== 'CANCELLED' && (
                  <>
                    <button onClick={() => setShowCompleteDialog(true)}>Complete</button>
                    <button onClick={() => setShowBlockDialog(true)}>Block</button>
                    <button onClick={() => setShowReassignDialog(true)}>Reassign</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Dialog */}
      {showCompleteDialog && selectedTask && (
        <CompleteTaskDialog
          task={selectedTask}
          onComplete={(request) => handleCompleteTask(selectedTask.id, request)}
          onClose={() => setShowCompleteDialog(false)}
        />
      )}

      {/* Block Dialog */}
      {showBlockDialog && selectedTask && (
        <BlockTaskDialog
          task={selectedTask}
          onBlock={(reason) => handleBlockTask(selectedTask.id, reason)}
          onClose={() => setShowBlockDialog(false)}
        />
      )}

      {/* Reassign Dialog */}
      {showReassignDialog && selectedTask && (
        <ReassignTaskDialog
          task={selectedTask}
          onReassign={(request) => handleReassignTask(selectedTask.id, request)}
          onClose={() => setShowReassignDialog(false)}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DIALOG COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const CompleteTaskDialog: React.FC<{
  task: Task;
  onComplete: (request: CompleteTaskRequest) => void;
  onClose: () => void;
}> = ({ task, onComplete, onClose }) => {
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    onComplete({ completionNote: note });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Complete Task</h3>
        <div className="dialog-content">
          <p>Task: {task.title}</p>
          {task.resolutionRequires?.type === 'text' && (
            <>
              <label>
                Completion Note {task.resolutionRequires.minLength && `(min ${task.resolutionRequires.minLength} chars)`}:
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Explain how the task was completed"
              />
            </>
          )}
        </div>
        <div className="dialog-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSubmit}>Complete</button>
        </div>
      </div>
    </div>
  );
};

const BlockTaskDialog: React.FC<{
  task: Task;
  onBlock: (reason: string) => void;
  onClose: () => void;
}> = ({ task, onBlock, onClose }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onBlock(reason);
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Block Task</h3>
        <div className="dialog-content">
          <p>Task: {task.title}</p>
          <label>
            Reason (required):
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Explain why the task is blocked"
          />
        </div>
        <div className="dialog-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSubmit} disabled={!reason.trim()}>Block</button>
        </div>
      </div>
    </div>
  );
};

const ReassignTaskDialog: React.FC<{
  task: Task;
  onReassign: (request: ReassignTaskRequest) => void;
  onClose: () => void;
}> = ({ task, onReassign, onClose }) => {
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onReassign({
      newAssigneeId: parseInt(newAssigneeId),
      reason,
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Reassign Task</h3>
        <div className="dialog-content">
          <p>Task: {task.title}</p>
          <label>
            New Assignee (User ID):
          </label>
          <input
            type="number"
            value={newAssigneeId}
            onChange={(e) => setNewAssigneeId(e.target.value)}
            placeholder="Enter user ID"
          />
          <label>
            Reason (required):
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Explain why the task is being reassigned"
          />
        </div>
        <div className="dialog-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="primary"
            onClick={handleSubmit}
            disabled={!newAssigneeId || !reason.trim()}
          >
            Reassign
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCentre;
