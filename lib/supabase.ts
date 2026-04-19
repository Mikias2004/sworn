import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

// Lazy-initialized server-side client with service role key.
// Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _client;
}

// Type definitions matching our schema
export type User = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  password_hash: string;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  push_subscription: object | null;
  notification_time_morning: string;
  notification_time_deadline: string;
  created_at: string;
};

export type PasswordResetToken = {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  frequency: string;
  metric: string;
  pledge_amount: number;
  status: "active" | "completed" | "failed" | "archived";
  created_at: string;
  tracking_app: string | null;
  streak_count: number;
  last_completed_date: string | null;
  last_notified_at: string | null;
};

export type Datapoint = {
  id: string;
  goal_id: string;
  value: number;
  logged_at: string;
};

export type Charge = {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  reason: string;
  charged_at: string;
};
