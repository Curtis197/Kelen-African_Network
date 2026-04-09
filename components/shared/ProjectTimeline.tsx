"use client";

import { CheckCircle2, Construction, Zap, Paintbrush } from "lucide-react";

export interface Phase {
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN PROGRESS' | 'UPCOMING';
  progress: number;
  last_update?: string;
  next_up?: string;
}

interface ProjectTimelineProps {
  phases: Phase[];
}

export default function ProjectTimeline({ phases }: ProjectTimelineProps) {
  const getIcon = (title: string, status: string) => {
    const props = { className: "w-7 h-7", fill: status === 'COMPLETED' ? "currentColor" : "none" };
    const t = (title || "").toLowerCase();
    
    if (t.includes('sol') || t.includes('plan') || t.includes('étude')) return <CheckCircle2 {...props} />;
    if (t.includes('œuvre') || t.includes('chantier') || t.includes('gros') || t.includes('fondations')) return <Construction {...props} />;
    if (t.includes('second') || t.includes('elec') || t.includes('plomberie') || t.includes('tech')) return <Zap {...props} />;
    return <Paintbrush {...props} />;
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {phases.map((phase, index) => (
        <div 
          key={index} 
          className={`p-8 rounded-[2.5rem] border transition-all duration-500 hover:shadow-2xl ${
            phase.status === 'IN PROGRESS'
              ? 'bg-white dark:bg-surface-container shadow-xl shadow-stone-200/50 dark:shadow-none border-kelen-green-500/30 ring-4 ring-kelen-green-500/5 relative overflow-hidden'
              : phase.status === 'COMPLETED'
              ? 'bg-white dark:bg-surface-container shadow-sm border-stone-100 dark:border-outline-variant/20'
              : 'bg-stone-50/50 dark:bg-surface-container-highest/30 border-stone-100 dark:border-outline-variant/20 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:bg-white dark:hover:bg-surface-container'
          }`}
        >
          {phase.status === 'IN PROGRESS' && (
            <div className="absolute top-0 right-0 w-48 h-48 bg-kelen-green-500/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          )}

          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                phase.status === 'COMPLETED'
                  ? 'bg-kelen-green-50 dark:bg-kelen-green-900/20 text-kelen-green-600 dark:text-kelen-green-400'
                  : phase.status === 'IN PROGRESS'
                  ? 'bg-stone-100 dark:bg-surface-container-highest text-stone-900 dark:text-on-surface shadow-inner'
                  : 'bg-stone-100 dark:bg-surface-container-highest text-stone-400 dark:text-on-surface-variant/50'
              }`}>
                {getIcon(phase.title, phase.status)}
              </div>
              <div>
                <h4 className={`text-2xl font-black font-headline leading-tight ${
                  phase.status === 'UPCOMING' ? 'text-stone-400 dark:text-on-surface-variant/50' : 'text-stone-900 dark:text-on-surface'
                }`}>
                  {phase.title}
                </h4>
                <p className={`text-sm font-medium italic ${
                  phase.status === 'UPCOMING' ? 'text-stone-300 dark:text-on-surface-variant/40' : 'text-stone-500 dark:text-on-surface-variant'
                }`}>
                  {phase.description}
                </p>
              </div>
            </div>

            <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
              phase.status === 'COMPLETED'
                ? 'bg-kelen-green-50 dark:bg-kelen-green-900/20 text-kelen-green-700 dark:text-kelen-green-400 border-kelen-green-100 dark:border-kelen-green-800/30'
                : phase.status === 'IN PROGRESS'
                ? 'bg-white dark:bg-surface-container text-stone-900 dark:text-on-surface border-stone-200 dark:border-outline-variant shadow-sm flex items-center gap-2'
                : 'bg-stone-100 dark:bg-surface-container-highest text-stone-400 dark:text-on-surface-variant/50 border-stone-200 dark:border-outline-variant'
            }`}>
              {phase.status === 'IN PROGRESS' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse"></span>}
              {phase.status === 'COMPLETED' ? 'Vérifié' : phase.status === 'IN PROGRESS' ? 'Action Requise' : 'Programmée'}
            </div>
          </div>

          <div className="space-y-4 relative z-10">
             <div className="flex justify-between text-[10px] font-black text-stone-400 dark:text-on-surface-variant/50 uppercase tracking-[0.2em]">
                <span>Progression de l&apos;étape</span>
                <span>{phase.progress}%</span>
             </div>
             <div className="w-full h-2 bg-stone-100 dark:bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-out ${
                    phase.status === 'COMPLETED' || phase.status === 'IN PROGRESS'
                      ? 'bg-gradient-to-r from-kelen-green-600 via-kelen-green-500 to-kelen-green-400'
                      : 'bg-stone-200 dark:bg-surface-variant'
                  } ${phase.status === 'IN PROGRESS' ? 'animate-pulse-slow' : ''}`}
                  style={{ width: `${phase.progress}%` }}
                />
             </div>

             {(phase.last_update || phase.next_up) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                   {phase.last_update && (
                      <div className="bg-stone-50 dark:bg-surface-container-highest/50 p-5 rounded-2xl border border-stone-100 dark:border-outline-variant/20 group-hover:bg-stone-100 dark:group-hover:bg-surface-container-highest transition-colors">
                         <p className="text-[9px] font-black text-stone-400 dark:text-on-surface-variant/50 uppercase tracking-[0.2em] mb-1.5">Récemment</p>
                         <p className="text-sm font-bold text-stone-900 dark:text-on-surface">{phase.last_update}</p>
                      </div>
                   )}
                   {phase.next_up && (
                      <div className="bg-stone-900 dark:bg-surface-container p-5 rounded-2xl shadow-xl dark:shadow-none transition-transform hover:-translate-y-1">
                         <p className="text-[9px] font-black text-kelen-green-400/60 uppercase tracking-[0.2em] mb-1.5">Prochaine Étape</p>
                         <p className="text-sm font-bold text-white dark:text-on-surface">{phase.next_up}</p>
                      </div>
                   )}
                </div>
             )}
          </div>
        </div>
      ))}
    </div>
  );
}
