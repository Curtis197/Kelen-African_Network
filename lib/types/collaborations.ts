// Collaboration types
// Types for the collaboration pipeline: Saved → Shortlisted → Finalist → Proposal → Picked → Active

export type CollaborationStatus =
  | 'pending'
  | 'negotiating'
  | 'active'
  | 'declined'
  | 'not_picked'
  | 'suspended'
  | 'terminated';

export type MessageType =
  | 'proposal'
  | 'counter_offer'
  | 'revision_request'
  | 'acceptance'
  | 'decline'
  | 'general';

export type SenderRole = 'client' | 'professional';

export type SelectionStatus =
  | 'candidate'
  | 'shortlisted'
  | 'finalist'
  | 'agreed'
  | 'not_selected';

export interface ProjectCollaboration {
  id: string;
  project_id: string;
  professional_id: string;
  project_professional_id: string;
  pro_project_id: string | null;
  status: CollaborationStatus;
  proposal_text: string | null;
  proposal_budget: number | null;
  proposal_currency: string | null;
  proposal_timeline: string | null;
  proposal_submitted_at: string | null;
  agreed_price: number | null;
  agreed_start_date: string | null;
  agreed_end_date: string | null;
  started_at: string | null;
  ended_at: string | null;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
  // Related data (joined queries)
  professional?: ProfessionalSnapshot;
  project?: UserProjectSnapshot;
  messages?: CollaborationMessage[];
}

export interface CollaborationMessage {
  id: string;
  collaboration_id: string;
  sender_id: string;
  sender_role: SenderRole;
  message_type: MessageType;
  content: string;
  attachments: MessageAttachment[] | null;
  created_at: string;
  // Related data
  sender?: SenderSnapshot;
}

export interface MessageAttachment {
  url: string;
  type: string;
  name: string;
}

export interface ProfessionalSnapshot {
  id: string;
  business_name: string;
  category: string;
  subcategories: string[] | null;
  city: string;
  country: string;
  profile_picture_url: string | null;
  avg_rating: number | null;
  review_count: number | null;
}

export interface UserProjectSnapshot {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  budget_total: number | null;
  budget_currency: string | null;
}

export interface SenderSnapshot {
  id: string;
  display_name: string;
  email: string;
}

// ProList grouped by status
export interface ProListGroup {
  pros: ProjectProfessionalWithProfile[];
  count: number;
}

export interface ProListGrouped {
  saved: ProListGroup;
  shortlisted: ProListGroup;
  finalists: ProListGroup;
  active: ProListGroup;
  declined: ProListGroup;
}

export interface ProjectProfessionalWithProfile {
  id: string;
  project_id: string;
  professional_id: string | null;
  role: string;
  selection_status: SelectionStatus;
  is_external: boolean;
  external_name: string | null;
  external_phone: string | null;
  external_category: string | null;
  external_location: string | null;
  added_at: string;
  updated_at: string;
  professional: ProfessionalSnapshot | null;
  collaboration?: ProjectCollaboration;
}

// Proposal form data
export interface ProposalFormData {
  text: string;
  budget: number;
  currency: string;
  timeline: string;
}

// Collaboration message form
export interface MessageFormData {
  type: MessageType;
  content: string;
  attachments?: MessageAttachment[];
}

// Inbox types
export interface ProInboxData {
  proposals: ProjectCollaboration[];
  unreadProposalCount: number;
}

// Notification types for collaboration
export type CollaborationNotificationType =
  | 'finalist_selected'
  | 'proposal_submitted'
  | 'revision_requested'
  | 'proposal_accepted'
  | 'proposal_declined'
  | 'collaboration_declined'
  | 'collaboration_activated'
  | 'collaboration_terminated';
