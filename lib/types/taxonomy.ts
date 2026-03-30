export interface ProfessionalArea {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at?: string;
}

export interface Profession {
  id: string;
  area_id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at?: string;
  area?: ProfessionalArea;
}
