"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSectorIcon } from "@/lib/utils/sector-icons";
import type { AreaWithCount } from "@/lib/actions/taxonomy";

interface SectorGridProps {
  areas: AreaWithCount[];
}

export function SectorGrid({ areas }: SectorGridProps) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? areas : areas.slice(0, 6);

  return (
    <div className="mb-16">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((area) => {
          const Icon = getSectorIcon(area.slug);
          return (
            <button
              key={area.id}
              onClick={() => router.push(`/secteur/${area.slug}`)}
              className="flex flex-col items-start gap-3 rounded-2xl bg-surface-container-low p-4 text-left transition-all hover:bg-kelen-green-50 hover:ring-1 hover:ring-kelen-green-200 active:scale-95"
            >
              <div className="rounded-xl bg-surface-container-lowest p-2.5">
                <Icon className="h-6 w-6 text-kelen-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface leading-tight">{area.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {area.professionalCount} professionnel{area.professionalCount !== 1 ? "s" : ""}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {areas.length > 6 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 text-sm font-black uppercase tracking-widest text-kelen-green-600 hover:text-kelen-green-700"
        >
          {showAll ? "Voir moins" : `Voir tous les secteurs (${areas.length})`}
        </button>
      )}
    </div>
  );
}
