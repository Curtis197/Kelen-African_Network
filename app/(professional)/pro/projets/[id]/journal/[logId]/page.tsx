import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProProject } from '@/lib/actions/pro-projects';
import { getLogById } from '@/lib/actions/daily-logs';
import { getLogComments } from '@/lib/actions/log-comments';
import { getMediaUrl } from '@/lib/actions/log-media';
import ProProjectLogDetail from '@/components/pro/ProProjectLogDetail';

interface Props {
  params: Promise<{ id: string; logId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, logId } = await params;
  const project = await getProProject(id);
  
  if (!project) {
    return { title: 'Rapport introuvable' };
  }

  const result = await getLogById(logId, project.id, !project.is_collaboration);
  return {
    title: result?.data ? `${result.data.title} - Journal` : 'Rapport introuvable',
  };
}

export default async function ProLogDetailPage({ params }: Props) {
  const { id, logId } = await params;
  
  // 1. Fetch project context
  const project = await getProProject(id);
  if (!project) {
    notFound();
  }

  // 2. Fetch the log
  // For collaborations, isProProject should be false and ID should be the user_project ID
  const result = await getLogById(logId, project.id, !project.is_collaboration);
  
  if (!result?.data) {
    notFound();
  }

  const log = result.data;

  // 3. Fetch comments
  const comments = await getLogComments(logId);

  // 4. Fetch signed URLs for media
  const signedUrls: Record<string, string> = {};
  if (log.media && log.media.length > 0) {
    for (const media of log.media) {
      const url = await getMediaUrl(media.storage_path);
      if (url) {
        signedUrls[media.storage_path] = url;
      }
    }
  }

  return (
    <ProProjectLogDetail
      log={log}
      project={project}
      initialComments={comments}
      initialSignedUrls={signedUrls}
    />
  );
}
