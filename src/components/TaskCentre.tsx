import { useState } from 'react';
import {
  CheckCircle2, Clock, AlertTriangle, Circle,
  Filter, Plus, Calendar, User, Flag, Search
} from 'lucide-react';
import { tasks } from '../data/mockData';
import type { Task } from '../data/mockData';

export default function TaskCentre() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filtered = tasks.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchStatus && matchPriority;
  });

  const statusCounts = {
    pending: tasks.filter(t => t.status === 'pending').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const statusIcons: Record<string, React.ReactNode> = {
    'pending': <Circle size={14} className="text-gray-400" />,
    'in-progress': <Clock size={14} className="text-blue-500" />,
    'overdue': <AlertTriangle size={14} className="text-red-500" />,
    'completed': <CheckCircle2 size={14} className="text-green-500" />,
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <div className="space-y-5 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--sapFontColor)' }}>Task Centre</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
            Manage and track tasks across all projects
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ background: 'var(--sapBrand)' }}>
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="sap-card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('pending')}>
          <div className="flex items-center gap-2 mb-1">
            <Circle size={14} className="text-gray-400" />
            <span className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>Pending</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapFontColor)' }}>{statusCounts.pending}</div>
        </div>
        <div className="sap-card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('in-progress')}>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-blue-500" />
            <span className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>In Progress</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapFontColor)' }}>{statusCounts['in-progress']}</div>
        </div>
        <div className="sap-card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('overdue')}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>Overdue</span>
          </div>
          <div className="text-2xl font-bold text-red-500">{statusCounts.overdue}</div>
        </div>
        <div className="sap-card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('completed')}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-green-500" />
            <span className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>Completed</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          style={{ borderColor: 'var(--sapBaseColor)', background: 'var(--sapGroupContentBG)', color: 'var(--sapFontColor)' }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          style={{ borderColor: 'var(--sapBaseColor)', background: 'var(--sapGroupContentBG)', color: 'var(--sapFontColor)' }}
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task List */}
      <div className="sap-card overflow-hidden">
        <div className="divide-y" style={{ borderColor: 'var(--sapBaseColor)' }}>
          {filtered.map((task) => (
            <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              {/* Status Icon */}
              <div className="shrink-0">
                {statusIcons[task.status]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}
                    style={{ color: 'var(--sapFontColor)' }}>
                    {task.title}
                  </h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${priorityColors[task.priority]}`}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>
                  <span className="flex items-center gap-1">
                    <User size={10} /> {task.assignee}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} /> {task.dueDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flag size={10} /> {task.project}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                task.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                task.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                task.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
