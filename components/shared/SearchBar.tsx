"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  size?: "md" | "lg";
}

export function SearchBar({
  placeholder = "Nom d'un professionnel ou d'une entreprise",
  defaultValue = "",
  size = "md",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("q", query.trim());
    params.delete("page");
    router.push(`/recherche?${params.toString()}`);
  };

  const sizeClasses = {
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-border bg-white pr-24 shadow-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20 ${sizeClasses[size]}`}
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-kelen-green-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600"
      >
        Rechercher
      </button>
    </form>
  );
}
