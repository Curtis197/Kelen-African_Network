// ============================================
// Kelen — Database Types (mirrors Supabase schema)
// These types match the tables defined in DATABASE_REFERENCE.md
// ============================================

export type UserRole = "user" | "professional" | "admin";
export type ProfessionalStatus = "gold" | "silver" | "white" | "red" | "black";
export type BudgetRange = "0-10k" | "10k-25k" | "25k-50k" | "50k-100k" | "100k+";
export type BreachType = "timeline" | "budget" | "quality" | "abandonment" | "fraud";
export type Severity = "minor" | "major" | "critical";
export type VerificationStatus = "pending" | "verified" | "rejected" | "disputed";
export type TransactionType = "purchase" | "deduction" | "refund" | "adjustment";
export type PaymentMethod = "stripe" | "wave" | "orange_money";
export type InteractionType = "contact_click" | "phone_click" | "whatsapp_click" | "email_click";
export type ViewSource = "search" | "browse" | "category" | "direct";

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
  // Computed status (never set from frontend)
  status: ProfessionalStatus;
  recommendation_count: number;
  signal_count: number;
  avg_rating: number | null;
  positive_review_pct: number | null;
  review_count: number;
  // CPM advertisement
  credit_balance: number;
  total_views: number;
  monthly_view_cap: number | null;
  current_month_views: number;
  last_view_reset: string | null;
  auto_reload_enabled: boolean;
  auto_reload_amount: number | null;
  auto_reload_threshold: number | null;
  // Verification
  verified: boolean;
  verification_documents: string[] | null;
  verified_at: string | null;
  // Visibility
  is_active: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  professional_id: string;
  professional_slug: string;
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
  professional_id: string;
  professional_slug: string;
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

export interface CreditTransaction {
  id: string;
  professional_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string;
  payment_method: PaymentMethod | null;
  payment_id: string | null;
  currency: "EUR" | "XOF" | null;
  created_at: string;
  ip_address: string | null;
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
  item_type: "recommendation" | "signal";
  item_id: string;
  professional_id: string;
  status: "pending" | "in_review" | "completed";
  assigned_to: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
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
