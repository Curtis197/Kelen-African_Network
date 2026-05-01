import {
  HardHat, Stethoscope, Laptop, Scale, GraduationCap, PencilRuler,
  Wrench, ShoppingBag, Building2, PaintRoller, Cog, HeartHandshake,
  Megaphone, LineChart, LayoutGrid,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

type IconComponent = React.ComponentType<LucideProps>;

const SECTOR_ICONS: Record<string, IconComponent> = {
  "batiment-travaux-publics": HardHat,
  "sante-bien-etre": Stethoscope,
  "digital-tech": Laptop,
  "juridique-administratif": Scale,
  "education-formation": GraduationCap,
  "architecture-design": PencilRuler,
  "mecanique-reparation": Wrench,
  "commerce-vente": ShoppingBag,
  "immobilier-foncier": Building2,
  "renovation-finitions": PaintRoller,
  "ingenierie-genie-civil": Cog,
  "services-personne": HeartHandshake,
  "marketing-evenementiel": Megaphone,
  "expertise-conseil": LineChart,
  "autre": LayoutGrid,
};

export function getSectorIcon(slug: string): IconComponent {
  return SECTOR_ICONS[slug] ?? LayoutGrid;
}
