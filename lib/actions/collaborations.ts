"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";
import type {
  CollaborationStatus,
  ProposalFormData,
  MessageFormData,
  MessageType,
  ProjectProfessionalWithProfile,
} from "@/lib/types/collaborations";

// ============================================
// MAKE FINALIST
// ============================================

export async function makeFinalist(projectId: string, professionalId: string, projectProfessionalId: string) {
  console.log('[ACTION] makeFinalist started:', { projectId, professionalId, projectProfessionalId });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] User:', user?.id);
  if (!user || authError) return { success: false, error: 'Unauthorized' };

  // Check if collaboration already exists (idempotent)
  const { data: existing, error: existingError } = await supabase
    .from('project_collaborations')
    .select('id, status')
    .eq('project_id', projectId)
    .eq('professional_id', professionalId)
    .single();

  console.log('[DB] Check existing collaboration:', { 
    count: existing ? 1 : 0, 
    status: existing?.status,
    error: existingError?.message,
    code: existingError?.code 
  });

  if (existingError?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: project_collaborations');
    return { success: false, error: 'Access denied' };
  }

  if (existing) {
    console.log('[ACTION] makeFinalist: Collaboration already exists, returning success (idempotent)');
    return { success: true, error: null };
  }

  // Create collaboration record
  const { data: collab, error: collabError } = await supabase
    .from('project_collaborations')
    .insert([{
      project_id: projectId,
      professional_id: professionalId,
      project_professional_id: projectProfessionalId,
      status: 'pending',
    }])
    .select('id')
    .single();

  console.log('[DB] Create collaboration:', { 
    id: collab?.id, 
    error: collabError?.message, 
    code: collabError?.code 
  });

  if (collabError) {
    if (collabError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: project_collaborations INSERT');
    }
    return { success: false, error: collabError.message };
  }

  // Update project_professionals selection_status
  const { error: ppError } = await supabase
    .from('project_professionals')
    .update({ selection_status: 'finalist' })
    .eq('id', projectProfessionalId);

  console.log('[DB] Update project_professionals:', { error: ppError?.message, code: ppError?.code });

  if (ppError) {
    if (ppError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: project_professionals UPDATE');
    }
    return { success: false, error: ppError.message };
  }

  // Get professional's user_id for notification
  const { data: professional, error: proError } = await supabase
    .from('professionals')
    .select('user_id')
    .eq('id', professionalId)
    .single();

  console.log('[DB] Get professional user_id:', { userId: professional?.user_id, error: proError?.message });

  if (professional?.user_id) {
    const { error: notifError } = await createNotification({
      userId: professional.user_id,
      type: 'finalist_selected',
      title: 'Invitation à soumettre une proposition',
      body: 'Vous avez été sélectionné comme finaliste pour un projet. Consultez les détails et soumettez votre proposition.',
      link: `/pro/collaborations/${collab.id}`,
      icon: 'award',
      metadata: { collaborationId: collab.id, projectId },
    });

    console.log('[NOTIFICATION] finalist_selected:', { error: notifError });
  }

  revalidatePath(`/projects/${projectId}/pros`);
  console.log('[ACTION] makeFinalist completed successfully');
  return { success: true, error: null };
}

// ============================================
// UPDATE SELECTION STATUS
// ============================================

export async function updateProjectProfessionalSelectionStatus(
  projectProfessionalId: string,
  newStatus: string,
  projectId: string
) {
  console.log('[ACTION] updateProjectProfessionalSelectionStatus started:', { projectProfessionalId, newStatus, projectId });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] User:', user?.id);
  if (!user || authError) return { success: false, error: 'Unauthorized' };

  // 1. Get current record to identify professional_id if we need to call other actions
  const { data: current, error: fetchError } = await supabase
    .from('project_professionals')
    .select('selection_status, professional_id')
    .eq('id', projectProfessionalId)
    .single();

  if (fetchError || !current) {
    console.error('[DB] Fetch current project_professional failed:', fetchError);
    return { success: false, error: 'Record not found' };
  }

  const oldStatus = current.selection_status;
  const professionalId = current.professional_id;

  // 2. Handle specific status logic
  if (newStatus === 'finalist') {
    // Reuse makeFinalist logic
    return await makeFinalist(projectId, professionalId, projectProfessionalId);
  }

  if (newStatus === 'agreed') {
    // Check if a collaboration exists to accept
    const { data: collab } = await supabase
      .from('project_collaborations')
      .select('id')
      .eq('project_professional_id', projectProfessionalId)
      .single();

    if (collab) {
      return await acceptProposal(collab.id);
    } else {
      // Direct agreement without collaboration record (rare but possible)
      const { error: ppError } = await supabase
        .from('project_professionals')
        .update({ selection_status: 'agreed' })
        .eq('id', projectProfessionalId);
      
      if (ppError) return { success: false, error: ppError.message };
    }
  }

  // 3. Cleanup collaboration if moving AWAY from finalist or agreed
  const wasFinalistOrAgreed = oldStatus === 'finalist' || oldStatus === 'agreed';
  const isFinalistOrAgreed = newStatus === 'finalist' || newStatus === 'agreed';

  if (wasFinalistOrAgreed && !isFinalistOrAgreed) {
    console.log('[ACTION] Moving away from finalist/agreed: DELETING collaboration record');
    const { error: collabError } = await supabase
      .from('project_collaborations')
      .delete()
      .eq('project_professional_id', projectProfessionalId);
    
    console.log('[DB] Collaboration delete result:', { error: collabError?.message });
  }

  // 4. Update the status
  const { error: updateError } = await supabase
    .from('project_professionals')
    .update({ selection_status: newStatus })
    .eq('id', projectProfessionalId);

  console.log('[DB] Update project_professional status:', { error: updateError?.message });

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath(`/projects/${projectId}/pros`);
  return { success: true, error: null };
}

// ============================================
// REMOVE PROFESSIONAL
// ============================================

export async function removeProjectProfessionalById(
  projectProfessionalId: string,
  projectId: string
) {
  console.log('[ACTION] removeProjectProfessionalById started:', { projectProfessionalId, projectId });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] User:', user?.id);
  if (!user || authError) return { success: false, error: 'Unauthorized' };

  // 1. Cleanup associated collaborations (cascade confirmed by user)
  const { error: collabError } = await supabase
    .from('project_collaborations')
    .delete()
    .eq('project_professional_id', projectProfessionalId);

  console.log('[DB] Delete associated collaborations:', { error: collabError?.message });

  // 2. Delete the professional record
  const { error: deleteError } = await supabase
    .from('project_professionals')
    .delete()
    .eq('id', projectProfessionalId);

  console.log('[DB] Delete project_professional:', { error: deleteError?.message });

  if (deleteError) {
    if (deleteError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: project_professionals DELETE');
    }
    return { success: false, error: deleteError.message };
  }

  revalidatePath(`/projects/${projectId}/pros`);
  return { success: true, error: null };
}

// ============================================
// SUBMIT PROPOSAL
// ============================================

export async function submitProposal(
  collaborationId: string,
  data: ProposalFormData
) {
  console.log('[ACTION] submitProposal started:', { collaborationId, data });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] User:', user?.id);
  if (!user || authError) return { success: false, error: 'Unauthorized' };

  const { error: updateError } = await supabase
    .from('project_collaborations')
    .update({
      proposal_text: data.text,
      proposal_budget: data.budget,
      proposal_currency: data.currency,
      proposal_timeline: data.timeline,
      proposal_submitted_at: new Date().toISOString(),
      status: 'negotiating',
    })
    .eq('id', collaborationId);

  console.log('[DB] Update collaboration:', { error: updateError?.message, code: updateError?.code });

  if (updateError) {
    if (updateError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: project_collaborations UPDATE');
    }
    return { success: false, error: updateError.message };
  }

  // Create proposal message
  const { error: messageError } = await supabase
    .from('collaboration_messages')
    .insert([{
      collaboration_id: collaborationId,
      sender_id: user.id,
      sender_role: 'professional',
      message_type: 'proposal',
      content: data.text,
    }]);

  console.log('[DB] Create proposal message:', { error: messageError?.message });

  if (messageError) {
    if (messageError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: collaboration_messages INSERT');
    }
  }

  // Notify client
  const { data: collabRaw, error: collabError } = await supabase
    .from('project_collaborations')
    .select('project_id, professional_id, project:user_projects(user_id)')
    .eq('id', collaborationId)
    .single();

  const collab = collabRaw as typeof collabRaw & { project: { user_id: string } | null };

  console.log('[DB] Get collaboration for notification:', {
    clientId: collab?.project?.user_id,
    error: collabError?.message
  });

  if (collab?.project?.user_id) {
    const { error: notifError } = await createNotification({
      userId: collab.project.user_id,
      type: 'proposal_submitted',
      title: 'Proposition soumise',
      body: 'Un professionnel a soumis sa proposition pour votre projet.',
      link: `/projects/${collab.project_id}/pros/proposal/${collab.professional_id}`,
      icon: 'file-text',
      metadata: { collaborationId, projectId: collab.project_id },
    });

    console.log('[NOTIFICATION] proposal_submitted:', { error: notifError });
  }

  revalidatePath(`/projects/${collab?.project_id}/pros`);
  revalidatePath(`/pro/collaborations/${collaborationId}`);
  console.log('[ACTION] submitProposal completed');
  return { success: true, error: null };
}

// ============================================
// DECLINE COLLABORATION
// ============================================

export async function declineCollaboration(collaborationId: string, reason: string) {
  console.log('[ACTION] declineCollaboration started:', { collaborationId, reason });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] User:', user?.id);
  if (!user || authError) return { success: false, error: 'Unauthorized' };

  const { error: updateError } = await supabase
    .from('project_collaborations')
    .update({
      status: 'declined',
      decline_reason: reason,
      ended_at: new Date().toISOString(),
    })
    .eq('id', collaborationId);

  console.log('[DB] Update collaboration:', { error: updateError?.message, code: updateError?.code });

  if (updateError) {
    if (updateError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: project_collaborations UPDATE');
    }
    return { success: false, error: updateError.message };
  }

  // Update project_professionals
  const { data: collabRaw2, error: collabError } = await supabase
    .from('project_collaborations')
    .select('project_professional_id, project_id, project:user_projects(user_id)')
    .eq('id', collaborationId)
    .single();

  const collab = collabRaw2 as typeof collabRaw2 & { project: { user_id: string } | null };

  console.log('[DB] Get collaboration for update:', { error: collabError?.message });

  if (collab?.project_professional_id) {
    const { error: ppError } = await supabase
      .from('project_professionals')
      .update({ selection_status: 'not_selected' })
      .eq('id', collab.project_professional_id);

    console.log('[DB] Update project_professionals:', { error: ppError?.message });
  }

  // Notify client
  if (collab?.project?.user_id) {
    const { error: notifError } = await createNotification({
      userId: collab.project.user_id,
      type: 'collaboration_declined',
      title: 'Proposition refusée',
      body: 'Un professionnel a refusé votre invitation à collaborer.',
      link: `/projects/${collab.project_id}/pros`,
      icon: 'x-circle',
      metadata: { collaborationId, projectId: collab.project_id },
    });

    console.log('[NOTIFICATION] collaboration_declined:', { error: notifError });
  }

  revalidatePath(`/projects/${collab?.project_id}/pros`);
  console.log('[ACTION] declineCollaboration completed');
  return { success: true, error: null };
}

// ============================================
// REQUEST REVISION
// ============================================

export async function requestRevision(collaborationId: string, message: string) {
  console.log('[ACTION] requestRevision started:', { collaborationId });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] User:', user?.id);
  if (!user || authError) return { success: false, error: 'Unauthorized' };

  const { error: messageError } = await supabase
    .from('collaboration_messages')
    .insert([{
      collaboration_id: collaborationId,
      sender_id: user.id,
      sender_role: 'client',
      message_type: 'revision_request',
      content: message,
    }]);

  console.log('[DB] Create revision message:', { error: messageError?.message, code: messageError?.code });

  if (messageError) {
    if (messageError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: collaboration_messages INSERT');
    }
    return { success: false, error: messageError.message };
  }

  // Notify pro
  const { data: collabRaw3, error: collabError } = await supabase
    .from('project_collaborations')
    .select('professional_id, project_id, professional:professionals(user_id)')
    .eq('id', collaborationId)
    .single();

  const collab = collabRaw3 as typeof collabRaw3 & { professional: { user_id: string } | null };

  console.log('[DB] Get collaboration for notification:', {
    proUserId: collab?.professional?.user_id,
    error: collabError?.message
  });

  if (collab?.professional?.user_id) {
    const { error: notifError } = await createNotification({
      userId: collab.professional.user_id,
      type: 'revision_requested',
      title: 'Demande de révision',
      body: 'Le client demande des modifications à votre proposition.',
      link: `/pro/collaborations/${collaborationId}`,
      icon: 'refresh-cw',
      metadata: { collaborationId, projectId: collab.project_id },
    });

    console.log('[NOTIFICATION] revision_requested:', { error: notifError });
  }

  revalidatePath(`/projects/${collab?.project_id}/pros`);
  console.log('[ACTION] requestRevision completed');
  return { success: true, error: null };
}

// ============================================
// ACCEPT PROPOSAL (Atomic: activate this, decline others)
// ============================================

export async function acceptProposal(collaborationId: string) {
  console.log('[ACTION] acceptProposal started:', { collaborationId });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] User:', user?.id);
  if (!user || authError) return { success: false, error: 'Unauthorized' };

  // Get collaboration details
  const { data: collabRaw4, error: collabError } = await supabase
    .from('project_collaborations')
    .select('project_id, professional_id, project_professional_id, professional:professionals(user_id)')
    .eq('id', collaborationId)
    .single();

  const collab = collabRaw4 as typeof collabRaw4 & { professional: { user_id: string } | null };

  console.log('[DB] Get collaboration:', { error: collabError?.message });
  if (!collab) return { success: false, error: 'Collaboration not found' };

  // Activate this collaboration
  const { error: updateError } = await supabase
    .from('project_collaborations')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('id', collaborationId);

  console.log('[DB] Activate collaboration:', { error: updateError?.message, code: updateError?.code });

  if (updateError) {
    if (updateError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: project_collaborations UPDATE');
    }
    return { success: false, error: updateError.message };
  }

  // Update project_professionals for the winner
  const { error: ppError } = await supabase
    .from('project_professionals')
    .update({ selection_status: 'agreed' })
    .eq('id', collab.project_professional_id);

  console.log('[DB] Update winner project_professionals:', { error: ppError?.message });

  // Decline other finalists
  const { data: otherFinalistsRaw, error: finalistsError } = await supabase
    .from('project_collaborations')
    .select('id, professional_id, project_professional_id, professional:professionals(user_id)')
    .eq('project_id', collab.project_id)
    .neq('id', collaborationId)
    .in('status', ['pending', 'negotiating']);

  type FinalistRow = { id: string; professional_id: string; project_professional_id: string; professional: { user_id: string } | null };
  const otherFinalists = otherFinalistsRaw as FinalistRow[] | null;

  console.log('[DB] Find other finalists:', { 
    count: otherFinalists?.length, 
    error: finalistsError?.message 
  });

  if (otherFinalists) {
    for (const finalist of otherFinalists) {
      // Update collaboration
      await supabase
        .from('project_collaborations')
        .update({
          status: 'not_picked',
          ended_at: new Date().toISOString(),
        })
        .eq('id', finalist.id);

      // Update project_professionals
      if (finalist.project_professional_id) {
        await supabase
          .from('project_professionals')
          .update({ selection_status: 'not_selected' })
          .eq('id', finalist.project_professional_id);
      }

      // Notify declined finalist
      if (finalist.professional?.user_id) {
        await createNotification({
          userId: finalist.professional.user_id,
          type: 'proposal_declined',
          title: 'Proposition non retenue',
          body: 'Votre proposition n\'a pas été sélectionnée pour ce projet.',
          link: `/pro/collaborations/${finalist.id}`,
          icon: 'info',
          metadata: { collaborationId: finalist.id, projectId: collab.project_id },
        });
      }
    }
  }

  // Notify winner
  if (collab.professional?.user_id) {
    const { error: notifError } = await createNotification({
      userId: collab.professional.user_id,
      type: 'proposal_accepted',
      title: 'Proposition acceptée !',
      body: 'Votre proposition a été acceptée. Vous avez maintenant accès complet au projet.',
      link: `/pro/projects/${collab.project_id}`,
      icon: 'check-circle',
      metadata: { collaborationId, projectId: collab.project_id },
    });

    console.log('[NOTIFICATION] proposal_accepted:', { error: notifError });
  }

  // Notify client about activation
  const { data: project, error: projError } = await supabase
    .from('user_projects')
    .select('user_id')
    .eq('id', collab.project_id)
    .single();

  console.log('[DB] Get project for notification:', { error: projError?.message });

  revalidatePath(`/projects/${collab.project_id}/pros`);
  revalidatePath(`/pro/collaborations`);
  console.log('[ACTION] acceptProposal completed');
  return { success: true, error: null };
}

// ============================================
// DECLINE FINALIST (Client declines a finalist)
// ============================================

export async function declineFinalist(collaborationId: string, reason: string) {
  console.log('[ACTION] declineFinalist started:', { collaborationId });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] User:', user?.id);
  if (!user || authError) return { success: false, error: 'Unauthorized' };

  const { error: updateError } = await supabase
    .from('project_collaborations')
    .update({
      status: 'not_picked',
      decline_reason: reason,
      ended_at: new Date().toISOString(),
    })
    .eq('id', collaborationId);

  console.log('[DB] Update collaboration:', { error: updateError?.message, code: updateError?.code });

  if (updateError) {
    if (updateError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: project_collaborations UPDATE');
    }
    return { success: false, error: updateError.message };
  }

  // Update project_professionals
  const { data: collabRaw5, error: collabError } = await supabase
    .from('project_collaborations')
    .select('project_professional_id, professional_id, project_id, professional:professionals(user_id)')
    .eq('id', collaborationId)
    .single();

  const collab = collabRaw5 as typeof collabRaw5 & { professional: { user_id: string } | null };

  console.log('[DB] Get collaboration:', { error: collabError?.message });

  if (collab?.project_professional_id) {
    await supabase
      .from('project_professionals')
      .update({ selection_status: 'not_selected' })
      .eq('id', collab.project_professional_id);
  }

  // Notify pro
  if (collab?.professional?.user_id) {
    await createNotification({
      userId: collab.professional.user_id,
      type: 'proposal_declined',
      title: 'Proposition non retenue',
      body: 'Votre proposition n\'a pas été sélectionnée pour ce projet.',
      link: `/pro/collaborations/${collaborationId}`,
      icon: 'info',
      metadata: { collaborationId, projectId: collab.project_id },
    });
  }

  revalidatePath(`/projects/${collab?.project_id}/pros`);
  console.log('[ACTION] declineFinalist completed');
  return { success: true, error: null };
}

// ============================================
// TERMINATE COLLABORATION
// ============================================

export async function terminateCollaboration(collaborationId: string, reason: string) {
  console.log('[ACTION] terminateCollaboration started:', { collaborationId });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] User:', user?.id);
  if (!user || authError) return { success: false, error: 'Unauthorized' };

  const { error: updateError } = await supabase
    .from('project_collaborations')
    .update({
      status: 'terminated',
      ended_at: new Date().toISOString(),
      decline_reason: reason,
    })
    .eq('id', collaborationId);

  console.log('[DB] Update collaboration:', { error: updateError?.message, code: updateError?.code });

  if (updateError) {
    if (updateError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: project_collaborations UPDATE');
    }
    return { success: false, error: updateError.message };
  }

  // Update project_professionals
  const { data: collabRaw6, error: collabError } = await supabase
    .from('project_collaborations')
    .select('project_professional_id, professional_id, project_id, professional:professionals(user_id)')
    .eq('id', collaborationId)
    .single();

  const collab = collabRaw6 as typeof collabRaw6 & { professional: { user_id: string } | null };

  console.log('[DB] Get collaboration:', { error: collabError?.message });

  if (collab?.project_professional_id) {
    await supabase
      .from('project_professionals')
      .update({ selection_status: 'not_selected' })
      .eq('id', collab.project_professional_id);
  }

  // Notify pro
  if (collab?.professional?.user_id) {
    await createNotification({
      userId: collab.professional.user_id,
      type: 'collaboration_terminated',
      title: 'Collaboration terminée',
      body: 'La collaboration pour ce projet a été terminée.',
      link: `/pro/collaborations/${collaborationId}`,
      icon: 'alert-triangle',
      metadata: { collaborationId, projectId: collab.project_id },
    });
  }

  revalidatePath(`/projects/${collab?.project_id}/pros`);
  revalidatePath(`/projects/${collab?.project_id}`);
  console.log('[ACTION] terminateCollaboration completed');
  return { success: true, error: null };
}

// ============================================
// SEND COLLABORATION MESSAGE
// ============================================

export async function sendCollaborationMessage(
  collaborationId: string,
  data: MessageFormData,
  senderRole: 'client' | 'professional' = 'professional'
) {
  console.log('[ACTION] sendCollaborationMessage started:', { collaborationId, type: data.type });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] User:', user?.id);
  if (!user || authError) return { success: false, error: 'Unauthorized' };

  const { data: message, error: messageError } = await supabase
    .from('collaboration_messages')
    .insert([{
      collaboration_id: collaborationId,
      sender_id: user.id,
      sender_role: senderRole,
      message_type: data.type,
      content: data.content,
      attachments: data.attachments || [],
    }])
    .select()
    .single();

  console.log('[DB] Create message:', { 
    messageId: message?.id, 
    error: messageError?.message, 
    code: messageError?.code 
  });

  if (messageError) {
    if (messageError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: collaboration_messages INSERT');
    }
    return { success: false, error: messageError.message };
  }

  revalidatePath(`/projects/[projectId]/pros/proposal/[proId]`);
  revalidatePath(`/pro/collaborations/${collaborationId}`);
  console.log('[ACTION] sendCollaborationMessage completed');
  return { success: true, data: message, error: null };
}

// ============================================
// GET PROJECT PRO LIST (Grouped by status)
// ============================================

export async function getProjectProList(projectId: string) {
  console.log('[ACTION] getProjectProList started:', { projectId });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] User:', user?.id);
  if (!user || authError) return { groups: null, error: 'Unauthorized' };

  const { data: pros, error: prosError } = await supabase
    .from('project_professionals')
    .select(`
      *,
      professional:professionals(
        id,
        business_name,
        slug,
        category,
        subcategories,
        city,
        country,
        profile_picture_url,
        avg_rating,
        review_count
      ),
      collaboration:project_collaborations(
        id,
        status,
        proposal_text,
        proposal_budget,
        proposal_currency,
        proposal_timeline,
        proposal_submitted_at,
        created_at,
        messages:collaboration_messages(id)
      )
    `)
    .eq('project_id', projectId)
    .order('added_at', { ascending: false });

  console.log('[DB] Get project professionals:', { 
    count: pros?.length, 
    error: prosError?.message,
    code: prosError?.code
  });

  if (prosError) {
    if (prosError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: project_professionals');
    }
    return { groups: null, error: prosError.message };
  }

  if (!pros || pros.length === 0) {
    console.warn('[RLS] ⚠️ SILENT RLS FILTERING! Table: project_professionals, expected data but got 0 rows');
  }

  // Group by status
  const groups: Record<string, { pros: ProjectProfessionalWithProfile[]; count: number }> = {
    saved: { pros: [], count: 0 },
    shortlisted: { pros: [], count: 0 },
    finalists: { pros: [], count: 0 },
    active: { pros: [], count: 0 },
    declined: { pros: [], count: 0 },
  };

  for (const pro of pros) {
    const selectionStatus = pro.selection_status;
    const collab = pro.collaboration;

    if (selectionStatus === 'candidate') {
      groups.saved.pros.push(pro);
    } else if (selectionStatus === 'shortlisted') {
      groups.shortlisted.pros.push(pro);
    } else if (selectionStatus === 'finalist') {
      groups.finalists.pros.push({ ...pro, collaboration: collab });
    } else if (selectionStatus === 'agreed') {
      groups.active.pros.push(pro);
    } else if (selectionStatus === 'not_selected') {
      groups.declined.pros.push(pro);
    }
  }

  groups.saved.count = groups.saved.pros.length;
  groups.shortlisted.count = groups.shortlisted.pros.length;
  groups.finalists.count = groups.finalists.pros.length;
  groups.active.count = groups.active.pros.length;
  groups.declined.count = groups.declined.pros.length;

  console.log('[ACTION] getProjectProList completed:', {
    saved: groups.saved.count,
    shortlisted: groups.shortlisted.count,
    finalists: groups.finalists.count,
    active: groups.active.count,
    declined: groups.declined.count,
  });

  return { groups, error: null };
}

// ============================================
// GET PRO INBOX
// ============================================

export async function getProInbox(professionalId: string) {
  console.log('[ACTION] getProInbox started:', { professionalId });

  const supabase = await createClient();

  const { data: collaborations, error: collabError } = await supabase
    .from('project_collaborations')
    .select(`
      *,
      project:user_projects(
        id,
        title,
        description,
        category,
        location,
        budget_total,
        budget_currency
      ),
      messages:collaboration_messages(
        id,
        message_type,
        content,
        created_at
      )
    `)
    .eq('professional_id', professionalId)
    .in('status', ['pending', 'negotiating', 'active'])
    .order('created_at', { ascending: false });

  console.log('[DB] Get pro collaborations:', { 
    count: collaborations?.length, 
    error: collabError?.message,
    code: collabError?.code
  });

  if (collabError) {
    if (collabError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: project_collaborations');
    }
    return { proposals: null, unreadProposalCount: 0, error: collabError.message };
  }

  if (!collaborations || collaborations.length === 0) {
    console.warn('[RLS] ⚠️ SILENT RLS FILTERING! Table: project_collaborations, expected data but got 0 rows');
  }

  const unreadCount = collaborations?.filter(c => 
    c.status === 'pending' && !c.proposal_submitted_at
  ).length || 0;

  console.log('[ACTION] getProInbox completed:', { 
    proposals: collaborations?.length,
    unread: unreadCount 
  });

  return { 
    proposals: collaborations || [], 
    unreadProposalCount: unreadCount,
    error: null 
  };
}

// ============================================
// GET FINALIST PROJECT VIEW (Read-only for pro)
// ============================================

export async function getFinalistProjectView(collaborationId: string) {
  console.log('[ACTION] getFinalistProjectView started:', { collaborationId });

  const supabase = await createClient();

  const { data: collab, error: collabError } = await supabase
    .from('project_collaborations')
    .select(`
      *,
      project:user_projects(
        *,
        areas:project_areas(*),
        steps:project_steps(*)
      )
    `)
    .eq('id', collaborationId)
    .single();

  console.log('[DB] Get finalist project view:', { 
    hasProject: !!collab?.project,
    error: collabError?.message,
    code: collabError?.code
  });

  if (collabError) {
    if (collabError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: project_collaborations');
    }
    return { project: null, steps: null, areas: null, error: collabError.message };
  }

  if (!collab) {
    console.warn('[RLS] ⚠️ SILENT RLS FILTERING! Table: project_collaborations, expected data but got 0 rows');
  }

  console.log('[ACTION] getFinalistProjectView completed');
  return { 
    project: collab?.project || null,
    steps: collab?.project?.steps || [],
    areas: collab?.project?.areas || [],
    error: null 
  };
}

// ============================================
// GET PROPOSAL DETAIL (Client reviews proposal)
// ============================================

export async function getProposalDetail(collaborationId: string) {
  console.log('[ACTION] getProposalDetail started:', { collaborationId });

  const supabase = await createClient();

  const { data: collab, error: collabError } = await supabase
    .from('project_collaborations')
    .select(`
      *,
      messages:collaboration_messages(*),
      professional:professionals(
        id,
        business_name,
        category,
        subcategories,
        city,
        country,
        profile_picture_url,
        avg_rating,
        review_count
      )
    `)
    .eq('id', collaborationId)
    .single();

  console.log('[DB] Get proposal detail:', { 
    hasMessages: collab?.messages?.length,
    error: collabError?.message,
    code: collabError?.code
  });

  if (collabError) {
    if (collabError.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: project_collaborations');
    }
    return { collaboration: null, messages: [], professional: null, error: collabError.message };
  }

  if (!collab) {
    console.warn('[RLS] ⚠️ SILENT RLS FILTERING! Table: project_collaborations, expected data but got 0 rows');
  }

  console.log('[ACTION] getProposalDetail completed');
  return { 
    collaboration: collab,
    messages: collab?.messages || [],
    professional: collab?.professional,
    error: null 
  };
}
