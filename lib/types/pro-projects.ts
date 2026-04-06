export type ProProjectStatus = 'in_progress' | 'completed' | 'paused' | 'cancelled';

export interface ProProject {
  id: string;
  professional_id: string;
  title: string;
  description: string | null;
  category: string;
  location: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  start_date: string | null;
  end_date: string | null;
  actual_end_date: string | null;
  budget: number | null;
  currency: 'XOF' | 'EUR' | 'USD';
  status: ProProjectStatus;
  is_public: boolean;
  featured_photo: string | null;
  photo_urls: string[];
  completion_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProProjectFormData {
  title: string;
  description: string;
  category: string;
  location: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  start_date: string;
  end_date: string;
  budget: number;
  currency: 'XOF' | 'EUR' | 'USD';
  status: ProProjectStatus;
  is_public: boolean;
  completion_notes: string;
}
