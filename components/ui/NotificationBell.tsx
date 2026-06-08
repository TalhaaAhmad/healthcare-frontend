'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  ClientNotification,
} from '@/hooks/use-frappe';
import Link from 'next/link';

// ─── Type badge colors ─────────────────────────────────────────────────────────
const typeColors: Record<string, string> = {
  Alert:   'bg-orange-100 text-orange-700 border-orange-200',
  Mention: 'bg-blue-100 text-blue-700 border-blue-200',
  '':      'bg-gray-100 text-gray-700 border-gray-200',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Bell Icon ─────────────────────────────────────────────────────────────────
const BellIcon = ({ unread }: { unread: number }) => (
  <div className="relative">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z"
      />
    </svg>
    {unread > 0 && (
      <span
        className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none"
        style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
      >
        {unread > 9 ? '9+' : unread}
      </span>
    )}
  </div>
);

// ─── Notification Row ──────────────────────────────────────────────────────────
function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: ClientNotification;
  onMarkRead: (id: string) => void;
}) {
  const isUnread = notification.read === 0;

  // Build link: if it references an appointment, link to it
  let href: string | null = null;
  if (notification.document_type === 'Patient Appointment' && notification.document_name) {
    href = `/patient/appointments/${notification.document_name}`;
  }

  const content = (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded border ${typeColors[notification.type] || typeColors.Alert}`}>
            {notification.type}
          </span>
          <span
            className="text-[10px] text-gray-400"
            style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
          >
            {timeAgo(notification.creation)}
          </span>
        </div>
        <p
          className={`text-sm leading-snug ${isUnread ? 'font-semibold text-[#001E42]' : 'font-medium text-[#333333]'}`}
          style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
        >
          {notification.subject}
        </p>
        {notification.email_content && (
          <p
            className="text-xs text-[#6C7087] mt-0.5 line-clamp-2"
            style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
            dangerouslySetInnerHTML={{
              __html: notification.email_content
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 120),
            }}
          />
        )}
      </div>
      {isUnread && (
        <span className="mt-1.5 w-2 h-2 flex-shrink-0 rounded-full bg-blue-500" />
      )}
    </div>
  );

  const rowClass = `block px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
    isUnread ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'
  }`;

  const handleClick = () => isUnread && onMarkRead(notification.name);

  if (href) {
    return (
      <Link href={href} className={rowClass} onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return (
    <div className={rowClass} onClick={handleClick}>
      {content}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = useNotifications(user?.email);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // ── Periodic reminder processing ─────────────────────────────────────────────
  // Polls the server every 5 minutes to trigger 1-day and 30-min appointment reminders.
  useEffect(() => {
    async function processReminders() {
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'process_reminders' }),
        });
        // Refresh notification list after processing
        refetch();
      } catch {
        // Non-critical: silently ignore
      }
    }

    // Run immediately on mount, then every 5 minutes
    processReminders();
    const interval = setInterval(processReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refetch]);

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n) => n.read === 0).length;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-[#333333] hover:text-[#001E42] transition-colors focus:outline-none"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <BellIcon unread={unreadCount} />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 sm:w-96 bg-white border border-gray-200 shadow-lg z-50 flex flex-col max-h-[70vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <h3
              className="text-sm font-semibold text-[#001E42]"
              style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
            >
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-normal text-[#6C7087]">
                  ({unreadCount} unread)
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => user?.email && markAllRead.mutate(user.email)}
                className="text-[11px] font-medium text-[#001E42] hover:underline"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-[#001E42] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z"
                  />
                </svg>
                <p className="text-xs text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationRow
                  key={n.name}
                  notification={n}
                  onMarkRead={(id) => markRead.mutate(id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 shrink-0 text-center">
              <button
                onClick={() => setOpen(false)}
                className="text-[11px] text-[#6C7087] hover:text-[#001E42] hover:underline"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
