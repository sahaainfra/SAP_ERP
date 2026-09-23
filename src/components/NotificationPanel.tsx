/**
 * Part 01 — Notification Panel
 * 
 * The notification centre. Notifications are emitted as events (Part 13),
 * delivered by Part 25 with channel preference, quiet hours, rate limiting,
 * digesting and body-level masking.
 * 
 * For Part 01, we demonstrate the notification framework structure.
 */

import React from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Bell, Check, CheckCheck, Clock, AlertCircle, Info, X } from 'lucide-react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, markNotificationRead, markAllRead } = useWorkspace();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-800">Notifications</h2>
          {unreadCount > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50"
              title="Mark all as read"
            >
              <CheckCheck size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Bell size={20} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 font-medium">No notifications</p>
            <p className="text-xs text-slate-400 mt-1 text-center">
              You're all caught up. New notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => markNotificationRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 mt-0.5 ${
                    notification.type === 'error' ? 'text-red-500' :
                    notification.type === 'warning' ? 'text-amber-500' :
                    notification.type === 'success' ? 'text-emerald-500' :
                    'text-blue-500'
                  }`}>
                    {notification.type === 'error' ? <AlertCircle size={16} /> :
                     notification.type === 'warning' ? <AlertCircle size={16} /> :
                     <Info size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock size={10} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      {!notification.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
        <p className="text-[10px] text-slate-400 text-center">
          Delivered by Part 25 Notification Engine • Channel preferences configurable
        </p>
      </div>
    </div>
  );
}
