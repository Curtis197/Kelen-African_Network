export type ProProjectClientStatus = 'pending' | 'invited' | 'verified' | 'linked' | 'cancelled';

export interface ProProjectClient {
  id: string;
  pro_project_id: string;
  created_by_pro_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  invitation_sent: boolean;
  invitation_sent_at: string | null;
  invitation_token: string | null;
  invitation_verified: boolean;
  invitation_verified_at: string | null;
  linked_user_id: string | null;
  linked_at: string | null;
  status: ProProjectClientStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateClientContactData {
  proProjectId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  sendInvitation?: boolean;
}

export interface InvitationResult {
  success: boolean;
  error?: string;
  inviteUrl?: string;
  client: ProProjectClient | null;
}
