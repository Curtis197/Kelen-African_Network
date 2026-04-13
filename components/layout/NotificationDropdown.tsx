"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const ICON_MAP: Record<string, string> = {
  log_created: "📋",
  log_approved: "✅",
  log_contested: "⚠️",
  log_resolved: "🔵",
  project_assigned: "🏗️",
  new_recommendation: "⭐",
  new_signal: "🔴",
  status_changed: "🔄",
  subscription_activated: "💎",
  subscription_expired: "⏰",
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await getNotifications(10);
    setNotifications(data);
    setUnreadCount(data.filter((n: any) => !n.is_read).length);
    setLoading(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleToggle = () => {
    if (!open) {
      loadData();
    }
    setOpen(!open);
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell trigger */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} non lues)` : ""}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface-container-low rounded-2xl shadow-xl border border-border overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-on-surface">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Tout marquer
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-surface-container-high rounded-xl animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 mx-auto text-on-surface-variant/40 mb-2" />
                <p className="text-sm text-on-surface-variant">Aucune notification</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border last:border-b-0 transition-colors cursor-pointer group ${
                    !n.is_read ? "bg-primary/5" : "hover:bg-surface-container"
                  }`}
                  onClick={() => {
                    handleMarkRead(n.id);
                    if (n.link) window.location.href = n.link;
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">{ICON_MAP[n.icon] || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{n.title}</p>
                      <p className="text-xs text-on-surface-variant/60 line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-on-surface-variant/40 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { locale: fr, addSuffix: true })}
                      </p>
                    </div>
                    {n.link && (
                      <ChevronRight className="w-4 h-4 text-on-surface-variant/30 group-hover:text-on-surface-variant/60 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
