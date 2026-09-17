/**
 * Task Centre Component - Part 7
 * 
 * Comprehensive task management interface with multiple views
 */

import { useState } from 'react';
import { 
  Plus, Filter, Calendar, List, LayoutGrid, Clock, 
  CheckCircle2, Circle, AlertCircle, Play, Pause,
  MessageSquare, Paperclip, MoreVertical, User,
  ChevronRight, Flag
} from 'lucide-react';
import { tasks } from '../data/workflowData';
import type { Task, TaskStatus, TaskPriority, TaskView } from '../types/workflow';
import { formatDate } from '../utils/formatting';
import { StatusChip, PriorityIndicator, Avatar } from './SupportingComponents';

export default function TaskCentre() {
  const [currentView, setCurrentView] = useState<TaskView>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus[]>([]);
  const [filterPriority, setFilterPriority] = useState<TaskPriority[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterStatus.length > 0 && !filterStatus.includes(task.status)) return false;
    if (filterPriority.length > 0 && !filterPriority.includes(task.priority)) return false;
    return true;
  });

  // Group tasks by due date for list view
  const groupedTasks = {
    overdue: filteredTasks.filter(t => t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'completed'),
    today: filteredTasks.filter(t => {
      if (!t.dueAt) return false;
      const due = new Date(t.dueAt);
      const today = new Date();
      return due.toDateString() === today.toDateString();
    }),
    thisWeek: filteredTasks.filter(t => {
      if (!t.dueAt) return false;
      const due = new Date(t.dueAt);
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      return due > today && due <= weekEnd;
    }),
    later: filteredTasks.filter(t => {
      if (!t.dueAt) return false;
      const due = new Date(t.dueAt);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      return due > weekEnd;
    }),
    noDueDate: filteredTasks.filter(t => !t.dueAt)
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
    console.log('Changing task status:', taskId, newStatus);
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return `Due in ${Math.ceil(diffDays / 7)} weeks`;
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} style={{ color: 'var(--sapPositiveColor)' }} />;
      case 'in_progress': return <Play size={16} style={{ color: 'var(--sapInformativeColor)' }} />;
      case 'blocked': return <Pause size={16} style={{ color: 'var(--sapNegativeColor)' }} />;
      default: return <Circle size={16} style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
          Task Centre
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{
            background: 'var(--sapButton_Emphasized_Background)',
            color: 'var(--sapButton_Emphasized_TextColor)'
          }}
        >
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* View Switcher and Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
          {[
            { key: 'list', label: 'List', icon: List },
            { key: 'board', label: 'Board', icon: LayoutGrid },
            { key: 'calendar', label: 'Calendar', icon: Calendar },
            { key: 'timeline', label: 'Timeline', icon: Clock }
          ].map(view => {
            const Icon = view.icon;
            return (
              <button
                key={view.key}
                onClick={() => setCurrentView(view.key as TaskView)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentView === view.key ? 'bg-[var(--sapSelectedColor)] text-white' : ''
                }`}
                style={{
                  color: currentView === view.key ? 'white' : 'var(--sapContent_LabelColor)'
                }}
              >
                <Icon size={16} />
                {view.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <select
            multiple
            value={filterStatus}
            onChange={(e) => setFilterStatus(Array.from(e.target.selectedOptions, o => o.value as TaskStatus))}
            className="text-sm px-3 py-1.5 rounded border"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)'
            }}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
          <select
            multiple
            value={filterPriority}
            onChange={(e) => setFilterPriority(Array.from(e.target.selectedOptions, o => o.value as TaskPriority))}
            className="text-sm px-3 py-1.5 rounded border"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)'
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Task List */}
        <div className="flex-1 sap-card overflow-y-auto">
          {currentView === 'list' && (
            <div className="p-4">
              {/* Overdue */}
              {groupedTasks.overdue.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--sapNegativeTextColor)' }}>
                    <AlertCircle size={16} />
                    Overdue ({groupedTasks.overdue.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.overdue.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        isSelected={selectedTask?.id === task.id}
                        getRelativeTime={getRelativeTime}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Today */}
              {groupedTasks.today.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                    Today ({groupedTasks.today.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.today.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        isSelected={selectedTask?.id === task.id}
                        getRelativeTime={getRelativeTime}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* This Week */}
              {groupedTasks.thisWeek.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                    This Week ({groupedTasks.thisWeek.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.thisWeek.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        isSelected={selectedTask?.id === task.id}
                        getRelativeTime={getRelativeTime}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Later */}
              {groupedTasks.later.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Later ({groupedTasks.later.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.later.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        isSelected={selectedTask?.id === task.id}
                        getRelativeTime={getRelativeTime}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No Due Date */}
              {groupedTasks.noDueDate.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    No Due Date ({groupedTasks.noDueDate.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.noDueDate.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        isSelected={selectedTask?.id === task.id}
                        getRelativeTime={getRelativeTime}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentView === 'board' && (
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4">
                {['open', 'in_progress', 'blocked', 'completed'].map(status => (
                  <div key={status} className="sap-card p-3">
                    <h3 className="text-sm font-semibold mb-3 capitalize flex items-center gap-2" style={{ color: 'var(--sapTextColor)' }}>
                      {getStatusIcon(status as TaskStatus)}
                      {status.replace('_', ' ')} ({filteredTasks.filter(t => t.status === status).length})
                    </h3>
                    <div className="space-y-2">
                      {filteredTasks.filter(t => t.status === status).map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={() => handleTaskClick(task)}
                          isSelected={selectedTask?.id === task.id}
                          getRelativeTime={getRelativeTime}
                          getStatusIcon={getStatusIcon}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Task Detail */}
        {selectedTask && (
          <div className="w-96 sap-card overflow-y-auto">
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(selectedTask.status)}
                    <span className="text-xs font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {selectedTask.taskNumber}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    {selectedTask.title}
                  </h2>
                  {selectedTask.description && (
                    <p className="text-sm mb-4" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {selectedTask.description}
                    </p>
                  )}
                </div>
                <button className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]">
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Task Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Status</span>
                  <StatusChip status={selectedTask.status} type={
                    selectedTask.status === 'completed' ? 'success' :
                    selectedTask.status === 'in_progress' ? 'info' :
                    selectedTask.status === 'blocked' ? 'error' : 'neutral'
                  } />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Priority</span>
                  <PriorityIndicator level={selectedTask.priority} />
                </div>
                {selectedTask.dueAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Due</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                      {getRelativeTime(selectedTask.dueAt)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Assigned to</span>
                  <div className="flex items-center gap-2">
                    <Avatar name={selectedTask.assignedToName} size="small" />
                    <span className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedTask.assignedToName}
                    </span>
                  </div>
                </div>
                {selectedTask.projectName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Project</span>
                    <span className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedTask.projectName}
                    </span>
                  </div>
                )}
                {selectedTask.progressPercent > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Progress</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                        {selectedTask.progressPercent}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${selectedTask.progressPercent}%`,
                          background: 'var(--sapProgress_Value_PositiveBackground)'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Comments */}
              {selectedTask.comments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--sapTextColor)' }}>
                    <MessageSquare size={16} />
                    Comments ({selectedTask.comments.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedTask.comments.map(comment => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar name={comment.userName} size="small" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                              {comment.userName}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapGroup_ContentBorderColor)' }}>
                {selectedTask.status !== 'completed' && (
                  <button
                    onClick={() => handleStatusChange(selectedTask.id, 'completed')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium"
                    style={{
                      background: 'var(--sapButton_Accept_Background)',
                      color: 'var(--sapButton_Accept_TextColor)',
                      border: '1px solid var(--sapButton_Accept_BorderColor)'
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Complete
                  </button>
                )}
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: 'var(--sapButton_Background)',
                    color: 'var(--sapButton_TextColor)',
                    border: '1px solid var(--sapButton_BorderColor)'
                  }}
                >
                  <MessageSquare size={16} />
                  Comment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onClick, isSelected, getRelativeTime, getStatusIcon, compact = false }: {
  task: Task;
  onClick: () => void;
  isSelected: boolean;
  getRelativeTime: (date: string) => string;
  getStatusIcon: (status: TaskStatus) => React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-[var(--sapList_SelectionBackgroundColor)]' : 'hover:bg-[var(--sapList_Hover_Background)]'
      }`}
      style={{ border: '1px solid var(--sapList_BorderColor)' }}
    >
      <div className="flex items-start gap-2">
        {getStatusIcon(task.status)}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold mb-1 truncate" style={{ color: 'var(--sapTextColor)' }}>
            {task.title}
          </div>
          {!compact && (
            <>
              {task.projectName && (
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {task.projectName}
                </div>
              )}
              <div className="flex items-center gap-3">
                <PriorityIndicator level={task.priority} showLabel={false} />
                {task.dueAt && (
                  <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {getRelativeTime(task.dueAt)}
                  </span>
                )}
                {task.comments.length > 0 && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    <MessageSquare size={12} />
                    {task.comments.length}
                  </span>
                )}
                {task.attachments.length > 0 && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    <Paperclip size={12} />
                    {task.attachments.length}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
