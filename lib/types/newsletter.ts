export type NewsletterSource = 'public_profile' | 'manual';
export type CampaignStatus = 'draft' | 'sending' | 'sent' | 'failed';

export interface NewsletterSubscriber {
  id: string;
  professional_id: string;
  email: string;
  name: string | null;
  unsubscribe_token: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  is_active: boolean;
  source: NewsletterSource;
}

export interface NewsletterCampaign {
  id: string;
  professional_id: string;
  subject: string;
  body_html: string;
  status: CampaignStatus;
  recipient_count: number;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscribeResult {
  success: boolean;
  error?: string;
  alreadySubscribed?: boolean;
}

export interface SendCampaignResult {
  success: boolean;
  error?: string;
  recipientCount?: number;
  rateLimitedUntil?: string;
}
