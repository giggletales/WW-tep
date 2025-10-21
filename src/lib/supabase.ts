import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin' | 'customer_service';
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  unique_id: string;
  account_type: 'personal' | 'professional' | 'enterprise';
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  setup_complete: boolean;
  phone?: string;
  country?: string;
  timezone: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: 'kickstarter' | 'starter' | 'pro' | 'enterprise';
  plan_name: string;
  price: number;
  period: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  features: any[];
  started_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TradingSignal {
  id: string;
  signal_type: 'crypto' | 'forex' | 'stocks' | 'commodities';
  symbol: string;
  currency_pair?: string;
  timeframe: string;
  direction: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number;
  take_profit: string;
  pips_at_risk?: string;
  confidence?: number;
  analysis?: string;
  ict_concepts?: string[];
  status: 'active' | 'closed' | 'cancelled';
  created_by?: string;
  created_at: string;
  expires_at?: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  plan_type: string;
  plan_name: string;
  amount: number;
  currency: string;
  payment_method: 'stripe' | 'paypal' | 'crypto';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  payment_details?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface AdminNotification {
  id: string;
  notification_type: 'purchase' | 'signup' | 'support' | 'system';
  title: string;
  message: string;
  related_user_id?: string;
  related_purchase_id?: string;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface MT5Account {
  id: string;
  user_id: string;
  account_number: string;
  account_name: string;
  broker: string;
  account_type: 'demo' | 'live';
  balance: number;
  equity: number;
  currency: string;
  leverage: number;
  is_active: boolean;
  api_credentials?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MT5Trade {
  id: string;
  mt5_account_id: string;
  user_id: string;
  ticket_number?: string;
  symbol: string;
  trade_type: 'BUY' | 'SELL';
  volume: number;
  open_price: number;
  close_price?: number;
  stop_loss?: number;
  take_profit?: number;
  profit?: number;
  commission?: number;
  swap?: number;
  opened_at: string;
  closed_at?: string;
  status: 'open' | 'closed' | 'pending';
  notes?: string;
  created_at: string;
}

export interface EmailLog {
  id: string;
  user_id?: string;
  email_to: string;
  email_type: 'welcome' | 'payment_confirmation' | 'password_reset' | 'notification';
  subject: string;
  body?: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
}
