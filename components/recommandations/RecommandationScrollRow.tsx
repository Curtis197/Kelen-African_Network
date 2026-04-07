"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Recommandation {
  id: string;
  content: string;
  project_context?: string | null;
  created_at: string;
}

interface RecommandationScrollRowProps {
  recommandations: Recommandation[];
  totalCount: number;
}

export default function RecommandationScrollRow({ recommandations, totalCount }: RecommandationScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  if (recommandations.length === 0) return null;

  return (
    <div className="relative">
      {/* Scroll Controls */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-stone-50 transition-colors"
        aria-label="Voir les recommandations précédentes"
      >
        <ChevronLeft className="w-5 h-5 text-stone-600" />
      </button>
      
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-stone-50 transition-colors"
        aria-label="Voir les recommandations suivantes"
      >
        <ChevronRight className="w-5 h-5 text-stone-600" />
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-kelen-green-600 font-black tracking-[0.3em] uppercase text-xs">Témoignages</span>
          <h2 className="text-3xl md:text-4xl font-black mt-2 text-stone-900 tracking-tight">
            {totalCount} recommandation{totalCount !== 1 ? "s" : ""}
          </h2>
        </div>
      </div>

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 -mx-4 px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {recommandations.map((rec) => (
          <div
            key={rec.id}
            className="flex-shrink-0 w-80 md:w-96 snap-start bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-lg transition-shadow"
          >
            {/* Quote Icon */}
            <div className="text-kelen-green-600 mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>

            {/* Content */}
            <p className="text-stone-600 text-sm leading-relaxed mb-4 line-clamp-4">
              {rec.content}
            </p>

            {/* Context */}
            {rec.project_context && (
              <p className="text-xs text-stone-400 mb-3 italic">
                Contexte : {rec.project_context}
              </p>
            )}

            {/* Anonymous Author */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-kelen-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-black text-kelen-green-600">A</span>
                </div>
                <span className="text-xs font-medium text-stone-500">Client vérifié</span>
              </div>
              <span className="text-xs text-stone-400">
                {formatDate(rec.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
