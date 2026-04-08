"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { getUnreadCount } from "@/lib/actions/notifications";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const c = await getUnreadCount();
      setCount(c);
      setLoading(false);
    };
    fetch();
  }, []);

  // Refresh count every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const c = await getUnreadCount();
      setCount(c);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <button
      className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors"
      aria-label={`Notifications ${count > 0 ? `(${count} non lues)` : ""}`}
      title={count > 0 ? `${count} notification(s) non lue(s)` : "Aucune notification"}
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
