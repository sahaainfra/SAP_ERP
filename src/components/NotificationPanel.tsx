/**
 * Notification Panel Component - Part 7
 * 
 * Multi-channel notification management interface
 */

import { useState } from 'react';
import { 
  Bell, Check, CheckCheck, Settings, Filter,
  Mail, Smartphone, MessageSquare, X
} from 'lucide-react';
import { notifications, notificationPreferences } from '../data/workflowData';
import type { Notification, NotificationCategory } from '../types/workflow';
import { formatDate } from '../utils/formatting';

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | NotificationCategory>('all');
  const [showPreferences, setShowPreferences] = useState(false);

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === 'unread') return !notif.isRead;
    if (activeFilter !== 'all') return notif.category === activeFilter;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (notificationId: number) => {
    console.log('Marking notification as read:', notificationId);
  };

  const handleMarkAllAsRead = () => {
    console.log('Marking all notifications as read');
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'approval': return <Check size={16} />;
      case 'task': return <Check size={16} />;
      case 'alert': return <Bell size={16} />;
      case 'mention': return <MessageSquare size={16} />;
      case 'system': return <Settings size={16} />;
      case 'digest': return <Mail size={16} />;
    }
  };

  const getCategoryColor = (category: NotificationCategory) => {
    switch (category) {
      case 'approval': return 'var(--sapAccentColor6)';
      case 'task': return 'var(--sapAccentColor1)';
      case 'alert': return 'var(--sapAccentColor2)';
      case 'mention': return 'var(--sapAccentColor5)';
      case 'system': return 'var(--sapAccentColor10)';
      case 'digest': return 'var(--sapAccentColor7)';
    }
  };

  return (
    <div className="fixed right-0 top-14 bottom-0 w-96 sap-card shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
        <div className="flex items-center gap-2">
          <Bell size={20} style={{ color: 'var(--sapContent_IconColor)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
              background: 'var(--sapNegativeColor)',
              color: 'white'
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
            title="Notification Settings"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 p-2 border-b overflow-x-auto" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: 'Unread' },
          { key: 'approval', label: 'Approvals' },
          { key: 'task', label: 'Tasks' },
          { key: 'alert', label: 'Alerts' }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key as any)}
            className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter.key ? 'bg-[var(--sapSelectedColor)] text-white' : ''
            }`}
            style={{
              color: activeFilter === filter.key ? 'white' : 'var(--sapContent_LabelColor)',
              background: activeFilter === filter.key ? undefined : 'var(--sapButton_Background)'
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Mark All as Read */}
      {unreadCount > 0 && (
        <div className="p-2 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 text-xs font-medium hover:underline"
            style={{ color: 'var(--sapLinkColor)' }}
          >
            <CheckCheck size={14} />
            Mark all as read
          </button>
        </div>
      )}

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <Bell size={48} style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
            <p className="text-sm mt-4" style={{ color: 'var(--sapContent_LabelColor)' }}>
              No notifications
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-[var(--sapList_Hover_Background)] transition-colors cursor-pointer ${
                  !notification.isRead ? 'bg-[var(--sapList_SelectionBackgroundColor)]' : ''
                }`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{
                      background: getCategoryColor(notification.category) + '20',
                      color: getCategoryColor(notification.category)
                    }}
                  >
                    {getCategoryIcon(notification.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--sapTextColor)' }}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--sapInformativeColor)' }} />
                      )}
                    </div>
                    {notification.body && (
                      <p className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        {notification.body}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      <span>{formatDate(notification.createdAt)}</span>
                      <div className="flex items-center gap-1">
                        {notification.deliveries.map(delivery => (
                          <span key={delivery.id} title={delivery.channel}>
                            {delivery.channel === 'email' && <Mail size={12} />}
                            {delivery.channel === 'push' && <Smartphone size={12} />}
                            {delivery.channel === 'sms' && <MessageSquare size={12} />}
                            {delivery.channel === 'in_app' && <Bell size={12} />}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences Panel */}
      {showPreferences && (
        <div className="absolute inset-0 bg-[var(--sapGroup_ContentBackground)] flex flex-col z-10">
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
            <h3 className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
              Notification Preferences
            </h3>
            <button
              onClick={() => setShowPreferences(false)}
              className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {notificationPreferences.map(pref => (
                <div key={pref.category} className="sap-card p-4">
                  <h4 className="text-sm font-semibold mb-3 capitalize" style={{ color: 'var(--sapTextColor)' }}>
                    {pref.category}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>In-App</span>
                      <input type="checkbox" checked={pref.inApp} readOnly className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Push</span>
                      <input type="checkbox" checked={pref.push} readOnly className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Email</span>
                      <input type="checkbox" checked={pref.email} readOnly className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>SMS</span>
                      <input type="checkbox" checked={pref.sms} readOnly className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Frequency</span>
                      <span className="text-sm capitalize" style={{ color: 'var(--sapTextColor)' }}>
                        {pref.frequency}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
