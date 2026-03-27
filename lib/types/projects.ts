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
  external_category: string | null;
  development_area: string | null;
  rank_order: number;
  selection_status: 'candidate' | 'shortlisted' | 'finalist';
  role: string;
  professional_id: string | null;
  professionals: Professional | null;
}
