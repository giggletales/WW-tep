import { supabase, TradingSignal } from '../lib/supabase';

export interface CreateSignalData {
  signalType: 'crypto' | 'forex' | 'stocks' | 'commodities';
  symbol: string;
  currencyPair?: string;
  timeframe: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: string;
  pipsAtRisk?: string;
  confidence?: number;
  analysis?: string;
  ictConcepts?: string[];
  createdBy: string;
  expiresAt?: string;
}

export const tradingSignalService = {
  async createSignal(data: CreateSignalData) {
    try {
      const { data: signal, error } = await supabase
        .from('trading_signals')
        .insert({
          signal_type: data.signalType,
          symbol: data.symbol,
          currency_pair: data.currencyPair,
          timeframe: data.timeframe,
          direction: data.direction,
          entry_price: data.entryPrice,
          stop_loss: data.stopLoss,
          take_profit: data.takeProfit,
          pips_at_risk: data.pipsAtRisk,
          confidence: data.confidence,
          analysis: data.analysis,
          ict_concepts: data.ictConcepts || [],
          status: 'active',
          created_by: data.createdBy,
          expires_at: data.expiresAt
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, signal };
    } catch (error: any) {
      console.error('Create signal error:', error);
      return { success: false, error: error.message };
    }
  },

  async getActiveSignals(userId?: string) {
    try {
      let query = supabase
        .from('trading_signals')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (userId) {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (!subscription) {
          return { success: false, error: 'No active subscription' };
        }
      }

      const { data: signals, error } = await query;

      if (error) throw error;

      return { success: true, signals };
    } catch (error: any) {
      console.error('Get signals error:', error);
      return { success: false, error: error.message };
    }
  },

  async getSignalsByType(signalType: 'crypto' | 'forex' | 'stocks' | 'commodities', userId?: string) {
    try {
      if (userId) {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (!subscription) {
          return { success: false, error: 'No active subscription' };
        }
      }

      const { data: signals, error } = await supabase
        .from('trading_signals')
        .select('*')
        .eq('signal_type', signalType)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, signals };
    } catch (error: any) {
      console.error('Get signals by type error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateSignalStatus(signalId: string, status: 'active' | 'closed' | 'cancelled') {
    try {
      const { error } = await supabase
        .from('trading_signals')
        .update({ status })
        .eq('id', signalId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Update signal status error:', error);
      return { success: false, error: error.message };
    }
  },

  async trackSignalView(userId: string, signalId: string) {
    try {
      const { error } = await supabase
        .from('user_signal_access')
        .insert({
          user_id: userId,
          signal_id: signalId,
          viewed_at: new Date().toISOString()
        });

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Track signal view error:', error);
      return { success: false, error: error.message };
    }
  },

  async getUserSignalHistory(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_signal_access')
        .select(`
          *,
          signal:signal_id (*)
        `)
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      return { success: true, history: data };
    } catch (error: any) {
      console.error('Get signal history error:', error);
      return { success: false, error: error.message };
    }
  },

  async checkUserSignalAccess(userId: string) {
    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (!subscription) {
        return {
          success: false,
          hasAccess: false,
          message: 'No active subscription found'
        };
      }

      const now = new Date();
      const expiresAt = new Date(subscription.expires_at);

      if (expiresAt < now) {
        return {
          success: false,
          hasAccess: false,
          message: 'Subscription has expired'
        };
      }

      return {
        success: true,
        hasAccess: true,
        subscription
      };
    } catch (error: any) {
      console.error('Check signal access error:', error);
      return {
        success: false,
        hasAccess: false,
        error: error.message
      };
    }
  }
};

export default tradingSignalService;
