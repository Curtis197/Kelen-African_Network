"use client";

import { ProjectStep } from "@/lib/types/projects";
import { CheckCircle2, Circle, Clock, AlertCircle, Users, TrendingUp, Wallet, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STATUS_CONFIG: Record<string, any> = {
  pending: { 
    label: "À venir", 
    icon: Circle, 
    color: "text-stone-400", 
    bg: "bg-stone-50",
    border: "border-stone-100"
  },
  in_progress: { 
    label: "En cours", 
    icon: Clock, 
    color: "text-amber-500", 
    bg: "bg-amber-50/50",
    border: "border-amber-100"
  },
  completed: { 
    label: "Terminé", 
    icon: CheckCircle2, 
    color: "text-kelen-green-600", 
    bg: "bg-kelen-green-50/50",
    border: "border-kelen-green-100"
  },
  on_hold: { 
    label: "En pause", 
    icon: AlertCircle, 
    color: "text-rose-500", 
    bg: "bg-rose-50/50",
    border: "border-rose-100"
  },
  cancelled: { 
    label: "Annulé", 
    icon: X, 
    color: "text-stone-500", 
    bg: "bg-stone-100",
    border: "border-stone-200"
  },
};

interface ProjectStepCardProps {
  step: ProjectStep;
  currency: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onManagePros?: () => void;
}

export default function ProjectStepCard({ step, currency, onEdit, onDelete, onManagePros }: ProjectStepCardProps) {
  const config = STATUS_CONFIG[step.status];
  const Icon = config.icon;
  const progress = step.budget > 0 ? Math.min(Math.round((step.expenditure / step.budget) * 100), 100) : 0;

  return (
    <div className={cn(
      "p-8 rounded-[2.5rem] border bg-white transition-all duration-500 hover:shadow-2xl group",
      step.status === 'in_progress' ? "shadow-xl border-amber-100 ring-4 ring-amber-500/5" : "shadow-sm border-stone-100"
    )}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div className="flex items-start gap-5">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shrink-0",
            config.bg, config.color
          )}>
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <h4 className={cn(
              "text-xl font-headline font-bold leading-tight mb-1",
              step.status === 'pending' ? "text-stone-400" : "text-stone-900"
            )}>
              {step.title}
            </h4>
            {step.comment && (
              <p className="text-sm font-medium text-stone-500 line-clamp-2 italic">
                "{step.comment}"
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-2",
            config.bg, config.color, config.border
          )}>
            {step.status === 'in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
            {config.label}
          </div>
          <button
            onClick={onEdit}
            className="p-2 hover:bg-stone-50 rounded-xl text-stone-400 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-stone-50 rounded-xl text-stone-300 hover:text-rose-500 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
              <TrendingUp className="w-3 h-3" />
              <span>Consommation Budget</span>
            </div>
            <span className="text-xs font-bold text-stone-900">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-out",
                step.status === 'completed' ? "bg-kelen-green-500" : "bg-amber-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Prévu</span>
              <span className="text-sm font-bold text-stone-900">{step.budget.toLocaleString()} {currency}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Dépensé</span>
              <span className="text-sm font-bold text-stone-900">{step.expenditure.toLocaleString()} {currency}</span>
            </div>
          </div>
        </div>

        <div className="bg-stone-50/50 rounded-3xl p-6 border border-stone-100/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">
              <Users className="w-3 h-3" />
              <span>Professionnels</span>
            </div>
            <button 
              onClick={onManagePros}
              className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
            >
              Gérer
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {step.associated_pros && step.associated_pros.length > 0 ? (
              step.associated_pros.map((name, i) => (
                <span 
                  key={i}
                  className="px-3 py-1 bg-white border border-stone-200 rounded-lg text-[10px] font-bold text-stone-600 shadow-sm"
                >
                  {name}
                </span>
              ))
            ) : (
              <span className="text-[10px] font-medium text-stone-400 italic">Aucun pro assigné</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
