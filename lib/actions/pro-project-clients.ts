"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ProProjectClient, CreateClientContactData, InvitationResult } from "@/lib/types/pro-project-clients";
import { Resend } from "resend";

function log(action: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), action, ...data }));
}

const createClientSchema = z.object({
  proProjectId: z.string().uuid(),
  clientName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  clientEmail: z.string().email("Email invalide"),
  clientPhone: z.string().optional(),
  sendInvitation: z.boolean().optional().default(false),
});

// Generate a secure random token for invitation
function generateInviteToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Send invitation email
async function sendInvitationEmail(email: string, name: string, inviteUrl: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    await resend.emails.send({
      from: 'Kelen <noreply@kelen.co>',
      to: email,
      subject: `${name} vous invite à consulter le journal de votre projet sur Kelen`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a8a;">Vous avez été invité à accéder au journal de votre projet</h2>
          <p>Bonjour ${name},</p>
          <p>Un professionnel vous a invité à consulter le journal de votre projet sur Kelen. Ce journal documente l'avancement des travaux avec des photos, des rapports financiers et des mises à jour régulières.</p>
          <p style="margin: 2rem 0;">
            <a href="${inviteUrl}" style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Accéder au journal de votre projet
            </a>
          </p>
          <p style="color: #6b7280; font-size: 0.875rem;">
            Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
            <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${inviteUrl}</code>
          </p>
          <hr style="margin-top: 2rem; border: none; border-top: 1px solid #e5e7eb;"/>
          <p style="color: #6b7280; font-size: 0.75rem;">Kelen - Réseau de professionnels de confiance</p>
        </div>
      `,
    });
    log("email.sent", { to: email, name });
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    log("email.error", { to: email, error: String(error) });
  }
}

export async function createClientContact(
  data: CreateClientContactData
): Promise<InvitationResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non autorisé", client: null };
  }

  const validated = createClientSchema.parse(data);

  // Verify professional owns the project
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) {
    return { success: false, error: "Professionnel introuvable", client: null };
  }

  const { data: project } = await supabase
    .from("pro_projects")
    .select("id, title")
    .eq("id", validated.proProjectId)
    .eq("professional_id", professional.id)
    .single();

  if (!project) {
    return { success: false, error: "Projet introuvable", client: null };
  }

  // Check if client already exists for this project
  const { data: existingClient } = await supabase
    .from("pro_project_clients")
    .select("id, status")
    .eq("pro_project_id", validated.proProjectId)
    .eq("client_email", validated.clientEmail)
    .single();

  if (existingClient) {
    return { 
      success: false, 
      error: "Un contact client avec cet email existe déjà pour ce projet", 
      client: null 
    };
  }

  // Check if email already exists in users table (existing Kelen account)
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, display_name, email")
    .eq("email", validated.clientEmail)
    .single();

  let linkedUserId: string | null = null;
  let needsConfirmation = false;
  let shouldSendInvitation = validated.sendInvitation;

  if (existingUser) {
    log("client.existing_user_found", { 
      email: validated.clientEmail, 
      userId: existingUser.id 
    });
    
    // User exists in database - mark for confirmation instead of invitation
    linkedUserId = existingUser.id;
    needsConfirmation = true;
    shouldSendInvitation = false; // Don't send invitation, user already has account
    
    // TODO: In the future, send a notification to the existing user
    // For now, we'll still create the contact but mark it as needing pro confirmation
  }

  // Generate invitation token only if sending invitation
  const inviteToken = shouldSendInvitation ? generateInviteToken() : null;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kelen-african-network.vercel.app";
  const inviteUrl = inviteToken ? `${baseUrl}/invitation/${inviteToken}` : undefined;

  // Create client contact
  const insertData: Record<string, unknown> = {
    pro_project_id: validated.proProjectId,
    created_by_pro_id: professional.id,
    client_name: validated.clientName,
    client_email: validated.clientEmail,
    client_phone: validated.clientPhone || null,
    invitation_token: inviteToken,
    linked_user_id: linkedUserId, // Link to existing user if found
  };

  if (linkedUserId) {
    // User already exists - mark as linked
    insertData.status = 'linked';
    insertData.linked_at = new Date().toISOString();
    insertData.invitation_verified = true;
    insertData.invitation_verified_at = new Date().toISOString();
  } else if (shouldSendInvitation) {
    insertData.invitation_sent = true;
    insertData.invitation_sent_at = new Date().toISOString();
    insertData.status = 'invited';
  }

  const { data: newClient, error: insertError } = await supabase
    .from("pro_project_clients")
    .insert([insertData])
    .select()
    .single();

  if (insertError) {
    log("client.create.error", { error: insertError.message });
    return { success: false, error: insertError.message, client: null };
  }

  log("client.create.ok", {
    clientId: newClient.id,
    email: validated.clientEmail,
    invitationSent: shouldSendInvitation,
    existingUserLinked: !!linkedUserId
  });

  // Send invitation email only if sending to new user
  if (shouldSendInvitation && inviteUrl) {
    await sendInvitationEmail(
      validated.clientEmail,
      validated.clientName,
      inviteUrl
    );
  } else if (linkedUserId) {
    // TODO: Send notification to existing user instead of invitation email
    log("client.existing_user_linked", { 
      clientId: newClient.id, 
      userId: linkedUserId 
    });
  }

  // Also update pro_projects with client info if not already set
  await supabase
    .from("pro_projects")
    .update({
      client_name: validated.clientName,
      client_email: validated.clientEmail,
      client_phone: validated.clientPhone || null,
    })
    .eq("id", validated.proProjectId);

  revalidatePath(`/pro/projets/${validated.proProjectId}/journal`);

  return {
    success: true,
    client: newClient,
    inviteUrl: shouldSendInvitation && inviteUrl ? inviteUrl : undefined,
    existingUserLinked: !!linkedUserId
  };
}

export async function verifyInvitation(token: string): Promise<{ 
  success: boolean; 
  error?: string; 
  client?: ProProjectClient | null;
  projectName?: string;
  professionalName?: string;
}> {
  const supabase = await createClient();

  // Find the invitation by token
  const { data: clientContact, error: findError } = await supabase
    .from("pro_project_clients")
    .select(`
      *,
      project:pro_projects(
        title,
        professional:professionals(
          id
        )
      )
    `)
    .eq("invitation_token", token)
    .single();

  if (findError || !clientContact) {
    return { success: false, error: "Invitation invalide ou expirée" };
  }

  if (clientContact.status === 'linked') {
    return { success: false, error: "Cette invitation a déjà été utilisée" };
  }

  if (clientContact.status === 'cancelled') {
    return { success: false, error: "Cette invitation a été annulée" };
  }

  // Mark as verified
  await supabase
    .from("pro_project_clients")
    .update({
      invitation_verified: true,
      invitation_verified_at: new Date().toISOString(),
      status: 'verified',
    })
    .eq("id", clientContact.id);

  return { 
    success: true, 
    client: clientContact,
    projectName: clientContact.project?.title,
    professionalName: "Votre professionnel"
  };
}

export async function resendInvitation(clientId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non autorisé" };
  }

  // Get client contact and verify ownership
  const { data: clientContact } = await supabase
    .from("pro_project_clients")
    .select(`
      *,
      project:pro_projects(
        title,
        professional_id
      )
    `)
    .eq("id", clientId)
    .single();

  if (!clientContact) {
    return { success: false, error: "Contact introuvable" };
  }

  // Verify professional owns the project
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional || professional.id !== clientContact.project.professional_id) {
    return { success: false, error: "Non autorisé" };
  }

  // Generate new token and update
  const newToken = generateInviteToken();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kelen-african-network.vercel.app";
  const inviteUrl = `${baseUrl}/invitation/${newToken}`;

  await supabase
    .from("pro_project_clients")
    .update({
      invitation_token: newToken,
      invitation_sent: true,
      invitation_sent_at: new Date().toISOString(),
      status: 'invited',
    })
    .eq("id", clientId);

  // Send email
  await sendInvitationEmail(
    clientContact.client_email,
    clientContact.client_name,
    inviteUrl
  );

  log("invitation.resent", { clientId, email: clientContact.client_email });

  return { success: true };
}

export async function cancelInvitation(clientId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non autorisé" };
  }

  // Get client contact and verify ownership
  const { data: clientContact } = await supabase
    .from("pro_project_clients")
    .select("*, project:pro_projects(professional_id)")
    .eq("id", clientId)
    .single();

  if (!clientContact) {
    return { success: false, error: "Contact introuvable" };
  }

  // Verify professional owns the project
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional || professional.id !== clientContact.project.professional_id) {
    return { success: false, error: "Non autorisé" };
  }

  await supabase
    .from("pro_project_clients")
    .update({
      status: 'cancelled',
      invitation_token: null,
    })
    .eq("id", clientId);

  log("invitation.cancelled", { clientId });

  return { success: true };
}

export async function getProjectClients(projectId: string): Promise<ProProjectClient[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pro_project_clients")
    .select("*")
    .eq("pro_project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching project clients:", error);
    return [];
  }

  return data || [];
}
