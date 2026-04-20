export type LogStatus = 'pending' | 'approved' | 'contested' | 'resolved';
export type MediaType = 'photo';
export type CommentType = 'approval' | 'contest';
export type ShareMethod = 'email' | 'whatsapp' | 'sms';
export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'cold';

export interface ProjectLog {
  id: string;
  project_id: string | null;  // Can be null for pro_projects
  pro_project_id: string | null;  // Can be null for client projects
  step_id: string | null;
  author_id: string;
  author_role: 'client' | 'professional';
  log_date: string;
  title: string;
  description: string;
  money_spent: number;
  money_currency: 'XOF' | 'EUR' | 'USD';
  payment_id: string | null;
  issues: string | null;
  next_steps: string | null;
  weather: WeatherCondition | null;
  status: LogStatus;
  gps_latitude: number | null;
  gps_longitude: number | null;
  is_synced: boolean;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
  location_name: string | null;
  // Joined fields
  media?: LogMedia[];
  comments?: LogComment[];
  author_name?: string;
  step_title?: string;
}

export interface LogMedia {
  id: string;
  log_id: string;
  media_type: MediaType;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string;
  caption: string | null;
  exif_timestamp: string | null;
  exif_latitude: number | null;
  exif_longitude: number | null;
  is_primary: boolean;
  created_at: string;
  // Client-side only
  preview_url?: string;
}

export interface LogComment {
  id: string;
  log_id: string;
  author_id: string;
  comment_type: CommentType;
  comment_text: string;
  evidence_urls: string[];
  created_at: string;
  // Joined fields
  author_name?: string;
  author_role?: 'client' | 'professional';
}

export interface LogShare {
  id: string;
  log_id: string;
  share_token: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  share_method: ShareMethod | null;
  shared_by_id: string;
  shared_at: string;
  first_viewed_at: string | null;
  view_count: number;
}

export interface LogView {
  id: string;
  share_id: string;
  viewed_at: string;
  viewer_ip: string | null;
  viewer_user_agent: string | null;
}

// Form input types
export interface LogFormData {
  logDate: string;
  title: string;
  description: string;
  moneySpent: number;
  moneyCurrency: 'XOF' | 'EUR' | 'USD';
  paymentId: string | null;
  issues: string;
  nextSteps: string;
  weather: WeatherCondition | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsSource: 'exif' | 'browser' | 'manual' | null;
  photos: LogMedia[];
}

// Draft types (IndexedDB)
export interface LogDraft {
  id: string;
  projectId: string;
  stepId: string | null;
  formData: LogFormData;
  createdAt: string;
  updatedAt: string;
  pendingSync: boolean;
}

// GPS info for display
export interface GPSInfo {
  latitude: number | null;
  longitude: number | null;
  source: 'exif' | 'browser' | 'manual';
  sourceLabel: string;
}

// Share stats
export interface ShareStats {
  viewCount: number;
  firstViewedAt: string | null;
}

// Shared log public view
export interface SharedLogData {
  log: ProjectLog;
  projectName: string;
  projectLocation: string | null;
  projectLocationLat: number | null;
  projectLocationLng: number | null;
  shareInfo: LogShare;
}
