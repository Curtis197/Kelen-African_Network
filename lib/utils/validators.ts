// ============================================
// Kelen — Zod Validation Schemas
// ============================================

import { z } from "zod";

// --- Auth ---

export const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerUserSchema = z.object({
  first_name: z.string().min(2, "Prénom requis (2 caractères minimum)"),
  last_name: z.string().min(2, "Nom requis (2 caractères minimum)"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  country: z.string().min(2, "Pays requis"),
  language: z.enum(["fr", "en"]).default("fr"),
  email_notifications: z.boolean().default(true),
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les CGU" }),
  }),
});

export const registerProfessionalSchema = registerUserSchema.extend({
  business_name: z.string().min(2, "Nom de l'entreprise requis"),
  category: z.string().min(1, "Catégorie requise"),
  city: z.string().min(2, "Ville requise"),
  phone: z.string().min(8, "Numéro de téléphone requis"),
  whatsapp: z.string().optional(),
  description: z.string().max(300, "300 caractères maximum").optional(),
  signal_understood: z.literal(true, {
    errorMap: () => ({
      message: "Vous devez comprendre la politique de signaux",
    }),
  }),
  privacy_accepted: z.literal(true, {
    errorMap: () => ({
      message: "Vous devez accepter la politique de confidentialité",
    }),
  }),
});

// --- Recommendation ---

export const recommendationSchema = z.object({
  professional_id: z.string().uuid(),
  project_type: z.string().min(1, "Type de projet requis"),
  project_description: z.string().min(20, "Description requise (20 caractères minimum)"),
  completion_date: z.string().min(1, "Date de fin requise"),
  budget_range: z.enum(["0-10k", "10k-25k", "25k-50k", "50k-100k", "100k+"]),
  location: z.string().min(2, "Localisation requise"),
  authenticity_confirmed: z.literal(true, {
    errorMap: () => ({
      message: "Vous devez confirmer l'authenticité des informations",
    }),
  }),
});

// --- Signal ---

export const signalSchema = z.object({
  professional_id: z.string().uuid(),
  breach_type: z.enum(["timeline", "budget", "quality", "abandonment", "fraud"]),
  breach_description: z.string().min(100, "Description requise (100 caractères minimum)"),
  severity: z.enum(["minor", "major", "critical"]),
  agreed_start_date: z.string().min(1, "Date de début convenue requise"),
  agreed_end_date: z.string().min(1, "Date de fin convenue requise"),
  actual_start_date: z.string().optional(),
  actual_end_date: z.string().optional(),
  timeline_deviation: z.string().optional(),
  agreed_budget: z.number().optional(),
  actual_budget: z.number().optional(),
  budget_deviation: z.string().optional(),
  authenticity_confirmed: z.literal(true, {
    errorMap: () => ({
      message: "Vous devez confirmer l'authenticité des informations",
    }),
  }),
  false_signal_understood: z.literal(true, {
    errorMap: () => ({
      message: "Vous devez comprendre les conséquences d'un faux signal",
    }),
  }),
  notification_understood: z.literal(true, {
    errorMap: () => ({
      message: "Vous devez comprendre que le professionnel sera notifié",
    }),
  }),
});

// --- Review ---

export const reviewSchema = z.object({
  professional_id: z.string().uuid(),
  rating: z.number().min(1, "Note requise").max(5),
  comment: z.string().max(2000, "2000 caractères maximum").optional(),
});

// --- Professional profile edit ---

export const proProfileSchema = z.object({
  description: z.string().max(300, "300 caractères maximum").optional(),
  services_offered: z.array(z.string()).optional(),
  years_experience: z.number().min(0).optional(),
  team_size: z.number().min(1).optional(),
  whatsapp: z.string().optional(),
});

// --- Contact form ---

export const contactSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  email: z.string().email("Adresse email invalide"),
  subject: z.string().min(5, "Objet requis"),
  message: z.string().min(20, "Message requis (20 caractères minimum)"),
});

// --- Type exports ---

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterUserFormData = z.infer<typeof registerUserSchema>;
export type RegisterProfessionalFormData = z.infer<typeof registerProfessionalSchema>;
export type RecommendationFormData = z.infer<typeof recommendationSchema>;
export type SignalFormData = z.infer<typeof signalSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type ProProfileFormData = z.infer<typeof proProfileSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
