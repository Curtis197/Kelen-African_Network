"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // Prevent hydration mismatch
  }

  const currentTheme = theme || "system";

  const themes = [
    { value: "light", icon: Sun, label: "Mode clair" },
    { value: "dark", icon: Moon, label: "Mode sombre" },
    { value: "system", icon: Monitor, label: "Système" },
  ];

  return (
    <div className="flex items-center gap-1 bg-surface-container rounded-lg p-0.5">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-1.5 rounded-md transition-colors ${
            currentTheme === value
              ? "bg-surface-container-high text-on-surface"
              : "text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high/50"
          }`}
          aria-label={label}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
