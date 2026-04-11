// ============================================
// Kelen — Database Types (mirrors Supabase schema)
// ============================================

export type UserRole = "client" | "pro_africa" | "pro_europe" | "admin";
export type ProfessionalStatus = "gold" | "silver" | "white" | "red" | "black";
export type BudgetRange = "0-10k" | "10k-25k" | "25k-50k" | "50k-100k" | "100k+";
export type BreachType = "timeline" | "budget" | "quality" | "abandonment" | "fraud";
export type Severity = "minor" | "major" | "critical";
export type VerificationStatus = "pending" | "verified" | "rejected" | "disputed";
export type PaymentMethod = "virement" | "especes" | "wave" | "orange_money" | "autre";
export type InteractionType = "contact_click" | "phone_click" | "whatsapp_click" | "email_click";
export type ViewSource = "search" | "browse" | "category" | "direct";
export type SubscriptionPlan = "pro_africa" | "pro_europe";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "incomplete";
export type ProjectCategory = "construction" | "renovation" | "immobilier" | "amenagement" | "autre";
export type ProjectStatus = "en_preparation" | "en_cours" | "en_pause" | "termine" | "annule";
export type ProjectProfessionalRole = "contact" | "liked" | "picked";
export type ExternalCategory = "construction" | "renovation" | "immobilier" | "amenagement" | "autre";
export type ProjectStepStatus = "pending" | "in_progress" | "completed" | "on_hold" | "cancelled" | "approved" | "rejected";
export type ProjectDocumentStatus = "pending_review" | "published" | "rejected";
export type VQueueStatus = "pending" | "in_review" | "completed";
export type VQueueItemType = "recommendation" | "signal";

// --- Tables ---

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  country: string;
  phone: string | null;
  email_notifications: boolean;
  language: "fr" | "en";
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface Professional {
  id: string;
  user_id: string;
  business_name: string;
  owner_name: string;
  slug: string;
  category: string;
  subcategories: string[] | null;
  area_id: string | null;
  profession_id: string | null;
  country: string;
  city: string;
  address: string | null;
  phone: string;
  whatsapp: string | null;
  email: string;
  description: string | null;
  services_offered: string[] | null;
  years_experience: number | null;
  team_size: number | null;
  portfolio_photos: string[] | null;
  portfolio_videos: string[] | null;
  status: ProfessionalStatus;
  recommendation_count: number;
  signal_count: number;
  avg_rating: number | null;
  positive_review_pct: number | null;
  review_count: number;
  verified: boolean;
  verification_documents: string[] | null;
  verified_at: string | null;
  is_active: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalPortfolio {
  id: string;
  professional_id: string;
  hero_image_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  about_text: string | null;
  about_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  professional_id: string | null;
  professional_slug: string | null;
  external_name: string | null;
  external_category: string | null;
  external_city: string | null;
  external_country: string | null;
  submitter_id: string;
  submitter_name: string;
  submitter_country: string;
  submitter_email: string;
  project_type: string;
  project_description: string;
  completion_date: string;
  budget_range: BudgetRange;
  location: string;
  contract_url: string;
  photo_urls: string[];
  before_photos: string[] | null;
  after_photos: string[] | null;
  linked: boolean;
  linked_at: string | null;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  status: VerificationStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Signal {
  id: string;
  professional_id: string | null;
  professional_slug: string | null;
  external_name: string | null;
  external_category: string | null;
  external_city: string | null;
  external_country: string | null;
  submitter_id: string;
  submitter_name: string;
  submitter_country: string;
  submitter_email: string;
  breach_type: BreachType;
  breach_description: string;
  severity: Severity | null;
  agreed_start_date: string;
  agreed_end_date: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
  timeline_deviation: string | null;
  agreed_budget: number | null;
  actual_budget: number | null;
  budget_deviation: string | null;
  contract_url: string;
  evidence_urls: string[];
  communication_logs: string[] | null;
  pro_response: string | null;
  pro_evidence_urls: string[] | null;
  pro_responded_at: string | null;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  status: VerificationStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  professional_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_country: string;
  rating: number;
  comment: string | null;
  is_hidden: boolean;
  hidden_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewHistory {
  id: string;
  review_id: string;
  previous_rating: number;
  previous_comment: string | null;
  changed_at: string;
}

export interface Subscription {
  id: string;
  professional_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileView {
  id: string;
  professional_id: string;
  viewer_ip_hash: string;
  viewer_country: string | null;
  viewer_city: string | null;
  source: ViewSource;
  search_query: string | null;
  referrer: string | null;
  cost_deducted: number;
  view_duration: number | null;
  created_at: string;
}

export interface ProfileInteraction {
  id: string;
  professional_id: string;
  type: InteractionType;
  viewer_ip_hash: string;
  viewer_country: string | null;
  created_at: string;
}

export interface VerificationQueueItem {
  id: string;
  item_type: VQueueItemType;
  item_id: string;
  professional_id: string;
  status: VQueueStatus;
  assigned_to: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
}

export interface ProjectDocument {
  id: string;
  professional_id: string;
  project_title: string;
  project_description: string | null;
  project_date: string | null;
  project_amount: number | null;
  contract_url: string;
  delivery_report_url: string | null;
  status: ProjectDocumentStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  client_email: string | null;
  client_notified_at: string | null;
  client_confirmed: boolean | null;
  client_responded_at: string | null;
  linked_recommendation_id: string | null;
  created_at: string;
  updated_at: string;
  // Related data (joined queries)
  images?: ProjectImage[];
}

export interface ProjectImage {
  id: string;
  professional_id: string;
  project_document_id: string | null;
  url: string;
  is_main: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalRealization {
  id: string;
  professional_id: string;
  title: string;
  description: string | null;
  location: string | null;
  completion_date: string | null;
  price: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
  images?: RealizationImage[];
  documents?: RealizationDocument[];
}

export interface RealizationImage {
  id: string;
  realization_id: string;
  url: string;
  is_main: boolean | null;
}

export interface RealizationDocument {
  id: string;
  realization_id: string;
  url: string;
  title: string | null;
  type: string | null;
}

export interface UserProject {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: ProjectCategory | null;
  location: string | null;
  budget_total: number | null;
  budget_currency: "EUR" | "XOF" | "USD";
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  objectives: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface ProjectProfessional {
  id: string;
  project_id: string;
  is_external: boolean;
  professional_id: string | null;
  external_name: string | null;
  external_phone: string | null;
  external_category: ExternalCategory | null;
  external_location: string | null;
  role: ProjectProfessionalRole;
  private_note: string | null;
  pro_snapshot: Record<string, unknown> | null;
  project_area_id: string | null;
  project_step_id: string | null;
  added_at: string;
  updated_at: string;
}

export interface ProjectPayment {
  id: string;
  project_id: string;
  project_professional_id: string | null;
  label: string;
  amount: number;
  currency: "EUR" | "XOF" | "USD";
  paid_at: string;
  payment_method: PaymentMethod | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  professional_id: string;
  added_at: string;
}

export interface ProjectStep {
  id: string;
  project_id: string;
  title: string;
  comment: string | null;
  status: ProjectStepStatus;
  budget: number;
  expenditure: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectStepProfessional {
  step_id: string;
  project_professional_id: string;
}

export interface ProjectArea {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

export interface ProfessionalArea {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface Profession {
  id: string;
  area_id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

// --- View types (for materialized views) ---

export interface ProfessionalAnalytics {
  professional_id: string;
  views_this_month: number;
  clicks_this_month: number;
  views_last_30_days: number;
  clicks_last_30_days: number;
  conversion_rate_30d: number;
  top_source: ViewSource;
  top_viewer_country: string;
}

export interface PlatformMetrics {
  total_users: number;
  total_professionals: number;
  gold_count: number;
  silver_count: number;
  white_count: number;
  red_count: number;
  black_count: number;
  queue_size: number;
  revenue_this_month: number;
  views_last_30_days: number;
  new_users_this_week: number;
}

// --- Database schema type for Supabase generics ---

export type Tables = {
  users: User;
  professionals: Professional;
  recommendations: Recommendation;
  signals: Signal;
  reviews: Review;
  review_history: ReviewHistory;
  subscriptions: Subscription;
  profile_views: ProfileView;
  profile_interactions: ProfileInteraction;
  verification_queue: VerificationQueueItem;
  project_documents: ProjectDocument;
  user_projects: UserProject;
  project_professionals: ProjectProfessional;
  project_payments: ProjectPayment;
  user_favorites: UserFavorite;
  project_steps: ProjectStep;
  project_step_professionals: ProjectStepProfessional;
  project_areas: ProjectArea;
  professional_areas: ProfessionalArea;
  professions: Profession;
};
