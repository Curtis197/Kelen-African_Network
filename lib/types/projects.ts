export interface Professional {
  id: string;
  business_name: string;
  category: string;
  portfolio_photos: string[] | null;
  status: string;
  slug: string;
}

export interface ProjectProfessional {
  id: string;
  project_id: string;
  is_external: boolean;
  external_name: string | null;
  external_phone: string | null;
  external_category: string | null;
  external_location: string | null;
  private_note: string | null;
  development_area: string | null;
  rank_order: number;
  selection_status: 'candidate' | 'shortlisted' | 'finalist';
  role: string;
  professional_id: string | null;
  professionals: Professional | null;
}

export type ProjectStepStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'approved' | 'rejected';

export interface ProjectStep {
  id: string;
  project_id: string;
  title: string;
  comment: string | null;
  status: ProjectStepStatus;
  budget: number;
  expenditure: number;
  order_index: number;
  created_at?: string;
  updated_at: string;
  associated_pros?: string[];
  project_step_professionals?: {
    project_professional_id: string;
  }[];
}
