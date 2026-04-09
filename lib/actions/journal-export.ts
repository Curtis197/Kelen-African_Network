"use server";

import { createClient } from "@/lib/supabase/server";
import { getProjectLogs } from "./daily-logs";
import { getLogComments } from "./log-comments";
import { getMediaUrl } from "./log-media";

interface PDFExportData {
  professionalName: string;
  professionalTitle?: string;
  clientName: string;
  projectName: string;
  projectLocation?: string;
  periodStart: string;
  periodEnd: string;
  stats: {
    totalEntries: number;
    approvedCount: number;
    contestedCount: number;
    budgetUsed: string;
    currency: string;
  };
  logs: Array<{
    id: string;
    log_date: string;
    title: string;
    description: string;
    author_role: 'client' | 'professional';
    author_name?: string;
    status: string;
    money_spent: number;
    money_currency: string;
    weather?: string;
    issues?: string;
    next_steps?: string;
    gps_latitude?: number;
    gps_longitude?: number;
    media: Array<{
      storage_path: string;
      file_name: string;
      caption?: string;
      exif_timestamp?: string;
      exif_latitude?: number;
      exif_longitude?: number;
      signedUrl?: string;
    }>;
    comments: Array<{
      id: string;
      comment_type: string;
      comment_text: string;
      created_at: string;
      author_name?: string;
    }>;
  }>;
  financialRecords: Array<{
    date: string;
    description: string;
    amount: number;
    balance: number;
    status: string;
    currency: string;
  }>;
}

export async function generateJournalPDFData(
  projectId: string,
  isProProject: boolean = true
): Promise<PDFExportData | null> {
  const supabase = await createClient();

  // Fetch project info
  let projectData: any = null;
  let professionalData: any = null;

  if (isProProject) {
    const { data: proj } = await supabase
      .from("pro_projects")
      .select("*, professionals(id, user_id)")
      .eq("id", projectId)
      .single();
    
    projectData = proj;
  }

  if (!projectData) {
    return null;
  }

  // Fetch professional info
  const { data: prof } = await supabase
    .from("professionals")
    .select("id, display_name, category")
    .eq("id", projectData.professional_id)
    .single();

  professionalData = prof;

  // Fetch all logs
  const logs = await getProjectLogs(projectId, isProProject);

  // Fetch signed URLs for media and build export data
  const exportLogs = await Promise.all(
    logs.map(async (log) => {
      const mediaWithUrls = await Promise.all(
        (log.media || []).map(async (media) => {
          const signedUrl = await getMediaUrl(media.storage_path);
          return { ...media, signedUrl };
        })
      );

      const comments = await getLogComments(log.id);

      return {
        ...log,
        media: mediaWithUrls,
        comments,
      };
    })
  );

  // Calculate stats
  const totalEntries = exportLogs.length;
  const approvedCount = exportLogs.filter(l => l.status === 'approved' || l.status === 'resolved').length;
  const contestedCount = exportLogs.filter(l => l.status === 'contested').length;
  const totalBudget = exportLogs.reduce((sum, log) => sum + Number(log.money_spent || 0), 0);

  // Build financial records
  const financialRecords = exportLogs
    .filter(log => Number(log.money_spent) > 0)
    .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime())
    .reduce((acc: any[], log, idx, arr) => {
      const balance = arr.slice(0, idx + 1).reduce((s, l) => s + Number(l.money_spent), 0);
      acc.push({
        date: new Date(log.log_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        description: log.title,
        amount: Number(log.money_spent),
        balance,
        status: log.status === 'approved' ? 'paid' : log.status === 'contested' ? 'disputed' : 'pending',
        currency: log.money_currency || 'XOF',
      });
      return acc;
    }, []);

  // Format dates
  const sortedLogs = [...exportLogs].sort((a, b) => 
    new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
  );

  const periodStart = sortedLogs.length > 0 
    ? new Date(sortedLogs[0].log_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    : '';
  
  const periodEnd = sortedLogs.length > 0
    ? new Date(sortedLogs[sortedLogs.length - 1].log_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    : '';

  return {
    professionalName: professionalData?.display_name || 'Professionnel',
    professionalTitle: professionalData?.category,
    clientName: projectData.client_name || 'Client',
    projectName: projectData.title || 'Projet',
    projectLocation: projectData.location,
    periodStart,
    periodEnd,
    stats: {
      totalEntries,
      approvedCount,
      contestedCount,
      budgetUsed: formatCurrency(totalBudget, projectData.currency || 'XOF'),
      currency: projectData.currency || 'XOF',
    },
    logs: exportLogs.map(log => ({
      ...log,
      weather: log.weather || undefined,
      issues: log.issues || undefined,
      next_steps: log.next_steps || undefined,
    })),
    financialRecords,
  };
}

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'XOF') {
    return `${(amount / 1000).toFixed(0)}K XOF`;
  }
  if (currency === 'EUR') {
    return `€${amount.toLocaleString('fr-FR')}`;
  }
  if (currency === 'USD') {
    return `$${amount.toLocaleString('fr-FR')}`;
  }
  return `${amount} ${currency}`;
}
